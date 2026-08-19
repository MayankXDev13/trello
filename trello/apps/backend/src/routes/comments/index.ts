import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import * as ctrl from "../../controllers/comments/comments.controller";

const router = Router();

router.get("/:commentId", requireAuth, ctrl.getOne);
router.patch("/:commentId", requireAuth, ctrl.patch);
router.delete("/:commentId", requireAuth, ctrl.remove);

export default router;
