import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need session-level state, so they must bypass the PgBouncer
    // pooled endpoint (host containing `-pooler`). Falls back to DATABASE_URL
    // for local Postgres development.
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres@localhost:5432/water_jar_management",
  },
  strict: true,
  verbose: true,
})