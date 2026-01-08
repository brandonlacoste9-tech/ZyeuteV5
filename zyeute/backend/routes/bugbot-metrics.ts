/**
 * BugBot Metrics & Observability Routes
 * Exposes metrics endpoints for monitoring
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { bugBotObservability } from "../colony/bugbot-observability.js";
import { bugBot } from "../colony/bugbot.js";

const router = express.Router();

/**
 * GET /api/bugbot/metrics
 * Get BugBot metrics (Prometheus format)
 */
router.get("/metrics", (req, res) => {
  const metrics = bugBotObservability.exportMetrics();
  res.set("Content-Type", "text/plain");
  res.send(metrics);
});

/**
 * GET /api/bugbot/metrics/json
 * Get BugBot metrics (JSON format)
 */
router.get("/metrics/json", requireAuth, (req, res) => {
  const metrics = bugBotObservability.getMetrics();
  res.json({ metrics });
});

/**
 * POST /api/bugbot/false-positive/:bugId
 * Mark bug as false positive
 */
router.post("/false-positive/:bugId", requireAuth, async (req, res) => {
  try {
    const { bugId } = req.params;
    bugBotObservability.recordFalsePositive(bugId);
    res.json({ success: true, message: "Bug marked as false positive" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
