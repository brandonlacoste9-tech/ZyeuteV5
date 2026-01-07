/**
 * Bee System API Routes
 * Exposes bee functionality via REST API
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { beeSystem } from "../colony/bee-system.js";
import { beeCommunication } from "../colony/bee-communication.js";
import { hiveManager } from "../colony/hive-manager.js";
import { getBeeById, getBeesByCapability } from "../ai/bee-registry.js";

const router = express.Router();

/**
 * GET /api/bees
 * List all bees and their status
 */
router.get("/", requireAuth, (req, res) => {
  const statuses = beeSystem.getAllBeeStatuses();
  res.json({
    bees: statuses,
    total: statuses.length,
    active: statuses.filter((s) => s.status === "active").length,
    busy: statuses.filter((s) => s.status === "busy").length,
  });
});

/**
 * GET /api/bees/:beeId
 * Get specific bee status
 */
router.get("/:beeId", requireAuth, (req, res) => {
  const { beeId } = req.params;
  const status = beeSystem.getBeeStatus(beeId);

  if (!status) {
    return res.status(404).json({ error: `Bee ${beeId} not found` });
  }

  res.json(status);
});

/**
 * POST /api/bees/task
 * Assign a task to a bee
 */
router.post("/task", requireAuth, async (req, res) => {
  try {
    const { capability, payload, priority, preferredBeeId } = req.body;

    if (!capability) {
      return res.status(400).json({ error: "capability required" });
    }

    const task = await beeSystem.assignTask(capability, payload || {}, {
      priority: priority || "medium",
      userId: req.userId,
      preferredBeeId,
    });

    // Wait for completion (with timeout)
    const timeout = setTimeout(() => {
      res.status(504).json({ error: "Task timeout" });
    }, 30000);

    beeSystem.once("task.completed", (completedTask) => {
      if (completedTask.id === task.id) {
        clearTimeout(timeout);
        res.json({
          taskId: task.id,
          status: "completed",
          result: completedTask.result,
        });
      }
    });

    beeSystem.once("task.failed", (failedTask) => {
      if (failedTask.id === task.id) {
        clearTimeout(timeout);
        res.status(500).json({
          taskId: task.id,
          status: "failed",
          error: failedTask.error,
        });
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bees/message
 * Send message between bees
 */
router.post("/message", requireAuth, async (req, res) => {
  try {
    const { fromBee, toBee, message, payload, priority, targetHive } = req.body;

    if (!fromBee || !toBee || !message) {
      return res
        .status(400)
        .json({ error: "fromBee, toBee, and message required" });
    }

    await beeCommunication.sendMessage(fromBee, toBee, message, payload, {
      priority: priority || "medium",
      targetHive,
    });

    res.json({ success: true, message: "Message sent" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bees/knowledge/share
 * Share knowledge with other bees
 */
router.post("/knowledge/share", requireAuth, async (req, res) => {
  try {
    const { beeId, key, value, scope, tags } = req.body;

    if (!beeId || !key || value === undefined) {
      return res.status(400).json({ error: "beeId, key, and value required" });
    }

    await beeCommunication.shareKnowledge(beeId, key, value, {
      scope: scope || "colony",
      tags: tags || [],
    });

    res.json({ success: true, message: "Knowledge shared" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bees/knowledge/:beeId/:key
 * Retrieve knowledge from a bee
 */
router.get("/knowledge/:beeId/:key", requireAuth, async (req, res) => {
  try {
    const { beeId, key } = req.params;
    const { scope } = req.query;

    const knowledge = await beeCommunication.learnFromOthers(beeId, key, {
      scope: (scope as string) || "colony",
    });

    if (!knowledge) {
      return res.status(404).json({ error: "Knowledge not found" });
    }

    res.json({ beeId, key, value: knowledge });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bees/capability/:capability
 * Find bees with specific capability
 */
router.get("/capability/:capability", requireAuth, (req, res) => {
  const { capability } = req.params;
  const bees = getBeesByCapability(capability as any);
  const statuses = bees
    .map((bee) => beeSystem.getBeeStatus(bee.id))
    .filter(Boolean);

  res.json({
    capability,
    bees: statuses,
    count: statuses.length,
  });
});

/**
 * GET /api/hives
 * List all known hives
 */
router.get("/hives", requireAuth, async (req, res) => {
  try {
    const hives = await hiveManager.discoverHives();
    res.json({ hives, count: hives.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/hives/:hiveId
 * Get specific hive info
 */
router.get("/hives/:hiveId", requireAuth, (req, res) => {
  const { hiveId } = req.params;
  const hive = hiveManager.getHiveInfo(hiveId);

  if (!hive) {
    return res.status(404).json({ error: `Hive ${hiveId} not found` });
  }

  res.json(hive);
});

/**
 * POST /api/hives/task
 * Send task to another hive
 */
router.post("/hives/task", requireAuth, async (req, res) => {
  try {
    const { targetHive, capability, payload, priority } = req.body;

    if (!targetHive || !capability) {
      return res
        .status(400)
        .json({ error: "targetHive and capability required" });
    }

    const task = await hiveManager.sendTaskToHive(
      targetHive,
      capability,
      payload || {},
      priority || "medium",
    );

    res.json({
      taskId: task.id,
      status: task.status,
      result: task.result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
