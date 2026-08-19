import type { Request, Response } from "express";
import { db, eq, users } from "@repo/db";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth";

const patchSchema = z
  .object({
    username: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
  })
  .refine((d) => d.username || d.email, {
    message: "At least one of username or email required",
  });

export const getMe = async (req: AuthRequest, res: Response) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.userId));
  if (!user) return res.status(404).json({ message: "User not found" });
  return res
    .status(200)
    .json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
};

export const patchMe = async (req: AuthRequest, res: Response) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation error", issues: parsed.error.issues });

  const updates: Record<string, unknown> = {};
  if (parsed.data.username) updates.username = parsed.data.username;
  if (parsed.data.email) updates.email = parsed.data.email;

  // uniqueness check
  if (parsed.data.email) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email));
    if (existing && existing.id !== req.user!.userId)
      return res.status(409).json({ message: "Email already in use" });
  }
  if (parsed.data.username) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, parsed.data.username));
    if (existing && existing.id !== req.user!.userId)
      return res.status(409).json({ message: "Username already in use" });
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, req.user!.userId))
    .returning();
  if (!updated) return res.status(404).json({ message: "User not found" });
  return res
    .status(200)
    .json({
      user: {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
};

export const deleteMe = async (req: AuthRequest, res: Response) => {
  await db.delete(users).where(eq(users.id, req.user!.userId));
  return res.status(200).json({ message: "Account deleted" });
};

export const getById = async (req: Request, res: Response) => {
  const { userId } = req.params as any;
  if (!z.string().uuid().safeParse(userId).success)
    return res.status(400).json({ message: "Invalid userId" });
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return res.status(404).json({ message: "User not found" });
  return res
    .status(200)
    .json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
};
