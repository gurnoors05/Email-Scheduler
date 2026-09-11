import prisma from '../config/prisma';
import { scheduleEmailJob, emailQueue } from './emailQueue';

export async function reconcileJobs() {
  console.log('Starting reconciliation of scheduled jobs...');
  // Query MySQL for EmailJob rows where status = "scheduled"
  const scheduledJobs = await prisma.emailJob.findMany({
    where: { status: 'scheduled' }
  });

  let reconciledCount = 0;

  for (const job of scheduledJobs) {
    // Check if a BullMQ job with that id already exists in the queue
    const existingJob = await emailQueue.getJob(job.id);
    
    if (!existingJob) {
      // If it does NOT exist, re-schedule it via scheduleEmailJob
      // using its original scheduledAt
      console.log(`Reconciling missing BullMQ job for EmailJob ${job.id}`);
      await scheduleEmailJob({
        emailJobId: job.id,
        recipientEmail: job.recipientEmail,
        subject: job.subject,
        body: job.body,
        senderEmail: job.senderEmail,
        scheduledAt: job.scheduledAt,
        hourlyLimit: 200,
      });
      reconciledCount++;
    }
  }

  console.log(`Reconciliation complete. ${reconciledCount} jobs reconciled.`);
}
