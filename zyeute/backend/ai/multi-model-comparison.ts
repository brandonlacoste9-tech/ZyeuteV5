/**
 * Multi-Model Comparison Service
 * Compares responses from Gemini 3 Pro, DeepSeek R1, and Copilot
 * Provides insights on which model performs best for different tasks
 */

import { routeMultiModel, type MultiModelResponse, type AIProvider } from "./multi-model-router.js";
import { logger } from "../utils/logger.js";

export interface ComparisonResult {
  responses: {
    provider: AIProvider;
    content: string;
    quality: {
      length: number;
      coherence: number; // 0-1
      relevance: number; // 0-1
      creativity: number; // 0-1
    };
    performance: {
      latency: number;
      tokensUsed: number;
      cost: number; // Estimated cost
    };
  }[];
  winner: AIProvider;
  insights: {
    bestForSpeed: AIProvider;
    bestForQuality: AIProvider;
    bestForCost: AIProvider;
    consensus: number; // How much they agree (0-1)
  };
}

/**
 * Analyze response quality (simple heuristics)
 */
function analyzeQuality(content: string): {
  coherence: number;
  relevance: number;
  creativity: number;
} {
  // Simple heuristics - could be enhanced with actual quality models
  
  // Coherence: Check for sentence structure, punctuation
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    : 0;
  const coherence = Math.min(1, avgSentenceLength / 20); // Optimal ~15-20 words per sentence
  
  // Relevance: Check for Quebec-specific terms (for Zyeuté context)
  const quebecTerms = ["quebec", "montreal", "poutine", "hockey", "hiver", "joual", "tabarnak"];
  const lowerContent = content.toLowerCase();
  const relevance = Math.min(1, quebecTerms.filter(term => lowerContent.includes(term)).length / 3);
  
  // Creativity: Check for variety in vocabulary
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const uniqueWords = new Set(words).size;
  const creativity = Math.min(1, uniqueWords / Math.max(1, words.length) * 2); // Higher unique word ratio = more creative
  
  return { coherence, relevance, creativity };
}

/**
 * Estimate cost per provider
 */
function estimateCost(provider: AIProvider, tokensUsed: number): number {
  // Rough cost estimates (per 1K tokens)
  const costs: Record<AIProvider, number> = {
    "gemini-3-pro": 0.001, // Free tier available
    "deepseek-r1": 0.00014, // Very cheap
    "copilot": 0.03, // More expensive
  };
  
  return (tokensUsed / 1000) * (costs[provider] || 0.001);
}

/**
 * Compare responses from all three models
 */
export async function compareAllModels(
  prompt: string,
  systemInstruction?: string
): Promise<ComparisonResult> {
  logger.info("[MultiModelComparison] Comparing all 3 models...");
  
  const result = await routeMultiModel({
    prompt,
    systemInstruction,
    providers: ["gemini-3-pro", "deepseek-r1", "copilot"],
    strategy: "all", // Get all responses for comparison
  });
  
  const allResponses = [result.primary, ...(result.alternatives || [])];
  
  const analyzed = allResponses.map(response => {
    const quality = analyzeQuality(response.content);
    const cost = estimateCost(response.provider, response.tokensUsed || 0);
    
    return {
      provider: response.provider,
      content: response.content,
      quality: {
        length: response.content.length,
        ...quality,
      },
      performance: {
        latency: response.latency || 0,
        tokensUsed: response.tokensUsed || 0,
        cost,
      },
    };
  });
  
  // Determine winners
  const bestForSpeed = analyzed.reduce((best, current) =>
    current.performance.latency < best.performance.latency ? current : best
  ).provider;
  
  const bestForQuality = analyzed.reduce((best, current) => {
    const currentScore = current.quality.coherence + current.quality.relevance + current.quality.creativity;
    const bestScore = best.quality.coherence + best.quality.relevance + best.quality.creativity;
    return currentScore > bestScore ? current : best;
  }).provider;
  
  const bestForCost = analyzed.reduce((best, current) =>
    current.performance.cost < best.performance.cost ? current : best
  ).provider;
  
  // Overall winner (balanced score)
  const scored = analyzed.map(r => ({
    ...r,
    score: (r.quality.coherence + r.quality.relevance + r.quality.creativity) / 3 * 0.6 +
           (1 - r.performance.latency / 10000) * 0.2 +
           (1 - r.performance.cost * 100) * 0.2,
  }));
  
  const winner = scored.reduce((best, current) =>
    current.score > best.score ? current : best
  ).provider;
  
  return {
    responses: analyzed,
    winner,
    insights: {
      bestForSpeed,
      bestForQuality,
      bestForCost,
      consensus: result.consensus?.agreement || 0,
    },
  };
}

/**
 * Get recommendation for which model to use based on task type
 */
export function recommendModel(taskType: "speed" | "quality" | "cost" | "balanced"): AIProvider {
  const recommendations: Record<string, AIProvider> = {
    speed: "deepseek-r1", // Typically fastest
    quality: "gemini-3-pro", // Best quality
    cost: "deepseek-r1", // Cheapest
    balanced: "gemini-3-pro", // Good balance
  };
  
  return recommendations[taskType] || "gemini-3-pro";
}
