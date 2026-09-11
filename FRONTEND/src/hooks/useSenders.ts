import { useQuery } from "@tanstack/react-query";
import { emailService } from "@/services/email.service";

export const DEFAULT_SENDERS = [
  "noreply@reachinbox.ai",
  "sales@reachinbox.ai",
  "support@reachinbox.ai",
];

export const useSenders = (enabled = true) =>
  useQuery<string[]>({
    queryKey: ["senders"],
    queryFn: emailService.getSenders,
    staleTime: 5 * 60_000,
    retry: 0,
    enabled,
  });
