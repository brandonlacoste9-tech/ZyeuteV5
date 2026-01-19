import { DeepSeekBot, BotMemory } from "../types";

// Local Swarm Adapter
export class DeepSeekClient {
  constructor(public config: any) {}

  async complete(prompt: string) {
    // Local Pivot: Use Ollama (Gemma 3)
    // Using generate endpoint for direct completion
    const OLLAMA_URL = process.env.OLLAMA_BASE_URL
      ? `${process.env.OLLAMA_BASE_URL}/api/generate`
      : "http://localhost:11434/api/generate";

    const model = process.env.OLLAMA_MODEL || "gemma3:12b";

    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: this.config.temperature || 0.7,
            num_ctx: 4096, // Ensure context fits
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Swarm] Ollama Error: ${res.status} - ${errText}`);
        return `Error: ${res.statusText}`;
      }

      const data = await res.json();
      return data.response as string;
    } catch (e: any) {
      console.error("[Swarm] LLM Connection Failed:", e.message);
      return "Error: Local Brain Offline.";
    }
  }
}

class SimpleMemory implements BotMemory {
  private history: string[] = [];
  constructor(private limit: number) {}
  addInteraction(input: string, output: string) {
    this.history.push(`Input: ${input}\nOutput: ${output}`);
    if (this.history.length > this.limit) this.history.shift();
  }
  getContext() {
    return this.history;
  }
}

const BOT_REGISTRY: Partial<DeepSeekBot>[] = [
  // STRATEGY BOTS
  {
    id: "priority-scorer",
    persona:
      "You are a ruthless priority algorithm. Evaluate tasks based on business impact, user value, and resource cost.",
    contextWindow: 8000,
    temperature: 0.1,
    costOptimized: true,
    capabilities: ["task_triage", "roi_calculation", "deadline_tracking"],
  },

  // EXECUTION BOTS
  {
    id: "api-refactor-bot",
    persona:
      "You are a senior backend engineer specializing in Node.js and TypeScript optimization.",
    contextWindow: 16000,
    temperature: 0.3,
    costOptimized: false,
    capabilities: [
      "code_refactoring",
      "performance_audit",
      "cache_implementation",
    ],
  },
  {
    id: "quebec-content-bot",
    persona:
      "You are a bilingual Québécois content creator who understands local culture and slang.",
    contextWindow: 32000,
    temperature: 0.7,
    costOptimized: true,
    capabilities: [
      "french_localization",
      "trend_analysis",
      "engagement_optimization",
    ],
  },

  // MONITOR BOTS
  {
    id: "health-monitor-bot",
    persona:
      "You are a system observability expert. You detect anomalies before they become problems.",
    contextWindow: 4000,
    temperature: 0.1,
    costOptimized: true,
    capabilities: ["metric_analysis", "alert_triage", "performance_tracking"],
  },
];

export class BotFactory {
  static createBot(botType: string): DeepSeekBot {
    const template = BOT_REGISTRY.find((b) => b.id === botType);
    if (!template) throw new Error(`Bot type ${botType} not found in registry`);

    return {
      id: template.id!,
      persona: template.persona!,
      contextWindow: template.contextWindow!,
      temperature: template.temperature!,
      costOptimized: template.costOptimized!,
      capabilities: template.capabilities!,
      client: new DeepSeekClient({
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: template.costOptimized ? "deepseek-chat" : "deepseek-coder",
        temperature: template.temperature,
        maxTokens: (template.contextWindow || 4000) / 2,
      }),
      memory: new SimpleMemory(1000),
    };
  }

  static spawnBotSwarm(taskRequirements: string[]): DeepSeekBot[] {
    return taskRequirements
      .map((req) => {
        const match = BOT_REGISTRY.find((b) => b.capabilities?.includes(req));
        return match ? this.createBot(match.id!) : null;
      })
      .filter((bot): bot is DeepSeekBot => bot !== null);
  }
}
