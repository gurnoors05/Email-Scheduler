import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { getMailingLists, createMailingList, deleteMailingList } from '../controllers/mailingListController';

const router = Router();

router.use(authenticateJWT);

router.get('/', getMailingLists);
router.post('/', createMailingList);
router.delete('/:id', deleteMailingList);

export default router;
