/**
 * 🔍 GenAI Search Routes
 * Smart content discovery using GenAI App Builder ($1,367.95 credits)
 *
 * Endpoints:
 * - POST /api/genai/search              (Text search)
 * - POST /api/genai/search-by-image     (Visual search)
 * - GET  /api/genai/similar/:id         (Find similar content)
 * - GET  /api/genai/for-you             (Personalized feed)
 * - GET  /api/genai/trending            (Trending content)
 */

import { Router } from "express";
import {
  searchByText,
  searchByImage,
  findSimilarContent,
  getForYouFeed,
  SearchResult,
} from "../ai/genai-search.js";
import { creditCheckMiddleware } from "../ai/credit-manager.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Optional auth - works for both logged-in and guest users
const optionalAuth = (req: any, res: any, next: any) => {
  // If no auth, continue as guest
  next();
};

// ═══════════════════════════════════════════════════════════════
// 🔍 TEXT SEARCH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/genai/search
 * Smart semantic search with Quebec context awareness
 *
 * Body: {
 *   query: "poutine reviews in Montreal",
 *   filters?: { type: ["video"], location: "montreal", vibe: "chill" },
 *   limit?: 20
 * }
 */
router.post(
  "/search",
  optionalAuth,
  creditCheckMiddleware("genai-app-builder", "genai-text-generation"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { query, filters = {}, limit = 20, offset = 0 } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          error: "Search query is required",
          example: { query: "poutine reviews in Montreal" },
        });
      }

      logger.info(
        `[GenAI-Search] Text search: "${query}" by user ${req.userId || "guest"}`,
      );

      const results = await searchByText(query, {
        userId: req.userId,
        limit,
        offset,
        filters,
      });

      const responseTime = Date.now() - startTime;

      res.json({
        query,
        results,
        total: results.length,
        meta: {
          response_time_ms: responseTime,
          service: "genai-app-builder",
          credits_used: "genai-text-generation",
          credits_pool: "$1,367.95",
          search_type: "semantic",
          language: "quebec-aware",
        },
      });
    } catch (error: any) {
      logger.error("[GenAI-Search] Error:", error);
      res.status(500).json({
        error: "Search failed",
        message: error.message,
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// 🖼️ VISUAL SEARCH
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/genai/search-by-image
 * Search by uploading an image (reverse image search)
 *
 * Body: {
 *   imageUrl: "https://...",
 *   filters?: { type: ["video"] }
 * }
 */
router.post(
  "/search-by-image",
  optionalAuth,
  creditCheckMiddleware("genai-app-builder", "genai-image-analysis"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { imageUrl, filters = {}, limit = 20 } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          error: "imageUrl is required",
          example: { imageUrl: "https://example.com/image.jpg" },
        });
      }

      logger.info(
        `[GenAI-Search] Visual search by user ${req.userId || "guest"}`,
      );

      const results = await searchByImage(imageUrl, {
        userId: req.userId,
        limit,
        filters,
      });

      const responseTime = Date.now() - startTime;

      res.json({
        imageUrl,
        results,
        total: results.length,
        meta: {
          response_time_ms: responseTime,
          service: "genai-app-builder",
          credits_used: "genai-image-analysis",
          credits_pool: "$1,367.95",
          search_type: "visual",
        },
      });
    } catch (error: any) {
      logger.error("[GenAI-Search] Visual search error:", error);
      res.status(500).json({
        error: "Visual search failed",
        message: error.message,
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// 🔗 SIMILAR CONTENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/genai/similar/:contentId
 * Find similar videos/posts to the given content
 */
router.get(
  "/similar/:contentId",
  optionalAuth,
  creditCheckMiddleware("genai-app-builder", "genai-text-generation"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { contentId } = req.params;
      const { limit = 10 } = req.query;

      logger.info(`[GenAI-Search] Finding similar to ${contentId}`);

      const results = await findSimilarContent(contentId, {
        userId: req.userId,
        limit: parseInt(limit as string),
      });

      const responseTime = Date.now() - startTime;

      res.json({
        contentId,
        results,
        total: results.length,
        meta: {
          response_time_ms: responseTime,
          service: "genai-app-builder",
          search_type: "similarity",
        },
      });
    } catch (error: any) {
      logger.error("[GenAI-Search] Similar content error:", error);
      res.status(500).json({
        error: "Failed to find similar content",
        message: error.message,
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// 🎯 FOR YOU FEED (Personalized)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/genai/for-you
 * Personalized "For You" feed based on user preferences
 * Requires authentication
 */
router.get(
  "/for-you",
  (req: any, res: any, next: any) => {
    if (!req.userId) {
      return res.status(401).json({
        error: "Authentication required for personalized feed",
        fallback: "/api/genai/trending",
      });
    }
    next();
  },
  creditCheckMiddleware("genai-app-builder", "genai-text-generation"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { limit = 20, offset = 0 } = req.query;

      logger.info(`[GenAI-Search] For You feed for user ${req.userId}`);

      const results = await getForYouFeed(req.userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      const responseTime = Date.now() - startTime;

      res.json({
        results,
        total: results.length,
        meta: {
          response_time_ms: responseTime,
          service: "genai-app-builder",
          feed_type: "personalized",
          user_id: req.userId,
        },
      });
    } catch (error: any) {
      logger.error("[GenAI-Search] For You feed error:", error);
      res.status(500).json({
        error: "Failed to generate feed",
        message: error.message,
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// 🔥 TRENDING CONTENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/genai/trending
 * Get trending content (no credits used - basic query)
 */
router.get("/trending", async (req: any, res) => {
  try {
    const { limit = 20, region = "quebec" } = req.query;

    // Import trending function
    const { getTrendingContent } = await import("../ai/genai-search.js");

    const results = await getTrendingContent(parseInt(limit as string));

    res.json({
      results,
      region,
      meta: {
        service: "database",
        feed_type: "trending",
        credits_used: "none",
      },
    });
  } catch (error: any) {
    logger.error("[GenAI-Search] Trending error:", error);
    res.status(500).json({
      error: "Failed to get trending content",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🔍 SEARCH SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/genai/suggestions
 * Get search suggestions as user types
 */
router.get("/suggestions", async (req: any, res) => {
  try {
    const { q = "" } = req.query;

    // Popular Quebec-themed searches
    const suggestions = [
      "poutine reviews",
      "hockey moments",
      "Montreal nightlife",
      "Quebec winter",
      "festival vibes",
      "joual expressions",
      "Plateau street art",
      "Old Quebec",
      "St-Lawrence river",
      "maple syrup",
      "chill spots Montreal",
      "party MTL",
      "nature Quebec",
      "ski trips",
      "food tour",
    ]
      .filter((s) => s.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);

    res.json({
      query: q,
      suggestions,
      trending: ["poutine", "hockey", "OSHEAGA", "winter", "festival"],
    });
  } catch (error) {
    res.json({ suggestions: [] });
  }
});

export default router;
