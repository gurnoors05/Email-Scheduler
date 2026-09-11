import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma';
import { scheduleEmailJob } from '../queues/emailQueue';
import { indexEmailJob } from '../services/searchService';

const scheduleEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  recipients: z.array(z.string().email('Invalid email')).min(1, 'At least one recipient is required'),
  startTime: z.string().datetime({ message: 'Invalid ISO date string' }).refine(v => new Date(v) > new Date(), 'startTime must be in the future'),
  delayBetweenEmails: z.number().min(0),
  hourlyLimit: z.number().min(1),
  senderEmail: z.string().email('Invalid sender email'),
});

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    const parsedData = scheduleEmailSchema.parse(req.body);
    const { subject, body, recipients, startTime, delayBetweenEmails, senderEmail, hourlyLimit } = parsedData;

    const baseStartTime = new Date(startTime);
    const batchId = uuidv4();
    let totalScheduled = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Stagger each recipient's scheduledAt by (index * delayBetweenEmails) seconds
      const scheduledAt = new Date(baseStartTime.getTime() + (i * delayBetweenEmails * 1000));

      const finalJobId = uuidv4();

      const emailJob = await prisma.emailJob.create({
        data: {
          id: finalJobId,
          batchId,
          userId,
          recipientEmail: recipient,
          subject,
          body,
          senderEmail,
          scheduledAt,
          status: 'scheduled',
          bullJobId: finalJobId 
        }
      });

      // Fire and forget indexing to Elasticsearch
      indexEmailJob(emailJob);

      await scheduleEmailJob({
        emailJobId: finalJobId,
        recipientEmail: recipient,
        subject,
        body,
        senderEmail,
        scheduledAt,
        hourlyLimit,
      });

      totalScheduled++;
    }

    return res.status(200).json({
      batchId,
      totalScheduled,
      firstSendAt: baseStartTime.toISOString()
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: (error as z.ZodError).issues });
    }
    console.error('Schedule Email Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const searchStr = search as string;
    
    const whereClause: any = {
      userId: req.userId,
      status: { in: ['scheduled', 'sending'] },
    };

    if (searchStr) {
      whereClause.OR = [
        { recipientEmail: { contains: searchStr } },
        { subject: { contains: searchStr } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.emailJob.findMany({
        where: whereClause,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { scheduledAt: 'asc' }
      }),
      prisma.emailJob.count({ where: whereClause })
    ]);

    return res.status(200).json({ data, total });
  } catch (error) {
    console.error('Get Scheduled Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const searchStr = search as string;
    
    const whereClause: any = {
      userId: req.userId,
      status: { in: ['sent', 'failed'] },
    };

    if (searchStr) {
      whereClause.OR = [
        { recipientEmail: { contains: searchStr } },
        { subject: { contains: searchStr } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.emailJob.findMany({
        where: whereClause,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { sentAt: 'desc' }
      }),
      prisma.emailJob.count({ where: whereClause })
    ]);

    return res.status(200).json({ data, total });
  } catch (error) {
    console.error('Get Sent Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter q is required' });
    }

    const { esClient } = await import('../config/elasticsearch');
    
    const result = await esClient.search({
      index: 'email-jobs',
      query: {
        bool: {
          must: [
            { term: { userId: req.userId } },
            {
              multi_match: {
                query: q,
                fields: ['subject', 'body']
              }
            }
          ]
        }
      }
    });

    // @ts-ignore
    const hits = result.hits.hits.map(hit => {
      return {
        id: hit._id,
        // @ts-ignore
        ...hit._source
      };
    });

    // @ts-ignore
    return res.status(200).json({ data: hits, total: result.hits.total.value });
  } catch (error) {
    console.error('ES Search Error:', error);
    return res.status(500).json({ message: 'Elasticsearch query failed' });
  }
};
