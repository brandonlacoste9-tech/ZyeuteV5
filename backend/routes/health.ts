import express from "express";
import { db } from "../storage.js";
import { sql } from "drizzle-orm";

export const healthRouter = express.Router();

// Liveness check - basic service availability
healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "zyeute-api",
    version: "5.0.0-quebec-bootstrap",
    timestamp: new Date().toISOString(),
  });
});

// Readiness check - verifies database connectivity
healthRouter.get("/ready", async (_req, res) => {
  try {
    // Simple query to verify DB connection
    await db.execute(sql`SELECT 1`);
    res.json({
      status: "ready",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Ready check failed:", err);
    res.status(503).json({
      status: "not ready",
      db: "disconnected",
      error: err.message || String(err),
    });
  }
});
