import type { Response } from "express";
import { db, eq, and, issues, sections, issueUsers, comments, users } from "@repo/db";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth";
import { getOrganizationIdByIssue, getOrganizationIdBySection, isOrgMember } from "../../lib/org";

const patchSchema = z.object({ title: z.string().min(1).max(200).optional(), description: z.string().max(2000).optional().nullable() });

export const getOne = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  return res.status(200).json({ issue });
};

export const patch = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No fields to update" });
  const [updated] = await db.update(issues).set(updates as any).where(eq(issues.id, issueId)).returning();
  return res.status(200).json({ issue: updated });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  await db.delete(issues).where(eq(issues.id, issueId));
  return res.status(200).json({ message: "Issue deleted" });
};

const moveSchema = z.object({ targetSectionId: z.string().uuid() });
export const move = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const [targetSection] = await db.select().from(sections).where(eq(sections.id, parsed.data.targetSectionId));
  if (!targetSection) return res.status(404).json({ message: "Target section not found" });
  // ensure target section is in same org (via board)
  const targetOrgId = await getOrganizationIdBySection(parsed.data.targetSectionId);
  if (targetOrgId !== orgId) return res.status(400).json({ message: "Target section must be in same organization" });
  const [updated] = await db.update(issues).set({ sectionId: parsed.data.targetSectionId }).where(eq(issues.id, issueId)).returning();
  return res.status(200).json({ issue: updated });
};

// Assignees
export const listAssignees = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const rows = await db.select({ assignment: issueUsers, user: users }).from(issueUsers).innerJoin(users, eq(users.id, issueUsers.userId)).where(eq(issueUsers.issueId, issueId));
  return res.status(200).json({ assignees: rows.map((r: any) => ({ id: r.user.id, username: r.user.username, email: r.user.email })) });
};

const assignSchema = z.object({ userId: z.string().uuid() });
export const addAssignee = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  // assignee must be org member
  if (!(await isOrgMember(parsed.data.userId, orgId))) return res.status(403).json({ message: "Assignee must be organization member" });
  const [targetUser] = await db.select().from(users).where(eq(users.id, parsed.data.userId));
  if (!targetUser) return res.status(404).json({ message: "User not found" });
  try {
    const [row] = await db.insert(issueUsers).values({ issueId, userId: parsed.data.userId }).returning();
    return res.status(201).json({ assignee: row });
  } catch (e: any) {
    if ((e as any)?.code === "23505" || (e as any)?.cause?.code === "23505" || String((e as any)?.cause?.message||"").includes("duplicate") || String(e?.message).includes("unique")) return res.status(409).json({ message: "Already assigned" });
    throw e;
  }
};

export const removeAssignee = async (req: AuthRequest, res: Response) => {
  const { issueId, userId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success || !z.string().uuid().safeParse(userId).success) return res.status(400).json({ message: "Invalid id" });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const [deleted] = await db.delete(issueUsers).where(and(eq(issueUsers.issueId, issueId), eq(issueUsers.userId, userId))).returning();
  if (!deleted) return res.status(404).json({ message: "Assignment not found" });
  return res.status(200).json({ message: "Assignee removed" });
};

// Comments sub-resource for issues
export const listComments = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const rows = await db.select().from(comments).where(eq(comments.issueId, issueId));
  return res.status(200).json({ comments: rows });
};

const commentCreateSchema = z.object({ content: z.string().min(1).max(2000) });
export const createComment = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params as any;
  if (!z.string().uuid().safeParse(issueId).success) return res.status(400).json({ message: "Invalid issueId" });
  const parsed = commentCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  const orgId = await getOrganizationIdByIssue(issueId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const [comment] = await db.insert(comments).values({ content: parsed.data.content, issueId, userId: req.user!.userId }).returning();
  return res.status(201).json({ comment });
};
