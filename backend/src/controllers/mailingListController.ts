import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getMailingLists = async (req: Request, res: Response) => {
  try {
    const lists = await prisma.mailingList.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching mailing lists:', error);
    res.status(500).json({ error: 'Failed to fetch mailing lists' });
  }
};

export const createMailingList = async (req: Request, res: Response) => {
  try {
    const { name, emails } = req.body;
    if (!name || !emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // validate emails are all valid
    const validEmails = emails.filter(e => typeof e === 'string' && e.includes('@'));
    if (validEmails.length === 0) {
      return res.status(400).json({ error: 'No valid emails provided' });
    }

    const list = await prisma.mailingList.create({
      data: {
        name,
        emails: JSON.stringify(validEmails),
        userId: req.userId!,
      },
    });
    res.status(201).json(list);
  } catch (error) {
    console.error('Error creating mailing list:', error);
    res.status(500).json({ error: 'Failed to create mailing list' });
  }
};

export const deleteMailingList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const list = await prisma.mailingList.findUnique({ where: { id } });
    if (!list) return res.status(404).json({ error: 'Not found' });
    if (list.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.mailingList.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting mailing list:', error);
    res.status(500).json({ error: 'Failed to delete mailing list' });
  }
};
