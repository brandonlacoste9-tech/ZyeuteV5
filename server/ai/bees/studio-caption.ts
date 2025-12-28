/**
 * Studio Caption Bee
 * Generates captions using V3 Feed system
 */

import { v3TiGuy } from '../../v3-swarm.js';

export async function run(task: any) {
    const payload = task.payload || {};
    const context = payload.context || payload.prompt || 'a beautiful Quebec scene';

    console.log('[Studio Caption] Generating caption for:', context);

    // Generate a caption and transform it to Ti-Guy joual
    const caption = await v3TiGuy(
        `Write a short, engaging caption for: ${context}`,
        'social media post'
    );

    return {
        caption,
        metadata: { model: 'deepseek', bee: 'studio-caption' }
    };
}
