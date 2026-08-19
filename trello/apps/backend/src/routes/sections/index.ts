import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import * as ctrl from '../../controllers/sections/sections.controller';

const router = Router();

router.get('/:sectionId', requireAuth, ctrl.getOne);
router.patch('/:sectionId', requireAuth, ctrl.patch);
router.delete('/:sectionId', requireAuth, ctrl.remove);
router.post('/:sectionId/issues', requireAuth, ctrl.createIssue);
router.get('/:sectionId/issues', requireAuth, ctrl.listIssues);

export default router;
