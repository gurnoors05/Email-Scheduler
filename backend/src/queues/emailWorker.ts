import { Worker, Job, DelayedError } from 'bullmq';
import nodemailer from 'nodemailer';
import redisClient from '../config/redis';
import prisma from '../config/prisma';
import { emailQueueName } from './emailQueue';
import { checkAndIncrementRateLimit, checkMinimumDelay } from '../services/rateLimiter';
import { notifyRateLimitHit } from '../services/slackService';
import { updateEmailJobStatus } from '../services/searchService';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

// Configure Nodemailer transporter with Ethereal SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailWorker = new Worker(
  emailQueueName,
  async (job: Job) => {
    // a. Load the EmailJob row from MySQL by id = job.id
    const emailJob = await prisma.emailJob.findUnique({
      where: { id: job.id! }
    });

    if (!emailJob) {
      throw new Error(`EmailJob with id ${job.id} not found in database.`);
    }

    // b. Idempotency guard: If row.status is already "sent" or "failed", return immediately
    if (emailJob.status === 'sent' || emailJob.status === 'failed') {
      console.log(`Job ${job.id} already ${emailJob.status}. Skipping.`);
      return;
    }

    // c. Set status = "sending"
    await prisma.emailJob.update({
      where: { id: job.id! },
      data: { status: 'sending' }
    });
    updateEmailJobStatus(job.id!, 'sending');

    // d. Rate limiting injection point (Module 3)
    // 1. Minimum Delay Check (Do this FIRST so we don't burn an hourly slot if we're just delaying)
    const { allowed: delayAllowed, delayMs } = await checkMinimumDelay(emailJob.senderEmail);
    
    if (!delayAllowed) {
      console.log(`Job ${job.id} hit minimum delay limit. Delaying by ${delayMs}ms.`);
      
      await prisma.emailJob.update({
        where: { id: job.id! },
        data: { status: 'scheduled' }
      });
      updateEmailJobStatus(job.id!, 'scheduled');
      
      await job.moveToDelayed(Date.now() + delayMs!, job.token);
      throw new DelayedError();
    }

    // 2. Hourly Rate Limit Check (Only increment if we passed the delay check)
    const hourlyLimit = job.data.hourlyLimit || 200;
    const { allowed: rateAllowed, nextWindowStart } = await checkAndIncrementRateLimit(emailJob.senderEmail, hourlyLimit);
    
    if (!rateAllowed) {
      console.log(`Job ${job.id} hit hourly rate limit. Rescheduling to ${nextWindowStart}.`);
      
      // Fire and forget Slack notification
      notifyRateLimitHit(emailJob.userId, emailJob.senderEmail).catch(err => {
         console.error('Unexpected error from notifyRateLimitHit', err);
      });

      // Revert DB status back to scheduled
      await prisma.emailJob.update({
        where: { id: job.id! },
        data: { status: 'scheduled' }
      });
      updateEmailJobStatus(job.id!, 'scheduled');
      
      // Move active job back to delayed natively without collisions
      await job.moveToDelayed(nextWindowStart!.getTime(), job.token);
      throw new DelayedError(); // Signals BullMQ to pause job without failing it
    }

    try {
      // e. Send via nodemailer
      await transporter.sendMail({
        from: emailJob.senderEmail,
        to: emailJob.recipientEmail,
        subject: emailJob.subject,
        text: emailJob.body,
        // Depending on body content, could map to html as well
      });

      // f. On success: set status = "sent", sentAt = now
      const now = new Date();
      await prisma.emailJob.update({
        where: { id: job.id! },
        data: {
          status: 'sent',
          sentAt: now
        }
      });
      updateEmailJobStatus(job.id!, 'sent', { sentAt: now });
      console.log(`Job ${job.id} successfully sent.`);
    } catch (error: any) {
      // g. On failure: set status = "failed", errorMessage = err.message, rethrow
      // Only write "failed" if this is the final attempt so retries are not blocked
      const maxAttempts = job.opts.attempts || 1;
      const isFinalAttempt = job.attemptsMade >= maxAttempts;

      if (isFinalAttempt) {
        await prisma.emailJob.update({
          where: { id: job.id! },
          data: {
            status: 'failed',
            errorMessage: error.message
          }
        });
        updateEmailJobStatus(job.id!, 'failed', { errorMessage: error.message });
        console.error(`Job ${job.id} failed on final attempt (${job.attemptsMade}):`, error.message);
      } else {
        console.warn(`Job ${job.id} failed on attempt ${job.attemptsMade} of ${maxAttempts}, will retry:`, error.message);
      }
      
      throw error; // Rethrow so BullMQ's retry/backoff applies
    }
  },
  {
    connection: redisClient,
    concurrency: WORKER_CONCURRENCY,
  }
);

emailWorker.on('error', (err) => {
  console.error('Email Worker error:', err);
});
