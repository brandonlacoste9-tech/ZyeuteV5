/**
 * Studio API Routes
 * Endpoints for AI Hive media generation
 */

import express from 'express';
import { hiveOrchestrator } from '../ai/orchestrator.js';
import type { HiveTask } from '../ai/types.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * POST /api/studio/generate-image
 * Generate an image from a text prompt
 */
router.post('/generate-image', async (req, res) => {
    try {
        const { prompt, modelHint, imageSize } = req.body;
        const userId = (req as any).userId;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const task: HiveTask = {
            id: crypto.randomUUID(),
            type: 'generate_image',
            payload: { prompt, modelHint, imageSize },
            userId,
            createdAt: new Date(),
        };

        const result = await hiveOrchestrator.handleTask(task);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

/**
 * POST /api/studio/generate-video
 * Generate a video from a text prompt (placeholder)
 */
router.post('/generate-video', async (req, res) => {
    try {
        const { prompt, duration, modelHint } = req.body;
        const userId = (req as any).userId;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const task: HiveTask = {
            id: crypto.randomUUID(),
            type: 'generate_video',
            payload: { prompt, duration, modelHint },
            userId,
            createdAt: new Date(),
        };

        const result = await hiveOrchestrator.handleTask(task);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

/**
 * POST /api/studio/compose-post
 * Generate a complete post with image and caption
 */
router.post('/compose-post', async (req, res) => {
    try {
        const { prompt, includeImage, modelHint } = req.body;
        const userId = (req as any).userId;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const task: HiveTask = {
            id: crypto.randomUUID(),
            type: 'compose_post',
            payload: { prompt, includeImage, modelHint },
            userId,
            createdAt: new Date(),
        };

        const result = await hiveOrchestrator.handleTask(task);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

/**
 * POST /api/studio/chat
 * Chat with Ti-Guy
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        const userId = (req as any).userId;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const task: HiveTask = {
            id: crypto.randomUUID(),
            type: 'chat',
            payload: { message, history },
            userId,
            createdAt: new Date(),
        };

        const result = await hiveOrchestrator.handleTask(task);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ response: result.data });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

/**
 * GET /api/studio/stats
 * Get orchestrator statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = hiveOrchestrator.getStats();
        res.json(stats);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});

export default router;
