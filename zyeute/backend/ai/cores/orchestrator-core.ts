/**
 * Orchestrator Core
 * Routes tasks to appropriate bees based on capability
 */

import { HiveTask, HiveTaskResult } from "../types";
import { getBeesByCapability } from "../bee-registry";
// @ts-ignore - The bridge module definitely exists, TS just might be fussy about extensions
import { sendMetricsToColony } from "../../colony/bridge";

export class OrchestratorCore {
  async handleHiveTask(task: HiveTask): Promise<HiveTaskResult> {
    const startTime = Date.now();
    console.log(`[Orchestrator] Received task: ${task.type}`);

    // Map task type to capability (simple mapping for now)
    const capability = this.mapTaskTypeToCapability(task.type);

    // Find bee
    const bees = getBeesByCapability(capability);
    if (bees.length === 0) {
      return {
        taskId: task.id,
        success: false,
        error: `No bee found for capability: ${capability}`,
      };
    }

    const bee = bees[0]; // Pick first available
    console.log(`[Orchestrator] Routing to bee: ${bee.id}`);

    try {
      // Dynamic import to break circular dependency if any, or just standard import pattern
      // In a real app, we might use a BeeFactory or Command pattern.
      // For this plan, we'll assume we load the module from ../bees/<id>

      // Check if it's a Python bee (Colony Swarm)
      if (bee.endpoint) {
        // Determine if we should wait or fire-and-forget.
        // For now, Orchestrator expects a promise result.
        const { executePythonBee } = await import("../python-bridge");
        const result = await executePythonBee(bee.id, task);

        // Add execution time to result if missing
        const executionTime = Date.now() - startTime;
        if (result.metadata) {
          result.metadata.executionTime =
            result.metadata.executionTime || executionTime;
        }

        return result;
      }

      // Note: We need to use relative path that works at runtime
      const beeModule = await import(`../bees/${bee.id}`);

      if (beeModule && typeof beeModule.run === "function") {
        const result = await beeModule.run(task);
        const executionTime = Date.now() - startTime;

        const taskResult: HiveTaskResult = {
          taskId: task.id,
          success: true,
          data: result,
          metadata: {
            beeId: bee.id,
            executionTime,
            model: bee.model,
            cost: result.metadata?.cost || 0,
          },
        };

        // Send metrics to Colony OS (fire 'n forget)
        sendMetricsToColony({
          beeId: bee.id,
          taskType: task.type,
          executionTime,
          cost: taskResult.metadata?.cost || 0,
          success: true,
          model: bee.model,
        }).catch((err) =>
          console.error("[Orchestrator] Failed to send metrics:", err),
        );

        return taskResult;
      } else {
        throw new Error(`Bee ${bee.id} does not export a run function`);
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`[Orchestrator] Error executing bee ${bee.id}:`, error);

      // Report failure metrics too
      sendMetricsToColony({
        beeId: bee.id,
        taskType: task.type,
        executionTime,
        success: false,
        error: error.message,
      }).catch((err) =>
        console.error("[Orchestrator] Failed to send failure metrics:", err),
      );

      return {
        taskId: task.id,
        success: false,
        error: error.message || String(error),
      };
    }
  }

  private mapTaskTypeToCapability(taskType: string): any {
    // fast mapping
    if (taskType.includes("chat")) return "chat";
    if (taskType.includes("caption")) return "caption";
    if (taskType.includes("image")) return "image";
    if (taskType.includes("video")) return "video";
    if (taskType.includes("compose")) return "compose";
    if (taskType.includes("moderate")) return "moderation";
    if (taskType.includes("budget")) return "budget";
    if (taskType.includes("analytics")) return "analytics";
    return "chat"; // default
  }
}

export const orchestrator = new OrchestratorCore();
