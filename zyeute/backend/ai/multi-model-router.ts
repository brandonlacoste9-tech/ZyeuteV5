/**
 * Multi-Model AI Router
 * Routes requests across Gemini 3 Pro, DeepSeek R1, and Copilot
 * Compares responses and selects the best one or aggregates them
 */

import { logger } from "../utils/logger.js";
import { synapseBridge } from "../colony/synapse-bridge.js";
import { ollama } from "./ollama-service.js";

export type AIProvider = "gemini-3-pro" | "deepseek-r1" | "copilot" | "ollama";

export interface AIResponse {
  content: string;
  provider: AIProvider;
  confidence?: number;
  tokensUsed?: number;
  latency?: number;
  metadata?: Record<string, any>;
}

export interface MultiModelRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  providers?: AIProvider[]; // If not specified, uses all available
  strategy?: "best" | "consensus" | "first" | "all"; // How to handle multiple responses
}

export interface MultiModelResponse {
  primary: AIResponse;
  alternatives?: AIResponse[];
  strategy: string;
  consensus?: {
    agreement: number; // 0-1, how much the responses agree
    commonThemes: string[];
  };
}

/**
 * Call Gemini 3 Pro (Vertex AI)
 */
async function callGemini3Pro(
  prompt: string,
  options: { systemInstruction?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const startTime = Date.now();
  
  try {
    const { VertexAI } = await import("@google-cloud/vertexai");
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";
    
    let vertexAIConfig: any = { project, location };
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      vertexAIConfig.googleAuthOptions = { credentials };
    }
    
    const vertexAI = new VertexAI(vertexAIConfig);
    const model = vertexAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Using latest Gemini model
      systemInstruction: options.systemInstruction,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1024,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    
    return {
      content: text,
      provider: "gemini-3-pro",
      confidence: 0.9,
      tokensUsed,
      latency: Date.now() - startTime,
      metadata: {
        model: "gemini-2.0-flash-exp",
        finishReason: response.candidates?.[0]?.finishReason,
      },
    };
  } catch (error: any) {
    logger.error(`[MultiModelRouter] Gemini 3 Pro failed: ${error.message}`);
    throw error;
  }
}

/**
 * Call DeepSeek R1
 */
async function callDeepSeekR1(
  prompt: string,
  options: { systemInstruction?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY not configured");
    }
    
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: prompt });
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-reasoner", // DeepSeek R1 reasoning model
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek R1 API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const tokensUsed = data.usage?.total_tokens || 0;
    
    return {
      content,
      provider: "deepseek-r1",
      confidence: 0.85,
      tokensUsed,
      latency: Date.now() - startTime,
      metadata: {
        model: "deepseek-reasoner",
        finishReason: data.choices?.[0]?.finish_reason,
      },
    };
  } catch (error: any) {
    logger.error(`[MultiModelRouter] DeepSeek R1 failed: ${error.message}`);
    throw error;
  }
}

/**
 * Call Microsoft Copilot (via Azure OpenAI)
 */
async function callCopilot(
  prompt: string,
  options: { systemInstruction?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    if (!apiKey || !endpoint) {
      throw new Error("Azure OpenAI not configured (AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT required)");
    }
    
    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: prompt });
    
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Copilot API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const tokensUsed = data.usage?.total_tokens || 0;
    
    return {
      content,
      provider: "copilot",
      confidence: 0.88,
      tokensUsed,
      latency: Date.now() - startTime,
      metadata: {
        model: deployment,
        finishReason: data.choices?.[0]?.finish_reason,
      },
    };
  } catch (error: any) {
    logger.error(`[MultiModelRouter] Copilot failed: ${error.message}`);
    throw error;
  }
}

/**
 * Call Ollama (free cloud models)
 */
async function callOllama(
  prompt: string,
  options: { systemInstruction?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const startTime = Date.now();
  
  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: prompt });
    
    const response = await ollama.chat.completions.create({
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
    });
    
    const content = response.choices?.[0]?.message?.content || "";
    const tokensUsed = response.usage?.total_tokens || 0;
    
    return {
      content,
      provider: "ollama",
      confidence: 0.8, // Free model, slightly lower confidence
      tokensUsed,
      latency: Date.now() - startTime,
      metadata: {
        model: response.model,
        finishReason: response.choices?.[0]?.finish_reason || null,
      },
    };
  } catch (error: any) {
    logger.error(`[MultiModelRouter] Ollama failed: ${error.message}`);
    throw error;
  }
}

/**
 * Calculate consensus between multiple responses
 */
function calculateConsensus(responses: AIResponse[]): {
  agreement: number;
  commonThemes: string[];
} {
  if (responses.length < 2) {
    return { agreement: 1.0, commonThemes: [] };
  }
  
  // Simple word overlap as agreement metric
  const allWords = responses.map(r => 
    r.content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  
  const wordSets = allWords.map(words => new Set(words));
  const intersection = wordSets.reduce((acc, set) => {
    const result = new Set<string>();
    for (const word of set) {
      if (acc.has(word)) result.add(word);
    }
    return result;
  }, wordSets[0]);
  
  const union = wordSets.reduce((acc, set) => {
    for (const word of set) acc.add(word);
    return acc;
  }, new Set<string>());
  
  const agreement = union.size > 0 ? intersection.size / union.size : 0;
  
  // Extract common themes (words that appear in at least 2 responses)
  const wordCounts = new Map<string, number>();
  allWords.forEach(words => {
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });
  
  const commonThemes = Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([word]) => word)
    .slice(0, 10); // Top 10 common themes
  
  return { agreement, commonThemes };
}

/**
 * Select best response based on strategy
 */
function selectBestResponse(
  responses: AIResponse[],
  strategy: "best" | "consensus" | "first" | "all"
): { primary: AIResponse; alternatives?: AIResponse[] } {
  if (strategy === "first") {
    return { primary: responses[0] };
  }
  
  if (strategy === "all") {
    return { primary: responses[0], alternatives: responses.slice(1) };
  }
  
  if (strategy === "best") {
    // Score based on confidence, latency, and token efficiency
    const scored = responses.map(r => ({
      response: r,
      score: (r.confidence || 0.5) * 0.5 + 
             (r.latency ? Math.max(0, 1 - r.latency / 5000) : 0.5) * 0.3 +
             (r.tokensUsed ? Math.max(0, 1 - r.tokensUsed / 2000) : 0.5) * 0.2,
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return {
      primary: scored[0].response,
      alternatives: scored.slice(1).map(s => s.response),
    };
  }
  
  // Consensus strategy: pick response with highest agreement
  const consensus = calculateConsensus(responses);
  const scored = responses.map(r => ({
    response: r,
    score: (r.confidence || 0.5) + consensus.agreement * 0.3,
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return {
    primary: scored[0].response,
    alternatives: scored.slice(1).map(s => s.response),
  };
}

/**
 * Multi-Model Router
 * Calls multiple AI providers and aggregates/comparison results
 */
export async function routeMultiModel(
  request: MultiModelRequest
): Promise<MultiModelResponse> {
  const {
    prompt,
    systemInstruction,
    temperature,
    maxTokens,
    providers = ["gemini-3-pro", "deepseek-r1", "copilot", "ollama"],
    strategy = "best",
  } = request;
  
  logger.info(`[MultiModelRouter] Routing to ${providers.length} providers: ${providers.join(", ")}`);
  
  const providerMap: Record<AIProvider, (prompt: string, options: any) => Promise<AIResponse>> = {
    "gemini-3-pro": callGemini3Pro,
    "deepseek-r1": callDeepSeekR1,
    "copilot": callCopilot,
    "ollama": callOllama,
  };
  
  // Call all providers in parallel
  const promises = providers.map(async (provider) => {
    try {
      const fn = providerMap[provider];
      if (!fn) {
        throw new Error(`Unknown provider: ${provider}`);
      }
      return await fn(prompt, { systemInstruction, temperature, maxTokens });
    } catch (error: any) {
      logger.warn(`[MultiModelRouter] ${provider} failed: ${error.message}`);
      return null; // Return null for failed providers
    }
  });
  
  const results = await Promise.all(promises);
  const successfulResponses = results.filter((r): r is AIResponse => r !== null);
  
  if (successfulResponses.length === 0) {
    throw new Error("All AI providers failed");
  }
  
  // Select best response based on strategy
  const { primary, alternatives } = selectBestResponse(successfulResponses, strategy);
  
  // Calculate consensus if we have multiple responses
  const consensus = successfulResponses.length > 1 
    ? calculateConsensus(successfulResponses)
    : undefined;
  
  // Report to Colony OS
  await synapseBridge.publishEvent("ai.multi_model", {
    providers: successfulResponses.map(r => r.provider),
    primary: primary.provider,
    strategy,
    consensus: consensus?.agreement,
    timestamp: new Date().toISOString(),
  }).catch(err => logger.warn("Failed to report to Colony OS:", err));
  
  logger.info(`[MultiModelRouter] Selected ${primary.provider} as primary (${successfulResponses.length}/${providers.length} succeeded)`);
  
  return {
    primary,
    alternatives,
    strategy,
    consensus,
  };
}

/**
 * Quick single-model call (backward compatibility)
 */
export async function callSingleModel(
  provider: AIProvider,
  prompt: string,
  options?: { systemInstruction?: string; temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const providerMap: Record<AIProvider, (prompt: string, options: any) => Promise<AIResponse>> = {
    "gemini-3-pro": callGemini3Pro,
    "deepseek-r1": callDeepSeekR1,
    "copilot": callCopilot,
  };
  
  const fn = providerMap[provider];
  if (!fn) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  
  return await fn(prompt, options || {});
}
