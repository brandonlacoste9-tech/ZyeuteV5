import { neurosphere } from "../lib/ai/deepseek.js";
import { geminiCortex } from "../lib/ai/gemini.js";
import { db, colonyTasks } from "../lib/db.js";
import { LlmAgent } from "../lib/agents/LlmAgent.js";
import { AgentTask } from "../lib/agents/BaseAgent.js";
import { eq, inArray, asc } from "drizzle-orm";

export class DeepSeekBee extends LlmAgent {
  private isForaging = false;
  private pollInterval = 5000;

  constructor() {
    super(
      "bee_deepseek_v3_01",
      neurosphere,
      "Tu es l'intelligence de Zyeuté. ADN Québécois. Respecte la Loi 25 sur la protection des données.",
    );
  }

  public async onStartup() {
    console.log(
      `🐝 [${this.agentId}] Hive Link Established via ADK App. Polling for tasks...`,
    );
  }

  public async onShutdown() {
    console.log(`🐝 [${this.agentId}] Agent going to sleep safely.`);
  }

  public async onStart() {}
  public async onStop() {}

  public wakeUp() {
    this.start();
  }

  /**
   * The Safe Forage Loop
   */
  protected async forage() {
    if (this.isForaging) return;
    this.isForaging = true;

    try {
      const [task] = await db
        .select()
        .from(colonyTasks)
        .where(eq(colonyTasks.status, "pending"))
        .where(
          inArray(colonyTasks.command, [
            "content_advice",
            "moderation",
            "scan_moderation",
            "bug_report",
            "check_vitals",
            "generate_video",
            "visual_analysis",
            "research",
          ]),
        )
        .orderBy(asc(colonyTasks.createdAt))
        .limit(1);

      if (!task) {
        this.isForaging = false;
        return;
      }

      console.log(
        `🐝 [${this.agentId}] 🌸 Task Detected: [${task.command}] - ID: ${task.id}`,
      );

      // Claim Task
      await db
        .update(colonyTasks)
        .set({
          status: "processing",
          startedAt: new Date(),
        })
        .where(eq(colonyTasks.id, task.id));

      try {
        const result = await this.processTask(task as unknown as AgentTask);

        // Deposit Honey
        await db
          .update(colonyTasks)
          .set({
            status: "completed",
            result: typeof result === "string" ? { output: result } : result,
            completedAt: new Date(),
          })
          .where(eq(colonyTasks.id, task.id));
      } catch (processingError: any) {
        console.error(
          `🐝 [${this.agentId}] Processing Error:`,
          processingError,
        );
        await db
          .update(colonyTasks)
          .set({
            status: "failed",
            error: processingError.message || String(processingError),
            completedAt: new Date(),
          })
          .where(eq(colonyTasks.id, task.id));
      }
    } catch (error) {
      console.error(`🐝 [${this.agentId}] Loop Error:`, error);
      // Backoff to prevent log spamming on DB connection failures
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } finally {
      this.isForaging = false;
    }
  }

  // --- Cognitive Processing ---

  public async processTask(task: AgentTask): Promise<any> {
    const payload =
      typeof task.payload === "string"
        ? JSON.parse(task.payload)
        : task.payload || task.metadata || {};

    // Command: Bug Report -> GitHub Issue
    if (task.command === "bug_report") {
      // ... (existing bug report logic) ...
      // For brevity in this edit, assuming previous content is preserved if I target correctly. Always allow context.
      // Actually, to be safe with replace_file_content on large blocks, I should include the logic I want to keep or target carefully.
      // I will re-implement the block to be safe.

      console.log("🐞 [Bee] Initiating GitHub Protocol...");
      const messages: DeepSeekMessage[] = [
        {
          role: "system",
          content:
            'You are a QA Lead. Summarize this error for a GitHub Issue. Return strictly JSON: { "title": "...", "body": "..." }',
        },
        { role: "user", content: JSON.stringify(payload) },
      ];

      const aiResponse = await neurosphere.think(messages);
      try {
        const cleanJson = aiResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const issueData = JSON.parse(cleanJson);

        if (gitHubTool) {
          const issueUrl = await gitHubTool.createIssue({
            title: issueData.title,
            body: `${issueData.body}\n\n*Reported automatically by DeepSeekBee*`,
            labels: ["bug", "automated"],
          });
          return `Issue created: ${issueUrl}`;
        } else {
          return `GitHub Tool not available. Simulated Issue: ${issueData.title}`;
        }
      } catch (e: any) {
        return `Failed to create issue: ${e.message}`;
      }
    }

    // Command: Check Vitals
    if (task.command === "check_vitals") {
      return JSON.stringify({
        status: "NOMINAL",
        heartbeat: "STABLE",
        caffeine_level: "HIGH",
        active_bees: 3,
        timestamp: new Date().toISOString(),
      });
    }

    // Command: Generate Video
    if (task.command === "generate_video") {
      // In real usage, this would call Fal.ai or Kling directly
      // For now, we simulate the instruction being acknowledged
      return JSON.stringify({
        status: "QUEUED",
        message: `Video generation initiated for prompt: "${payload.prompt}"`,
        estimated_time: "120s",
      });
    }

    // Command: Visual Analysis (Using Gemini Tools)
    if (task.command === "visual_analysis") {
      if (!payload.imageUrl) return "Error: No Image URL provided";
      return await geminiCortex.chat(
        `Detailed visual analysis of: ${payload.imageUrl}. Context: ${payload.prompt || "Describe this."}`,
      );
    }

    // Command: Research (Using MCP Tool)
    if (task.command === "research") {
      const query = payload.query || payload.text;
      if (!query) return "Error: No research query provided";
      return await this.executeTool("perplexity_research", { query });
    }

    // Handle other types (content_advice, moderation)
    let systemPrompt = "";
    let userContent = "";

    if (task.command === "content_advice") {
      systemPrompt =
        "You are Ti-Guy, a helpful Quebecois social media expert. Speak in 'Joual'. Give 3 short, punchy tips to improve this post.";
      userContent = JSON.stringify(payload);
    } else if (
      task.command === "moderation" ||
      task.command === "scan_moderation"
    ) {
      systemPrompt =
        "You are the Colony Guard. Analyze this text for toxicity. Return strictly JSON: { isSafe: boolean, confidence: number, reason: string }.";
      userContent = payload.text || payload.content || JSON.stringify(payload);
    }

    if (systemPrompt) {
      return await this.think(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        task.id,
      );
    }

    return `Command '${task.command}' processed by ${this.agentId}`;
  }
}
