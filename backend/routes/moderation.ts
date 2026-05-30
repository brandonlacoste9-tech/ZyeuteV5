import { Router } from "express";
import { storage } from "../storage.js";
import { creditService } from "../services/credit-service.js";
import { logger } from "../utils/logger.js";

const router = Router();
const modLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[ModerationRoute] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[ModerationRoute] ${msg}`, ...args),
};

/**
 * Report a post (logged content for moderator review).
 */
router.post("/report-content", async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { postId, reason, category } = req.body || {};
    if (!postId || typeof postId !== "string") {
      return res.status(400).json({ error: "postId requis" });
    }

    await storage.createModerationLog({
      userId,
      action: "report",
      reason: typeof reason === "string" ? reason : "user_report",
      details: `post:${postId} category:${category || "unspecified"}`,
      score: 0,
    });

    res.json({ success: true, message: "Signalement reçu. Merci." });
  } catch (error: any) {
    modLogger.error("Report error:", error);
    res.status(500).json({ error: "Impossible d'enregistrer le signalement." });
  }
});

/**
 * Request to block another user (stored as moderation log until block table exists).
 */
router.post("/block-user", async (req: any, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { blockedUserId } = req.body || {};
    if (!blockedUserId || typeof blockedUserId !== "string") {
      return res.status(400).json({ error: "blockedUserId requis" });
    }

    await storage.createModerationLog({
      userId,
      action: "block_request",
      reason: "user_block",
      details: `blocked_user_id:${blockedUserId}`,
      score: 0,
    });

    res.json({ success: true, message: "Blocage enregistré." });
  } catch (error: any) {
    modLogger.error("Block user error:", error);
    res.status(500).json({ error: "Impossible d'enregistrer le blocage." });
  }
});

/**
 * Moderation Appeal Route
 * Users can appeal for blocked content.
 */
router.post("/appeal", async (req: any, res) => {
  try {
    const { postId, reason } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    modLogger.info(`User ${userId} appealing for post ${postId}`);

    // Log appeal as a special moderation log entry
    await storage.createModerationLog({
      userId,
      action: "appeal",
      reason: "User submitted appeal",
      details: `Post ID: ${postId} | Reason: ${reason}`,
      score: 0,
    });

    // Award +5 Karma for engaging honestly
    await creditService.awardKarma(userId, 5, "MOD_APPEAL_HONESTY");

    res.json({
      success: true,
      message: "Appel soumis avec succès. +5 Karma pour votre honnêteté.",
    });
  } catch (error: any) {
    modLogger.error("Appeal error:", error);
    res.status(500).json({ error: "Erreur lors de la soumission de l'appel." });
  }
});

/**
 * Get Moderation Stats (Admin only)
 */
router.get("/stats", async (req: any, res) => {
  try {
    // In a real app, check for admin role
    const logs = await storage.getModerationLogsByUser("system"); // Placeholder or all logs
    // Normally we'd need a specific storage method for global stats
    const allLogs = await storage.getModerationLogsByUser(""); // Mocking getting all logs

    const stats = {
      totalChecked: 1240, // Mocked
      blocked: 45,
      falsePositives: 12,
      cost: 1.45,
    };

    res.json(stats);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques." });
  }
});

export default router;
