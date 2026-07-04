import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(24).optional(),
  AUTH_EMAIL_PASSWORD_ENABLED: z.coerce.boolean().default(true),
  AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
  AUTH_APPLE_CLIENT_ID: z.string().optional(),
  AUTH_APPLE_CLIENT_SECRET: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "supabase", "s3", "cloudinary"]).default("local"),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_DEFAULT_MODEL: z.string().default("gpt-4.1-mini")
});

export type ApexEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: process.env.APP_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_EMAIL_PASSWORD_ENABLED: process.env.AUTH_EMAIL_PASSWORD_ENABLED,
  AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,
  AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET,
  AUTH_APPLE_CLIENT_ID: process.env.AUTH_APPLE_CLIENT_ID,
  AUTH_APPLE_CLIENT_SECRET: process.env.AUTH_APPLE_CLIENT_SECRET,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  STORAGE_PUBLIC_BASE_URL: process.env.STORAGE_PUBLIC_BASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_DEFAULT_MODEL: process.env.OPENAI_DEFAULT_MODEL
});

export function requireEnv<K extends keyof ApexEnv>(key: K): NonNullable<ApexEnv[K]> {
  const value = env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }
  return value as NonNullable<ApexEnv[K]>;
}

export function getDatabaseUrl() {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production.");
  }
  return "postgresql://user:password@localhost:5432/apex?schema=public";
}

export function getConfiguredAuthProviders() {
  return {
    emailPassword: env.AUTH_EMAIL_PASSWORD_ENABLED,
    google: Boolean(env.AUTH_GOOGLE_CLIENT_ID && env.AUTH_GOOGLE_CLIENT_SECRET),
    apple: Boolean(env.AUTH_APPLE_CLIENT_ID && env.AUTH_APPLE_CLIENT_SECRET),
    phone: false,
    whatsapp: false
  };
}
