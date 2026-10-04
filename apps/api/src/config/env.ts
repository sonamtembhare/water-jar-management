import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z
    .string()
    .default("postgresql://postgres@localhost:5432/water_jar_management"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),

  JWT_EXPIRES_IN: z.string().default("7d"),

  // Browser origins allowed to call the API. Comma-separated. In production
  // this MUST list the deployed web domain(s); otherwise every browser request
  // is rejected by the CORS guard. `*` is allowed as a whole segment, e.g.
  // `https://*.vercel.app` to also accept preview deployments.
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Public URL of the web app. Used for links the API generates (emails).
  // Defaults to the first entry of CORS_ORIGIN.
  WEB_APP_URL: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  SEED_ADMIN_EMAIL: z.string().default("admin@waterjar.com"),
  SEED_ADMIN_PASSWORD: z.string().default("admin12345"),
  SEED_DEMO_DATA: z.enum(["true", "false"]).default("true"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  )
  throw new Error("Invalid environment variables")
}

export const env = parsed.data

export const APP_URL =
  env.WEB_APP_URL?.trim() || env.CORS_ORIGIN.split(",")[0]?.trim() || "http://localhost:3000"