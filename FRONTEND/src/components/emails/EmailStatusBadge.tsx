import { cn } from "@/lib/utils";
import type { EmailStatus } from "@/types/email.types";

const STYLES: Record<EmailStatus, { label: string; wrap: string; dot: string; pulse?: boolean }> = {
  scheduled: {
    label: "Scheduled",
    wrap: "bg-info/10 text-info ring-info/20",
    dot: "bg-info",
  },
  sending: {
    label: "Sending",
    wrap: "bg-warning/10 text-warning ring-warning/20",
    dot: "bg-warning",
    pulse: true,
  },
  sent: {
    label: "Sent",
    wrap: "bg-success/10 text-success ring-success/20",
    dot: "bg-success",
  },
  failed: {
    label: "Failed",
    wrap: "bg-destructive/10 text-destructive ring-destructive/20",
    dot: "bg-destructive",
  },
};

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        style.wrap,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", style.dot, style.pulse && "animate-pulse")}
        aria-hidden
      />
      {style.label}
    </span>
  );
}
