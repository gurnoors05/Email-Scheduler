import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export function ListsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Mailing Lists
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your audience and contacts.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border border-dashed bg-card/50 py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
            No lists created yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            This page is a placeholder for your future mailing lists feature. Right now, you can upload your CSV lists directly when scheduling an email on the Dashboard.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
