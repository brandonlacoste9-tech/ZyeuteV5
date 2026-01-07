/**
 * Observability Dashboard - "Queen's View"
 * Visualizes the Hive Mind's decisions and system state
 * Provides visibility into MLOps lifecycle, drift, pipelines, and features
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";
import { beeSystem } from "./bee-system.js";
import { learningSystem } from "./learning-system.js";
import { mlopsPipelines } from "./mlops-pipelines.js";
import { featureStore } from "./feature-store.js";
import { governanceEngine } from "./governance-engine.js";
import { hiveManager } from "./hive-manager.js";
import type { ModelPerformance } from "./learning-system.js";
import type { PipelineRun } from "./mlops-pipelines.js";

export interface DashboardMetrics {
  timestamp: string;
  bees: {
    total: number;
    active: number;
    busy: number;
    idle: number;
  };
  hives: {
    total: number;
    active: number;
  };
  models: {
    total: number;
    inProduction: number;
    inTraining: number;
    driftDetected: number;
  };
  pipelines: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  features: {
    total: number;
    stored: number;
    accessed: number;
  };
  compliance: {
    checks: number;
    passed: number;
    failed: number;
    blocked: number;
  };
}

export interface DriftData {
  beeId: string;
  modelVersion: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  metrics: {
    before: Record<string, number>;
    after: Record<string, number>;
    delta: Record<string, number>;
  };
}

export interface PipelineStatus {
  runId: string;
  pipelineName: string;
  status: string;
  progress: number; // 0-100
  currentStep: string;
  steps: Array<{
    id: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
  }>;
  artifacts: Array<{
    type: string;
    uri: string;
  }>;
}

export interface FeatureCatalog {
  name: string;
  description: string;
  type: string;
  source: string;
  usageCount: number;
  lastAccessed: string;
  tags: string[];
}

export interface ModelLineage {
  modelId: string;
  version: string;
  parent?: string;
  children: string[];
  experiments: string[];
  performance: Record<string, number>;
  createdAt: string;
}

/**
 * Observability Dashboard
 * Centralized view of Colony OS state
 */
export class ObservabilityDashboard extends EventEmitter {
  private metrics: DashboardMetrics | null = null;
  private driftHistory: DriftData[] = [];
  private pipelineStatuses: Map<string, PipelineStatus> = new Map();
  private featureCatalog: FeatureCatalog[] = [];
  private modelLineage: Map<string, ModelLineage> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startMetricsCollection();
  }

  /**
   * Start collecting metrics
   */
  private startMetricsCollection(): void {
    // Update metrics every 5 seconds
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000);

    // Initial update
    this.updateMetrics();

    // Listen for events
    this.setupEventListeners();
  }

  /**
   * Update dashboard metrics
   */
  private async updateMetrics(): Promise<void> {
    const beeStatuses = beeSystem.getAllBeeStatuses();
    const hives = hiveManager.getKnownHives();
    const pipelineRuns = mlopsPipelines.getAllRuns();
    const allLearnings = learningSystem.getAllLearnings("model");
    const auditLogs = governanceEngine.getAuditLogs();

    const metrics: DashboardMetrics = {
      timestamp: new Date().toISOString(),
      bees: {
        total: beeStatuses.length,
        active: beeStatuses.filter((s) => s.status === "active").length,
        busy: beeStatuses.filter((s) => s.status === "busy").length,
        idle: beeStatuses.filter((s) => s.status === "idle").length,
      },
      hives: {
        total: hives.length,
        active: hives.filter((h) => h.status === "active").length,
      },
      models: {
        total: allLearnings.filter((l) => l.type === "model").length,
        inProduction: 0, // Would track from deployments
        inTraining: pipelineRuns.filter((r) => r.status === "running").length,
        driftDetected: this.driftHistory.filter((d) => d.severity === "high")
          .length,
      },
      pipelines: {
        total: pipelineRuns.length,
        running: pipelineRuns.filter((r) => r.status === "running").length,
        completed: pipelineRuns.filter((r) => r.status === "completed").length,
        failed: pipelineRuns.filter((r) => r.status === "failed").length,
      },
      features: {
        total: this.featureCatalog.length,
        stored: 0, // Would track from feature store
        accessed: 0, // Would track from feature store
      },
      compliance: {
        checks: auditLogs.filter((l) => l.action === "compliance_check").length,
        passed: auditLogs.filter((l) => l.decision === "approved").length,
        failed: auditLogs.filter((l) => l.decision === "blocked").length,
        blocked: auditLogs.filter((l) => l.decision === "blocked").length,
      },
    };

    this.metrics = metrics;
    this.emit("metrics.updated", metrics);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Track drift events
    learningSystem.on("model.evaluated", (performance: ModelPerformance) => {
      if (performance.drift?.detected) {
        const driftData: DriftData = {
          beeId: performance.beeId,
          modelVersion: performance.modelVersion,
          timestamp: performance.lastEvaluated,
          severity: performance.drift.severity,
          metrics: {
            before: {}, // Would get from history
            after: performance.metrics,
            delta: {}, // Would calculate
          },
        };

        this.driftHistory.push(driftData);
        if (this.driftHistory.length > 1000) {
          this.driftHistory = this.driftHistory.slice(-1000);
        }

        this.emit("drift.detected", driftData);
      }
    });

    // Track pipeline status
    mlopsPipelines.on("pipeline.triggered", (run: PipelineRun) => {
      this.updatePipelineStatus(run);
    });

    mlopsPipelines.on("pipeline.completed", (run: PipelineRun) => {
      this.updatePipelineStatus(run);
    });
  }

  /**
   * Update pipeline status
   */
  private updatePipelineStatus(run: PipelineRun): void {
    const progress = this.calculatePipelineProgress(run);

    const status: PipelineStatus = {
      runId: run.id,
      pipelineName: run.pipelineName,
      status: run.status,
      progress,
      currentStep: this.getCurrentStep(run),
      steps: run.steps,
      artifacts: run.artifacts,
    };

    this.pipelineStatuses.set(run.id, status);
    this.emit("pipeline.status.updated", status);
  }

  /**
   * Calculate pipeline progress
   */
  private calculatePipelineProgress(run: PipelineRun): number {
    if (run.status === "completed") return 100;
    if (run.status === "failed") return 0;

    const completedSteps = run.steps.filter(
      (s) => s.status === "completed",
    ).length;
    return Math.round((completedSteps / run.steps.length) * 100);
  }

  /**
   * Get current pipeline step
   */
  private getCurrentStep(run: PipelineRun): string {
    const runningStep = run.steps.find((s) => s.status === "processing");
    return runningStep?.stepId || "pending";
  }

  /**
   * Get dashboard metrics
   */
  getMetrics(): DashboardMetrics | null {
    return this.metrics;
  }

  /**
   * Get drift history
   */
  getDriftHistory(limit: number = 100): DriftData[] {
    return this.driftHistory.slice(-limit);
  }

  /**
   * Get pipeline statuses
   */
  getPipelineStatuses(): PipelineStatus[] {
    return Array.from(this.pipelineStatuses.values());
  }

  /**
   * Get feature catalog
   */
  async getFeatureCatalog(): Promise<FeatureCatalog[]> {
    // Would query feature store for all features
    // For now, return cached catalog
    return this.featureCatalog;
  }

  /**
   * Get model lineage
   */
  async getModelLineage(
    beeId: string,
    modelVersion: string,
  ): Promise<ModelLineage | null> {
    const key = `${beeId}-${modelVersion}`;
    return this.modelLineage.get(key) || null;
  }

  /**
   * Get system health summary
   */
  getSystemHealth(): {
    status: "healthy" | "degraded" | "critical";
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.metrics;
    if (!metrics) {
      return {
        status: "critical",
        issues: ["Metrics not available"],
        recommendations: ["Check system connectivity"],
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check bee health
    if (metrics.bees.active < metrics.bees.total * 0.5) {
      issues.push("Less than 50% of bees are active");
      recommendations.push("Check bee health and connectivity");
    }

    // Check drift
    if (metrics.models.driftDetected > 0) {
      issues.push(`${metrics.models.driftDetected} models have drift detected`);
      recommendations.push("Review drift reports and consider retraining");
    }

    // Check pipeline failures
    if (metrics.pipelines.failed > metrics.pipelines.completed * 0.2) {
      issues.push("High pipeline failure rate");
      recommendations.push("Review pipeline logs and fix issues");
    }

    // Check compliance
    if (metrics.compliance.blocked > 0) {
      issues.push(
        `${metrics.compliance.blocked} deployments blocked by governance`,
      );
      recommendations.push("Review governance policies and approvals");
    }

    const status =
      issues.length === 0
        ? "healthy"
        : issues.filter((i) => i.includes("critical") || i.includes("blocked"))
              .length > 0
          ? "critical"
          : "degraded";

    return {
      status,
      issues,
      recommendations,
    };
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const observabilityDashboard = new ObservabilityDashboard();
