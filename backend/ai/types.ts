/**
 * AI Hive - Core Type Definitions
 * Defines types for the bee orchestration system
 */

export type BeeCore = "orchestrator" | "guardian" | "architect" | "worker";

export type BeeCapability =
  | "chat"
  | "caption"
  | "image"
  | "video"
  | "moderation"
  | "analytics"
  | "budget"
  | "compose";

export interface BeeDefinition {
  id: string;
  name: string;
  core: BeeCore;
  capabilities: BeeCapability[];
  description: string;
  model: "deepseek" | "mistral" | "flux" | "hunyuan_image" | "hunyuan_video";
  endpoint?: string; // For Python Colony bees
}

export interface HiveTask {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  userId?: string;
  priority?: number;
  createdAt: Date;
}

export interface HiveTaskResult {
  taskId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    beeId: string;
    executionTime: number;
    model?: string;
    cost?: number;
  };
}

export interface MediaGenerationMetrics {
  imagesGenerated: number;
  videosGenerated: number;
  totalCost: number;
  averageGenerationTime: number;
}
