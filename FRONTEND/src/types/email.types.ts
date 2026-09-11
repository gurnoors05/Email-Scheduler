export type EmailStatus = "scheduled" | "sending" | "sent" | "failed";

export interface ScheduledEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: EmailStatus;
  senderEmail: string;
  createdAt: string;
}

export interface SentEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: "sent" | "failed";
  errorMessage?: string;
  senderEmail: string;
}

export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  senderEmail: string;
}

export interface ScheduleEmailResponse {
  batchId: string;
  totalScheduled: number;
  firstSendAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface EmailListParams {
  page: number;
  limit: number;
  search?: string;
}
