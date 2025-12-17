/**
 * AI Hive - Image Generation Engine
 * Wraps FAL client for image generation
 */

import * as fal from "@fal-ai/client";
import { traceExternalAPI } from "../../tracer.js";

export interface ImageGenerationOptions {
    prompt: string;
    modelHint?: "flux-schnell" | "flux-realism" | "flux-2-flex" | "auraflow";
    imageSize?: "square_hd" | "landscape_4_3" | "portrait_4_3";
    numInferenceSteps?: number;
}

export interface ImageGenerationResult {
    url: string;
    width: number;
    height: number;
    seed: number;
    model: string;
    cost: number;
}

// Cost estimates per image (in USD)
const MODEL_COSTS = {
    "fal-ai/flux/schnell": 0.003,
    "fal-ai/flux-realism": 0.01,
    "fal-ai/aura-flow": 0.008,
};

/**
 * Generate an image using FAL AI
 */
export async function generateImage(
    options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
    return traceExternalAPI("fal", "image.generate", "POST", async (span) => {
        span.setAttributes({
            "ai.prompt_length": options.prompt.length,
            "ai.model_hint": options.modelHint || "flux-schnell",
        });

        // Map model hint to FAL model
        const modelMap: Record<string, string> = {
            "flux-schnell": "fal-ai/flux/schnell",
            "flux-realism": "fal-ai/flux-realism",
            "flux-2-flex": "fal-ai/flux/schnell", // Use schnell for now
            "auraflow": "fal-ai/aura-flow",
        };

        const model = modelMap[options.modelHint || "flux-schnell"];

        const result = await fal.subscribe(model, {
            input: {
                prompt: options.prompt,
                image_size: options.imageSize || "square_hd",
                num_inference_steps: options.numInferenceSteps || 4,
            },
        });

        const imageData = result.data as any;

        span.setAttributes({
            "ai.image_url": imageData.images[0].url,
            "ai.model_used": model,
        });

        const cost = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 0.01;

        return {
            url: imageData.images[0].url,
            width: imageData.images[0].width,
            height: imageData.images[0].height,
            seed: imageData.seed || 0,
            model,
            cost,
        };
    });
}
