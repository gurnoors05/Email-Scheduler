import { format } from "date-fns";
import { Send } from "lucide-react";
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
import type { SentEmail } from "@/types/email.types";

interface Props {
  rows: SentEmail[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  hasSearch: boolean;
}

const HEADS = ["Email", "Subject", "Sent Time", "Status"];

function StatusCell({ row }: { row: SentEmail }) {
  if (row.status === "failed" && row.errorMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            <EmailStatusBadge status="failed" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{row.errorMessage}</TooltipContent>
      </Tooltip>
    );
  }
  return <EmailStatusBadge status={row.status} />;
}

export function SentEmailsTable({ rows, isLoading, isError, onRetry, hasSearch }: Props) {
  if (isError) return <ErrorState onRetry={onRetry} />;

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title={hasSearch ? "No matching sent emails" : "No emails sent yet"}
        subtitle={
          hasSearch
            ? "Try a different recipient or subject."
            : "Once your scheduled batches go out, they'll appear here."
        }
      />
    );
  }

  return (
    <>
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
                    {format(new Date(row.sentAt), "MMM d, yyyy · h:mm a")}
                  </TableCell>
                  <TableCell>
                    <StatusCell row={row} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))
          : rows.map((row) => (
              <div key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-medium">{row.recipientEmail}</p>
                  <StatusCell row={row} />
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{row.subject}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {format(new Date(row.sentAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
            ))}
      </div>
    </>
  );
}
