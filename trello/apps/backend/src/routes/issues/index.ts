import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import * as ctrl from "../../controllers/issues/issues.controller";

const router = Router();

router.get("/:issueId", requireAuth, ctrl.getOne);
router.patch("/:issueId", requireAuth, ctrl.patch);
router.delete("/:issueId", requireAuth, ctrl.remove);
router.patch("/:issueId/move", requireAuth, ctrl.move);

router.get("/:issueId/assignees", requireAuth, ctrl.listAssignees);
router.post("/:issueId/assignees", requireAuth, ctrl.addAssignee);
router.delete("/:issueId/assignees/:userId", requireAuth, ctrl.removeAssignee);

router.get("/:issueId/comments", requireAuth, ctrl.listComments);
router.post("/:issueId/comments", requireAuth, ctrl.createComment);

export default router;
