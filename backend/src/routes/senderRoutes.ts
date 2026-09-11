import { Router } from 'express';
import { getSenders } from '../controllers/senderController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', authenticateJWT, getSenders);

export default router;
