import { QuebecContextEngine } from "./context-engine.js";
import { TiGuyPromptBuilder } from "./prompt-builder.js";
import { MemoryService } from "../../packages/kernel-node/src/lib/agents/MemoryService.js";
import { getMemoryQueue } from "../queue.js";

export class TiGuyUnified {
  private static instance: TiGuyUnified;
  private contextEngine: QuebecContextEngine;
  private promptBuilder: TiGuyPromptBuilder;
  private memory: MemoryService;

  private constructor() {
    this.contextEngine = new QuebecContextEngine();
    this.promptBuilder = new TiGuyPromptBuilder();
    this.memory = new MemoryService();
  }

  static getInstance(): TiGuyUnified {
    if (!TiGuyUnified.instance) {
      TiGuyUnified.instance = new TiGuyUnified();
    }
    return TiGuyUnified.instance;
  }

  /**
   * Generates the dynamic system prompt and static instructions.
   * Integrates Long-term Memory recall.
   */
  public async prepareInteraction(
    message: string,
    userId?: string,
  ): Promise<{
    staticInstructions: string;
    dynamicInstructions: string;
    contextSnapshot: any;
  }> {
    // 1. Analyze Context (Slang, Topic, etc.)
    const context = this.contextEngine.analyze(message);

    // 2. Recall Memory if userId is provided
    let memoryInsights = "";
    if (userId) {
      const memories = await this.memory.recall(userId, message);
      if (memories.length > 0) {
        memoryInsights = `\n\n[MÉMOIRE DU PASSÉ]\nTu te souviens de ces faits sur cet utilisateur:\n- ${memories.join("\n- ")}`;
      }
    }

    // 3. Build Prompts
    const staticInstructions = this.promptBuilder.getStaticInstructions();
    let dynamicInstructions = this.promptBuilder.build(context);

    // Inject memory into dynamic context
    dynamicInstructions += memoryInsights;

    return {
      staticInstructions,
      dynamicInstructions,
      contextSnapshot: context,
    };
  }

  /**
   * Stores a new memory snapshot for the user.
   * In a production swarm, this might use another LLM call to extract 'facts'.
   * For now, we store the interaction if it seems significant.
   */
  public async storeMemory(
    userId: string,
    userMessage: string,
    aiResponse: string,
  ) {
    // Simple heuristic: if message > 10 chars, it might be worth remembering
    if (userMessage.length < 10) return;

    // In the future, this would be:
    // const facts = await extractFacts(userMessage, aiResponse);
    // await this.memory.store(userId, facts);

    // For now, store the user's intent
    await this.memory.store(userId, `L'utilisateur a dit: "${userMessage}"`, 1);

    // 🚀 Trigger "Sleep Memory" Cycle (Memory Mining)
    try {
      const queue = getMemoryQueue();
      if (queue) {
        await queue.add(
          "memory-mining",
          {
            userId,
            reason: "interaction_cycle",
          },
          {
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
        console.log(
          `[TiGuyUnified] 🧠 Scheduled memory miner for user ${userId}`,
        );
      }
    } catch (error) {
      console.error("[TiGuyUnified] Failed to schedule miner:", error);
    }
  }
}
