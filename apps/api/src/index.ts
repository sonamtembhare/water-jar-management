import { app } from "./app";
import { env } from "./config/env";
import { db } from "@repo/db";
import { seed } from "./seed";

async function startServer() {
  try {
    await db.execute("SELECT 1");
    console.log("Database connected successfully");

    if (env.NODE_ENV !== "production") {
      await seed().catch((error) => console.error("Seed failed:", error));
    }

    app.listen(env.PORT, () => {
      console.log(`API server running at http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

// Vercel (and other serverless platforms) import this module and capture the
// HTTP server from the `listen()` call, then proxy requests into it. Startup
// work like the database health check above would delay that capture and can
// trip Vercel's 1s wait-for-listen timeout, so it is skipped there. The
// /health route already reports liveness without touching the database.
const isServerless = Boolean(process.env.VERCEL);
if (!isServerless) {
  startServer();
}

// Vercel's framework detection looks for a default export of the Express app
// (or a listen() call) to know what to route requests into.
export default app;
