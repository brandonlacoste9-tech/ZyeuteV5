/**
 * SwarmOrchestrator - The Queen Bee's Voice
 * The high-level bridge that allows the Queen Bee to command the MCP Hands
 * using Llama 4 Maverick's sovereign reasoning logic.
 *
 * This is the "Sovereign Directive" entry point for the Beekeeper.
 */

import { llamaToolLoop, type LlamaToolLoopStep } from "./ai/llama-maverick.js";
import { mcpClient, type McpTool } from "./mcp/client-bridge.js";

export interface SwarmTelemetry {
  unit: "SWAT-ELITE" | "QUEEN" | "INFANTRY";
  message: string;
  action?: string;
  timestamp: Date;
  iteration?: number;
}

export interface DirectiveResult {
  success: boolean;
  finalResponse: string;
  iterations: number;
  toolCalls: number;
  telemetry: SwarmTelemetry[];
  error?: string;
}

/**
 * SwarmOrchestrator
 * The central command center for the Sovereign Colony
 */
export class SwarmOrchestrator {
  private telemetryHistory: SwarmTelemetry[] = [];
  private dashboardEmitter?: any; // Socket.IO or EventEmitter for dashboard
  private waxLedger?: any; // BigQuery logging (optional, lazy-loaded)

  /**
   * Initialize the Swarm Orchestrator
   * Sets up MCP connections and tool registry
   * Configures Sovereign Shield (restricted foraging paths)
   */
  async initialize(options?: { allowedPaths?: string[] }): Promise<void> {
    console.log("👑 [QUEEN] Initializing Swarm Orchestrator...");

    // Configure Sovereign Shield (restricted foraging)
    if (options?.allowedPaths) {
      mcpClient.setAllowedPaths(options.allowedPaths);
    } else {
      // Default: restrict to project directory
      const projectRoot = process.cwd();
      mcpClient.setAllowedPaths([projectRoot]);
    }

    // Listen for consensus-required events (Beekeeper's Smoker)
    mcpClient.on(
      "consensus-required",
      (data: { toolName: string; args: any }) => {
        console.log("🚨 [GUARDIAN] Consensus Required!");
        console.log(`   Tool: ${data.toolName}`);
        console.log(`   Args: ${JSON.stringify(data.args)}`);
        this.broadcastTelemetry({
          unit: "QUEEN",
          message: `⚠️ Consensus required for: ${data.toolName}`,
          action: data.toolName,
          timestamp: new Date(),
        });
      },
    );

    // Initialize MCP servers
    try {
      // Note: In production, these would connect to actual MCP servers
      // For now, we'll use the direct implementation in client-bridge
      await mcpClient.listAllTools();
      console.log("✅ [QUEEN] MCP Bridge initialized");
      console.log("🛡️ [GUARDIAN] Sovereign Shield active");
    } catch (error: any) {
      console.error("❌ [QUEEN] MCP Bridge initialization failed:", error);
      throw error;
    }

    // Initialize BigQuery logging if in Google Cloud (lazy load)
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      try {
        const { WaxLedger } =
          await import("./google-cloud/bigquery-logging.js");
        this.waxLedger = new WaxLedger(process.env.GOOGLE_CLOUD_PROJECT);
        await this.waxLedger.initialize();
        console.log("📊 [WAX LEDGER] BigQuery logging initialized");
      } catch (error: any) {
        console.warn(
          "⚠️ [WAX LEDGER] BigQuery initialization failed (continuing without logging):",
          error.message,
        );
        // Don't fail initialization if BigQuery is unavailable
      }
    }

    console.log("👑 [QUEEN] Swarm Orchestrator ready");
  }

  /**
   * The "Sovereign Directive" - The only entry point for the Beekeeper.
   * This takes your vision and turns it into a multi-turn tactical mission.
   *
   * @param prompt - The directive from the Beekeeper
   * @returns Mission result with telemetry and execution details
   */
  async executeDirective(prompt: string): Promise<DirectiveResult> {
    console.log("\n👑 [QUEEN] Directive Received:", prompt);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const telemetry: SwarmTelemetry[] = [];

    try {
      // 1. Get the Battalion's "Hands" (List all MCP Tools)
      console.log("🛠️ [QUEEN] Gathering available tools...");
      const availableTools = await mcpClient.listAllTools();
      console.log(`✅ [QUEEN] ${availableTools.length} tools available`);

      // Broadcast initial telemetry
      this.broadcastTelemetry({
        unit: "QUEEN",
        message: `Directive received: ${prompt.substring(0, 50)}...`,
        timestamp: new Date(),
      });

      // 2. Initiate the Maverick Reasoning Loop
      // This is the "SWAT" tier logic we built earlier.
      console.log("🦙 [QUEEN] Deploying Maverick Reasoning Loop...");
      const missionResult = await llamaToolLoop({
        prompt: prompt,
        tools: availableTools,
        maxIterations: 10,
        temperature: 0.7,
        onStep: (step: LlamaToolLoopStep) => {
          // PUSH TO MISSION CONTROL DASHBOARD
          const telemetryEntry: SwarmTelemetry = {
            unit: step.toolCall ? "SWAT-ELITE" : "QUEEN",
            message: step.reasoning,
            action: step.toolCall?.name,
            timestamp: new Date(),
            iteration: step.iteration,
          };

          telemetry.push(telemetryEntry);
          this.broadcastTelemetry(telemetryEntry);

          // Stream to BigQuery if available
          if (this.waxLedger) {
            this.waxLedger
              .log({
                timestamp: telemetryEntry.timestamp.toISOString(),
                unit: telemetryEntry.unit,
                message: telemetryEntry.message,
                action: telemetryEntry.action,
                iteration: telemetryEntry.iteration,
              })
              .catch((error) => {
                console.warn("⚠️ [WAX LEDGER] Failed to log telemetry:", error);
              });
          }

          // Log to console
          if (step.toolCall) {
            console.log(
              `🔧 [SWAT-ELITE] ${step.toolCall.name} → ${JSON.stringify(step.toolCall.result).substring(0, 100)}`,
            );
          } else {
            console.log(`🧠 [QUEEN] ${step.reasoning.substring(0, 100)}...`);
          }
        },
      });

      // Store telemetry history
      this.telemetryHistory.push(...telemetry);

      // Final telemetry
      const finalTelemetry: SwarmTelemetry = {
        unit: "QUEEN",
        message: missionResult.success
          ? "Mission completed successfully"
          : "Mission completed with warnings",
        timestamp: new Date(),
      };
      telemetry.push(finalTelemetry);
      this.broadcastTelemetry(finalTelemetry);

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`✅ [QUEEN] Mission Complete`);
      console.log(`   Iterations: ${missionResult.iterations}`);
      console.log(`   Tool Calls: ${missionResult.toolCalls}`);
      console.log(`   Success: ${missionResult.success}`);

      return {
        success: missionResult.success,
        finalResponse: missionResult.finalResponse,
        iterations: missionResult.iterations,
        toolCalls: missionResult.toolCalls,
        telemetry,
      };
    } catch (error: any) {
      console.error("❌ [QUEEN] Mission failed:", error);

      const errorTelemetry: SwarmTelemetry = {
        unit: "QUEEN",
        message: `Mission failed: ${error.message}`,
        timestamp: new Date(),
      };
      telemetry.push(errorTelemetry);
      this.broadcastTelemetry(errorTelemetry);

      return {
        success: false,
        finalResponse: `Error: ${error.message}`,
        iterations: 0,
        toolCalls: 0,
        telemetry,
        error: error.message,
      };
    }
  }

  /**
   * Broadcast telemetry to Mission Control Dashboard
   * This feeds your Mission Control Dashboard (Real-time Emerald Glow)
   */
  private broadcastToDashboard(telemetry: SwarmTelemetry): void {
    // If Socket.IO is available, emit to dashboard
    if (this.dashboardEmitter) {
      this.dashboardEmitter.emit("swarm_telemetry", telemetry);
    }

    // Also log to console for development
    const emoji =
      telemetry.unit === "SWAT-ELITE"
        ? "🔧"
        : telemetry.unit === "QUEEN"
          ? "👑"
          : "🪖";
    console.log(`${emoji} [${telemetry.unit}] ${telemetry.message}`);
  }

  /**
   * Broadcast telemetry (public method)
   */
  broadcastTelemetry(telemetry: SwarmTelemetry): void {
    this.broadcastToDashboard(telemetry);
  }

  /**
   * Get telemetry history
   */
  getTelemetryHistory(): SwarmTelemetry[] {
    return [...this.telemetryHistory];
  }

  /**
   * Set dashboard emitter (Socket.IO or EventEmitter)
   */
  setDashboardEmitter(emitter: any): void {
    this.dashboardEmitter = emitter;
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    console.log("👑 [QUEEN] Shutting down Swarm Orchestrator...");
    await mcpClient.shutdown();
    console.log("👑 [QUEEN] Swarm Orchestrator shutdown complete");
  }
}

// Singleton instance
export const swarmOrchestrator = new SwarmOrchestrator();
