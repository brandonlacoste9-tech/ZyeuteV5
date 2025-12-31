import express from "express";
import { db } from "../storage.js";
import { sql } from "drizzle-orm";
import { checkVertexAIHealth } from "../ai/vertex-service.js";

export const healthRouter = express.Router();

// Liveness & Readiness check - basic service availability
// ALWAYS return 200 to ensure deployment succeeds
healthRouter.get("/health", async (_req, res) => {
  const healthStatus: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "zyeute-api",
    version: "5.0.0-quebec-bootstrap",
    env: process.env.NODE_ENV,
  };

  try {
    // 1. Check DB
    await db.execute(sql`SELECT 1`);
    healthStatus.database = "connected";
  } catch (err: any) {
    healthStatus.status = "degraded";
    healthStatus.database = "disconnected";
    healthStatus.db_error = err.message;
  }

  try {
    // 2. Check AI Services
    const aiHealth = await checkVertexAIHealth();
    healthStatus.ai = aiHealth;
    if (aiHealth.status === "degraded") {
      healthStatus.status = "degraded";
    }
  } catch (err: any) {
    healthStatus.ai_check_failed = err.message;
  }

  // Healthcheck for Railway MUST be 200 to pass
  res.status(200).json(healthStatus);
});

// Separate ready check for more detailed infra monitoring
healthRouter.get("/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ready",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "not ready",
      db: "disconnected",
      error: err.message,
    });
  }
});
