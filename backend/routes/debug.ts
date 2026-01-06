import { Router } from "express";
import { db } from "../storage.js";
import { users, posts } from "../../shared/schema.js";
import { sql } from "drizzle-orm";

const router = Router();
const debugLogger = {
  error: (...args: any[]) => console.error("[Debug]", ...args),
  info: (...args: any[]) => console.log("[Debug]", ...args),
};

router.get("/health", async (req, res) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
    },
  };

  try {
    // 1. Database Latency Check
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = {
      status: "connected",
      latency: `${Date.now() - dbStart}ms`,
    };

    // 2. Schema Integrity Check
    const userCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const postCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts);
    checks.counts = {
      users: userCount[0].count,
      posts: postCount[0].count,
    };

    checks.status = "READY_FOR_3M";
  } catch (error: any) {
    debugLogger.error("Health check failed", error);
    checks.status = "CRITICAL_FAILURE";
    checks.error = error.message;
    return res.status(500).json(checks);
  }

  checks.totalLatency = `${Date.now() - startTime}ms`;
  res.json(checks);
});

export default router;
