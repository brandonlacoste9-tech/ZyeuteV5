/**
 * Video Engine
 * Real FAL/Kling integration for video generation
 */

import { fal } from "@fal-ai/client";

// Configure FAL if not already done
if (process.env.FAL_API_KEY) {
  fal.config({ credentials: process.env.FAL_API_KEY });
}

export interface VideoGenerationParams {
  prompt: string;
  imageUrl?: string; // For image-to-video
  duration?: number;
  modelHint?: "kling" | "hunyuan_video";
}

export interface VideoGenerationResult {
  url: string;
  cost: number;
  model: string;
  duration: number;
}

export async function generateVideo(
  params: VideoGenerationParams,
): Promise<VideoGenerationResult> {
  const { prompt, imageUrl, duration = 5, modelHint = "kling" } = params;

  console.log("[Video Engine] Generating video:", prompt.substring(0, 50));

  if (!process.env.FAL_API_KEY) {
    console.warn(
      "[Video Engine] FAL API key not configured, returning placeholder",
    );
    return {
      url: "https://placehold.co/1920x1080/1a1a1a/gold?text=Video+Generation+Disabled",
      cost: 0,
      model: "placeholder",
      duration: 0,
    };
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
      // Text-to-video (placeholder for now - Kling requires image input)
      console.warn(
        "[Video Engine] Text-to-video not yet implemented, returning placeholder",
      );
      return {
        url: "https://placehold.co/1920x1080/1a1a1a/gold?text=Text+to+Video+Coming+Soon",
        cost: 0,
        model: "placeholder",
        duration: 0,
      };
    }
  } catch (error: any) {
    console.error("[Video Engine] Generation failed:", error.message);
    throw error;
  }
}
