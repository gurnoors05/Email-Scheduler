import { esClient } from '../config/elasticsearch';

export async function indexEmailJob(job: any) {
  try {
    await esClient.index({
      index: 'email-jobs',
      id: job.id,
      document: {
        recipientEmail: job.recipientEmail,
        subject: job.subject,
        body: job.body,
        senderEmail: job.senderEmail,
        status: job.status,
        scheduledAt: job.scheduledAt,
        sentAt: job.sentAt || null,
        userId: job.userId
      }
    });
  } catch (error) {
    console.error(`Failed to index email job ${job.id} in Elasticsearch. Swallowing error to prevent crash:`, error);
  }
}

export async function updateEmailJobStatus(jobId: string, status: string, extra: any = {}) {
  try {
    await esClient.update({
      index: 'email-jobs',
      id: jobId,
      doc: {
        status,
        ...extra
      }
    });
  } catch (error) {
    console.error(`Failed to update email job ${jobId} status in Elasticsearch. Swallowing error to prevent crash:`, error);
  }
}
