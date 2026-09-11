import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMinutes, format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CsvUploader } from "@/components/emails/CsvUploader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DEFAULT_SENDERS, useSenders } from "@/hooks/useSenders";
import { useScheduleEmail } from "@/hooks/useScheduleEmail";

const schema = z.object({
  senderEmail: z.string().email("Pick a sender"),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Body is required").max(5000),
  recipients: z.array(z.string().email()).min(1, "Upload a CSV with at least one email"),
  startTime: z
    .string()
    .min(1, "Pick a start time")
    .refine((v) => new Date(v) > new Date(), "Must be in the future"),
  delayBetweenEmails: z.coerce.number().min(0).max(60),
  hourlyLimit: z.coerce.number().min(1).max(10000),
});

type FormValues = z.input<typeof schema>;

const localInput = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeEmailModal({ open, onOpenChange }: Props) {
  const { data: senders } = useSenders(open);
  const options = senders?.length ? senders : DEFAULT_SENDERS;
  const schedule = useScheduleEmail();

  const defaults = (): FormValues => ({
    senderEmail: options[0] ?? DEFAULT_SENDERS[0]!,
    subject: "",
    body: "",
    recipients: [],
    startTime: localInput(addMinutes(new Date(), 5)),
    delayBetweenEmails: 2,
    hourlyLimit: 200,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => {
    if (open) reset(defaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (senders?.length) setValue("senderEmail", senders[0]!);
  }, [senders, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.parse(values);
    const startIso = new Date(parsed.startTime).toISOString();
    const res = await schedule.mutateAsync({ ...parsed, startTime: startIso });
    toast.success(
      `Scheduled ${res.totalScheduled ?? parsed.recipients.length} emails starting at ${format(
        new Date(res.firstSendAt ?? startIso),
        "h:mm a",
      )}`,
    );
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-xl sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Compose new email</DialogTitle>
          <DialogDescription>
            Upload your leads, set the pace, and let the scheduler handle delivery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="senderEmail">Sender email</Label>
            <Controller
              control={control}
              name="senderEmail"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="senderEmail" className="rounded-lg">
                    <SelectValue placeholder="Select a sender" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.senderEmail ? (
              <p className="text-sm text-destructive">{errors.senderEmail.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" maxLength={200} {...register("subject")} className="rounded-lg" />
            {errors.subject ? (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" rows={7} maxLength={5000} {...register("body")} />
            <p className="text-xs text-muted-foreground">
              Supports {"{{name}}"} personalization.
            </p>
            {errors.body ? <p className="text-sm text-destructive">{errors.body.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Leads CSV</Label>
            <Controller
              control={control}
              name="recipients"
              render={({ field }) => (
                <CsvUploader value={field.value ?? []} onChange={field.onChange} />
              )}
            />
            {errors.recipients ? (
              <p className="text-sm text-destructive">{errors.recipients.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="startTime">Start time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
                className="rounded-lg"
              />
              {errors.startTime ? (
                <p className="text-sm text-destructive">{errors.startTime.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="delayBetweenEmails">Delay (seconds)</Label>
              <Input
                id="delayBetweenEmails"
                type="number"
                min={0}
                max={60}
                {...register("delayBetweenEmails")}
                className="rounded-lg"
              />
              {errors.delayBetweenEmails ? (
                <p className="text-sm text-destructive">{errors.delayBetweenEmails.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hourlyLimit">Hourly limit</Label>
              <Input
                id="hourlyLimit"
                type="number"
                min={1}
                max={10000}
                {...register("hourlyLimit")}
                className="rounded-lg"
              />
              {errors.hourlyLimit ? (
                <p className="text-sm text-destructive">{errors.hourlyLimit.message}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={schedule.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={schedule.isPending}>
              {schedule.isPending ? <LoadingSpinner /> : null}
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
