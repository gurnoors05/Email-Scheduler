# ReachInbox — Email Job Scheduler (Frontend)

Production-grade React + TypeScript frontend for an email-scheduling SaaS. Talks to an
Express + BullMQ backend that schedules and sends emails via SMTP. No mocks — every
data call is a real Axios request against the API contract below.

## Stack

- React + TypeScript (strict) on TanStack Start (Vite)
- Tailwind CSS v4 + shadcn/ui
- TanStack Query v5, TanStack Router
- Axios (single instance with auth + 401 interceptor)
- React Hook Form + Zod
- Zustand (auth state, persisted)
- Sonner toasts, lucide-react icons, date-fns, papaparse
- @react-oauth/google for sign-in

## Getting started

```bash
cp .env.example .env
# fill in the two values, then:
bun install
bun run dev
```

### Environment variables

| Variable              | Description                                | Default                    |
| --------------------- | ------------------------------------------ | -------------------------- |
| `VITE_API_URL`        | Base URL of the scheduler API              | `http://localhost:5000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID (required)    | —                          |

Add both your local origin and any deployed preview URL to the Google Cloud
Console → Credentials → "Authorized JavaScript origins".

## API contract

| Method | Endpoint           | Purpose                                  |
| ------ | ------------------ | ---------------------------------------- |
| POST   | `/auth/google`     | Exchange Google credential → { user, token } |
| GET    | `/auth/me`         | Current user                             |
| POST   | `/auth/logout`     | Logout                                   |
| GET    | `/senders`         | Sender email addresses for the compose modal |
| POST   | `/emails/schedule` | Schedule a batch (subject, body, recipients, startTime, delay, hourlyLimit) |
| GET    | `/emails/scheduled?page&limit&search` | Paginated scheduled emails |
| GET    | `/emails/sent?page&limit&search`      | Paginated sent/failed emails |

If the backend is unreachable, the UI shows friendly error and empty states with
retry — the real Axios integration stays in place.

## Structure

```
src/
  components/   ui (shadcn), layout (Header, AppShell, ProtectedRoute),
                emails (ComposeEmailModal, tables, badges, CsvUploader), common
  pages/        LoginPage, DashboardPage, NotFoundPage
  hooks/        useAuth, useScheduledEmails, useSentEmails, useScheduleEmail, ...
  lib/          api.ts (axios instance), queryClient.ts, utils.ts
  services/     auth.service.ts, email.service.ts
  types/        auth.types.ts, email.types.ts
  store/        authStore.ts (Zustand + persist)
  routes/       TanStack Router file routes (/, /login, catch-all)
```
