/**
 * Studio Video Bee
 * Uses the real Video Engine with FAL/Kling
 */

import { generateVideo } from '../media/video-engine.js';

export async function run(task: any) {
    const payload = task.payload || {};
    const prompt = payload.prompt || 'A cinematic drone shot of Montreal';
    const imageUrl = payload.imageUrl;
    const duration = payload.duration || 5;

    console.log('[Studio Video] Generating video:', prompt.substring(0, 50));

    const result = await generateVideo({
        prompt,
        imageUrl,
        duration,
        modelHint: 'kling'
    });

    return {
        ...result,
        metadata: { bee: 'studio-video' }
    };
}
