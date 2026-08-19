import type { Response } from "express";
import { db, eq, sections, issues } from "@repo/db";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth";
import {
  getOrganizationIdByBoard,
  getOrganizationIdBySection,
  isOrgMember,
} from "../../lib/org";

const patchSchema = z.object({ title: z.string().min(1).max(200) });

export const getOne = async (req: AuthRequest, res: Response) => {
  const { sectionId } = req.params as any;
  if (!z.string().uuid().safeParse(sectionId).success)
    return res.status(400).json({ message: "Invalid sectionId" });
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId));
  if (!section) return res.status(404).json({ message: "Section not found" });
  const orgId = await getOrganizationIdBySection(sectionId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId)))
    return res.status(403).json({ message: "Forbidden" });
  return res.status(200).json({ section });
};

export const patch = async (req: AuthRequest, res: Response) => {
  const { sectionId } = req.params as any;
  if (!z.string().uuid().safeParse(sectionId).success)
    return res.status(400).json({ message: "Invalid sectionId" });
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId));
  if (!section) return res.status(404).json({ message: "Section not found" });
  const orgId = await getOrganizationIdBySection(sectionId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId)))
    return res.status(403).json({ message: "Forbidden" });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation error", issues: parsed.error.issues });
  const [updated] = await db
    .update(sections)
    .set({ title: parsed.data.title })
    .where(eq(sections.id, sectionId))
    .returning();
  return res.status(200).json({ section: updated });
};

export const remove = async (req: AuthRequest, res: Response) => {
  const { sectionId } = req.params as any;
  if (!z.string().uuid().safeParse(sectionId).success)
    return res.status(400).json({ message: "Invalid sectionId" });
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId));
  if (!section) return res.status(404).json({ message: "Section not found" });
  const orgId = await getOrganizationIdBySection(sectionId);
  if (!orgId || !(await isOrgMember(req.user!.userId, orgId)))
    return res.status(403).json({ message: "Forbidden" });
  await db.delete(sections).where(eq(sections.id, sectionId));
  return res.status(200).json({ message: "Section deleted" });
};

// Issues sub-resource for sections
const issueCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const createIssue = async (req: AuthRequest, res: Response) => {
  const { sectionId } = req.params as any;
  if (!z.string().uuid().safeParse(sectionId).success)
    return res.status(400).json({ message: "Invalid sectionId" });
  const orgId = await getOrganizationIdBySection(sectionId);
  if (!orgId) return res.status(404).json({ message: "Section not found" });
  if (!(await isOrgMember(req.user!.userId, orgId)))
    return res.status(403).json({ message: "Forbidden" });
  // ensure section exists
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId));
  if (!section) return res.status(404).json({ message: "Section not found" });
  const parsed = issueCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation error", issues: parsed.error.issues });
  const [issue] = await db
    .insert(issues)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      sectionId,
    })
    .returning();
  return res.status(201).json({ issue });
};

export const listIssues = async (req: AuthRequest, res: Response) => {
  const { sectionId } = req.params as any;
  if (!z.string().uuid().safeParse(sectionId).success)
    return res.status(400).json({ message: "Invalid sectionId" });
  const orgId = await getOrganizationIdBySection(sectionId);
  if (!orgId) return res.status(404).json({ message: "Section not found" });
  if (!(await isOrgMember(req.user!.userId, orgId)))
    return res.status(403).json({ message: "Forbidden" });
  const rows = await db
    .select()
    .from(issues)
    .where(eq(issues.sectionId, sectionId));
  return res.status(200).json({ issues: rows });
};
