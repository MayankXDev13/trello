import type { Response } from 'express';
import { db, eq, and, organizations, userOrganizations, users } from '@repo/db';
import { z } from 'zod';
import type { AuthRequest } from '../../middlewares/auth';
import { isOrgMember, isOrgAdmin } from '../../lib/org';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

// POST /organizations
export const create = async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: 'Validation error', issues: parsed.error.issues });

  const [org] = await db
    .insert(organizations)
    .values({ name: parsed.data.name, description: parsed.data.description })
    .returning();
  if (!org)
    return res.status(500).json({ message: 'Failed to create organization' });
  await db.insert(userOrganizations).values({
    userId: req.user!.userId,
    organizationId: org.id,
    role: 'admin',
  });
  return res.status(201).json({ organization: org });
};

// GET /organizations - list my orgs
export const list = async (req: AuthRequest, res: Response) => {
  const rows = await db
    .select({ org: organizations, role: userOrganizations.role })
    .from(userOrganizations)
    .innerJoin(
      organizations,
      eq(organizations.id, userOrganizations.organizationId)
    )
    .where(eq(userOrganizations.userId, req.user!.userId));
  return res.status(200).json({
    organizations: rows.map((r: any) => ({ ...r.org, role: r.role })),
  });
};

// GET /organizations/:organizationId
export const getOne = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success)
    return res.status(400).json({ message: 'Invalid organizationId' });
  const member = await isOrgMember(req.user!.userId, organizationId);
  if (!member) return res.status(403).json({ message: 'Forbidden' });
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId));
  if (!org) return res.status(404).json({ message: 'Organization not found' });
  return res.status(200).json({ organization: org });
};

// PATCH /organizations/:organizationId
export const patch = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success)
    return res.status(400).json({ message: 'Invalid organizationId' });
  if (!(await isOrgAdmin(req.user!.userId, organizationId)))
    return res.status(403).json({ message: 'Forbidden - admin only' });
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: 'Validation error', issues: parsed.error.issues });
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description;
  if (Object.keys(updates).length === 0)
    return res.status(400).json({ message: 'No fields to update' });
  const [updated] = await db
    .update(organizations)
    .set(updates as any)
    .where(eq(organizations.id, organizationId))
    .returning();
  if (!updated)
    return res.status(404).json({ message: 'Organization not found' });
  return res.status(200).json({ organization: updated });
};

// DELETE /organizations/:organizationId
export const remove = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success)
    return res.status(400).json({ message: 'Invalid organizationId' });
  if (!(await isOrgAdmin(req.user!.userId, organizationId)))
    return res.status(403).json({ message: 'Forbidden - admin only' });
  const [deleted] = await db
    .delete(organizations)
    .where(eq(organizations.id, organizationId))
    .returning();
  if (!deleted)
    return res.status(404).json({ message: 'Organization not found' });
  return res.status(200).json({ message: 'Organization deleted' });
};

// Members
export const listMembers = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success)
    return res.status(400).json({ message: 'Invalid organizationId' });
  if (!(await isOrgMember(req.user!.userId, organizationId)))
    return res.status(403).json({ message: 'Forbidden' });
  const rows = await db
    .select({ membership: userOrganizations, user: users })
    .from(userOrganizations)
    .innerJoin(users, eq(users.id, userOrganizations.userId))
    .where(eq(userOrganizations.organizationId, organizationId));
  return res.status(200).json({
    members: rows.map((r: any) => ({
      id: r.user.id,
      username: r.user.username,
      email: r.user.email,
      role: r.membership.role,
      membershipId: r.membership.id,
    })),
  });
};

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'member']).default('member'),
});
export const addMember = async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.params as any;
  if (!z.string().uuid().safeParse(organizationId).success)
    return res.status(400).json({ message: 'Invalid organizationId' });
  if (!(await isOrgAdmin(req.user!.userId, organizationId)))
    return res.status(403).json({ message: 'Forbidden - admin only' });
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: 'Validation error', issues: parsed.error.issues });
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, parsed.data.userId));
  if (!targetUser) return res.status(404).json({ message: 'User not found' });
  try {
    const [row] = await db
      .insert(userOrganizations)
      .values({
        userId: parsed.data.userId,
        organizationId,
        role: parsed.data.role,
      })
      .returning();
    return res.status(201).json({ member: row });
  } catch (e: any) {
    if (
      (e as any)?.code === '23505' ||
      (e as any)?.cause?.code === '23505' ||
      String((e as any)?.cause?.message || '').includes('duplicate') ||
      String(e?.message).includes('unique')
    )
      return res.status(409).json({ message: 'Already a member' });
    throw e;
  }
};

const patchMemberSchema = z.object({ role: z.enum(['admin', 'member']) });
export const patchMember = async (req: AuthRequest, res: Response) => {
  const { organizationId, userId } = req.params as any;
  if (
    !z.string().uuid().safeParse(organizationId).success ||
    !z.string().uuid().safeParse(userId).success
  )
    return res.status(400).json({ message: 'Invalid id' });
  if (!(await isOrgAdmin(req.user!.userId, organizationId)))
    return res.status(403).json({ message: 'Forbidden - admin only' });
  const parsed = patchMemberSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: 'Validation error', issues: parsed.error.issues });
  const [updated] = await db
    .update(userOrganizations)
    .set({ role: parsed.data.role })
    .where(
      and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      )
    )
    .returning();
  if (!updated)
    return res.status(404).json({ message: 'Membership not found' });
  return res.status(200).json({ member: updated });
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  const { organizationId, userId } = req.params as any;
  if (
    !z.string().uuid().safeParse(organizationId).success ||
    !z.string().uuid().safeParse(userId).success
  )
    return res.status(400).json({ message: 'Invalid id' });
  if (!(await isOrgAdmin(req.user!.userId, organizationId)))
    return res.status(403).json({ message: 'Forbidden - admin only' });
  const [deleted] = await db
    .delete(userOrganizations)
    .where(
      and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.userId, userId)
      )
    )
    .returning();
  if (!deleted)
    return res.status(404).json({ message: 'Membership not found' });
  return res.status(200).json({ message: 'Member removed' });
};
