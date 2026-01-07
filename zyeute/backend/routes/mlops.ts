/**
 * MLOps Pipelines API Routes
 * Exposes pipeline management and feature store endpoints
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { mlopsPipelines } from "../colony/mlops-pipelines.js";
import { featureStore } from "../colony/feature-store.js";

const router = express.Router();

/**
 * POST /api/mlops/pipeline/trigger
 * Trigger a pipeline
 */
router.post("/pipeline/trigger", requireAuth, async (req, res) => {
  try {
    const { pipelineName, parameters } = req.body;

    if (!pipelineName) {
      return res.status(400).json({ error: "pipelineName required" });
    }

    const run = await mlopsPipelines.triggerPipeline(
      pipelineName,
      parameters || {},
    );

    res.json({
      success: true,
      run: {
        id: run.id,
        pipelineName: run.pipelineName,
        status: run.status,
        startedAt: run.startedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mlops/pipeline/run/:runId
 * Get pipeline run status
 */
router.get("/pipeline/run/:runId", requireAuth, (req, res) => {
  const { runId } = req.params;
  const run = mlopsPipelines.getPipelineRun(runId);

  if (!run) {
    return res.status(404).json({ error: "Pipeline run not found" });
  }

  res.json({ run });
});

/**
 * GET /api/mlops/pipeline/runs
 * Get all pipeline runs
 */
router.get("/pipeline/runs", requireAuth, (req, res) => {
  const runs = mlopsPipelines.getAllRuns();
  res.json({ runs, count: runs.length });
});

/**
 * POST /api/mlops/features/store
 * Store feature value
 */
router.post("/features/store", requireAuth, async (req, res) => {
  try {
    const { entityId, featureName, value, metadata } = req.body;

    if (!entityId || !featureName || value === undefined) {
      return res
        .status(400)
        .json({ error: "entityId, featureName, and value required" });
    }

    await featureStore.storeFeature(entityId, featureName, value, metadata);

    res.json({ success: true, message: "Feature stored" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/mlops/features/:entityId/:featureName
 * Get feature value
 */
router.get(
  "/features/:entityId/:featureName",
  requireAuth,
  async (req, res) => {
    try {
      const { entityId, featureName } = req.params;
      const { timestamp } = req.query;

      const value = await featureStore.getFeature(
        entityId,
        featureName,
        timestamp as string | undefined,
      );

      if (value === null) {
        return res.status(404).json({ error: "Feature not found" });
      }

      res.json({
        entityId,
        featureName,
        value,
        timestamp: timestamp || "latest",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/mlops/features/batch
 * Get multiple features (for inference)
 */
router.post("/features/batch", requireAuth, async (req, res) => {
  try {
    const { entityId, featureNames, timestamp } = req.body;

    if (!entityId || !featureNames || !Array.isArray(featureNames)) {
      return res
        .status(400)
        .json({ error: "entityId and featureNames array required" });
    }

    const features = await featureStore.getFeatures(
      entityId,
      featureNames,
      timestamp,
    );

    res.json({ entityId, features });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mlops/features/training
 * Get features for training (with time-travel)
 */
router.post("/features/training", requireAuth, async (req, res) => {
  try {
    const { entityIds, featureNames, startTime, endTime, snapshotTime } =
      req.body;

    if (
      !entityIds ||
      !featureNames ||
      !Array.isArray(entityIds) ||
      !Array.isArray(featureNames)
    ) {
      return res
        .status(400)
        .json({ error: "entityIds and featureNames arrays required" });
    }

    const features = await featureStore.getFeaturesForTraining(
      entityIds,
      featureNames,
      {
        startTime,
        endTime,
        snapshotTime,
      },
    );

    res.json({ features, count: features.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/mlops/features/define
 * Define a new feature
 */
router.post("/features/define", requireAuth, (req, res) => {
  try {
    const { name, description, type, source, computation, tags } = req.body;

    if (!name || !description || !type) {
      return res
        .status(400)
        .json({ error: "name, description, and type required" });
    }

    featureStore.defineFeature({
      name,
      description,
      type,
      source: source || "computed",
      computation,
      tags: tags || [],
    });

    res.json({ success: true, message: "Feature defined" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
