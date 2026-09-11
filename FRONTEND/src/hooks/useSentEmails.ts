import { useQuery } from "@tanstack/react-query";
import { emailService } from "@/services/email.service";
import type { EmailListParams, PaginatedResponse, SentEmail } from "@/types/email.types";

export const useSentEmails = (params: EmailListParams, enabled = true) =>
  useQuery<PaginatedResponse<SentEmail>>({
    queryKey: ["sent-emails", params],
    queryFn: () => emailService.getSent(params),
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled,
  });
