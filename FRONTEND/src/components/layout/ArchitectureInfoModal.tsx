import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ArchitectureInfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
          <Info className="mr-1.5 h-3.5 w-3.5" />
          How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Architecture & Features</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  <th className="px-4 py-3 font-semibold">Implementation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Scheduling (no cron)</td>
                  <td className="px-4 py-3 text-muted-foreground">BullMQ delayed jobs, Redis-backed</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Restart survival</td>
                  <td className="px-4 py-3 text-muted-foreground">Jobs persist in Redis; reconciliation runs on boot as a safety net</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Idempotency</td>
                  <td className="px-4 py-3 text-muted-foreground">Job ID = DB row ID; status checked before every send</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Rate limiting</td>
                  <td className="px-4 py-3 text-muted-foreground">Atomic Redis counters, per-sender hourly buckets</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Rate-limit alerts</td>
                  <td className="px-4 py-3 text-muted-foreground">Real Slack OAuth + live chat.postMessage</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Queue visibility</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <a
                      href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/admin/queues`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline hover:text-info transition-colors"
                    >
                      Live Bull-Board dashboard at /admin/queues
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-foreground">Search</td>
                  <td className="px-4 py-3 text-muted-foreground">Elasticsearch, indexed on write and on status update</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            * Elasticsearch search is available via a dedicated API endpoint; the dashboard tables above use MySQL-backed search for now.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
