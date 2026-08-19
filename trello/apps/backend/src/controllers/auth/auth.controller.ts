import type { Request, Response } from "express";
import { db, eq, users } from "@repo/db";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import type { AuthRequest } from "../../middlewares/auth";

const registerSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  }
  const { username, email, password } = parsed.data;

  const [existingEmail] = await db.select().from(users).where(eq(users.email, email));
  if (existingEmail) {
    return res.status(409).json({ message: "Email already in use" });
  }
  const [existingUsername] = await db.select().from(users).where(eq(users.username, username));
  if (existingUsername) {
    return res.status(409).json({ message: "Username already in use" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ username, email, password: hashed }).returning();
  if (!user) return res.status(500).json({ message: "Failed to create user" });

  return res.status(201).json({ message: "User registered successfully", user: { id: user.id, username: user.username, email: user.email } });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation error", issues: parsed.error.issues });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const payload = { userId: user.id, username: user.username, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return res.status(200).json({ message: "User logged in successfully", accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email } });
};

export const logout = async (_req: Request, res: Response) => {
  // Stateless JWT - client discards tokens. No server-side blacklist for MVP.
  return res.status(200).json({ message: "Logged out successfully" });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  const token = refreshToken || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
  if (!token) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  try {
    const payload = verifyRefreshToken(token);
    const newAccess = signAccessToken({ userId: payload.userId, username: payload.username, email: payload.email });
    const newRefresh = signRefreshToken({ userId: payload.userId, username: payload.username, email: payload.email });
    return res.status(200).json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({ user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
};
