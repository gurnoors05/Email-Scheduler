import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposeEmailModal } from "@/components/emails/ComposeEmailModal";
import { PaginationBar } from "@/components/emails/PaginationBar";
import { ScheduledEmailsTable } from "@/components/emails/ScheduledEmailsTable";
import { SentEmailsTable } from "@/components/emails/SentEmailsTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useScheduledEmails } from "@/hooks/useScheduledEmails";
import { useSentEmails } from "@/hooks/useSentEmails";

type TabKey = "scheduled" | "sent";

export function DashboardPage() {
  const searchParams = useSearch({ from: "/" }) as { tab?: TabKey };
  const navigate = useNavigate();
  
  const tab = searchParams.tab ?? "scheduled";
  const setTab = (newTab: TabKey) => {
    void navigate({ to: "/", search: { tab: newTab }, replace: true });
  };
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [composeOpen, setComposeOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => setPage(1), [debouncedSearch, tab, limit]);

  const params = useMemo(
    () => ({ page, limit, ...(debouncedSearch ? { search: debouncedSearch } : {}) }),
    [page, limit, debouncedSearch],
  );

  const scheduled = useScheduledEmails(params, tab === "scheduled");
  const sent = useSentEmails(params, tab === "sent");
  const active = tab === "scheduled" ? scheduled : sent;
  const total = active.data?.total ?? 0;

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex flex-col gap-4 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Scheduled Emails
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your upcoming automated outreach.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full rounded-xl border-input bg-card py-2 pl-10 text-sm focus-visible:ring-primary/50 sm:w-64"
              aria-label="Search emails"
            />
          </div>
          <button
            onClick={() => setComposeOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-primary transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Compose email
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="px-6 pb-8 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="scheduled"
                className="rounded-none border-b-2 border-transparent px-8 py-4 text-sm font-semibold text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="rounded-none border-b-2 border-transparent px-8 py-4 text-sm font-semibold text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Sent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled" className="m-0">
              <ScheduledEmailsTable
                rows={scheduled.data?.data ?? []}
                isLoading={scheduled.isPending}
                isError={scheduled.isError}
                onRetry={() => void scheduled.refetch()}
                onCompose={() => setComposeOpen(true)}
                hasSearch={Boolean(debouncedSearch)}
              />
            </TabsContent>

            <TabsContent value="sent" className="m-0">
              <SentEmailsTable
                rows={sent.data?.data ?? []}
                isLoading={sent.isPending}
                isError={sent.isError}
                onRetry={() => void sent.refetch()}
                hasSearch={Boolean(debouncedSearch)}
              />
            </TabsContent>
          </Tabs>

          {!active.isError && total > 0 ? (
            <PaginationBar
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          ) : null}
        </div>
      </div>

      <ComposeEmailModal open={composeOpen} onOpenChange={setComposeOpen} />
    </AppShell>
  );
}
