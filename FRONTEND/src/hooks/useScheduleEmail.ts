import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { emailService } from "@/services/email.service";
import { getErrorMessage } from "@/lib/api";
import type { ScheduleEmailPayload, ScheduleEmailResponse } from "@/types/email.types";

export const useScheduleEmail = () => {
  const qc = useQueryClient();

  return useMutation<ScheduleEmailResponse, unknown, ScheduleEmailPayload>({
    mutationFn: emailService.scheduleBatch,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["scheduled-emails"] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        toast.error(
          "Hourly limit reached for this sender. Remaining emails will be sent in the next window.",
        );
        return;
      }
      toast.error(getErrorMessage(err, "Failed to schedule"));
    },
  });
};
