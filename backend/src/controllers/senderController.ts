import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getSenders = async (req: Request, res: Response) => {
  try {
    let senders = await prisma.sender.findMany();
    
    if (senders.length === 0) {
      // Seed default senders if empty
      const defaultSenders = [
        'noreply@reachinbox.ai',
        'sales@reachinbox.ai',
        'support@reachinbox.ai'
      ];
      
      await prisma.sender.createMany({
        data: defaultSenders.map(email => ({ email }))
      });
      
      senders = await prisma.sender.findMany();
    }
    
    return res.status(200).json(senders.map(s => s.email));
  } catch (error) {
    console.error('Get Senders Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
