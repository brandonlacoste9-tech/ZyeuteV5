/**
 * AI Hive - Post Composer Bee
 * Orchestrates caption + image generation for complete posts
 */

import { executeStudioImageBee } from './studio-image.js';
import { executeStudioCaptionBee } from './studio-caption.js';

export async function executePostComposerBee(payload: Record<string, unknown>): Promise<unknown> {
    const prompt = payload.prompt as string;
    const includeImage = payload.includeImage !== false; // Default true
    const modelHint = payload.modelHint as "flux-schnell" | "flux-realism" | undefined;

    if (!prompt) {
        throw new Error('No prompt provided for post composition');
    }

    let imageResult;
    if (includeImage) {
        // 1. Generate image
        imageResult = await executeStudioImageBee({ prompt, modelHint });
    }

    // 2. Generate caption based on prompt (and image if generated)
    const caption = await executeStudioCaptionBee({
        context: {
            prompt,
            imageUrl: imageResult ? (imageResult as any).url : undefined,
        },
        mediaType: includeImage ? 'image' : 'text',
    });

    return {
        type: 'post',
        caption,
        ...(includeImage && { media: imageResult }),
    };
}
