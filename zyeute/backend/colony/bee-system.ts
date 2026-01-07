/**
 * Colony OS Bee System
 * Distributed AI agent ecosystem where each bee has a specific job
 * All bees communicate, learn, and help each other through Colony OS
 */

import { EventEmitter } from "events";
import { synapseBridge } from "./synapse-bridge.js";
import { logger } from "../utils/logger.js";
import {
  getBeeById,
  getBeesByCapability,
  getBeesByCore,
} from "../ai/bee-registry.js";
import type { BeeDefinition, BeeCapability, BeeCore } from "../ai/types.js";

export interface BeeMessage {
  id: string;
  fromBee: string;
  toBee: string | "broadcast";
  hive: string;
  message: string;
  payload?: any;
  timestamp: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface BeeTask {
  id: string;
  beeId: string;
  capability: BeeCapability;
  payload: any;
  hive: string;
  userId?: string;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface BeeMemory {
  beeId: string;
  key: string;
  value: any;
  hive: string;
  timestamp: string;
  shared: boolean; // Can other bees access this?
}

export interface BeeStatus {
  beeId: string;
  hive: string;
  status: "active" | "idle" | "busy" | "error";
  lastSeen: string;
  tasksCompleted: number;
  tasksFailed: number;
  capabilities: BeeCapability[];
  load: number; // 0-1, current workload
}

/**
 * Bee System - Central orchestrator for all bees
 * Manages communication, learning, and task distribution
 */
export class BeeSystem extends EventEmitter {
  private beeStatuses: Map<string, BeeStatus> = new Map();
  private beeMemories: Map<string, Map<string, BeeMemory>> = new Map(); // beeId -> memories
  private taskQueue: BeeTask[] = [];
  private activeTasks: Map<string, BeeTask> = new Map();
  private hiveId: string;

  constructor(hiveId: string = "zyeute") {
    super();
    this.hiveId = hiveId;
    this.initializeBeeSystem();
  }

  /**
   * Initialize bee system and connect to Colony OS
   */
  private async initializeBeeSystem(): Promise<void> {
    // Register this hive with Colony OS
    if (synapseBridge.isConnected()) {
      const { BEE_REGISTRY } = await import("../ai/bee-registry.js");
      await synapseBridge.publishEvent("hive.registered", {
        hive: this.hiveId,
        bees: Object.keys(BEE_REGISTRY).length,
        capabilities: this.getAllCapabilities(),
        timestamp: new Date().toISOString(),
      });

      // Listen for Colony OS events
      synapseBridge.on("colony.bee.message", (message: BeeMessage) => {
        this.handleIncomingMessage(message);
      });

      synapseBridge.on("colony.bee.task", (task: BeeTask) => {
        this.handleIncomingTask(task);
      });

      synapseBridge.on("colony.bee.memory", (memory: BeeMemory) => {
        this.handleSharedMemory(memory);
      });
    }

    // Initialize all bee statuses
    this.initializeBeeStatuses();

    logger.info(`🐝 [BeeSystem] Initialized hive: ${this.hiveId}`);
  }

  /**
   * Initialize status tracking for all registered bees
   */
  private initializeBeeStatuses(): void {
    // This would load from bee-registry.ts
    // For now, we'll track dynamically as bees report in
  }

  /**
   * Register a bee with the system
   */
  async registerBee(
    beeId: string,
    capabilities: BeeCapability[],
  ): Promise<void> {
    const bee = getBeeById(beeId);
    if (!bee) {
      throw new Error(`Bee ${beeId} not found in registry`);
    }

    const status: BeeStatus = {
      beeId,
      hive: this.hiveId,
      status: "active",
      lastSeen: new Date().toISOString(),
      tasksCompleted: 0,
      tasksFailed: 0,
      capabilities,
      load: 0,
    };

    this.beeStatuses.set(beeId, status);

    // Notify Colony OS
    await synapseBridge.publishEvent("bee.registered", {
      beeId,
      hive: this.hiveId,
      capabilities,
      timestamp: new Date().toISOString(),
    });

    this.emit("bee.registered", status);
    logger.info(
      `🐝 [BeeSystem] Bee registered: ${beeId} with capabilities: ${capabilities.join(", ")}`,
    );
  }

  /**
   * Assign a task to a bee
   */
  async assignTask(
    capability: BeeCapability,
    payload: any,
    options: {
      priority?: "low" | "medium" | "high" | "urgent";
      userId?: string;
      preferredBeeId?: string;
    } = {},
  ): Promise<BeeTask> {
    const { priority = "medium", userId, preferredBeeId } = options;

    // Find available bee with the capability
    let targetBee: BeeDefinition | undefined;

    if (preferredBeeId) {
      targetBee = getBeeById(preferredBeeId);
      if (!targetBee?.capabilities.includes(capability)) {
        throw new Error(
          `Bee ${preferredBeeId} doesn't have capability ${capability}`,
        );
      }
    } else {
      const availableBees = getBeesByCapability(capability);
      // Find bee with lowest load
      targetBee = availableBees
        .map((bee) => ({
          bee,
          status: this.beeStatuses.get(bee.id),
        }))
        .filter(
          ({ status }) =>
            status && status.status === "active" && status.load < 0.8,
        )
        .sort((a, b) => (a.status?.load || 0) - (b.status?.load || 0))[0]?.bee;

      if (!targetBee) {
        throw new Error(`No available bee with capability ${capability}`);
      }
    }

    const task: BeeTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      beeId: targetBee.id,
      capability,
      payload,
      hive: this.hiveId,
      userId,
      priority,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    this.taskQueue.push(task);
    this.processTaskQueue();

    // Notify Colony OS
    await synapseBridge.publishEvent("bee.task.assigned", {
      taskId: task.id,
      beeId: targetBee.id,
      capability,
      hive: this.hiveId,
      timestamp: new Date().toISOString(),
    });

    this.emit("task.assigned", task);
    return task;
  }

  /**
   * Process pending tasks
   */
  private async processTaskQueue(): Promise<void> {
    // Sort by priority
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const task of this.taskQueue) {
      if (this.activeTasks.has(task.id)) continue;

      const beeStatus = this.beeStatuses.get(task.beeId);
      if (
        !beeStatus ||
        beeStatus.status !== "active" ||
        beeStatus.load >= 1.0
      ) {
        continue; // Skip if bee is busy
      }

      // Move to active
      this.taskQueue = this.taskQueue.filter((t) => t.id !== task.id);
      this.activeTasks.set(task.id, task);
      task.status = "processing";

      // Update bee load
      beeStatus.load += 0.1;
      beeStatus.status = "busy";

      // Execute task (would call actual bee implementation)
      this.executeTask(task).catch((error) => {
        logger.error(`[BeeSystem] Task ${task.id} failed:`, error);
        task.status = "failed";
        task.error = error.message;
        beeStatus.tasksFailed++;
        beeStatus.load = Math.max(0, beeStatus.load - 0.1);
        beeStatus.status = beeStatus.load === 0 ? "active" : "busy";
        this.activeTasks.delete(task.id);
        this.emit("task.failed", task);
      });
    }
  }

  /**
   * Execute a task (routes to appropriate bee handler)
   */
  private async executeTask(task: BeeTask): Promise<void> {
    const bee = getBeeById(task.beeId);
    if (!bee) {
      throw new Error(`Bee ${task.beeId} not found`);
    }

    logger.info(
      `🐝 [BeeSystem] Executing task ${task.id} with bee ${task.beeId}`,
    );

    // Route to bee handler based on endpoint
    if (bee.endpoint === "colony_tasks") {
      // Route to Colony OS Python kernel
      const result = await synapseBridge.requestIntelligence(
        `run_bee ${task.beeId} ${JSON.stringify(task.payload)}`,
      );
      task.result = result;
    } else {
      // Route to local bee handler (would import and call)
      // For now, emit event for handlers to listen
      this.emit(`bee.${task.beeId}.task`, task);
    }

    // Mark complete
    task.status = "completed";
    const beeStatus = this.beeStatuses.get(task.beeId);
    if (beeStatus) {
      beeStatus.tasksCompleted++;
      beeStatus.load = Math.max(0, beeStatus.load - 0.1);
      beeStatus.status = beeStatus.load === 0 ? "active" : "busy";
      beeStatus.lastSeen = new Date().toISOString();
    }

    this.activeTasks.delete(task.id);

    // Notify Colony OS
    await synapseBridge.publishEvent("bee.task.completed", {
      taskId: task.id,
      beeId: task.beeId,
      result: task.result,
      timestamp: new Date().toISOString(),
    });

    this.emit("task.completed", task);
  }

  /**
   * Send message between bees
   */
  async sendMessage(
    fromBee: string,
    toBee: string | "broadcast",
    message: string,
    payload?: any,
    priority: "low" | "medium" | "high" | "urgent" = "medium",
  ): Promise<void> {
    const beeMessage: BeeMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromBee,
      toBee,
      hive: this.hiveId,
      message,
      payload,
      timestamp: new Date().toISOString(),
      priority,
    };

    // Send via Colony OS if connected
    if (synapseBridge.isConnected()) {
      await synapseBridge.publishEvent("bee.message", beeMessage);
    }

    // Also handle locally
    if (toBee === "broadcast") {
      this.emit("bee.message.broadcast", beeMessage);
    } else {
      this.emit(`bee.message.${toBee}`, beeMessage);
    }

    logger.info(`🐝 [BeeSystem] Message sent: ${fromBee} → ${toBee}`);
  }

  /**
   * Store memory (knowledge) for a bee
   */
  async storeMemory(
    beeId: string,
    key: string,
    value: any,
    shared: boolean = false,
  ): Promise<void> {
    if (!this.beeMemories.has(beeId)) {
      this.beeMemories.set(beeId, new Map());
    }

    const memory: BeeMemory = {
      beeId,
      key,
      value,
      hive: this.hiveId,
      timestamp: new Date().toISOString(),
      shared,
    };

    this.beeMemories.get(beeId)!.set(key, memory);

    // Share with Colony OS if shared
    if (shared && synapseBridge.isConnected()) {
      await synapseBridge.publishEvent("bee.memory.shared", memory);
    }

    this.emit("memory.stored", memory);
    logger.info(
      `🐝 [BeeSystem] Memory stored: ${beeId}.${key} (shared: ${shared})`,
    );
  }

  /**
   * Retrieve memory (knowledge) from a bee
   */
  async getMemory(beeId: string, key: string): Promise<any | null> {
    // Check local memory
    const beeMemory = this.beeMemories.get(beeId);
    if (beeMemory?.has(key)) {
      return beeMemory.get(key)!.value;
    }

    // Check shared memories from other bees
    for (const [otherBeeId, memories] of this.beeMemories.entries()) {
      const memory = memories.get(key);
      if (memory && memory.shared) {
        return memory.value;
      }
    }

    // Query Colony OS for shared memory
    if (synapseBridge.isConnected()) {
      try {
        const result = await synapseBridge.requestIntelligence(
          `get_bee_memory ${beeId} ${key}`,
        );
        return result;
      } catch (error) {
        logger.warn(
          `[BeeSystem] Could not retrieve memory from Colony OS: ${error}`,
        );
      }
    }

    return null;
  }

  /**
   * Handle incoming message from Colony OS
   */
  private handleIncomingMessage(message: BeeMessage): void {
    if (
      message.toBee === "broadcast" ||
      message.toBee.startsWith(this.hiveId)
    ) {
      this.emit(`bee.message.${message.toBee}`, message);
      logger.info(
        `🐝 [BeeSystem] Received message: ${message.fromBee} → ${message.toBee}`,
      );
    }
  }

  /**
   * Handle incoming task from Colony OS
   */
  private handleIncomingTask(task: BeeTask): void {
    if (task.hive === this.hiveId) {
      this.taskQueue.push(task);
      this.processTaskQueue();
    }
  }

  /**
   * Handle shared memory from Colony OS
   */
  private handleSharedMemory(memory: BeeMemory): void {
    if (!this.beeMemories.has(memory.beeId)) {
      this.beeMemories.set(memory.beeId, new Map());
    }
    this.beeMemories.get(memory.beeId)!.set(memory.key, memory);
    this.emit("memory.received", memory);
  }

  /**
   * Get bee status
   */
  getBeeStatus(beeId: string): BeeStatus | undefined {
    return this.beeStatuses.get(beeId);
  }

  /**
   * Get all bee statuses
   */
  getAllBeeStatuses(): BeeStatus[] {
    return Array.from(this.beeStatuses.values());
  }

  /**
   * Get all capabilities across all bees
   */
  private getAllCapabilities(): BeeCapability[] {
    const capabilities = new Set<BeeCapability>();
    for (const status of this.beeStatuses.values()) {
      status.capabilities.forEach((cap) => capabilities.add(cap));
    }
    return Array.from(capabilities);
  }

  /**
   * Health check - report hive status to Colony OS
   */
  async reportHealth(): Promise<void> {
    const health = {
      hive: this.hiveId,
      activeBees: Array.from(this.beeStatuses.values()).filter(
        (s) => s.status === "active",
      ).length,
      busyBees: Array.from(this.beeStatuses.values()).filter(
        (s) => s.status === "busy",
      ).length,
      pendingTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      timestamp: new Date().toISOString(),
    };

    await synapseBridge.publishEvent("hive.health", health);
    this.emit("health.reported", health);
  }
}

// Singleton instance
export const beeSystem = new BeeSystem("zyeute");
