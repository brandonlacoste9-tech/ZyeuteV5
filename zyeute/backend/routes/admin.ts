/**
 * Admin Routes
 * Includes AI metrics endpoint for dashboard
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// In-memory metrics store (in production, use Redis or database)
const aiMetrics: Map<string, {
  requests: number;
  failures: number;
  latencies: number[];
  costs: number[];
  lastUsed: Date;
}> = new Map();

const circuitBreakerEvents: Array<{
  timestamp: string;
  model: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  reason: string;
}> = [];

const recentRequests: Array<{
  timestamp: string;
  provider: string;
  intendedModel?: string;
  actualModel: string;
  circuitBreakerIntervened: boolean;
  latency: number;
}> = [];

// Listen for AI usage events (would be published from AI services)
// This is a placeholder - in production, use event emitter or message queue

/**
 * GET /api/admin/ai-metrics
 * Returns AI usage metrics for dashboard
 */
router.get("/ai-metrics", requireAuth, (req, res) => {
  // Check if user is admin (you'd implement proper admin check)
  // const isAdmin = req.user?.role === "admin";
  // if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

  const metrics = Array.from(aiMetrics.entries()).map(([provider, data]) => ({
    provider,
    requests: data.requests,
    failures: data.failures,
    avgLatency: data.latencies.length > 0
      ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length)
      : 0,
    totalCost: data.costs.reduce((a, b) => a + b, 0),
    lastUsed: data.lastUsed.toISOString(),
  }));

  res.json({
    metrics,
    circuitBreakerEvents: circuitBreakerEvents.slice(-50), // Last 50 events
    recentRequests: recentRequests.slice(-100), // Last 100 requests
  });
});

/**
 * POST /api/admin/ai-metrics/track
 * Internal endpoint to track AI usage (called by AI services)
 */
router.post("/ai-metrics/track", (req, res) => {
  const { provider, success, latency, cost, intendedModel, actualModel, circuitBreakerIntervened } = req.body;

  if (!provider) {
    return res.status(400).json({ error: "Provider required" });
  }

  if (!aiMetrics.has(provider)) {
    aiMetrics.set(provider, {
      requests: 0,
      failures: 0,
      latencies: [],
      costs: [],
      lastUsed: new Date(),
    });
  }

  const metric = aiMetrics.get(provider)!;
  metric.requests++;
  if (!success) metric.failures++;
  if (latency) metric.latencies.push(latency);
  if (cost) metric.costs.push(cost);
  metric.lastUsed = new Date();

  // Keep only last 1000 latencies/costs for rolling average
  if (metric.latencies.length > 1000) {
    metric.latencies = metric.latencies.slice(-1000);
  }
  if (metric.costs.length > 1000) {
    metric.costs = metric.costs.slice(-1000);
  }

  // Track recent request
  recentRequests.push({
    timestamp: new Date().toISOString(),
    provider,
    intendedModel,
    actualModel: actualModel || provider,
    circuitBreakerIntervened: circuitBreakerIntervened || false,
    latency: latency || 0,
  });

  // Keep only last 1000 requests
  if (recentRequests.length > 1000) {
    recentRequests.shift();
  }

  res.json({ success: true });
});

/**
 * POST /api/admin/ai-metrics/circuit-breaker
 * Track circuit breaker events
 */
router.post("/ai-metrics/circuit-breaker", (req, res) => {
  const { model, state, reason } = req.body;

  circuitBreakerEvents.push({
    timestamp: new Date().toISOString(),
    model: model || "unknown",
    state: state || "CLOSED",
    reason: reason || "Unknown",
  });

  // Keep only last 1000 events
  if (circuitBreakerEvents.length > 1000) {
    circuitBreakerEvents.shift();
  }

  res.json({ success: true });
});

/**
 * GET /api/admin/model-policies
 * Get current model policies and route mappings
 */
router.get("/model-policies", requireAuth, async (req, res) => {
  try {
    const { MODEL_POLICIES, ROUTE_USE_CASES, getPolicyWithOverrides } = await import("../ai/model-policies.js");
    
    // Get all policies (with overrides applied)
    const policies = Object.entries(MODEL_POLICIES).map(([useCase, basePolicy]) => ({
      useCase,
      policy: getPolicyWithOverrides(useCase as any),
      isOverridden: basePolicy !== getPolicyWithOverrides(useCase as any),
    }));

    res.json({
      policies,
      routeMappings: ROUTE_USE_CASES,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/model-policies/override
 * Set policy override for a use case
 */
router.post("/model-policies/override", requireAuth, async (req, res) => {
  try {
    const { setPolicyOverride } = await import("../ai/model-policies.js");
    const { useCase, policy } = req.body;

    if (!useCase || !policy) {
      return res.status(400).json({ error: "useCase and policy required" });
    }

    setPolicyOverride(useCase, policy);
    res.json({ success: true, message: `Policy override set for ${useCase}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/model-policies/override
 * Clear policy override
 */
router.delete("/model-policies/override/:useCase?", requireAuth, async (req, res) => {
  try {
    const { clearPolicyOverride } = await import("../ai/model-policies.js");
    const { useCase } = req.params;

    clearPolicyOverride(useCase || undefined);
    res.json({ success: true, message: `Policy override cleared for ${useCase || "all"}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
