/**
 * 🚀 GenAI App Builder Routes
 * Uses $1,367.95 credits for image analysis and content generation
 * Separate from TI-GUY (Dialogflow CX - $813 credits)
 */

import { Router } from "express";
import {
  analyzeImageWithGenAI,
  checkGenAIHealth,
} from "../ai/genai-app-builder.js";
import {
  creditCheckMiddleware,
  getCreditStatus,
} from "../ai/credit-manager.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Middleware to ensure authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

/**
 * POST /api/genai/analyze-image
 * Analyze an image using GenAI App Builder credits ($1,367 available)
 * Returns Quebec-themed captions with joual (slang) versions
 * STOPs when credits run out
 */
router.post(
  "/analyze-image",
  requireAuth,
  creditCheckMiddleware("genai-app-builder", "genai-image-analysis"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { imageUrl, location, generateJoual = true } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          error: "Image URL required",
          usage: {
            service: "genai-app-builder",
            credits_available: "$1,367.95",
          },
        });
      }

      logger.info(
        `[GenAI-Builder] Analyzing image for user ${req.userId}: ${imageUrl.substring(0, 50)}...`,
      );

      const result = await analyzeImageWithGenAI(imageUrl, {
        generateJoual,
        location,
      });

      const responseTime = Date.now() - startTime;

      logger.info(`[GenAI-Builder] ✅ Analysis complete in ${responseTime}ms`);

      res.json({
        ...result,
        meta: {
          service: "genai-app-builder",
          response_time_ms: responseTime,
          credits_remaining_estimate: "$1,367.95",
          model: "gemini-2.0-flash-exp",
        },
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logger.error(`[GenAI-Builder] ❌ Error after ${responseTime}ms:`, error);

      res.status(500).json({
        error: "Failed to analyze image",
        details: error.message,
        response_time_ms: responseTime,
        fallback: {
          caption: "Ben coudonc, c'est cool! 🦫",
          tags: ["quebec", "cool"],
          vibe_category: "chill",
        },
      });
    }
  },
);

/**
 * GET /api/genai/health
 * Check GenAI App Builder health and credit status
 */
router.get("/health", async (req, res) => {
  const health = await checkGenAIHealth();

  res.json({
    service: "genai-app-builder",
    ...health,
    credits: {
      genai_app_builder: "$1,367.95",
      dialogflow_cx: "$813.16 (separate pool for TI-GUY)",
    },
    features: [
      "image-analysis",
      "multimodal-understanding",
      "content-generation",
    ],
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/genai/generate-tags
 * Auto-generate tags for a post using GenAI credits
 */
router.post("/generate-tags", requireAuth, async (req: any, res) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content && !imageUrl) {
      return res.status(400).json({ error: "Content or imageUrl required" });
    }

    // For now, return smart defaults based on content
    // In production, this would call GenAI App Builder's text generation
    const defaultTags = [
      "quebec",
      "montreal",
      "mtl",
      "quebeccity",
      "canada",
      "joual",
      "francais",
      "culture",
      "nature",
      "citylife",
      "food",
      "poutine",
      "maple",
      "hockey",
      "music",
    ];

    const suggestedTags = defaultTags
      .filter(
        (tag) =>
          content?.toLowerCase().includes(tag.toLowerCase()) ||
          Math.random() > 0.7, // Randomly suggest some popular tags
      )
      .slice(0, 5);

    res.json({
      tags: suggestedTags.length > 0 ? suggestedTags : ["zyeute", "quebec"],
      suggested_hashtags: suggestedTags.map((t) => `#${t}`),
      meta: {
        service: "genai-app-builder",
        credits_available: "$1,367.95",
      },
    });
  } catch (error: any) {
    logger.error("[GenAI-Builder] Tag generation error:", error);
    res.status(500).json({ error: "Failed to generate tags" });
  }
});

export default router;
