/**
 * Video Engine
 * Real FAL/Kling integration for video generation
 * Supports Veo 3.1 (when available via Python bridge)
 */

import { fal } from "@fal-ai/client";
import { logger } from "../../utils/logger.js";

// Configure FAL if not already done
if (process.env.FAL_API_KEY) {
  fal.config({ credentials: process.env.FAL_API_KEY });
}

export interface VideoGenerationParams {
  prompt: string;
  imageUrl?: string; // For image-to-video
  duration?: number;
  modelHint?: "kling" | "hunyuan_video" | "veo-3.1";
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

export interface VideoGenerationResult {
  url: string;
  cost: number;
  model: string;
  duration: number;
}

/**
 * Generate video with Veo 3.1 (Google Vertex AI)
 * Note: Requires Python bridge or @google/genai TypeScript SDK when available
 */
async function generateVideoWithVeo31(
  params: VideoGenerationParams,
): Promise<VideoGenerationResult> {
  // TODO: Implement Veo 3.1 via Python bridge or TypeScript SDK
  // For now, fallback to Kling
  logger.warn("[Video Engine] Veo 3.1 not yet implemented, using Kling fallback");
  return generateVideoWithKling(params);
}

/**
 * Generate video with Kling (FAL)
 */
async function generateVideoWithKling(
  params: VideoGenerationParams,
): Promise<VideoGenerationResult> {
  const { prompt, imageUrl, duration = 5, aspectRatio = "9:16" } = params;

  if (!process.env.FAL_API_KEY) {
    throw new Error("FAL_API_KEY not configured");
  }

  try {
    // Use image-to-video if imageUrl provided, otherwise text-to-video
    if (imageUrl) {
      const result = await fal.subscribe(
        "fal-ai/kling-video/v2/master/image-to-video",
        {
          input: {
            image_url: imageUrl,
            prompt,
            duration: String(duration) as "5" | "10",
          },
          logs: true,
        },
      );

      const video = (result.data as any)?.video;
      if (!video?.url) {
        throw new Error("No video generated");
      }

      return {
        url: video.url,
        cost: 0.5, // Approximate cost per Kling video
        model: "kling-i2v",
        duration,
      };
    } else {
      // Text-to-video implementation
      const result = await fal.subscribe(
        "fal-ai/kling-video/v1.0/text-to-video",
        {
          input: {
            prompt,
            duration: String(duration) as "5" | "10",
            aspect_ratio: aspectRatio,
          },
          logs: true,
        },
      );

      const video = (result.data as any)?.video;
      if (!video?.url) {
        throw new Error("No video generated");
      }

      return {
        url: video.url,
        cost: 0.5,
        model: "kling-t2v",
        duration,
      };
    }
  } catch (error: any) {
    logger.error(`[Video Engine] Kling generation failed: ${error.message}`);
    throw error;
  }
}

export async function generateVideo(
  params: VideoGenerationParams,
): Promise<VideoGenerationResult> {
  const { prompt, modelHint = "kling" } = params;

  logger.info(`[Video Engine] Generating video with ${modelHint}: ${prompt.substring(0, 50)}...`);

  // Route to appropriate video generation service
  if (modelHint === "veo-3.1") {
    return generateVideoWithVeo31(params);
  }

  // Default to Kling
  return generateVideoWithKling(params);
}
