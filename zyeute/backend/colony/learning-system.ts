/**
 * Colony OS Learning System
 * The collective brain that enables bees to learn, remember, and share knowledge
 * Built on Vertex AI: Model Registry, Experiments, Monitoring, and ML Metadata
 */

import { EventEmitter } from "events";
import { synapseBridge } from "./synapse-bridge.js";
import { beeSystem } from "./bee-system.js";
import { beeCommunication } from "./bee-communication.js";
import { logger } from "../utils/logger.js";

export interface Learning {
  id: string;
  beeId: string;
  hive: string;
  type: "pattern" | "model" | "strategy" | "insight";
  key: string;
  value: any;
  metadata: {
    performance?: number;
    successRate?: number;
    usageCount?: number;
    lastUsed?: string;
    tags?: string[];
    experimentId?: string;
    modelVersion?: string;
  };
  lineage?: {
    sourceBee?: string;
    sourceHive?: string;
    derivedFrom?: string[];
  };
  timestamp: string;
}

export interface Experiment {
  id: string;
  beeId: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  modelVersion?: string;
}

export interface ModelPerformance {
  beeId: string;
  modelVersion: string;
  metrics: {
    accuracy?: number;
    latency?: number;
    cost?: number;
    successRate?: number;
    usageCount: number;
  };
  drift?: {
    detected: boolean;
    severity: "low" | "medium" | "high";
    lastChecked: string;
  };
  lastEvaluated: string;
}

/**
 * Learning System - The Collective Brain
 * Manages learning, memory, and knowledge sharing across all bees and hives
 */
export class LearningSystem extends EventEmitter {
  private learnings: Map<string, Learning> = new Map(); // key -> learning
  private experiments: Map<string, Experiment> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private vertexAIClient: any = null;

  constructor() {
    super();
    this.initializeVertexAI();
  }

  /**
   * Initialize Vertex AI client for learning system
   */
  private async initializeVertexAI(): Promise<void> {
    try {
      const { VertexAI } = await import("@google-cloud/vertexai");
      const project =
        process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

      if (!project) {
        logger.warn(
          "[LearningSystem] Vertex AI not configured, operating in local mode",
        );
        return;
      }

      let vertexAIConfig: any = { project, location };
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        vertexAIConfig.googleAuthOptions = { credentials };
      }

      this.vertexAIClient = new VertexAI(vertexAIConfig);
      logger.info("[LearningSystem] Vertex AI initialized for learning system");
    } catch (error: any) {
      logger.warn(
        `[LearningSystem] Could not initialize Vertex AI: ${error.message}`,
      );
    }
  }

  /**
   * Learn - Store knowledge from bee experience
   * Acts as the "Hive Mind" memory system
   */
  async learn(
    beeId: string,
    type: "pattern" | "model" | "strategy" | "insight",
    key: string,
    value: any,
    metadata: {
      performance?: number;
      successRate?: number;
      experimentId?: string;
      modelVersion?: string;
      tags?: string[];
    } = {},
  ): Promise<Learning> {
    const learning: Learning = {
      id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      beeId,
      hive: "zyeute",
      type,
      key,
      value,
      metadata: {
        ...metadata,
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        tags: metadata.tags || [],
      },
      timestamp: new Date().toISOString(),
    };

    // Store locally
    this.learnings.set(key, learning);

    // Store in Vertex AI Model Registry (if model type)
    if (type === "model" && this.vertexAIClient && metadata.modelVersion) {
      await this.registerModelInVertexAI(beeId, key, value, metadata);
    }

    // Store in Vertex ML Metadata (for provenance)
    if (this.vertexAIClient) {
      await this.trackMetadata(beeId, type, key, learning);
    }

    // Share with Colony OS
    await synapseBridge.publishEvent("learning.stored", {
      learningId: learning.id,
      beeId,
      type,
      key,
      metadata: learning.metadata,
      timestamp: learning.timestamp,
    });

    // Share knowledge with other bees
    await beeCommunication.shareKnowledge(beeId, key, value, {
      scope: "colony",
      tags: metadata.tags,
    });

    this.emit("learning.stored", learning);
    logger.info(`🧠 [LearningSystem] ${beeId} learned: ${key} (${type})`);

    return learning;
  }

  /**
   * Retrieve - Get learned knowledge
   * Bees can access what others have learned
   */
  async retrieve(
    beeId: string,
    key: string,
    options: {
      scope?: "local" | "colony";
      type?: "pattern" | "model" | "strategy" | "insight";
      minPerformance?: number;
    } = {},
  ): Promise<Learning | null> {
    const { scope = "colony", type, minPerformance } = options;

    // Check local learnings first
    const localLearning = this.learnings.get(key);
    if (localLearning) {
      if (type && localLearning.type !== type) return null;
      if (
        minPerformance &&
        (localLearning.metadata.performance || 0) < minPerformance
      ) {
        return null;
      }
      // Update usage
      localLearning.metadata.usageCount =
        (localLearning.metadata.usageCount || 0) + 1;
      localLearning.metadata.lastUsed = new Date().toISOString();
      return localLearning;
    }

    // Query Colony OS for shared learnings
    if (scope === "colony" && synapseBridge.isConnected()) {
      try {
        const query = type
          ? `get_learning ${key} ${type}`
          : `get_learning ${key}`;

        const result = await synapseBridge.requestIntelligence(query);
        if (result) {
          // Store locally for future use
          const learning: Learning = {
            id: result.id || `learning-${Date.now()}`,
            beeId: result.beeId || "unknown",
            hive: result.hive || "unknown",
            type: result.type,
            key,
            value: result.value,
            metadata: result.metadata,
            timestamp: result.timestamp,
          };
          this.learnings.set(key, learning);
          return learning;
        }
      } catch (error) {
        logger.warn(
          `[LearningSystem] Could not retrieve learning from Colony OS: ${error}`,
        );
      }
    }

    return null;
  }

  /**
   * Start Experiment - Track learning experiments
   * Uses Vertex AI Experiments for tracking
   */
  async startExperiment(
    beeId: string,
    name: string,
    description: string,
    parameters: Record<string, any>,
  ): Promise<Experiment> {
    const experiment: Experiment = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      beeId,
      name,
      description,
      parameters,
      metrics: {},
      status: "running",
      startedAt: new Date().toISOString(),
    };

    this.experiments.set(experiment.id, experiment);

    // Track in Vertex AI Experiments
    if (this.vertexAIClient) {
      await this.trackExperimentInVertexAI(experiment);
    }

    // Notify Colony OS
    await synapseBridge.publishEvent("experiment.started", {
      experimentId: experiment.id,
      beeId,
      name,
      parameters,
      timestamp: experiment.startedAt,
    });

    this.emit("experiment.started", experiment);
    logger.info(`🧪 [LearningSystem] Experiment started: ${name} (${beeId})`);

    return experiment;
  }

  /**
   * Complete Experiment - Record results
   */
  async completeExperiment(
    experimentId: string,
    metrics: Record<string, number>,
    modelVersion?: string,
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = "completed";
    experiment.metrics = metrics;
    experiment.completedAt = new Date().toISOString();
    experiment.modelVersion = modelVersion;

    // Update Vertex AI Experiments
    if (this.vertexAIClient) {
      await this.updateExperimentInVertexAI(experiment);
    }

    // Learn from experiment results
    if (metrics.successRate && metrics.successRate > 0.8) {
      await this.learn(
        experiment.beeId,
        "strategy",
        `experiment_${experiment.name}`,
        {
          parameters: experiment.parameters,
          metrics,
        },
        {
          performance: metrics.successRate,
          successRate: metrics.successRate,
          experimentId: experiment.id,
          modelVersion,
        },
      );
    }

    // Notify Colony OS
    await synapseBridge.publishEvent("experiment.completed", {
      experimentId,
      metrics,
      modelVersion,
      timestamp: experiment.completedAt,
    });

    this.emit("experiment.completed", experiment);
    logger.info(`✅ [LearningSystem] Experiment completed: ${experiment.name}`);
  }

  /**
   * Evaluate Model Performance
   * Uses Vertex AI Model Evaluation and Monitoring
   */
  async evaluateModel(
    beeId: string,
    modelVersion: string,
    metrics: {
      accuracy?: number;
      latency?: number;
      cost?: number;
      successRate?: number;
      usageCount: number;
    },
  ): Promise<ModelPerformance> {
    const performance: ModelPerformance = {
      beeId,
      modelVersion,
      metrics,
      drift: {
        detected: false,
        severity: "low",
        lastChecked: new Date().toISOString(),
      },
      lastEvaluated: new Date().toISOString(),
    };

    // Check for drift (would use Vertex AI Model Monitoring)
    if (this.vertexAIClient) {
      const driftCheck = await this.checkModelDrift(beeId, modelVersion);
      if (driftCheck) {
        performance.drift = driftCheck;
      }
    }

    this.modelPerformance.set(`${beeId}-${modelVersion}`, performance);

    // Store in Vertex AI Model Registry
    if (this.vertexAIClient) {
      await this.updateModelPerformanceInVertexAI(performance);
    }

    // Learn from performance
    if (metrics.successRate && metrics.successRate > 0.9) {
      await this.learn(
        beeId,
        "model",
        `model_${modelVersion}`,
        { version: modelVersion, metrics },
        {
          performance: metrics.successRate,
          successRate: metrics.successRate,
          modelVersion,
        },
      );
    }

    // Notify Colony OS
    await synapseBridge.publishEvent("model.evaluated", {
      beeId,
      modelVersion,
      metrics,
      drift: performance.drift,
      timestamp: performance.lastEvaluated,
    });

    this.emit("model.evaluated", performance);
    logger.info(
      `📊 [LearningSystem] Model evaluated: ${beeId} v${modelVersion}`,
    );

    return performance;
  }

  /**
   * Get Best Learning - Find the best performing knowledge
   */
  async getBestLearning(
    type: "pattern" | "model" | "strategy" | "insight",
    minPerformance: number = 0.8,
  ): Promise<Learning | null> {
    let bestLearning: Learning | null = null;
    let bestPerformance = 0;

    for (const learning of this.learnings.values()) {
      if (learning.type !== type) continue;

      const performance = learning.metadata.performance || 0;
      if (performance >= minPerformance && performance > bestPerformance) {
        bestPerformance = performance;
        bestLearning = learning;
      }
    }

    return bestLearning;
  }

  /**
   * Get Learnings by Bee - See what a bee has learned
   */
  getLearningsByBee(beeId: string): Learning[] {
    return Array.from(this.learnings.values()).filter((l) => l.beeId === beeId);
  }

  /**
   * Get All Learnings - Colony-wide knowledge
   */
  getAllLearnings(
    type?: "pattern" | "model" | "strategy" | "insight",
  ): Learning[] {
    const learnings = Array.from(this.learnings.values());
    return type ? learnings.filter((l) => l.type === type) : learnings;
  }

  /**
   * Register Model in Vertex AI Model Registry
   */
  private async registerModelInVertexAI(
    beeId: string,
    key: string,
    modelData: any,
    metadata: any,
  ): Promise<void> {
    try {
      const modelId = await registerModelInRegistry(beeId, key, modelData, {
        version: metadata.modelVersion || "1.0.0",
        performance: metadata.performance || 0,
        capabilities: [], // Would get from bee definition
        hive: "zyeute",
      });
      logger.info(`[LearningSystem] Model registered in Vertex AI: ${modelId}`);
    } catch (error: any) {
      logger.warn(
        `[LearningSystem] Could not register model in Vertex AI: ${error.message}`,
      );
    }
  }

  /**
   * Track Metadata in Vertex ML Metadata
   */
  private async trackMetadata(
    beeId: string,
    type: string,
    key: string,
    learning: Learning,
  ): Promise<void> {
    try {
      await trackMetadata(beeId, type, key, learning);
      logger.debug(
        `[LearningSystem] Metadata tracked: ${beeId} → ${key} (${type})`,
      );
    } catch (error: any) {
      logger.warn(
        `[LearningSystem] Could not track metadata: ${error.message}`,
      );
    }
  }

  /**
   * Track Experiment in Vertex AI Experiments
   */
  private async trackExperimentInVertexAI(
    experiment: Experiment,
  ): Promise<void> {
    try {
      await trackExperiment(experiment);
      logger.debug(`[LearningSystem] Experiment tracked: ${experiment.name}`);
    } catch (error: any) {
      logger.warn(
        `[LearningSystem] Could not track experiment: ${error.message}`,
      );
    }
  }

  /**
   * Update Experiment in Vertex AI
   */
  private async updateExperimentInVertexAI(
    experiment: Experiment,
  ): Promise<void> {
    // Update experiment with results
    logger.debug(`[LearningSystem] Updating experiment: ${experiment.name}`);
  }

  /**
   * Check Model Drift using Vertex AI Model Monitoring
   */
  private async checkModelDrift(
    beeId: string,
    modelVersion: string,
  ): Promise<{
    detected: boolean;
    severity: "low" | "medium" | "high";
    lastChecked: string;
  } | null> {
    try {
      const result = await monitorModel(beeId, modelVersion);
      if (result.driftDetected) {
        return {
          detected: true,
          severity: result.severity,
          lastChecked: new Date().toISOString(),
        };
      }
      return {
        detected: false,
        severity: "low",
        lastChecked: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.warn(`[LearningSystem] Could not check drift: ${error.message}`);
      return null;
    }
  }

  /**
   * Update Model Performance in Vertex AI
   */
  private async updateModelPerformanceInVertexAI(
    performance: ModelPerformance,
  ): Promise<void> {
    // Update model registry with performance metrics
    logger.debug(
      `[LearningSystem] Updating model performance: ${performance.beeId}`,
    );
  }
}

export const learningSystem = new LearningSystem();
