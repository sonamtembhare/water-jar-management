import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
// Must run before process.env.DATABASE_URL is read below. Consumers import
// @repo/db from many entrypoints (seed.ts, scripts) where this module is
// evaluated *before* their own dotenv import, so without this the pool would
// silently fall back to the localhost default and write to the wrong database.
import "dotenv/config"
import * as schema from "./schema"
import * as relations from "./relations"

export * from "./schema"
export * from "./relations"
export { schema }

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres@localhost:5432/water_jar_management"

const isServerless = Boolean(process.env.VERCEL)

function createDb() {
  const pool = new Pool({
    connectionString,
    // Serverless functions open a fresh pool per cold start, and Neon routes
    // through PgBouncer. A small pool keeps the total connection count well
    // under the Postgres limit; raise it only if you outgrow serverless.
    ...(isServerless ? { max: 2, idleTimeoutMillis: 5_000 } : {}),
  })

  // Lets Vercel close idle connections before a function is suspended, so the
  // pool survives warm invocations instead of leaking. Optional dependency —
  // absent locally, so it is loaded defensively.
  if (isServerless) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { attachDatabasePool } = require("@vercel/functions")
      attachDatabasePool(pool)
    } catch {
      console.warn(
        "[db] @vercel/functions unavailable — pool will not be closed on suspend",
      )
    }
  }

  return drizzle(pool, {
    schema: { ...schema, ...relations },
  })
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> }

export const db: ReturnType<typeof createDb> =
  globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db
}

export type Database = typeof db
