import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGO_URI: z.string().default("mongodb://localhost:27017/securevault"),
  JWT_SECRET: z.string().default("supersecretjwtkey_zero_trust_securevault"),
  JWT_REFRESH_SECRET: z.string().default("superrefreshsecretjwtkey_securevault"),
  JWT_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default("100").transform((val) => parseInt(val, 10)),
  ALLOWED_ORIGINS: z.string().default("*"),
});

export const env = envSchema.parse(process.env);
