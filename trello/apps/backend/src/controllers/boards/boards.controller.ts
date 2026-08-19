import type { Response } from "express";
import { db, eq, boards, sections, issues, issueUsers, comments } from "@repo/db";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth";
import { isOrgMember, getOrganizationIdByBoard } from "../../lib/org";

const createSchema = z.object({ title: z.string().min(1).max(200), description: z.string().max(1000).optional() });
const patchSchema = z.object({ title: z.string().min(1).max(200).optional(), description: z.string().max(1000).optional().nullable() });

// POST /organizations/:organizationId/boards
export const createInOrg = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success) return res.status(400).json({ message: "Invalid organizationId" });
  if (!(await isOrgMember(req.user!.userId, organizationId))) return res.status(403).json({ message: "Forbidden" });
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const [board] = await db.insert(boards).values({ title: parsed.data.title, description: parsed.data.description, organizationId }).returning();
  return res.status(201).json({ board });
};

// GET /organizations/:organizationId/boards
export const listInOrg = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success) return res.status(400).json({ message: "Invalid organizationId" });
  if (!(await isOrgMember(req.user!.userId, organizationId))) return res.status(403).json({ message: "Forbidden" });
  const rows = await db.select().from(boards).where(eq(boards.organizationId, organizationId));
  return res.status(200).json({ boards: rows });
};

// GET /boards/:boardId
export const getOne = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params as any;
  if (!z.string().uuid().safeParse(boardId).success) return res.status(400).json({ message: "Invalid boardId" });
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return res.status(404).json({ message: "Board not found" });
  const orgId = board.organizationId;
  if (!(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  return res.status(200).json({ board });
};

// PATCH /boards/:boardId
export const patch = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params as any;
  if (!z.string().uuid().safeParse(boardId).success) return res.status(400).json({ message: "Invalid boardId" });
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return res.status(404).json({ message: "Board not found" });
  if (!(await isOrgMember(req.user!.userId, board.organizationId))) return res.status(403).json({ message: "Forbidden" });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No fields to update" });
  const [updated] = await db.update(boards).set(updates as any).where(eq(boards.id, boardId)).returning();
  return res.status(200).json({ board: updated });
};

// DELETE /boards/:boardId
export const remove = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params as any;
  if (!z.string().uuid().safeParse(boardId).success) return res.status(400).json({ message: "Invalid boardId" });
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return res.status(404).json({ message: "Board not found" });
  if (!(await isOrgMember(req.user!.userId, board.organizationId))) return res.status(403).json({ message: "Forbidden" });
  await db.delete(boards).where(eq(boards.id, boardId));
  return res.status(200).json({ message: "Board deleted" });
};

// GET /boards/:boardId/full
export const getFull = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params as any;
  if (!z.string().uuid().safeParse(boardId).success) return res.status(400).json({ message: "Invalid boardId" });
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  if (!board) return res.status(404).json({ message: "Board not found" });
  if (!(await isOrgMember(req.user!.userId, board.organizationId))) return res.status(403).json({ message: "Forbidden" });

  const secs = await db.select().from(sections).where(eq(sections.boardId, boardId));
  const sectionIds = secs.map((s: any) => s.id);
  let iss: typeof issues.$inferSelect[] = [];
  if (sectionIds.length > 0) {
    // fetch all issues for these sections
    const { inArray } = await import("@repo/db");
    iss = await db.select().from(issues).where(inArray(issues.sectionId, sectionIds));
  }

  // For each issue, fetch assignees and comments
  const { inArray } = await import("@repo/db");
  const issueIds = iss.map((i) => i.id);
  let assigneeRows: any[] = [];
  let commentRows: any[] = [];
  if (issueIds.length > 0) {
    assigneeRows = await db.select().from(issueUsers).where(inArray(issueUsers.issueId, issueIds));
    commentRows = await db.select().from(comments).where(inArray(comments.issueId, issueIds));
  }

  // Need user info for assignees
  let userMap: Record<string, any> = {};
  if (assigneeRows.length > 0) {
    const userIds = [...new Set(assigneeRows.map((r) => r.userId))];
    const { users } = await import("@repo/db");
    const urows = await db.select().from(users).where(inArray(users.id, userIds));
    for (const u of urows) userMap[u.id] = { id: u.id, username: u.username, email: u.email };
  }

  const sectionsWithIssues = secs.map((sec: any) => {
    const secIssues = iss.filter((i) => i.sectionId === sec.id).map((issRow) => {
      const assignees = assigneeRows.filter((a) => a.issueId === issRow.id).map((a) => userMap[a.userId] ?? { id: a.userId });
      const issComments = commentRows.filter((c) => c.issueId === issRow.id);
      return { ...issRow, assignees, comments: issComments };
    });
    return { ...sec, issues: secIssues };
  });

  return res.status(200).json({ board, sections: sectionsWithIssues });
};

// Sections sub-resource for boards
const sectionCreateSchema = z.object({ title: z.string().min(1).max(200) });
export const createSection = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params as any;
  if (!z.string().uuid().safeParse(boardId).success) return res.status(400).json({ message: "Invalid boardId" });
  const orgId = await getOrganizationIdByBoard(boardId);
  if (!orgId) return res.status(404).json({ message: "Board not found" });
  if (!(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const parsed = sectionCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  const [section] = await db.insert(sections).values({ title: parsed.data.title, boardId }).returning();
  return res.status(201).json({ section });
};

export const listSections = async (req: AuthRequest, res: Response) => {
  const { boardId } = req.params as any;
  if (!z.string().uuid().safeParse(boardId).success) return res.status(400).json({ message: "Invalid boardId" });
  const orgId = await getOrganizationIdByBoard(boardId);
  if (!orgId) return res.status(404).json({ message: "Board not found" });
  if (!(await isOrgMember(req.user!.userId, orgId))) return res.status(403).json({ message: "Forbidden" });
  const rows = await db.select().from(sections).where(eq(sections.boardId, boardId));
  return res.status(200).json({ sections: rows });
};
