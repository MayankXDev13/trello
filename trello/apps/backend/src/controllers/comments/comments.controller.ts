import type { Response } from "express";
import { db, eq, comments } from "@repo/db";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth";
import {
  getOrganizationIdByIssue,
  isOrgMember,
  isOrgAdmin,
} from "../../lib/org";

export const getOne = async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params as any;
  if (!z.string().uuid().safeParse(commentId).success)
    return res.status(400).json({ message: "Invalid commentId" });
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  const orgId = await getOrganizationIdByIssue(comment.issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId)))
    return res.status(403).json({ message: "Forbidden" });
  return res.status(200).json({ comment });
};

export const patch = async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params as any;
  if (!z.string().uuid().safeParse(commentId).success)
    return res.status(400).json({ message: "Invalid commentId" });
  const parsed = z
    .object({ content: z.string().min(1).max(2000) })
    .safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation error", issues: parsed.error.issues });
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  if (comment.userId !== req.user!.userId)
    return res.status(403).json({ message: "Forbidden - author only" });
  const [updated] = await db
    .update(comments)
    .set({ content: parsed.data.content })
    .where(eq(comments.id, commentId))
    .returning();
  return res.status(200).json({ comment: updated });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params as any;
  if (!z.string().uuid().safeParse(commentId).success)
    return res.status(400).json({ message: "Invalid commentId" });
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  const orgId = await getOrganizationIdByIssue(comment.issueId);
  if (!orgId)
    return res.status(404).json({ message: "Organization not found" });
  const isAuthor = comment.userId === req.user!.userId;
  const isAdmin = await isOrgAdmin(req.user!.userId, orgId);
  if (!isAuthor && !isAdmin)
    return res
      .status(403)
      .json({ message: "Forbidden - author or admin only" });
  await db.delete(comments).where(eq(comments.id, commentId));
  return res.status(200).json({ message: "Comment deleted" });
};
