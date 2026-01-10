/**
 * 🐝 HIVE MIND API ROUTES
 *
 * New cost-optimized AI endpoints using the smart tier routing system
 * Replaces expensive DeepSeek calls with free Groq/Vertex alternatives
 */

import { Router } from "express";
import { hiveMindChat, getProviderStats, clearCache } from "../ai/hive-router.js";
import { getTiGuyPrompt } from "../ai/tiguy-personality.js";
import rateLimit from "express-rate-limit";

const router = Router();

// AI rate limiter - 30 requests per 15 minutes
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Trop de requêtes AI. Réessaie dans quelques minutes! 🦫" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/hive/chat
 *
 * Ti-Guy chat powered by Hive Mind router
 * Uses FREE Groq for 90% of requests, falls back to Vertex/DeepSeek
 */
router.post("/chat", aiRateLimiter, async (req, res) => {
  try {
    const { message, context, complexity } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get Ti-Guy personality prompt
    const systemPrompt = getTiGuyPrompt("CONTENT_CREATION");

    // Build full prompt with context
    const fullPrompt = context
      ? `Contexte: ${JSON.stringify(context)}\n\nUser: ${message}`
      : message;

    // Route through Hive Mind
    const response = await hiveMindChat({
      prompt: fullPrompt,
      systemPrompt,
      complexity: complexity || "low", // Most chat is low complexity
      maxTokens: 1000,
      temperature: 0.8,
    });

    res.json({
      response: response.content,
      metadata: {
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
        cached: response.cached,
        tokensUsed: response.tokensUsed,
      },
    });
  } catch (error: any) {
    console.error("❌ [HIVE CHAT] Error:", error);
    res.status(500).json({
      error: "Ti-Guy est temporairement indisponible. Réessaie dans quelques instants!",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/hive/generate-content
 *
 * Generate Quebec-focused content (captions, posts, ideas)
 * Routes to Vertex for complex generation, Groq for simple
 */
router.post("/generate-content", aiRateLimiter, async (req, res) => {
  try {
    const { type, theme, context } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Content type is required" });
    }

    const systemPrompt = `Tu es un expert en création de contenu pour les réseaux sociaux québécois.
Génère du contenu engageant, authentique, et culturellement pertinent pour le Québec.
Format: ${type}
Thème: ${theme || "général"}`;

    const prompt = `Génère du contenu ${type} pour Zyeuté.${theme ? ` Thème: ${theme}.` : ""}${context ? ` Contexte: ${context}` : ""}

Sois créatif, authentique, et utilise des références québécoises quand c'est approprié.`;

    const response = await hiveMindChat({
      prompt,
      systemPrompt,
      complexity: "medium", // Content generation needs more creativity
      maxTokens: 2000,
      temperature: 0.9, // More creative
    });

    res.json({
      content: response.content,
      type,
      theme,
      metadata: {
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
      },
    });
  } catch (error: any) {
    console.error("❌ [HIVE GENERATE] Error:", error);
    res.status(500).json({
      error: "Impossible de générer du contenu. Réessaie plus tard!",
    });
  }
});

/**
 * POST /api/hive/moderate
 *
 * Content moderation using free AI models
 * Uses Vertex for accuracy, falls back to Groq
 */
router.post("/moderate", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const systemPrompt = `Tu es un modérateur pour Zyeuté, réseau social québécois.
Analyse le contenu et détermine s'il respecte nos règles:
- Pas de harcèlement, discours haineux, ou violence
- Pas de contenu sexuel explicite
- Pas de désinformation dangereuse
- Respectueux de toutes les communautés

Réponds en JSON:
{
  "status": "approved" | "rejected" | "review",
  "reason": "raison si rejeté/en révision",
  "severity": "low" | "medium" | "high",
  "categories": ["violence", "sexual", "hate", "spam", etc.]
}`;

    const prompt = `Analyse ce contenu:\n\n"${content}"\n\nRéponds en JSON uniquement.`;

    const response = await hiveMindChat({
      prompt,
      systemPrompt,
      complexity: "high", // Moderation needs accuracy - use Vertex
      maxTokens: 500,
      temperature: 0.3, // Low temp for consistency
    });

    // Parse JSON response
    try {
      const modResult = JSON.parse(response.content);
      res.json(modResult);
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      res.json({
        status: "approved",
        reason: "Could not parse moderation result",
        severity: "low",
        categories: [],
      });
    }
  } catch (error: any) {
    console.error("❌ [HIVE MODERATE] Error:", error);
    // Fail safe - approve but flag for review
    res.json({
      status: "review",
      reason: "Moderation service unavailable",
      severity: "medium",
      categories: [],
    });
  }
});

/**
 * POST /api/hive/onboarding
 *
 * Personalized onboarding messages for new users
 */
router.post("/onboarding", async (req, res) => {
  try {
    const { step, userInfo } = req.body;

    const systemPrompt = getTiGuyPrompt("ONBOARDING");

    const prompt = `L'utilisateur est à l'étape "${step}" de son onboarding.${userInfo ? ` Info: ${JSON.stringify(userInfo)}` : ""}

Génère un message d'accueil chaleureux et engageant qui explique cette étape et encourage l'utilisateur à continuer.`;

    const response = await hiveMindChat({
      prompt,
      systemPrompt,
      complexity: "low",
      maxTokens: 500,
      temperature: 0.8,
    });

    res.json({
      message: response.content,
      step,
      provider: response.provider,
    });
  } catch (error: any) {
    console.error("❌ [HIVE ONBOARDING] Error:", error);
    res.status(500).json({
      error: "Erreur d'onboarding",
    });
  }
});

/**
 * GET /api/hive/stats
 *
 * Get current Hive Mind provider statistics
 * Useful for monitoring which AI services are available
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = getProviderStats();

    res.json({
      providers: {
        ollamaCloud: {
          available: stats.ollamaCloudAvailable,
          tier: "1",
          cost: "FREE",
          description: "Llama 3.1 70B - Cloud-hosted Ollama",
        },
        groq: {
          available: stats.groqAvailable,
          tier: "1",
          cost: "FREE",
          description: "Llama 3.3 70B - Fast chat",
        },
        vertex: {
          available: stats.vertexAvailable,
          tier: "2",
          cost: "CREDITS ($1,778)",
          description: "Gemini 1.5 Pro/Flash",
        },
        deepseek: {
          available: stats.deepseekAvailable,
          tier: "3",
          cost: "PAID (Last resort)",
          description: "DeepSeek R1",
        },
        ollamaLocal: {
          available: stats.ollamaLocalAvailable,
          tier: "0",
          cost: "FREE",
          description: "Local fallback",
        },
      },
      cache: {
        size: stats.cacheSize,
        ttl: "5 minutes",
      },
      recommendation: stats.ollamaCloudAvailable
        ? "Using FREE Ollama Cloud tier - optimal cost! 🚀"
        : stats.groqAvailable
        ? "Using FREE Groq tier - optimal cost! 🚀"
        : stats.vertexAvailable
        ? "Using Vertex credits - good! 💰"
        : "Warning: Using paid DeepSeek tier ⚠️",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * POST /api/hive/cache/clear
 *
 * Clear the response cache (admin only)
 */
router.post("/cache/clear", async (req, res) => {
  try {
    // TODO: Add admin auth check here
    clearCache();
    res.json({ success: true, message: "Cache cleared" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

/**
 * POST /api/hive/test
 *
 * Test endpoint for debugging Hive Mind routing
 */
router.post("/test", async (req, res) => {
  try {
    const { prompt, provider, complexity } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const response = await hiveMindChat({
      prompt,
      systemPrompt: getTiGuyPrompt(),
      complexity: complexity || "low",
      forceProvider: provider, // Can force specific provider for testing
    });

    res.json({
      success: true,
      response: response.content,
      metadata: {
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
        tokensUsed: response.tokensUsed,
        cached: response.cached,
      },
    });
  } catch (error: any) {
    console.error("❌ [HIVE TEST] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
