/**
 * 🦫 TI-GUY Routes
 * All TI-GUY conversational AI uses Dialogflow CX ($813.16 credits)
 * With automatic cutoff when credits run out
 */

import { Router } from "express";
import {
  chatWithTIGuy,
  detectTIGuyIntent,
  getTIGuyHealth,
} from "../ai/tiguy-service.js";
import {
  creditCheckMiddleware,
  getCreditStatus,
  getUsageStats,
} from "../ai/credit-manager.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Middleware to ensure authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

// ═══════════════════════════════════════════════════════════════
// 💬 MAIN CHAT ENDPOINT (Uses Dialogflow CX - $813.16 credits)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/chat
 * Main TI-GUY conversational endpoint
 * Uses Dialogflow CX credits with automatic cutoff protection
 */
router.post(
  "/chat",
  requireAuth,
  creditCheckMiddleware("dialogflow-cx", "dialogflow-cx-text"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { message, context = {} } = req.body;

      if (!message) {
        return res.status(400).json({
          error: "Message is required",
          response: "Envoie-moi de quoi, câlisse!",
        });
      }

      logger.info(
        `[TI-GUY] Chat request from user ${req.userId}: ${message.substring(0, 50)}...`,
      );

      // Route to Dialogflow CX (uses $813.16 credits)
      const result = await chatWithTIGuy(message, {
        userId: req.userId,
        ...context,
      });

      const responseTime = Date.now() - startTime;

      res.json({
        response: result.response,
        intent: result.intent,
        confidence: result.confidence,
        action: result.action,
        meta: {
          service: result.type,
          credits_used: result.creditsUsed,
          response_time_ms: responseTime,
          credits_pool: "$813.16 (Dialogflow CX)",
        },
      });
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logger.error(`[TI-GUY] Chat error after ${responseTime}ms:`, error);

      res.status(500).json({
        error: "TI-GUY request failed",
        response: "Désolé, j'ai eu un problème. Réessaye!",
        meta: {
          response_time_ms: responseTime,
          credits_pool: "$813.16 (Dialogflow CX)",
        },
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// 🎤 INTENT DETECTION (Uses Dialogflow CX - $813.16 credits)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/detect-intent
 * Direct Dialogflow CX intent detection
 * Protected by credit manager
 */
router.post(
  "/detect-intent",
  requireAuth,
  creditCheckMiddleware("dialogflow-cx", "dialogflow-cx-text"),
  async (req: any, res) => {
    try {
      const { sessionId, queryInput, languageCode = "fr-CA" } = req.body;

      if (!sessionId || !queryInput) {
        return res.status(400).json({
          error: "sessionId and queryInput are required",
        });
      }

      const result = await detectTIGuyIntent(
        sessionId,
        queryInput,
        languageCode,
      );

      res.json({
        ...result,
        meta: {
          service: "dialogflow-cx",
          credits_pool: "$813.16",
          language: languageCode,
        },
      });
    } catch (error: any) {
      logger.error("[TI-GUY] Intent detection error:", error);
      res.status(500).json({
        error: "Intent detection failed",
        message: error.message,
      });
    }
  },
);

// ═══════════════════════════════════════════════════════════════
// 📊 CREDIT MONITORING ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/tiguy/health
 * TI-GUY health and credit status
 */
router.get("/health", async (req, res) => {
  const health = await getTIGuyHealth();
  res.json(health);
});

/**
 * GET /api/tiguy/credits
 * Credit status and usage statistics
 */
router.get("/credits", requireAuth, async (req: any, res) => {
  // Only admins can see full details
  const isAdmin = req.userRole === "admin" || req.userRole === "moderator";

  if (isAdmin) {
    res.json({
      status: "ok",
      credits: getCreditStatus(),
      usage: getUsageStats(),
      timestamp: new Date().toISOString(),
    });
  } else {
    // Regular users see limited info
    res.json({
      status: "ok",
      services: getCreditStatus().map((c: any) => ({
        service: c.service,
        status: c.status,
        available: c.status === "HEALTHY",
      })),
      message: "TI-GUY est prêt à jaser! 🦫",
    });
  }
});

/**
 * GET /api/tiguy/status
 * Simple status check
 */
router.get("/status", async (req, res) => {
  const credits = getCreditStatus();
  const dialogflowCredits = credits.find(
    (c: any) => c.service === "dialogflow-cx",
  );

  res.json({
    online: dialogflowCredits?.status !== "DEPLETED",
    persona: "TI-GUY",
    mood: "joual",
    credits:
      dialogflowCredits?.status === "HEALTHY"
        ? "available"
        : dialogflowCredits?.status === "LOW"
          ? "low"
          : "depleted",
    message: "TI-GUY est là pour jaser! 🔥",
  });
});

// ═══════════════════════════════════════════════════════════════
// 🎭 SPECIALIST SKILLS (Also use Dialogflow CX)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/tiguy/trends
 * Get trending topics with TI-GUY commentary
 */
router.post(
  "/trends",
  requireAuth,
  creditCheckMiddleware("dialogflow-cx", "dialogflow-cx-text"),
  async (req: any, res) => {
    try {
      const { region = "quebec" } = req.body;

      const result = await chatWithTIGuy(`Qu'est-ce qui tend au ${region}?`, {
        userId: req.userId,
        mood: "trending",
      });

      res.json({
        commentary: result.response,
        region,
        meta: {
          credits_used: result.creditsUsed,
          credits_pool: "$813.16",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get trends" });
    }
  },
);

export default router;
