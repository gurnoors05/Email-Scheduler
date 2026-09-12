# ReachInbox — Email Job Scheduler

A production-slice of ReachInbox's email scheduling system, built for the ReachInbox/Outbox Labs hiring assignment. Backend handles reliable scheduling, sending, rate limiting and persistence; frontend is a dashboard to compose, schedule, and track emails.

## 🚀 Live Demo & Credentials
The application is fully deployed to the cloud for immediate review.

- **Frontend Dashboard:** [https://reachinbox-dashboard.vercel.app](https://reachinbox-dashboard.vercel.app) *(Login with any Google account)*
- **Live BullMQ Queue Dashboard:** [https://email-scheduler-mizn.onrender.com/admin/queues](https://email-scheduler-mizn.onrender.com/admin/queues)
  - **Username:** `admin`
  - **Password:** `changeme123`
- **Ethereal Email Inbox (To verify emails were sent):** [https://ethereal.email/login](https://ethereal.email/login)
  - **Email:** `orville.buckridge@ethereal.email`
  - **Password:** `faHTs9aNn1S6PAveWj`

> [!WARNING]
> **Live Site SMTP Limitation:** The backend is deployed on Render's free tier, which strictly blocks standard outbound SMTP traffic (ports 25, 465, 587). The live demo uses Ethereal (port 587), so emails sent from the live URL will currently timeout in the queue.
> 
> **To test emails on the live site:** You can bypass the firewall by setting `SMTP_HOST=sandbox.smtp.mailtrap.io` and `SMTP_PORT=2525` in the live environment variables, as Render ignores non-standard ports like 2525. Otherwise, the app works perfectly when cloned and run locally on port 5000!

## TL;DR — What's actually implemented

| Feature | Implementation | Route / File |
|---|---|---|
| Scheduling (no cron) | BullMQ delayed jobs, Redis-backed | `POST /api/emails/schedule` → `queues/emailQueue.ts` |
| Restart survival | Jobs persist in Redis; reconciliation runs once on boot as a safety net | `queues/reconcile.ts` |
| Idempotency | BullMQ job ID = DB row ID; status checked before every send attempt | `queues/emailWorker.ts` |
| Rate limiting | Atomic Redis Lua-script counters, per-sender hourly buckets | `services/rateLimiter.ts` |
| Rate-limit alerts | Real Slack OAuth + live `chat.postMessage` on limit hit | `GET /api/auth/slack`, `services/slackService.ts` |
| Queue visibility | Live Bull-Board dashboard, Basic Auth protected | `/admin/queues` |
| Search | Elasticsearch, indexed on write + on status update | `GET /api/emails/search?q=`, `services/searchService.ts` |
| Auth | Real Google OAuth, JWT sessions | `POST /api/auth/google` |

I go into more detail on each of these below, but if you only have a few minutes, this table + the demo video covers the important parts.

---

## Running it locally

### Prerequisites
- Node 18+
- Docker (for MySQL, Redis, Elasticsearch)
- A Google OAuth client ID/secret ([console.cloud.google.com](https://console.cloud.google.com))
- A Slack app with `chat:write` scope ([api.slack.com/apps](https://api.slack.com/apps))
- An Ethereal Email account (free, get one at [ethereal.email](https://ethereal.email) — used as fake SMTP)

### 1. Infra
```bash
docker-compose up -d
```
This brings up MySQL, Redis, and Elasticsearch (single-node, security disabled — see the security note below).

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in the values, see below
npm install
npx prisma db push
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Env vars you need to fill in

**Backend `.env`**

DATABASE_URL=mysql://root:password@localhost:3306/reachinbox
REDIS_HOST=localhost
REDIS_PORT=6379
ELASTICSEARCH_URL=http://localhost:9200

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=some-random-string

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER= # from ethereal.email
SMTP_PASS= # from ethereal.email

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:5000/api/auth/slack/callback

MAX_EMAILS_PER_HOUR_PER_SENDER=200
MIN_DELAY_BETWEEN_EMAILS_SECONDS=2
WORKER_CONCURRENCY=5

ADMIN_DASHBOARD_USER=admin
ADMIN_DASHBOARD_PASS=change-this-before-you-push # see note below

FRONTEND_URL=http://localhost:5173
PORT=5000


**Frontend `.env`**

VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=


⚠️ Make sure your Google OAuth client's "Authorized JavaScript origins" includes `http://localhost:5173`, and your Slack app's redirect URL matches `SLACK_REDIRECT_URI` exactly.

---

## How scheduling actually works

No cron, anywhere. Scheduling is done with **BullMQ delayed jobs**, which live in Redis.

When you hit `POST /api/emails/schedule` with a batch of recipients, each recipient gets:
- Its own row in the `EmailJob` MySQL table (`status: scheduled`)
- Its own BullMQ job on the `email-send` queue, with `delay = scheduledAt - now`

Each recipient's `scheduledAt` is staggered by `index * delayBetweenEmails` seconds from the batch's start time, so the "delay between emails" setting is reflected both in when jobs are scheduled *and* enforced again at send-time by a Redis-based minimum-delay gate (belt and suspenders — if someone bypasses the frontend and hits the API directly with a bad `delayBetweenEmails`, the worker-side gate still holds).

**The important part for "no cron, no restart loss":** the delay is tracked by Redis itself, not by a `setTimeout` sitting in the Node process. If the server goes down, Redis doesn't care — it's still counting down. When the server comes back up, BullMQ's worker just resumes pulling jobs off the queue when their delay expires. I don't have to do anything special to make this work; it's a property of using BullMQ correctly.

What I *do* add on top is `reconcile.ts`, which runs once at boot: it checks every `EmailJob` row still marked `scheduled` in MySQL and confirms a matching job still exists in Redis. This only matters if Redis itself lost data (e.g. someone flushed it, or a non-persistent Redis config), which shouldn't happen with the Docker setup here (Redis persistence is on by default), but it's a safety net rather than the primary mechanism.

## Idempotency

Every `EmailJob` row has a `bullJobId` that's set to the same UUID as the row's own `id`, and that UUID is used as the BullMQ job's `jobId`. Before the worker sends anything, it checks: is this row already `sent` or `failed`? If so, skip. This means:
- BullMQ retrying a job after a transient failure won't double-send once it's already succeeded
- If reconcile.ts or anything else ever tried to re-add a job that already completed, the guard catches it

One subtlety I had to fix during development: I originally marked a row `failed` inside the `catch` block on *every* failed attempt, which meant the idempotency guard would kick in on BullMQ's second retry attempt and skip it — silently defeating the retry/backoff config. Fixed by only writing `failed` once `job.attemptsMade` reaches the configured max attempts.

## Rate limiting

Per-sender hourly limits (`MAX_EMAILS_PER_HOUR_PER_SENDER`) are enforced with **Redis, not in-memory counters** — this matters because in-memory counts would break the moment you run more than one worker process, or even just reset silently on every server restart.

Counting uses a small Lua script that does `INCR` + conditional `EXPIRE` in a single atomic round-trip, keyed by `ratelimit:{senderEmail}:{UTC-hour-bucket}`. Doing this as two separate Redis calls (`GET` then `INCR`) would be a race condition under concurrent workers — the Lua script avoids that.

There's a separate `lastsend:{senderEmail}` key enforcing the minimum delay between sends per sender, checked *before* the hourly counter — so a job that only gets pushed back for spacing reasons doesn't burn one of its sender's hourly slots for no reason.

When a sender's hourly limit is actually hit, the job is never failed — it gets moved to the start of the next hour window using BullMQ's `job.moveToDelayed()` (paired with throwing `DelayedError`, which is BullMQ's mechanism for pausing an active job without counting it as a failed attempt).

**Known trade-off:** if `sendMail` itself throws *after* the hourly counter already incremented, that slot is still considered "spent" even though no email went out. I decided not to add a compensating decrement here, since that introduces its own race (a decrement could race against a new increment in the same window) for a fairly small accuracy gain. Worth knowing about, not worth the complexity given the time I had.

**Behavior under load (1000+ emails at once):** since staggering spreads each recipient's `scheduledAt` across time based on `delayBetweenEmails`, and the hourly counter naturally pushes overflow into the next hour, a large batch scheduled for "now" doesn't blow through the rate limit — it just spreads itself out further than the naive stagger would suggest, self-correcting via the reschedule path. I didn't load-test with an actual 1000-email batch (would've spammed Ethereal for no reason), but the logic path is the same one exercised by the smaller-scale rate-limit test in my demo video.

## Slack notifications

Real OAuth, not a webhook shortcut. Clicking "Connect Slack" hits `GET /api/auth/slack`, which redirects to Slack's authorize screen with a signed JWT in the `state` param (so the callback can recover which user is connecting without relying on cookies — this API is otherwise fully stateless/JWT-based). The callback exchanges the code for a token via `oauth.v2.access` and stores it against the user.

For notifications, I use the `authed_user.id` from that OAuth response as the target — Slack's `chat.postMessage` will DM that user ID directly, no channel-invite step needed, which made this much simpler to actually test than trying to route through a workspace channel.

If a user hasn't connected Slack, a rate-limit hit just logs and skips — no crash, no exception, nothing shown to them. If they connect later, notifications start working immediately without a redeploy, since it's just checking whether `slackAccessToken` exists on their row at call time.

## Elasticsearch

Sent/scheduled emails are indexed into an `email-jobs` index on creation and re-indexed (partial update) on every status change. Like Slack, this is entirely fire-and-forget — if Elasticsearch is down, scheduling and sending both continue to work fine, the index call just logs and moves on.

There's a dedicated `GET /api/emails/search?q=` endpoint that queries ES directly (matches against subject/body, filtered to the current user). The frontend's own Scheduled/Sent tables use MySQL-backed search (`LIKE` queries) rather than this endpoint, since that's what was already wired to the frontend contract — the ES endpoint exists specifically to demonstrate the requirement independently.

**Security note:** Elasticsearch is running with `xpack.security.enabled=false` for local dev simplicity. Do not do this in anything resembling production — I only left it off here because this is a take-home assignment running entirely on localhost.

## Queue visibility

There's a live Bull-Board dashboard at `/admin/queues`, protected by HTTP Basic Auth (not JWT — Bull-Board serves a full HTML page that a browser navigates to directly, and browsers can't attach a custom Bearer header just from typing a URL, so Basic Auth is the standard fit here since browsers handle the login prompt natively). Credentials are in `.env` (`ADMIN_DASHBOARD_USER` / `ADMIN_DASHBOARD_PASS`) — please change these before deploying this anywhere beyond your own machine.

There's also a "View Live Queue Dashboard" button directly in the app's header for convenience.

## Frontend notes

Built with React + Vite + TypeScript, TanStack Query for data fetching, Zustand for auth state, shadcn/ui components, real Google OAuth via `@react-oauth/google`. CSV upload uses `papaparse` client-side to detect and validate recipient emails before scheduling. All API calls are real (no mocked data) — if the backend is down, the dashboard shows a friendly error state rather than crashing.

## Assumptions & trade-offs

- One Google account per email address — no account-linking flow if the same email somehow gets a different Google ID (edge case, unlikely to occur in normal testing).
- A rate-limit slot can be "spent" even if the send itself fails after the counter increments (see rate limiting section above) — a deliberate simplicity trade-off, documented rather than engineered around.
- Elasticsearch security is disabled for local dev only.
- The demo/admin dashboard credentials are meant for local review, not production use.
- I didn't run an actual 1000-email load test against Ethereal — the design (staggering + Redis-backed rate limiting) is meant to handle it, reasoning explained above, but it's not something I directly measured.

## What I'd do differently with more time

- Wire the frontend's own Scheduled/Sent search to hit the Elasticsearch endpoint instead of (or in addition to) MySQL `LIKE` search, now that both exist.
- Add a compensating decrement (or a more careful two-phase commit) for the rate-limit-slot-burned-on-failure edge case.
- Multi-instance testing for the worker (currently tested with one worker process, though the Redis-backed logic is designed to be safe across multiple).
