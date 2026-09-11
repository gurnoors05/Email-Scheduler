import { useQuery } from "@tanstack/react-query";
import { emailService } from "@/services/email.service";
import type { EmailListParams, PaginatedResponse, ScheduledEmail } from "@/types/email.types";

export const useScheduledEmails = (params: EmailListParams, enabled = true) =>
  useQuery<PaginatedResponse<ScheduledEmail>>({
    queryKey: ["scheduled-emails", params],
    queryFn: () => emailService.getScheduled(params),
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled,
  });
