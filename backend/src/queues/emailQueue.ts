import { Queue } from 'bullmq';
import redisClient from '../config/redis';

export const emailQueueName = 'email-send';

export const emailQueue = new Queue(emailQueueName, {
  connection: redisClient,
});

export async function scheduleEmailJob(data: {
  emailJobId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  scheduledAt: Date;
  hourlyLimit: number;
}) {
  // Compute delay = scheduledAt.getTime() - Date.now() (clamp to 0 if negative)
  let delay = data.scheduledAt.getTime() - Date.now();
  if (delay < 0) {
    delay = 0;
  }

  await emailQueue.add(
    data.emailJobId, // job name can be the id
    data,
    {
      jobId: data.emailJobId, // Explicit jobId for idempotency in BullMQ
      delay,
      removeOnComplete: false,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // wait 5s, 10s, 20s
      },
    }
  );

  console.log(`Job ${data.emailJobId} added to queue with delay ${delay}ms`);
}
