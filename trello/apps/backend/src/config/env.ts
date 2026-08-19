import { z } from "zod";
import "dotenv/config"

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  ALLOWED_ORIGINS: z.string().optional(),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  ACCESS_TOKEN_SECRET: z.string().min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters").default("access-token-secret-must-be-32chars-long!!"),
  REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters").default("refresh-token-secret-must-be-32chars-long!"),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

  // Email
  RESEND_API_KEY: z.string().optional().default("dummy-resend-key"),
  RESEND_FROM_EMAIL: z.string().email().optional().default("test@example.com"),

  // OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // Analytics (Optional)
  POSTHOG_API_KEY: z.string().optional(),

  // Session
  EXPRESS_SESSION_SECRET: z.string().min(32, "EXPRESS_SESSION_SECRET must be at least 32 characters").default("express-session-secret-must-be-32chars!!"),

  // URLs
  CLIENT_SSO_REDIRECT_URL: z.string().url().optional().default("http://localhost:3000"),
  FORGOT_PASSWORD_REDIRECT_URL: z.string().url().optional().default("http://localhost:3000/reset"),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional().default("dummy"),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default("dummy"),
  AWS_REGION: z.string().optional().default("us-east-1"),
  S3_BUCKET: z.string().optional().default("dummy-bucket"),
  S3_PROFILE_PICS_PREFIX: z.string().default("profile-pics/"),
});




export const env = envSchema.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;