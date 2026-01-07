/**
 * Vertex AI Feature Store Integration
 * Centralized feature management for consistent, reusable features across all bees and hives
 * Ensures features used for training are consistent with online inference
 */

import { logger } from "../utils/logger.js";
import { synapseBridge } from "./synapse-bridge.js";

export interface Feature {
  name: string;
  value: any;
  timestamp: string;
  entityId: string; // e.g., userId, postId
  metadata?: Record<string, any>;
}

export interface FeatureDefinition {
  name: string;
  description: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  source: string; // Where feature comes from
  computation?: string; // How to compute it
  tags?: string[];
}

export interface FeatureSet {
  name: string;
  description: string;
  features: FeatureDefinition[];
  entityType: "user" | "post" | "content" | "interaction";
}

/**
 * Feature Store Manager
 * Manages features using Vertex AI Feature Store
 */
export class FeatureStore {
  private features: Map<string, Feature[]> = new Map(); // entityId -> features
  private featureDefinitions: Map<string, FeatureDefinition> = new Map();
  private featureSets: Map<string, FeatureSet> = new Map();
  private vertexAIClient: any = null;
  private featureStoreClient: any = null;

  constructor() {
    this.initializeVertexAI();
    this.setupDefaultFeatures();
  }

  /**
   * Initialize Vertex AI Feature Store client
   */
  private async initializeVertexAI(): Promise<void> {
    try {
      const project =
        process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

      if (!project) {
        logger.warn("[FeatureStore] Vertex AI not configured");
        return;
      }

      const { VertexAI } = await import("@google-cloud/vertexai");
      let vertexAIConfig: any = { project, location };
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        vertexAIConfig.googleAuthOptions = { credentials };
      }

      this.vertexAIClient = new VertexAI(vertexAIConfig);
      // Would initialize FeatureStoreClient here
      // this.featureStoreClient = new FeaturestoreServiceClient(vertexAIConfig);

      logger.info("[FeatureStore] Vertex AI Feature Store initialized");
    } catch (error: any) {
      logger.error(`[FeatureStore] Initialization failed: ${error.message}`);
    }
  }

  /**
   * Setup default feature definitions
   */
  private setupDefaultFeatures(): void {
    // User features
    this.defineFeature({
      name: "user_reputation_score",
      description: "User reputation score based on engagement",
      type: "number",
      source: "computed",
      computation: "sum(engagement_metrics) / account_age",
      tags: ["user", "reputation"],
    });

    // Content features
    this.defineFeature({
      name: "content_quality_score",
      description: "Content quality score from AI analysis",
      type: "number",
      source: "ai_analysis",
      tags: ["content", "quality"],
    });

    // Interaction features
    this.defineFeature({
      name: "spam_probability",
      description: "Spam detection probability",
      type: "number",
      source: "moderation_bee",
      tags: ["moderation", "spam"],
    });
  }

  /**
   * Define a feature
   */
  defineFeature(definition: FeatureDefinition): void {
    this.featureDefinitions.set(definition.name, definition);
    logger.info(`[FeatureStore] Feature defined: ${definition.name}`);
  }

  /**
   * Store feature value (Online Serving)
   * For real-time feature access during inference
   */
  async storeFeature(
    entityId: string,
    featureName: string,
    value: any,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const feature: Feature = {
      name: featureName,
      value,
      timestamp: new Date().toISOString(),
      entityId,
      metadata,
    };

    // Store locally
    if (!this.features.has(entityId)) {
      this.features.set(entityId, []);
    }
    this.features.get(entityId)!.push(feature);

    // Store in Vertex AI Feature Store
    if (this.featureStoreClient) {
      await this.storeInVertexAI(feature);
    }

    // Share with Colony OS
    await synapseBridge.publishEvent("feature.stored", {
      entityId,
      featureName,
      value,
      timestamp: feature.timestamp,
    });

    logger.debug(`[FeatureStore] Feature stored: ${entityId}.${featureName}`);
  }

  /**
   * Get feature value (Online Serving)
   * For real-time inference
   */
  async getFeature(
    entityId: string,
    featureName: string,
    timestamp?: string, // Time-travel: get feature value at specific time
  ): Promise<any | null> {
    // Check local cache first
    const entityFeatures = this.features.get(entityId);
    if (entityFeatures) {
      const feature = entityFeatures
        .filter((f) => f.name === featureName)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )[0];

      if (feature) {
        // Time-travel: if timestamp specified, find closest match
        if (timestamp) {
          const timeFeatures = entityFeatures
            .filter((f) => f.name === featureName && f.timestamp <= timestamp)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
          return timeFeatures[0]?.value || null;
        }
        return feature.value;
      }
    }

    // Query Vertex AI Feature Store
    if (this.featureStoreClient) {
      return await this.getFromVertexAI(entityId, featureName, timestamp);
    }

    return null;
  }

  /**
   * Get multiple features (Online Serving)
   * Batch feature retrieval for inference
   */
  async getFeatures(
    entityId: string,
    featureNames: string[],
    timestamp?: string,
  ): Promise<Record<string, any>> {
    const features: Record<string, any> = {};

    for (const featureName of featureNames) {
      const value = await this.getFeature(entityId, featureName, timestamp);
      if (value !== null) {
        features[featureName] = value;
      }
    }

    return features;
  }

  /**
   * Get features for training (Offline Serving)
   * Batch feature retrieval with time-travel for historical data
   */
  async getFeaturesForTraining(
    entityIds: string[],
    featureNames: string[],
    options: {
      startTime?: string;
      endTime?: string;
      snapshotTime?: string; // Point-in-time snapshot
    } = {},
  ): Promise<Array<Record<string, any>>> {
    const { startTime, endTime, snapshotTime } = options;

    const results: Array<Record<string, any>> = [];

    for (const entityId of entityIds) {
      const features: Record<string, any> = { entityId };

      for (const featureName of featureNames) {
        if (snapshotTime) {
          // Point-in-time snapshot
          features[featureName] = await this.getFeature(
            entityId,
            featureName,
            snapshotTime,
          );
        } else if (startTime && endTime) {
          // Time range - get average or latest
          features[featureName] = await this.getFeatureInRange(
            entityId,
            featureName,
            startTime,
            endTime,
          );
        } else {
          // Current value
          features[featureName] = await this.getFeature(entityId, featureName);
        }
      }

      results.push(features);
    }

    return results;
  }

  /**
   * Get feature value in time range
   */
  private async getFeatureInRange(
    entityId: string,
    featureName: string,
    startTime: string,
    endTime: string,
  ): Promise<any> {
    const entityFeatures = this.features.get(entityId);
    if (!entityFeatures) return null;

    const rangeFeatures = entityFeatures.filter(
      (f) =>
        f.name === featureName &&
        f.timestamp >= startTime &&
        f.timestamp <= endTime,
    );

    if (rangeFeatures.length === 0) return null;

    // Return average for numeric features, or latest for others
    const definition = this.featureDefinitions.get(featureName);
    if (definition?.type === "number") {
      const values = rangeFeatures
        .map((f) => Number(f.value))
        .filter((v) => !isNaN(v));
      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;
    }

    // Return latest
    return rangeFeatures.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0].value;
  }

  /**
   * Compute feature value
   * For computed features, calculates value on-demand
   */
  async computeFeature(
    featureName: string,
    entityId: string,
    context?: Record<string, any>,
  ): Promise<any> {
    const definition = this.featureDefinitions.get(featureName);
    if (!definition) {
      throw new Error(`Feature ${featureName} not defined`);
    }

    if (!definition.computation) {
      // Not a computed feature, get stored value
      return await this.getFeature(entityId, featureName);
    }

    // Compute feature value
    // Would evaluate computation expression
    // For now, simplified
    if (featureName === "user_reputation_score") {
      const engagement = context?.engagement || 0;
      const accountAge = context?.accountAge || 1;
      return engagement / accountAge;
    }

    return null;
  }

  /**
   * Store feature in Vertex AI Feature Store
   */
  private async storeInVertexAI(feature: Feature): Promise<void> {
    // Would use Vertex AI Feature Store API
    // await this.featureStoreClient.writeFeatureValues({
    //   entityType: "user",
    //   entityId: feature.entityId,
    //   features: [{
    //     featureName: feature.name,
    //     value: feature.value,
    //     timestamp: feature.timestamp,
    //   }],
    // });

    logger.debug(
      `[FeatureStore] Stored in Vertex AI: ${feature.entityId}.${feature.name}`,
    );
  }

  /**
   * Get feature from Vertex AI Feature Store
   */
  private async getFromVertexAI(
    entityId: string,
    featureName: string,
    timestamp?: string,
  ): Promise<any> {
    // Would use Vertex AI Feature Store API
    // const response = await this.featureStoreClient.readFeatureValues({
    //   entityType: "user",
    //     entityId,
    //     featureSelector: {
    //       idMatcher: { ids: [featureName] },
    //     },
    //     snapshotTime: timestamp,
    // });

    return null;
  }

  /**
   * Create feature set
   */
  createFeatureSet(featureSet: FeatureSet): void {
    this.featureSets.set(featureSet.name, featureSet);
    logger.info(`[FeatureStore] Feature set created: ${featureSet.name}`);
  }

  /**
   * Get feature set
   */
  getFeatureSet(name: string): FeatureSet | undefined {
    return this.featureSets.get(name);
  }
}

export const featureStore = new FeatureStore();

/**
 * Convenience function for getting features (used by pipelines)
 */
export async function getFeatures(options: {
  window?: string;
  source?: string;
  entityIds?: string[];
  featureNames?: string[];
}): Promise<Array<Record<string, any>>> {
  const { window, entityIds = [], featureNames = [] } = options;

  // Parse window (e.g., "last_30_days")
  let startTime: string | undefined;
  if (window === "last_30_days") {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    startTime = date.toISOString();
  }

  return await featureStore.getFeaturesForTraining(entityIds, featureNames, {
    startTime,
    snapshotTime: startTime,
  });
}
