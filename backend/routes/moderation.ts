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
