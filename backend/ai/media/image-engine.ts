/**
 * Image Engine
 * Real FAL/Flux integration for image generation
 */

import { fal } from "@fal-ai/client";

// Configure FAL if not already done
if (process.env.FAL_API_KEY) {
  fal.config({ credentials: process.env.FAL_API_KEY });
}

export interface ImageGenerationParams {
  prompt: string;
  modelHint?: "flux" | "flux-schnell" | "flux-realism";
  imageSize?: "square" | "portrait" | "landscape";
}

export interface ImageGenerationResult {
  url: string;
  cost: number;
  model: string;
}

export async function generateImage(
  params: ImageGenerationParams,
): Promise<ImageGenerationResult> {
  const { prompt, modelHint = "flux", imageSize = "square" } = params;

  console.log("[Image Engine] Generating image:", prompt.substring(0, 50));

  if (!process.env.FAL_API_KEY) {
    console.warn(
      "[Image Engine] FAL API key not configured, returning placeholder",
    );
    return {
      url: "https://placehold.co/1024x1024/1a1a1a/gold?text=Image+Generation+Disabled",
      cost: 0,
      model: "placeholder",
    };
  }

  try {
    // Map size preference to FAL format
    const sizeMap = {
      square: "square_hd",
      portrait: "portrait_16_9",
      landscape: "landscape_16_9",
    } as const;

    type ImageSizeType = (typeof sizeMap)[keyof typeof sizeMap];
    const selectedSize: ImageSizeType =
      imageSize in sizeMap
        ? sizeMap[imageSize as keyof typeof sizeMap]
        : "square_hd";

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: selectedSize,
        num_inference_steps: 4,
        num_images: 1,
      },
      logs: true,
    });

    const images = (result.data as any)?.images || [];
    if (images.length === 0) {
      throw new Error("No image generated");
    }

    return {
      url: images[0].url,
      cost: 0.003, // Approximate cost per Flux schnell generation
      model: "flux-schnell",
    };
  } catch (error: any) {
    console.error("[Image Engine] Generation failed:", error.message);
    throw error;
  }
}
