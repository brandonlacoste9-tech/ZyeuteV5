/**
 * AI Hive - Ti-Guy Chat Bee
 * Wraps existing V3-TI-GUY system for chat interactions
 */

import { v3TiGuyChat } from '../../v3-swarm.js';

export async function executeTiGuyChatBee(payload: Record<string, unknown>): Promise<string> {
    const userMessage = (payload.message as string) || (payload.prompt as string) || '';
    const history = (payload.history as Array<{ role: string; content: string }>) || [];

    if (!userMessage) {
        throw new Error('No message provided for Ti-Guy chat');
    }

    return v3TiGuyChat(userMessage, history);
}
