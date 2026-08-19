import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import {
  getMe,
  patchMe,
  deleteMe,
  getById,
} from '../../controllers/users/users.controller';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, patchMe);
router.delete('/me', requireAuth, deleteMe);
router.get('/:userId', requireAuth, getById);

export default router;
