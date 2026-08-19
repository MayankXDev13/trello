import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import * as ctrl from '../../controllers/boards/boards.controller';

const router = Router();

// Org-scoped board routes
const orgBoardRouter = Router({ mergeParams: true });
orgBoardRouter.post('/', requireAuth, ctrl.createInOrg);
orgBoardRouter.get('/', requireAuth, ctrl.listInOrg);

// Board-scoped routes
const boardRouter = Router();
boardRouter.get('/:boardId', requireAuth, ctrl.getOne);
boardRouter.patch('/:boardId', requireAuth, ctrl.patch);
boardRouter.delete('/:boardId', requireAuth, ctrl.remove);
boardRouter.get('/:boardId/full', requireAuth, ctrl.getFull);
boardRouter.post('/:boardId/sections', requireAuth, ctrl.createSection);
boardRouter.get('/:boardId/sections', requireAuth, ctrl.listSections);

export { orgBoardRouter, boardRouter };
