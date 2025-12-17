/**
 * AI Hive - Studio Caption Bee
 * Generates captions for media content using V3-FEED
 */

import { v3Feed } from '../../v3-swarm.js';

export async function executeStudioCaptionBee(payload: Record<string, unknown>): Promise<string> {
    const context = (payload.context as Record<string, unknown>) || {};
    const mediaType = (payload.mediaType as string) || 'image';
    const theme = (payload.theme as string) || 'Quebec culture';

    // Use V3-FEED to generate contextual caption
    const feedItem = await v3Feed({
        ...context,
        content_type: 'caption',
        media_type: mediaType,
        theme,
    });

    return feedItem.body || feedItem.title;
}
