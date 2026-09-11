import { Router } from 'express';
import { scheduleEmails, getScheduledEmails, getSentEmails, searchEmails } from '../controllers/emailController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/schedule', authenticateJWT, scheduleEmails);
router.get('/scheduled', authenticateJWT, getScheduledEmails);
router.get('/sent', authenticateJWT, getSentEmails);
router.get('/search', authenticateJWT, searchEmails);

export default router;
