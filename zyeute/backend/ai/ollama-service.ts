/**
 * Ollama API Client (Fetch-based)
 * Free cloud-based Ollama models integration
 * Supports gemini-3-flash-preview:cloud and other Ollama models
 */

import { logger } from "../utils/logger.js";

const OLLAMA_API_BASE = process.env.OLLAMA_API_BASE || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || "gemini-3-flash-preview:cloud";

/**
 * Available Ollama models in your system
 * Includes both existing and new cloud models
 */
export const AVAILABLE_OLLAMA_MODELS = {
  // === EXISTING MODELS ===
  // Cloud models (free, fast)
  "gemini-3-flash-preview:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Fast responses, general chat, content generation",
    tags: ["fast", "general"],
  },
  "gemini-3-pro-preview:cloud": {
    type: "cloud",
    size: "-",
    useCase: "SOTA reasoning, multimodal, agentic tasks, vibe coding - Most intelligent model",
    tags: ["reasoning", "multimodal", "agentic", "premium"],
    priority: "high",
  },
  "gpt-oss:120b-cloud": {
    type: "cloud",
    size: "-",
    useCase: "High-capacity reasoning, complex tasks",
    tags: ["reasoning", "large"],
  },
  "gpt-oss:20b-cloud": {
    type: "cloud",
    size: "-",
    useCase: "Balanced performance, good for most tasks",
    tags: ["balanced", "general"],
  },
  "deepseek-v3.1:671b-cloud": {
    type: "cloud",
    size: "-",
    useCase: "Advanced reasoning, code generation, math, thinking mode",
    tags: ["reasoning", "code", "thinking"],
  },
  "deepseek-v3.2:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Newer version - harmonizes efficiency with superior reasoning and agent performance",
    tags: ["reasoning", "agentic", "latest"],
  },
  // Local models (downloaded)
  "llama3.1:8b": {
    type: "local",
    size: "4.9 GB",
    useCase: "Local fast inference, offline use",
    tags: ["local", "offline"],
  },
  "llama3.2:latest": {
    type: "local",
    size: "2.0 GB",
    useCase: "Latest Llama, good balance of speed/quality",
    tags: ["local", "balanced"],
  },
  "brandonlacoste9/zyeuteV8:latest": {
    type: "local",
    size: "2.0 GB",
    useCase: "Custom Zyeuté fine-tuned model - optimized for Quebec/your use case",
    priority: "high", // Custom model gets priority
    memoryRequired: "15.9 GiB",
    tags: ["custom", "quebec", "persona"],
  },
  
  // === NEW PREMIUM MODELS ===
  // Advanced Agentic Models
  "nemotron-3-nano:cloud": {
    type: "cloud",
    size: "30b",
    useCase: "Efficient, open agentic models - Standard for intelligent agents",
    tags: ["agentic", "efficient", "tools"],
  },
  "devstral-2:cloud": {
    type: "cloud",
    size: "123b",
    useCase: "Code exploration, multi-file editing, software engineering agents",
    tags: ["code", "tools", "engineering"],
    priority: "high",
  },
  "devstral-small-2:cloud": {
    type: "cloud",
    size: "24b",
    useCase: "Lightweight code/tool use - Good balance for coding tasks",
    tags: ["code", "tools", "efficient"],
  },
  // Vision & Multimodal
  "qwen3-vl:cloud": {
    type: "cloud",
    size: "2b/4b/8b/30b/32b/235b",
    useCase: "Most powerful vision-language model - Image understanding",
    tags: ["vision", "multimodal", "tools"],
    priority: "high",
  },
  "ministral-3:cloud": {
    type: "cloud",
    size: "3b/8b/14b",
    useCase: "Edge deployment, vision, tools - Runs on wide hardware range",
    tags: ["vision", "tools", "edge"],
  },
  // Coding Specialists
  "qwen3-coder:cloud": {
    type: "cloud",
    size: "30b/480b",
    useCase: "Long context models for agentic and coding tasks",
    tags: ["code", "long-context", "agentic"],
  },
  "rnj-1:cloud": {
    type: "cloud",
    size: "8b",
    useCase: "Code and STEM optimized - 8B parameter dense model",
    tags: ["code", "stem", "efficient"],
  },
  "glm-4.7:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Advancing coding capability",
    tags: ["code", "latest"],
  },
  // Agentic & Reasoning
  "glm-4.6:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Advanced agentic, reasoning and coding capabilities",
    tags: ["agentic", "reasoning", "code"],
  },
  "kimi-k2:cloud": {
    type: "cloud",
    size: "-",
    useCase: "MoE model for coding agent tasks - Significant improvements on benchmarks",
    tags: ["code", "agentic", "moe"],
  },
  "kimi-k2-thinking:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Best open-source thinking model - Moonshot AI",
    tags: ["thinking", "reasoning"],
  },
  "qwen3-next:cloud": {
    type: "cloud",
    size: "80b",
    useCase: "Parameter efficient, strong inference speed, thinking mode",
    tags: ["thinking", "efficient", "tools"],
  },
  // Production & Enterprise
  "mistral-large-3:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Production-grade multimodal MoE for enterprise workloads",
    tags: ["production", "enterprise", "multimodal"],
  },
  "minimax-m2:cloud": {
    type: "cloud",
    size: "-",
    useCase: "High-efficiency for coding and agentic workflows",
    tags: ["code", "agentic", "efficient"],
  },
  "minimax-m2.1:cloud": {
    type: "cloud",
    size: "-",
    useCase: "Exceptional multilingual capabilities for code engineering",
    tags: ["code", "multilingual", "latest"],
  },
  // Efficient Models
  "gemma3:cloud": {
    type: "cloud",
    size: "270m/1b/4b/12b/27b",
    useCase: "Most capable model that runs on a single GPU",
    tags: ["efficient", "single-gpu"],
  },
  "cogito-2.1:cloud": {
    type: "cloud",
    size: "671b",
    useCase: "MIT licensed commercial use - Instruction tuned generative model",
    tags: ["open-source", "commercial", "large"],
  },
} as const;

export type OllamaModelName = keyof typeof AVAILABLE_OLLAMA_MODELS;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  format?: "json" | "text";
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: "assistant";
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Convert messages to Ollama format
 */
function convertMessages(messages: ChatMessage[]): {
  messages: Array<{ role: string; content: string }>;
  system?: string;
} {
  // Extract system message if present
  const systemMessages = messages.filter((m) => m.role === "system");
  const otherMessages = messages.filter((m) => m.role !== "system");

  return {
    messages: otherMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    system: systemMessages.length > 0 ? systemMessages[0].content : undefined,
  };
}

/**
 * Generate with automatic failover from cloud to local models
 */
async function generateWithFailover(
  prompt: string,
  options?: {
    model?: string;
    system?: string;
    temperature?: number;
    max_tokens?: number;
    format?: "json" | "text";
  }
): Promise<string> {
  const model = options?.model || DEFAULT_MODEL;
  
  try {
    return await ollama.generate(prompt, options);
  } catch (error: any) {
    // If cloud model fails and we have a local fallback, try it
    if (model.includes(":cloud") && !options?.model?.includes("llama")) {
      logger.warn(
        `[Ollama] Cloud model ${model} failed (${error.message}). Falling back to local Llama...`
      );
      
      try {
        return await ollama.generate(prompt, {
          ...options,
          model: "llama3.2:latest", // Local fallback
        });
      } catch (fallbackError: any) {
        logger.error(`[Ollama] Local fallback also failed: ${fallbackError.message}`);
        throw new Error(
          `Both cloud and local models failed. Cloud: ${error.message}, Local: ${fallbackError.message}`
        );
      }
    }
    
    // Re-throw if not a cloud model or fallback already attempted
    throw error;
  }
}

/**
 * Ollama API client with OpenAI-compatible interface
 */
export const ollama = {
  chat: {
    completions: {
      create: async (options: CompletionOptions): Promise<{
        id: string;
        object: string;
        created: number;
        model: string;
        choices: Array<{
          index: number;
          message: {
            role: "assistant";
            content: string;
          };
          finish_reason: string | null;
        }>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      }> => {
        const model = options.model || DEFAULT_MODEL;
        const { messages: ollamaMessages, system } = convertMessages(options.messages);

        const maxRetries = 3;
        let lastError: any;

        for (let i = 0; i < maxRetries; i++) {
          try {
            // Ollama uses /api/chat endpoint
            const response = await fetch(`${OLLAMA_API_BASE}/api/chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                messages: ollamaMessages,
                system,
                stream: options.stream || false,
                options: {
                  temperature: options.temperature ?? 0.7,
                  num_predict: options.max_tokens,
                  format: options.format === "json" ? "json" : undefined,
                },
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Ollama API Error ${response.status}: ${errorText}`,
              );
            }

            const data: OllamaChatResponse = await response.json();

            // Convert Ollama response to OpenAI-compatible format
            const created = Math.floor(Date.now() / 1000);
            return {
              id: `ollama-${Date.now()}`,
              object: "chat.completion",
              created,
              model: data.model,
              choices: [
                {
                  index: 0,
                  message: {
                    role: "assistant",
                    content: data.message.content,
                  },
                  finish_reason: data.done ? "stop" : null,
                },
              ],
              usage: data.prompt_eval_count && data.eval_count ? {
                prompt_tokens: data.prompt_eval_count,
                completion_tokens: data.eval_count,
                total_tokens: data.prompt_eval_count + data.eval_count,
              } : undefined,
            };
          } catch (err: any) {
            lastError = err;
            logger.warn(`[Ollama] Attempt ${i + 1} failed: ${err.message}`);
            
            if (i < maxRetries - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * Math.pow(2, i)),
              ); // Exponential backoff
            }
          }
        }

        throw lastError;
      },
    },
  },
  /**
   * Generate text using Ollama (simpler interface)
   * Includes automatic failover from cloud to local models
   */
  generate: async (
    prompt: string,
    options?: {
      model?: string;
      system?: string;
      temperature?: number;
      max_tokens?: number;
      format?: "json" | "text";
      enableFailover?: boolean; // Default: true
    }
  ): Promise<string> => {
    const model = options?.model || DEFAULT_MODEL;
    const enableFailover = options?.enableFailover !== false; // Default to true

    const messages: ChatMessage[] = [];
    if (options?.system) {
      messages.push({ role: "system", content: options.system });
    }
    messages.push({ role: "user", content: prompt });

    try {
      const response = await ollama.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
        format: options?.format,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      // Sovereign Failover Logic
      if (enableFailover) {
        const isCloudModel = model.includes(":cloud");
        const isLocalModel = !isCloudModel;
        
        // If local model fails (memory issues), fall back to cloud
        if (isLocalModel && error.message.includes("memory")) {
          logger.warn(
            `[Ollama] ⚠️ Local model ${model} failed (memory). Stinging to cloud Gemini...`
          );
          
          try {
            const fallbackModel = "gemini-3-flash-preview:cloud";
            logger.info(`[Ollama] 🔄 Attempting cloud failover to ${fallbackModel}`);
            
            const response = await ollama.chat.completions.create({
              model: fallbackModel,
              messages,
              temperature: options?.temperature,
              max_tokens: options?.max_tokens,
              format: options?.format,
            });

            logger.info(`[Ollama] ✅ Cloud failover successful - using ${fallbackModel}`);
            return response.choices[0]?.message?.content || "";
          } catch (fallbackError: any) {
            logger.error(
              `[Ollama] ❌ Cloud failover also failed: ${fallbackError.message}`
            );
            throw new Error(
              `Sovereign Failover exhausted. Local: ${error.message}, Cloud: ${fallbackError.message}`
            );
          }
        }
        
        // If cloud model fails, fall back to local (if available)
        if (isCloudModel) {
          logger.warn(
            `[Ollama] ⚠️ Cloud model ${model} failed. Attempting local fallback...`
          );
          
          // Try smaller local models first (they're more likely to work)
          const fallbackModels = ["llama3.1:8b", "llama3.2:latest"];
          
          for (const fallbackModel of fallbackModels) {
            try {
              logger.info(`[Ollama] 🔄 Attempting local failover to ${fallbackModel}`);
              
              const response = await ollama.chat.completions.create({
                model: fallbackModel,
                messages,
                temperature: options?.temperature,
                max_tokens: options?.max_tokens,
                format: options?.format,
              });

              logger.info(`[Ollama] ✅ Local failover successful - using ${fallbackModel}`);
              return response.choices[0]?.message?.content || "";
            } catch (fallbackError: any) {
              // Try next fallback model
              logger.warn(
                `[Ollama] ${fallbackModel} failed: ${fallbackError.message}. Trying next...`
              );
              continue;
            }
          }
          
          // All fallbacks exhausted
          logger.error(`[Ollama] ❌ All fallback models failed`);
          throw new Error(
            `Sovereign Failover exhausted. Cloud: ${error.message}, All local fallbacks failed.`
          );
        }
      }
      
      // Re-throw if failover disabled or not a cloud model
      throw error;
    }
  },
  
};

/**
 * Check if Ollama service is available
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available Ollama models
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_API_BASE}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error: any) {
    logger.error(`[Ollama] Failed to list models: ${error.message}`);
    return [];
  }
}

/**
 * Select best Ollama model for a use case
 */
export function selectOllamaModel(useCase: {
  priority?: "speed" | "quality" | "cost" | "balance";
  requiresLocal?: boolean;
  task?: "chat" | "reasoning" | "code" | "creative" | "quebec" | "vision" | "image" | "agentic" | "tools";
}): string {
  const { priority = "balance", requiresLocal = false, task = "chat" } = useCase;

  // Custom Zyeuté model for Quebec-specific tasks
  // Note: Falls back to cloud Gemini if local model has memory issues
  if (task === "quebec" || task === "creative") {
    if (requiresLocal) {
      return "brandonlacoste9/zyeuteV8:latest";
    }
    // Try custom model, but will auto-failover to cloud if memory insufficient
    return "brandonlacoste9/zyeuteV8:latest";
  }

  // Code tasks - use specialized coding models
  if (task === "code") {
    if (!requiresLocal) {
      // Try devstral-2 first (best for code), fallback to devstral-small or qwen3-coder
      return "devstral-2:cloud"; // 123b - best for software engineering
    }
    return "rnj-1:cloud"; // 8b - efficient local code model
  }
  
  // Reasoning tasks - use thinking models
  if (task === "reasoning") {
    if (!requiresLocal) {
      // Use newest thinking/reasoning models
      return "kimi-k2-thinking:cloud"; // Best open-source thinking model
    }
    return "llama3.1:8b";
  }

  // Speed priority - use fastest cloud model
  if (priority === "speed") {
    return "gemini-3-flash-preview:cloud";
  }

  // Quality priority - use best reasoning models
  if (priority === "quality") {
    if (!requiresLocal) {
      // Use Gemini 3 Pro (SOTA reasoning) or DeepSeek v3.2
      return "gemini-3-pro-preview:cloud"; // Most intelligent, SOTA reasoning
    }
    return "llama3.1:8b";
  }
  
  // Vision tasks - use vision models
  if (task === "vision" || task === "image") {
    if (!requiresLocal) {
      return "qwen3-vl:cloud"; // Most powerful vision-language model
    }
    return "ministral-3:cloud"; // Edge deployment with vision
  }
  
  // Agentic tasks - use agentic models
  if (task === "agentic" || task === "tools") {
    if (!requiresLocal) {
      return "nemotron-3-nano:cloud"; // Standard for intelligent agents
    }
    return "llama3.2:latest";
  }

  // Cost priority - use free cloud models
  if (priority === "cost") {
    return "gemini-3-flash-preview:cloud";
  }

  // Balanced default
  if (!requiresLocal) {
    return "gpt-oss:20b-cloud"; // Good balance
  }
  
  return "llama3.2:latest"; // Local balanced model
}