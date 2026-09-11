import { Router } from 'express';
import { googleAuth, getMe, logout, slackAuthRedirect, slackAuthCallback } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/google', googleAuth);
router.get('/me', authenticateJWT, getMe);
router.post('/logout', logout);
router.get('/slack', authenticateJWT, slackAuthRedirect);
router.get('/slack/callback', slackAuthCallback);

export default router;
