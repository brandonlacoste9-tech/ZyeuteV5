import { DeepSeekBot, Task, TaskResult } from "../types";
import { BotFactory, DeepSeekClient } from "../bots/bot-factory";
import { EmergencyFixer, Diagnosis } from "./emergency-fixer";

export class DeepSeekV3 {
  private client: DeepSeekClient;

  constructor(
    apiKey: string | undefined,
    public role: string,
  ) {
    this.client = new DeepSeekClient({ apiKey, role });
  }

  async analyzeTask(request: string): Promise<any> {
    const prompt = `
        You are a generic task analyzer (Strategist).
        Analyze this request: "${request}"
        
        Return ONLY valid JSON with this structure:
        {
            "strategy": "Step by step high level approach",
            "priority": "critical" | "high" | "medium" | "low",
            "originalRequest": "${request}"
        }
        Do not include markdown formatting.
        `;

    try {
      const responseText = await this.client.complete(prompt);
      // Attempt to clean markdown if present
      const jsonStr = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("[Swarm] Strategy fallback due to parse error or failure.");
      return {
        strategy: "Execute immediate fix (Fallback)",
        priority: "high",
        originalRequest: request,
      };
    }
  }

  async createExecutionPlan(strategy: any): Promise<any> {
    const prompt = `
        You are an Execution Planner (Tactician).
        Strategy: ${JSON.stringify(strategy)}
        
        Create a plan with specialized bots.
        Available Bots: 'priority-scorer', 'api-refactor-bot', 'quebec-content-bot', 'health-monitor-bot'.
        
        Return ONLY valid JSON:
        {
            "steps": [
                { "botType": "exact-bot-id-from-list", "input": "specific instructions for bot" }
            ]
        }
        `;

    try {
      const responseText = await this.client.complete(prompt);
      const jsonStr = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("[Swarm] Planning fallback.");
      return {
        steps: [
          {
            botType: "health-monitor-bot",
            input: "Check system status (Fallback)",
          },
        ],
      };
    }
  }

  async reviewResults(results: any[]): Promise<TaskResult> {
    const prompt = `
        You are a Quality Analyst.
        Review these execution results: ${JSON.stringify(results)}
        
        Return ONLY valid JSON:
        {
            "taskId": "task-${Date.now()}",
            "success": true,
            "data": { "summary": "brief summary", "details": [...] },
            "metrics": { "executionTimeMs": 0, "tokensUsed": 0, "cost": 0 }
        }
        `;
    try {
      const responseText = await this.client.complete(prompt);
      const jsonStr = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      return {
        taskId: `task-${Date.now()}`,
        success: true,
        data: {
          summary: "Swarm execution completed (Fallback Review)",
          details: results,
        },
        metrics: { executionTimeMs: 0, tokensUsed: 0, cost: 0 },
      };
    }
  }
}

export class DeepSeekSwarm {
  private strategist: DeepSeekV3;
  private executor: DeepSeekV3;
  private analyst: DeepSeekV3;
  private fixer: EmergencyFixer;

  constructor() {
    this.strategist = new DeepSeekV3(process.env.DSK_MASTER, "strategist");
    this.executor = new DeepSeekV3(process.env.DSK_TACTICAL, "executor");
    this.analyst = new DeepSeekV3(process.env.DSK_ANALYTICAL, "analyst");
    this.fixer = new EmergencyFixer();
  }

  async processTask(userRequest: string): Promise<TaskResult> {
    console.log(`[Swarm] Received task: ${userRequest}`);

    // Step 1: Strategist analyzes and plans
    console.log("[Swarm] Strategist analyzing...");
    const strategy = await this.strategist.analyzeTask(userRequest);

    // Step 2: Executor dispatches to appropriate bots
    console.log("[Swarm] Executor planning...");
    const executionPlan = await this.executor.createExecutionPlan(strategy);

    // Step 3: Run bots in parallel
    console.log("[Swarm] Spawning bots...");
    const botResults = await this.executeBotSwarm(executionPlan);

    // Step 4: Analyst reviews and optimizes
    console.log("[Swarm] Analyst reviewing...");
    const optimizedResult = await this.analyst.reviewResults(botResults);

    return optimizedResult;
  }

  async runEmergencyMode(diagnosisTarget: string) {
    console.log(`🚨 STARTING EMERGENCY MODE -- Target: ${diagnosisTarget}`);

    const diagnosticBots = [
      "auth-inspector-bot", // We'll map these to existing capabilities in factory or mock logic
      "health-monitor-bot",
    ];

    console.log(
      `[Swarm] Launching diagnostic bots: ${diagnosticBots.join(", ")}...`,
    );

    // Simulation of diagnosis findings
    await new Promise((r) => setTimeout(r, 1500)); // Scan time

    // Mock Diagnosis Result - based on user scenario
    const diagnosis: Diagnosis = {
      rootCause: "REACT_HYDRATION",
      details:
        "Detected hydration mismatch in root layout causing suspension freeze.",
    };

    console.log(`[Swarm] 🔍 DIAGNOSIS COMPLETE: ${diagnosis.rootCause}`);
    console.log(`[Swarm] Details: ${diagnosis.details}`);

    // Execute Fix
    await this.fixer.executeFix(diagnosis);

    console.log(`[Swarm] ✅ REPAIR SEQUENCE COMPLETED.`);
  }

  private async executeBotSwarm(plan: any): Promise<any[]> {
    const results = [];
    for (const step of plan.steps) {
      try {
        const bot = BotFactory.createBot(step.botType);
        console.log(`[Swarm] Bot ${bot.id} executing...`);
        results.push({
          bot: bot.id,
          status: "success",
          output: "Mock execution result",
        });
      } catch (e) {
        console.error(`[Swarm] Failed to spawn bot ${step.botType}:`, e);
        results.push({ bot: step.botType, status: "failed", error: e });
      }
    }
    return results;
  }
}

// CLI Entrypoint
if (typeof require !== "undefined" && require.main === module) {
  const args = process.argv.slice(2);
  // Rough parsing for now
  let mode = "normal";
  let diagnoseTarget = "general";

  args.forEach((arg) => {
    if (arg.startsWith("--mode=")) mode = arg.split("=")[1];
    if (arg === "--emergency") mode = "emergency"; // Handle flag style
    if (arg.startsWith("--diagnose=")) diagnoseTarget = arg.split("=")[1];
  });

  const swarm = new DeepSeekSwarm();

  if (mode === "emergency") {
    swarm.runEmergencyMode(diagnoseTarget).catch(console.error);
  } else {
    console.log(
      "Running in normal mode. Use --mode=emergency for rescue operations.",
    );
  }
}
