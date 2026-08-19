import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  ALLOWED_ORIGINS: z.string().optional(),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters")
    .default("access-token-secret-must-be-32chars-long!!"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters")
    .default("refresh-token-secret-must-be-32chars-long!"),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  RESEND_API_KEY: z.string().optional().default("dummy-resend-key"),
  RESEND_FROM_EMAIL: z.string().email().optional().default("test@example.com"),
});

export const env = envSchema.parse(process.env);


export type Env = z.infer<typeof envSchema>;
