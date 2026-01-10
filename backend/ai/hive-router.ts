/**
 * 🐝 HIVE MIND ROUTER - Smart AI Tier System
 *
 * Priority routing to minimize costs while maximizing quality:
 * - TIER 0: Local Ollama (FREE, Emergency Fallback)
 * - TIER 1: Groq Llama 3.3 (FREE, 90% of requests)
 * - TIER 2: Vertex Gemini 1.5 (CREDITS $1,778, Complex tasks)
 * - TIER 3: DeepSeek R1 (PAID, 1% fallback only)
 *
 * Estimated Monthly Savings: $175-675 (70% reduction)
 */

import Groq from "groq-sdk";
import { VertexAI } from "@google-cloud/vertexai";
import { deepseek } from "./deepseek.js";
import { traced, addSpanAttributes } from "../tracer.js";

// Initialize Groq (FREE - https://console.groq.com)
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Initialize Vertex AI (CREDITS $1,778)
const vertex = process.env.GOOGLE_CLOUD_PROJECT
  ? new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.VERTEX_LOCATION || "us-central1",
    })
  : null;

// Task complexity levels
export type TaskComplexity = "low" | "medium" | "high";
export type AIProvider = "groq" | "vertex" | "deepseek" | "ollama";

export interface HiveMindRequest {
  prompt: string;
  systemPrompt?: string;
  complexity?: TaskComplexity;
  maxTokens?: number;
  temperature?: number;
  forceProvider?: AIProvider;
}

export interface HiveMindResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  cached?: boolean;
}

// Response cache for identical requests (5 minute TTL)
const responseCache = new Map<string, { response: HiveMindResponse; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from request
 */
function getCacheKey(request: HiveMindRequest): string {
  return `${request.complexity}:${request.prompt.substring(0, 100)}:${request.systemPrompt?.substring(0, 50)}`;
}

/**
 * Call local Ollama (TIER 0 - FREE Emergency Fallback)
 */
async function callLocalOllama(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";

  try {
    const response = await fetch(`${ollamaHost}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b", // Fast local model
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("❌ [OLLAMA] Failed:", error);
    throw new Error("All AI providers failed - Ollama unreachable");
  }
}

/**
 * Call Groq API (TIER 1 - FREE, Fast)
 */
async function callGroq(
  request: HiveMindRequest,
): Promise<HiveMindResponse> {
  if (!groq) {
    throw new Error("Groq API key not configured");
  }

  const startTime = Date.now();

  try {
    const response = await groq.chat.completions.create({
      messages: [
        ...(request.systemPrompt
          ? [{ role: "system" as const, content: request.systemPrompt }]
          : []),
        { role: "user" as const, content: request.prompt },
      ],
      model: "llama-3.3-70b-versatile", // FREE, fastest
      temperature: request.temperature ?? 0.8,
      max_tokens: request.maxTokens ?? 2000,
    });

    const content = response.choices[0]?.message?.content || "";

    return {
      content,
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      tokensUsed: response.usage?.total_tokens,
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("❌ [GROQ] Failed:", error.message);
    throw error;
  }
}

/**
 * Call Vertex AI (TIER 2 - CREDITS $1,778)
 */
async function callVertex(
  request: HiveMindRequest,
): Promise<HiveMindResponse> {
  if (!vertex) {
    throw new Error("Vertex AI not configured");
  }

  const startTime = Date.now();

  try {
    // Use Pro for high complexity, Flash for medium
    const modelName = request.complexity === "high"
      ? "gemini-1.5-pro"
      : "gemini-1.5-flash";

    const model = vertex.getGenerativeModel({
      model: modelName,
      systemInstruction: request.systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: request.prompt }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.8,
        maxOutputTokens: request.maxTokens ?? 2000,
      },
    });

    const content = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      content,
      provider: "vertex",
      model: modelName,
      tokensUsed: result.response.usageMetadata?.totalTokenCount,
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("❌ [VERTEX] Failed:", error.message);
    throw error;
  }
}

/**
 * Call DeepSeek (TIER 3 - PAID, Last Resort)
 */
async function callDeepSeek(
  request: HiveMindRequest,
): Promise<HiveMindResponse> {
  const startTime = Date.now();

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        ...(request.systemPrompt
          ? [{ role: "system" as const, content: request.systemPrompt }]
          : []),
        { role: "user" as const, content: request.prompt },
      ],
      temperature: request.temperature ?? 0.8,
      max_tokens: request.maxTokens ?? 2000,
    });

    const content = response.choices[0]?.message?.content || "";

    return {
      content,
      provider: "deepseek",
      model: "deepseek-chat",
      tokensUsed: response.usage?.total_tokens,
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error("❌ [DEEPSEEK] Failed:", error.message);
    throw error;
  }
}

/**
 * 🐝 HIVE MIND ROUTER - Main Entry Point
 *
 * Intelligently routes AI requests through the most cost-effective provider
 * based on task complexity and provider availability.
 */
export async function hiveMindChat(
  request: HiveMindRequest,
): Promise<HiveMindResponse> {
  const complexity = request.complexity || "low";

  // Check cache first
  const cacheKey = getCacheKey(request);
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`✅ [CACHE HIT] Returning cached response`);
    return { ...cached.response, cached: true };
  }

  // Force specific provider if requested
  if (request.forceProvider) {
    let response: HiveMindResponse;

    switch (request.forceProvider) {
      case "groq":
        response = await callGroq(request);
        break;
      case "vertex":
        response = await callVertex(request);
        break;
      case "deepseek":
        response = await callDeepSeek(request);
        break;
      case "ollama":
        const content = await callLocalOllama(request.prompt, request.systemPrompt);
        response = {
          content,
          provider: "ollama",
          model: "llama3.1:8b",
          latencyMs: 0,
        };
        break;
    }

    // Cache the response
    responseCache.set(cacheKey, {
      response,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return response;
  }

  // SMART ROUTING LOGIC
  try {
    // LOW COMPLEXITY (90% of requests) → GROQ (FREE)
    if (complexity === "low" && groq) {
      console.log(`🚀 [TIER 1] Routing to Groq (FREE)`);
      const response = await callGroq(request);
      responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
      return response;
    }

    // MEDIUM COMPLEXITY → VERTEX FLASH (CREDITS)
    if (complexity === "medium" && vertex) {
      console.log(`🧠 [TIER 2] Routing to Vertex Flash (CREDITS)`);
      const response = await callVertex(request);
      responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
      return response;
    }

    // HIGH COMPLEXITY → VERTEX PRO (CREDITS)
    if (complexity === "high" && vertex) {
      console.log(`🎯 [TIER 2] Routing to Vertex Pro (CREDITS)`);
      const response = await callVertex(request);
      responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
      return response;
    }

    // FALLBACK 1: Try Groq if Vertex unavailable
    if (groq) {
      console.warn(`⚠️ [FALLBACK] Vertex unavailable, using Groq`);
      const response = await callGroq(request);
      responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
      return response;
    }

    // FALLBACK 2: DeepSeek (PAID - last resort before Ollama)
    console.warn(`⚠️ [FALLBACK] Free tiers unavailable, using DeepSeek (PAID)`);
    const response = await callDeepSeek(request);
    responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
    return response;

  } catch (error) {
    // TIER 0: Emergency Ollama fallback
    console.error(`❌ All cloud providers failed, falling back to Local Ollama...`);

    const content = await callLocalOllama(request.prompt, request.systemPrompt);
    const response: HiveMindResponse = {
      content,
      provider: "ollama",
      model: "llama3.1:8b",
      latencyMs: 0,
    };

    responseCache.set(cacheKey, { response, expiresAt: Date.now() + CACHE_TTL });
    return response;
  }
}

/**
 * Get current provider statistics
 */
export function getProviderStats() {
  return {
    groqAvailable: !!groq,
    vertexAvailable: !!vertex,
    deepseekAvailable: !!process.env.DEEPSEEK_API_KEY,
    cacheSize: responseCache.size,
  };
}

/**
 * Clear response cache (useful for testing)
 */
export function clearCache() {
  responseCache.clear();
  console.log("🧹 Response cache cleared");
}
