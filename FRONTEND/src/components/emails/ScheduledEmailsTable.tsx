import { format } from "date-fns";
import { Inbox } from "lucide-react";
import { EmailStatusBadge } from "@/components/emails/EmailStatusBadge";
import { EmptyState } from "@/components/emails/EmptyState";
import { TableSkeleton } from "@/components/emails/TableSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ScheduledEmail } from "@/types/email.types";

interface Props {
  rows: ScheduledEmail[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCompose: () => void;
  hasSearch: boolean;
}

const HEADS = ["Email", "Subject", "Scheduled Time", "Status"];

export function ScheduledEmailsTable({
  rows,
  isLoading,
  isError,
  onRetry,
  onCompose,
  hasSearch,
}: Props) {
  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={hasSearch ? "No matching scheduled emails" : "Nothing scheduled yet"}
        subtitle={
          hasSearch
            ? "Try a different recipient or subject."
            : "Upload a leads CSV and queue your first batch."
        }
        action={
          hasSearch ? undefined : (
            <button
              type="button"
              onClick={onCompose}
              className="text-sm font-medium text-primary hover:underline"
            >
              Compose new email
            </button>
          )
        }
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <TableRow>
              {HEADS.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">
                    {row.recipientEmail}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate text-muted-foreground">
                          {row.subject}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{row.subject}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(new Date(row.scheduledAt), "MMM d, yyyy · h:mm a")}
                  </TableCell>
                  <TableCell>
                    <EmailStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))
          : rows.map((row) => (
              <div key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium">{row.recipientEmail}</p>
                  <EmailStatusBadge status={row.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{row.subject}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(row.scheduledAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
            ))}
      </div>
    </>
  );
}
