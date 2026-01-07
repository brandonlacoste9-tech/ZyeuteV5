/**
 * Observability Dashboard API Routes
 * Exposes dashboard metrics, drift data, pipeline status, and governance info
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { observabilityDashboard } from "../colony/observability-dashboard.js";
import { governanceEngine } from "../colony/governance-engine.js";
import { mlopsPipelines } from "../colony/mlops-pipelines.js";
import { featureStore } from "../colony/feature-store.js";

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get current dashboard metrics
 */
router.get("/metrics", requireAuth, (req, res) => {
  const metrics = observabilityDashboard.getMetrics();
  if (!metrics) {
    return res.status(503).json({ error: "Metrics not available" });
  }
  res.json({ metrics });
});

/**
 * GET /api/dashboard/health
 * Get system health summary
 */
router.get("/health", requireAuth, (req, res) => {
  const health = observabilityDashboard.getSystemHealth();
  res.json({ health });
});

/**
 * GET /api/dashboard/drift
 * Get drift history
 */
router.get("/drift", requireAuth, (req, res) => {
  const { limit } = req.query;
  const driftHistory = observabilityDashboard.getDriftHistory(
    limit ? parseInt(limit as string) : 100,
  );
  res.json({ driftHistory, count: driftHistory.length });
});

/**
 * GET /api/dashboard/pipelines
 * Get pipeline statuses
 */
router.get("/pipelines", requireAuth, (req, res) => {
  const statuses = observabilityDashboard.getPipelineStatuses();
  res.json({ pipelines: statuses, count: statuses.length });
});

/**
 * GET /api/dashboard/pipelines/:runId
 * Get specific pipeline status
 */
router.get("/pipelines/:runId", requireAuth, (req, res) => {
  const { runId } = req.params;
  const statuses = observabilityDashboard.getPipelineStatuses();
  const status = statuses.find((s) => s.runId === runId);

  if (!status) {
    return res.status(404).json({ error: "Pipeline run not found" });
  }

  res.json({ pipeline: status });
});

/**
 * GET /api/dashboard/features
 * Get feature catalog
 */
router.get("/features", requireAuth, async (req, res) => {
  try {
    const catalog = await observabilityDashboard.getFeatureCatalog();
    res.json({ features: catalog, count: catalog.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/lineage/:beeId/:modelVersion
 * Get model lineage
 */
router.get("/lineage/:beeId/:modelVersion", requireAuth, async (req, res) => {
  try {
    const { beeId, modelVersion } = req.params;
    const lineage = await observabilityDashboard.getModelLineage(
      beeId,
      modelVersion,
    );

    if (!lineage) {
      return res.status(404).json({ error: "Model lineage not found" });
    }

    res.json({ lineage });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/governance/policies
 * Get all governance policies
 */
router.get("/governance/policies", requireAuth, (req, res) => {
  const policies = governanceEngine.getAllPolicies();
  res.json({ policies, count: policies.length });
});

/**
 * GET /api/dashboard/governance/compliance/:entityId
 * Get compliance checks for entity
 */
router.get("/governance/compliance/:entityId", requireAuth, (req, res) => {
  const { entityId } = req.params;
  const checks = governanceEngine.getComplianceChecks(entityId);
  res.json({ entityId, checks, count: checks.length });
});

/**
 * GET /api/dashboard/governance/audit
 * Get audit logs
 */
router.get("/governance/audit", requireAuth, (req, res) => {
  const { entityType, entityId, actor, decision, startTime, endTime, limit } =
    req.query;

  const logs = governanceEngine.getAuditLogs({
    entityType: entityType as string,
    entityId: entityId as string,
    actor: actor as string,
    decision: decision as string,
    startTime: startTime as string,
    endTime: endTime as string,
  });

  const limitedLogs = limit
    ? logs.slice(0, parseInt(limit as string))
    : logs.slice(0, 100);

  res.json({
    logs: limitedLogs,
    total: logs.length,
    returned: limitedLogs.length,
  });
});

/**
 * POST /api/dashboard/governance/approve
 * Approve deployment (human override)
 */
router.post("/governance/approve", requireAuth, async (req, res) => {
  try {
    const { entityId, entityType, reason } = req.body;

    if (!entityId || !entityType || !reason) {
      return res
        .status(400)
        .json({ error: "entityId, entityType, and reason required" });
    }

    await governanceEngine.approveDeployment(
      entityId,
      entityType,
      req.userId || "unknown",
      reason,
    );

    res.json({ success: true, message: "Deployment approved" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
