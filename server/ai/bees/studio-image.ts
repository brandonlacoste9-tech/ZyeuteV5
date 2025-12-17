/**
 * AI Hive - Studio Image Bee
 * Generates images using FAL/Flux
 */

import { generateImage } from '../media/image-engine.js';

export async function executeStudioImageBee(payload: Record<string, unknown>): Promise<unknown> {
    const prompt = payload.prompt as string;
    const modelHint = payload.modelHint as "flux-schnell" | "flux-realism" | undefined;
    const imageSize = payload.imageSize as "square_hd" | "landscape_4_3" | "portrait_4_3" | undefined;

    if (!prompt) {
        throw new Error('No prompt provided for image generation');
    }

    const result = await generateImage({
        prompt,
        modelHint,
        imageSize,
    });

    return {
        type: 'image',
        url: result.url,
        metadata: {
            width: result.width,
            height: result.height,
            model: result.model,
            cost: result.cost,
            seed: result.seed,
        },
    };
}
