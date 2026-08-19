import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import * as ctrl from '../../controllers/organizations/organizations.controller';

const router = Router();

router.post('/', requireAuth, ctrl.create);
router.get('/', requireAuth, ctrl.list);
router.get('/:organizationId', requireAuth, ctrl.getOne);
router.patch('/:organizationId', requireAuth, ctrl.patch);
router.delete('/:organizationId', requireAuth, ctrl.remove);

router.get('/:organizationId/members', requireAuth, ctrl.listMembers);
router.post('/:organizationId/members', requireAuth, ctrl.addMember);
router.patch('/:organizationId/members/:userId', requireAuth, ctrl.patchMember);
router.delete(
  '/:organizationId/members/:userId',
  requireAuth,
  ctrl.removeMember
);

export default router;
