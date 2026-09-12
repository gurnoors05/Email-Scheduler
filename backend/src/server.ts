import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/authRoutes';
import senderRoutes from './routes/senderRoutes';
import emailRoutes from './routes/emailRoutes';
import mailingListRoutes from './routes/mailingListRoutes';

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/mailing-lists', mailingListRoutes);

// Bull-Board Dashboard with Basic Auth
import { basicAuthMiddleware } from './middleware/basicAuth';
import { serverAdapter } from './config/bullBoard';
app.use('/admin/queues', basicAuthMiddleware, serverAdapter.getRouter());

// Import worker and reconciler
import './queues/emailWorker';
import { reconcileJobs } from './queues/reconcile';
import { initElasticsearch } from './config/elasticsearch';

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Run reconciliation at startup
  try {
    await initElasticsearch();
    await reconcileJobs();
  } catch (error) {
    console.error('Failed to reconcile jobs at startup:', error);
  }
});
