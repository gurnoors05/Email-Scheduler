import type { ReactNode } from "react";
import { Activity, Slack, TriangleAlert } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api";
import { ArchitectureInfoModal } from "@/components/layout/ArchitectureInfoModal";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {user && !user.slackConnected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-info">
                <TriangleAlert className="h-4 w-4" aria-hidden />
              </span>
              <p className="text-sm text-foreground">
                Slack rate-limit alerts: connect Slack to get notified when sends are throttled.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end mr-2">
                <a
                  href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/admin/queues`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  <Activity className="h-3.5 w-3.5" />
                  View Live Queue Dashboard
                </a>
                <span className="text-[10px] text-muted-foreground mt-0.5">Requires admin credentials (see README)</span>
              </div>
              <a
                href={`${API_URL}/auth/slack?token=${useAuth().token}`}
                className="inline-flex items-center gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-info transition-colors hover:bg-info/20"
              >
                <Slack className="h-3.5 w-3.5" aria-hidden />
                Connect Slack
              </a>
              <ArchitectureInfoModal />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 border-b border-border bg-sidebar/50 px-6 py-2">
            <div className="flex flex-col items-end">
              <a
                href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/admin/queues`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary"
              >
                <Activity className="h-3.5 w-3.5" />
                View Live Queue Dashboard
              </a>
              <span className="text-[10px] text-muted-foreground mt-0.5">Requires admin credentials (see README)</span>
            </div>
            <ArchitectureInfoModal />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
