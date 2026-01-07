/**
 * Learning System API Routes
 * Exposes learning, experiments, and model evaluation endpoints
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { learningSystem } from "../colony/learning-system.js";
import {
  discoverModels,
  getLearningLineage,
  evaluateModelPerformance,
} from "../colony/vertex-learning-integration.js";

const router = express.Router();

/**
 * POST /api/learning/learn
 * Store learned knowledge
 */
router.post("/learn", requireAuth, async (req, res) => {
  try {
    const { beeId, type, key, value, metadata } = req.body;

    if (!beeId || !type || !key || value === undefined) {
      return res
        .status(400)
        .json({ error: "beeId, type, key, and value required" });
    }

    const learning = await learningSystem.learn(
      beeId,
      type,
      key,
      value,
      metadata || {},
    );

    res.json({
      success: true,
      learning: {
        id: learning.id,
        beeId: learning.beeId,
        type: learning.type,
        key: learning.key,
        metadata: learning.metadata,
        timestamp: learning.timestamp,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/learning/retrieve/:key
 * Retrieve learned knowledge
 */
router.get("/retrieve/:key", requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { scope, type, minPerformance, beeId } = req.query;

    const learning = await learningSystem.retrieve(
      (beeId as string) || "unknown",
      key,
      {
        scope: (scope as "local" | "colony") || "colony",
        type: type as any,
        minPerformance: minPerformance
          ? parseFloat(minPerformance as string)
          : undefined,
      },
    );

    if (!learning) {
      return res.status(404).json({ error: "Learning not found" });
    }

    res.json({ learning });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/learning/best/:type
 * Get best performing learning of a type
 */
router.get("/best/:type", requireAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { minPerformance } = req.query;

    const learning = await learningSystem.getBestLearning(
      type as any,
      minPerformance ? parseFloat(minPerformance as string) : 0.8,
    );

    if (!learning) {
      return res.status(404).json({ error: "No learning found" });
    }

    res.json({ learning });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/learning/bee/:beeId
 * Get all learnings from a specific bee
 */
router.get("/bee/:beeId", requireAuth, (req, res) => {
  const { beeId } = req.params;
  const learnings = learningSystem.getLearningsByBee(beeId);
  res.json({ beeId, learnings, count: learnings.length });
});

/**
 * GET /api/learning/all
 * Get all learnings (colony-wide knowledge)
 */
router.get("/all", requireAuth, (req, res) => {
  const { type } = req.query;
  const learnings = learningSystem.getAllLearnings(type as any);
  res.json({ learnings, count: learnings.length });
});

/**
 * POST /api/learning/experiment/start
 * Start a learning experiment
 */
router.post("/experiment/start", requireAuth, async (req, res) => {
  try {
    const { beeId, name, description, parameters } = req.body;

    if (!beeId || !name || !description) {
      return res
        .status(400)
        .json({ error: "beeId, name, and description required" });
    }

    const experiment = await learningSystem.startExperiment(
      beeId,
      name,
      description,
      parameters || {},
    );

    res.json({ success: true, experiment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/learning/experiment/complete
 * Complete an experiment and record results
 */
router.post("/experiment/complete", requireAuth, async (req, res) => {
  try {
    const { experimentId, metrics, modelVersion } = req.body;

    if (!experimentId || !metrics) {
      return res
        .status(400)
        .json({ error: "experimentId and metrics required" });
    }

    await learningSystem.completeExperiment(
      experimentId,
      metrics,
      modelVersion,
    );

    res.json({ success: true, message: "Experiment completed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/learning/model/evaluate
 * Evaluate model performance
 */
router.post("/model/evaluate", requireAuth, async (req, res) => {
  try {
    const { beeId, modelVersion, metrics } = req.body;

    if (!beeId || !modelVersion || !metrics) {
      return res
        .status(400)
        .json({ error: "beeId, modelVersion, and metrics required" });
    }

    const performance = await learningSystem.evaluateModel(
      beeId,
      modelVersion,
      metrics,
    );

    res.json({ success: true, performance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/learning/models/discover
 * Discover models from other hives
 */
router.get("/models/discover", requireAuth, async (req, res) => {
  try {
    const { capability, minPerformance } = req.query;

    const models = await discoverModels(
      capability as string,
      minPerformance ? parseFloat(minPerformance as string) : undefined,
    );

    res.json({ models, count: models.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/learning/lineage/:key
 * Get learning lineage (where knowledge came from)
 */
router.get("/lineage/:key", requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const lineage = await getLearningLineage(key);
    res.json({ key, lineage });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
