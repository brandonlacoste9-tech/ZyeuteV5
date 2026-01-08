/**
 * TI-Guy Multi-Model Integration
 * Uses Gemini 3 Pro, DeepSeek R1, and Copilot to generate responses
 * Compares and selects the best response or aggregates them
 */

import { routeMultiModel, callSingleModel, type AIProvider } from "./multi-model-router.js";
import { compareAllModels, recommendModel } from "./multi-model-comparison.js";
import { logger } from "../utils/logger.js";
import type { ContentGenerationRequest, ContentGenerationResponse } from "./vertex-service.js";

export interface TIGuyMultiModelOptions {
  strategy?: "best" | "consensus" | "first" | "all" | "compare";
  providers?: AIProvider[];
  compareMode?: boolean; // If true, returns comparison of all models
}

/**
 * Generate TI-Guy response using multiple AI models
 */
export async function generateWithTIGuyMultiModel(
  request: ContentGenerationRequest,
  options: TIGuyMultiModelOptions = {}
): Promise<ContentGenerationResponse & {
  metadata?: {
    providers: AIProvider[];
    primaryProvider: AIProvider;
    strategy: string;
    consensus?: number;
    comparison?: any;
  };
}> {
  const { mode, message, context = "", language = "auto" } = request;
  const {
    strategy = "best",
    providers = ["gemini-3-pro", "deepseek-r1", "copilot"],
    compareMode = false,
  } = options;

  try {
    // Select appropriate prompt
    const systemPrompt =
      mode === "customer_service"
        ? `You are TI-GUY, the customer service AI for Zyeuté, a Quebec social media platform. You are a helpful beaver 🦫 who speaks in Quebec French and English.

CUSTOMER SERVICE MODE:
- Provide friendly, helpful support in French and English
- Explain platform features clearly
- Troubleshoot common issues
- Escalate complex problems to human support
- Use Quebec expressions politely: "c'est facile", "pas de trouble", "on va arranger ça"
- Reference Quebec culture positively
- Always offer to help further

User query: ${message}
Platform context: Social media app for Quebec community, features include posts, stories, fire reactions, hive system, premium subscriptions.`
        : `You are TI-GUY, the official mascot of Zyeuté, a Quebec social media platform. You are a friendly beaver 🦫 who speaks in Quebec French slang (joual) and English.

CONTENT CREATION MODE:
- Generate culturally relevant Quebec content
- Use Quebec expressions: "c'est malade", "tiguidou", "tabarnak", "câlice"
- Reference Quebec culture: poutine, hockey, maple syrup, winters, Montreal
- Create engaging social media posts, captions, and articles
- Maintain fun, friendly personality
- Always end responses with Quebec pride emoji 🇨🇦

Current context: ${context}
User request: ${message}`;

    // If compare mode, get detailed comparison
    if (compareMode || strategy === "compare") {
      const comparison = await compareAllModels(message, systemPrompt);
      
      return {
        content: comparison.responses.find(r => r.provider === comparison.winner)?.content || comparison.responses[0].content,
        mode,
        confidence: comparison.insights.consensus,
        language: language === "auto" ? detectLanguage(comparison.responses[0].content) : language,
        metadata: {
          providers: comparison.responses.map(r => r.provider),
          primaryProvider: comparison.winner,
          strategy: "compare",
          consensus: comparison.insights.consensus,
          comparison: {
            winner: comparison.winner,
            bestForSpeed: comparison.insights.bestForSpeed,
            bestForQuality: comparison.insights.bestForQuality,
            bestForCost: comparison.insights.bestForCost,
            responses: comparison.responses.map(r => ({
              provider: r.provider,
              quality: r.quality,
              performance: r.performance,
            })),
          },
        },
      };
    }

    // Use multi-model router
    const result = await routeMultiModel({
      prompt: message,
      systemInstruction: systemPrompt,
      temperature: mode === "customer_service" ? 0.3 : 0.7,
      maxTokens: 1024,
      providers,
      strategy: strategy as "best" | "consensus" | "first" | "all",
    });

    // Detect language
    const detectedLanguage = language === "auto" 
      ? detectLanguage(result.primary.content)
      : language;

    return {
      content: result.primary.content,
      mode,
      confidence: result.primary.confidence || 0.85,
      language: detectedLanguage,
      metadata: {
        providers: [result.primary.provider, ...(result.alternatives?.map(a => a.provider) || [])],
        primaryProvider: result.primary.provider,
        strategy,
        consensus: result.consensus?.agreement,
      },
    };
  } catch (error: any) {
    logger.error(`[TIGuyMultiModel] Error: ${error.message}`);

    // Fallback response
    const fallbackResponse =
      mode === "customer_service"
        ? "Désolé, j'ai eu un petit problème technique! 🦫 Un humain va t'aider bientôt. 🇨🇦"
        : "Oups! J'ai eu un bug en générant ça. Réessaie dans une minute! 🦫";

    return {
      content: fallbackResponse,
      mode,
      confidence: 0,
      language: "fr",
    };
  }
}

/**
 * Simple language detection
 */
function detectLanguage(text: string): "fr" | "en" {
  const frenchWords = ["le", "la", "les", "et", "à", "un", "une", "dans", "sur", "avec", "pour", "des", "qui", "que", "mais", "nous", "vous", "ils", "elles"];
  const englishWords = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "an", "a"];
  
  const words = text.toLowerCase().split(/\s+/);
  let frenchCount = 0;
  let englishCount = 0;
  
  words.forEach((word) => {
    if (frenchWords.includes(word)) frenchCount++;
    if (englishWords.includes(word)) englishCount++;
  });
  
  return frenchCount > englishCount ? "fr" : "en";
}

/**
 * Get response from specific provider (for testing/comparison)
 */
export async function generateWithSpecificProvider(
  request: ContentGenerationRequest,
  provider: AIProvider
): Promise<ContentGenerationResponse> {
  const { mode, message, context = "" } = request;
  
  const systemPrompt =
    mode === "customer_service"
      ? `You are TI-GUY, customer service AI for Zyeuté (Quebec social app). Help users politely in French/English.`
      : `You are TI-GUY, mascot of Zyeuté (Quebec social app). Create fun Quebec content in Joual.`;
  
  const result = await callSingleModel(provider, message, {
    systemInstruction: `${systemPrompt}\n\nContext: ${context}`,
    temperature: mode === "customer_service" ? 0.3 : 0.7,
    maxTokens: 1024,
  });
  
  return {
    content: result.content,
    mode,
    confidence: result.confidence || 0.85,
    language: detectLanguage(result.content),
  };
}
