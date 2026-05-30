/**
 * User Flagging & Related User Management Routes
 * Admin endpoints for managing flagged users and ban propagation
 */

import { Router } from "express";
import { storage } from "../storage.js";
import {
  analyzeUserRelationships,
  findRelatedUsersToBanned,
  RelatedUserAnalysis,
} from "../services/userRelationshipAnalyzer.js";
import {
  scanAndFlagRelatedUsers,
  getFlaggedUsers,
  flagUserForReview,
  DEFAULT_FLAGGING_RULES,
  FlaggingRule,
} from "../services/userFlaggingSystem.js";
import { logger } from "../utils/logger.js";

const router = Router();
const flaggingLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[FlaggingRoute] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[FlaggingRoute] ${msg}`, ...args),
};

// Middleware to check admin role
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const user = await storage.getUser(req.userId);
  if (
    !user ||
    (user.role !== "moderator" && user.role !== "founder" && !user.isAdmin)
  ) {
    return res.status(403).json({ error: "Accès refusé. Admin requis." });
  }

  next();
};

/**
 * GET /api/admin/flagging/flagged
 * Get all flagged users
 */
router.get("/flagged", requireAdmin, async (req, res) => {
  try {
    const severity = req.query.severity as
      | "low"
      | "medium"
      | "high"
      | "critical"
      | undefined;

    const flags = await getFlaggedUsers(severity);

    res.json({
      success: true,
      flags,
      count: flags.length,
    });
  } catch (error: any) {
    flaggingLogger.error("Error getting flagged users:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des utilisateurs signalés",
    });
  }
});

/**
 * GET /api/admin/flagging/analyze/:userId
 * Analyze a specific user's relationships
 */
router.get("/analyze/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const maxDepth = parseInt(req.query.maxDepth as string) || 2;

    const analysis = await analyzeUserRelationships(userId, maxDepth);

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    flaggingLogger.error("Error analyzing user:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'analyse de l'utilisateur" });
  }
});

/**
 * POST /api/admin/flagging/scan-related/:bannedUserId
 * Scan and flag users related to a banned user
 */
router.post("/scan-related/:bannedUserId", requireAdmin, async (req, res) => {
  try {
    const bannedUserId = req.params.bannedUserId;

    // Verify user is actually banned
    const bannedUser = await storage.getUser(bannedUserId);
    if (!bannedUser || bannedUser.role !== "banned") {
      return res.status(400).json({
        error: "L'utilisateur spécifié n'est pas banni",
      });
    }

    flaggingLogger.info(
      `Scanning users related to banned user ${bannedUserId}`,
    );

    const flags = await scanAndFlagRelatedUsers(bannedUserId);

    res.json({
      success: true,
      message: `${flags.length} utilisateurs signalés`,
      flags,
    });
  } catch (error: any) {
    flaggingLogger.error("Error scanning related users:", error);
    res
      .status(500)
      .json({ error: "Erreur lors du scan des utilisateurs liés" });
  }
});

/**
 * GET /api/admin/flagging/related/:userId
 * Get all users related to a specific user
 */
router.get("/related/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const maxDepth = parseInt(req.query.maxDepth as string) || 2;

    const relatedUserIds = await findRelatedUsersToBanned(userId, maxDepth);

    // Get user details
    const relatedUsers = await Promise.all(
      relatedUserIds.map(async (id) => {
        const user = await storage.getUser(id);
        if (!user) return null;
        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      }),
    );

    res.json({
      success: true,
      relatedUsers: relatedUsers.filter((u) => u !== null),
      count: relatedUsers.length,
    });
  } catch (error: any) {
    flaggingLogger.error("Error getting related users:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des utilisateurs liés" });
  }
});

/**
 * POST /api/admin/flagging/manual-flag
 * Manually flag a user for review
 */
router.post("/manual-flag", requireAdmin, async (req, res) => {
  try {
    const { userId, reason, severity } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: "userId et reason requis" });
    }

    // Analyze user first
    const analysis = await analyzeUserRelationships(userId, 2);

    // Create manual flag rule
    const manualRule: FlaggingRule = {
      id: "manual",
      name: "Manual Flag",
      description: reason,
      conditions: {},
      action: "flag",
      autoExecute: false,
    };

    const flag = await flagUserForReview(userId, analysis, manualRule);

    res.json({
      success: true,
      message: "Utilisateur signalé avec succès",
      flag,
    });
  } catch (error: any) {
    flaggingLogger.error("Error manually flagging user:", error);
    res
      .status(500)
      .json({ error: "Erreur lors du signalement de l'utilisateur" });
  }
});

/**
 * POST /api/admin/flagging/ban-related/:userId
 * Ban a user and automatically scan/flag their related users
 */
router.post("/ban-related/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { reason } = req.body;

    // Ban the user
    await storage.updateUser(userId, {
      role: "banned",
      bio: "COMPTE DÉSACTIVÉ : Compte banni par un modérateur.",
    });

    await storage.createModerationLog({
      userId,
      action: "ban",
      reason: reason || "Banni par modérateur",
      details: "Banni manuellement via API de flagging",
      score: 10,
    });

    flaggingLogger.info(`User ${userId} banned, scanning related users...`);

    // Automatically scan and flag related users
    const flags = await scanAndFlagRelatedUsers(userId);

    res.json({
      success: true,
      message: `Utilisateur banni. ${flags.length} utilisateurs liés signalés.`,
      flags,
    });
  } catch (error: any) {
    flaggingLogger.error("Error banning user and scanning related:", error);
    res.status(500).json({ error: "Erreur lors du bannissement et du scan" });
  }
});

/**
 * GET /api/admin/flagging/rules
 * Get current flagging rules
 */
router.get("/rules", requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      rules: DEFAULT_FLAGGING_RULES,
    });
  } catch (error: any) {
    flaggingLogger.error("Error getting rules:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des règles" });
  }
});

/**
 * GET /api/admin/flagging/stats
 * Get flagging statistics
 */
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const allFlags = await getFlaggedUsers();
    const criticalFlags = allFlags.filter((f) => f.severity === "critical");
    const highFlags = allFlags.filter((f) => f.severity === "high");
    const mediumFlags = allFlags.filter((f) => f.severity === "medium");
    const lowFlags = allFlags.filter((f) => f.severity === "low");

    res.json({
      success: true,
      stats: {
        total: allFlags.length,
        critical: criticalFlags.length,
        high: highFlags.length,
        medium: mediumFlags.length,
        low: lowFlags.length,
      },
    });
  } catch (error: any) {
    flaggingLogger.error("Error getting stats:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des statistiques" });
  }
});

export default router;
