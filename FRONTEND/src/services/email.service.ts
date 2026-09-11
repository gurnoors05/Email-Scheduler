import { api } from "@/lib/api";
import type {
  EmailListParams,
  PaginatedResponse,
  ScheduleEmailPayload,
  ScheduleEmailResponse,
  ScheduledEmail,
  SentEmail,
} from "@/types/email.types";

export const emailService = {
  getSenders: () => api.get<string[]>("/senders").then((r) => r.data),

  scheduleBatch: (payload: ScheduleEmailPayload) =>
    api.post<ScheduleEmailResponse>("/emails/schedule", payload).then((r) => r.data),

  getScheduled: (params: EmailListParams) =>
    api
      .get<PaginatedResponse<ScheduledEmail>>("/emails/scheduled", { params })
      .then((r) => r.data),

  getSent: (params: EmailListParams) =>
    api.get<PaginatedResponse<SentEmail>>("/emails/sent", { params }).then((r) => r.data),
};
