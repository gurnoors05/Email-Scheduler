import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getMailingLists, createMailingList, deleteMailingList } from '../controllers/mailingListController';

const router = Router();

router.use(requireAuth);

router.get('/', getMailingLists);
router.post('/', createMailingList);
router.delete('/:id', deleteMailingList);

export default router;
