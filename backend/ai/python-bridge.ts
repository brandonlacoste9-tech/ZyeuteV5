/**
 * Python Bridge
 * Connects the Orchestrator to the Python Colony Swarm via the DB task queue.
 */

import { storage } from "../storage.js";
import type { HiveTask, HiveTaskResult } from "./types.js";

/**
 * Execute a task on a Python bee by queuing it in colony_tasks
 */
export async function executePythonBee(
  beeId: string,
  task: HiveTask,
): Promise<HiveTaskResult> {
  console.log(`[Python Bridge] Queuing task for ${beeId}: ${task.type}`);

  try {
    // Map Hive task to Colony task command
    // This is a simplification. In reality, we might serialise the whole payload.
    const command = `run_bee ${beeId} ${JSON.stringify(task.payload)}`;

    const colonyTask = await storage.createColonyTask({
      command: command,
      origin: "Orchestrator",
      priority: task.priority === 10 ? "high" : "normal",
      metadata: {
        beeId,
        hiveTaskId: task.id,
        ...task.payload,
      },
      workerId: beeId, // Target a specific worker/bee if the swarm supports it
    });

    console.log(
      `[Python Bridge] Task queued successfully (ID: ${colonyTask.id})`,
    );

    // For now, we return success immediately (async dispatch).
    // In a future version, we could poll colonyTask until status is completed.
    return {
      taskId: task.id,
      success: true,
      data: {
        status: "queued",
        colonyTaskId: colonyTask.id,
        message: "Task sent to Python swarm",
      },
      metadata: {
        beeId,
        executionTime: 0,
        model: "python-swarm",
      },
    };
  } catch (error: any) {
    console.error(`[Python Bridge] Failed to queue task:`, error);
    return {
      taskId: task.id,
      success: false,
      error: `Bridge Error: ${error.message}`,
    };
  }
}
