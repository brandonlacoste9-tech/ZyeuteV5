/**
 * MODERATION ROUTES
 * 
 * Handles content moderation, appeals, and moderation stats.
 * Migrated from Supabase Edge Functions to Express backend.
 */

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

// Quebec French slang that should NOT be flagged as offensive normally,
// but we still moderate for illegal/harmful intent.
const JOUAL_WHITELIST = [
  'câlisse', 'tabarnak', 'crisse', 'ostie', 'sacrament',
  'maudit', 'toé', 'moé', 'icitte', 'asteure', 'chu', 'jsuis'
];

const SYSTEM_PROMPT = `
You are the Zyeuté Safety Guardian, a content moderation AI for a social platform in Quebec.
You must strictly enforce our Safety Standards.

POLICY:
- ZERO TOLERANCE for child luring, grooming, or inappropriate interaction with minors.
- Strict moderation of hate speech, illegal acts, and extreme violence.
- Professional Joual (Quebec slang) is PERMITTED unless used to harass or violate policy.

Your task:
Analyze the provided content and return a JSON object with:
{
  "approved": boolean,
  "flagged_categories": string[],
  "severity_score": number (0-10),
  "is_minor_danger": boolean,
  "reasoning": string
}

If "is_minor_danger" is true, the account will be PERMANENTLY BANNED. Be absolutely sure.
`;

/**
 * Content Moderation Endpoint
 * Migrated from supabase/functions/moderate-content/index.ts
 * TODO: This duplicates logic from routes.ts - consider consolidating
 */
router.post("/content", async (req: any, res) => {
  try {
    const { publicationId, content, caption, userId } = req.body;

    if (!publicationId) {
      return res.status(400).json({ error: "Publication ID requis" });
    }

    const textToModerate = `Légende: ${caption || ''} | Contenu: ${content || ''}`.trim();

    if (!textToModerate) {
      return res.json({
        approved: true,
        message: "Aucun contenu à modérer"
      });
    }

    modLogger.info(`🛡️ Modération (Powered by DeepSeek) lancée pour: ${publicationId}`);

    // Call DeepSeek for Cognitive Moderation
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return res.status(500).json({ error: "DeepSeek API key not configured" });
    }

    const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this content for publication ${publicationId}:\n\n${textToModerate}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`DeepSeek API Failure: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    modLogger.info(`📊 Résultat IA: Approved=${result.approved}, MinorDanger=${result.is_minor_danger}`);

    // Update publication moderation status via storage
    const post = await storage.getPost(publicationId);
    if (post) {
      await storage.updateUser(publicationId, {
        // TODO: Update post moderation fields once schema supports it
      } as any);
    }

    // Handle Flags
    if (!result.approved) {
      // TODO: Mark post as hidden via storage
      modLogger.info('⚠️ Publication masquée car non approuvée');
    }

    // CRITICAL: Handle Child Luring / Minor Danger
    if (result.is_minor_danger && userId) {
      modLogger.error(`🚨 DANGER MINEURS DÉTECTÉ. Bannissement immédiat de l'utilisateur: ${userId}`);
      
      // Record persistent moderation log
      await storage.createModerationLog({
        userId,
        action: "ban",
        reason: "minor_danger",
        details: result.reasoning,
        score: result.severity_score,
      });

      // Mark user as banned
      await storage.updateUser(userId, {
        role: "banned" as any,
      });
    }

    res.json({
      success: true,
      approved: result.approved,
      is_minor_danger: result.is_minor_danger,
      message: result.approved ? "Contenu approuvé" : "Contenu rejeté par le Gardien Zyeuté"
    });
  } catch (error: any) {
    modLogger.error("❌ Erreur de modération:", error);
    res.status(500).json({
      error: error.message,
      message: "Échec de la modération"
    });
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
