/**
 * Hive Manager
 * Manages multiple hives (websites/apps) all connected to Colony OS
 * Each hive is a separate application that can communicate with others
 */

import { EventEmitter } from "events";
import { synapseBridge } from "./synapse-bridge.js";
import { beeSystem } from "./bee-system.js";
import { logger } from "../utils/logger.js";

export interface HiveInfo {
  hiveId: string;
  name: string;
  url?: string;
  status: "active" | "inactive" | "error";
  beeCount: number;
  capabilities: string[];
  lastSeen: string;
  metadata?: Record<string, any>;
}

export interface CrossHiveTask {
  id: string;
  fromHive: string;
  toHive: string;
  capability: string;
  payload: any;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
}

/**
 * Hive Manager
 * Manages connections to other hives in the Colony OS ecosystem
 */
export class HiveManager extends EventEmitter {
  private knownHives: Map<string, HiveInfo> = new Map();
  private crossHiveTasks: Map<string, CrossHiveTask> = new Map();
  private currentHiveId: string = "zyeute";

  constructor() {
    super();
    this.initializeHiveManager();
  }

  /**
   * Initialize hive manager and register with Colony OS
   */
  private async initializeHiveManager(): Promise<void> {
    // Register this hive
    await this.registerHive({
      hiveId: this.currentHiveId,
      name: "Zyeuté - Quebec Social Media",
      status: "active",
      beeCount: 0, // Will be updated as bees register
      capabilities: [],
      lastSeen: new Date().toISOString(),
      metadata: {
        type: "social_media",
        region: "quebec",
        language: "fr",
      },
    });

    // Listen for other hive registrations
    synapseBridge.on("colony.hive.registered", (hiveInfo: HiveInfo) => {
      this.knownHives.set(hiveInfo.hiveId, hiveInfo);
      this.emit("hive.discovered", hiveInfo);
      logger.info(
        `🐝 [HiveManager] Discovered hive: ${hiveInfo.hiveId} (${hiveInfo.name})`,
      );
    });

    // Listen for hive health updates
    synapseBridge.on("colony.hive.health", (health: any) => {
      const hive = this.knownHives.get(health.hive);
      if (hive) {
        hive.lastSeen = health.timestamp;
        hive.status = health.activeBees > 0 ? "active" : "inactive";
        this.emit("hive.health", health);
      }
    });

    // Listen for cross-hive tasks
    synapseBridge.on("colony.cross_hive.task", (task: CrossHiveTask) => {
      if (task.toHive === this.currentHiveId) {
        this.handleIncomingCrossHiveTask(task);
      }
    });

    // Periodic health reporting
    setInterval(() => {
      this.reportHealth();
    }, 30000); // Every 30 seconds
  }

  /**
   * Register this hive with Colony OS
   */
  async registerHive(info: HiveInfo): Promise<void> {
    this.knownHives.set(info.hiveId, info);

    await synapseBridge.publishEvent("hive.registered", {
      ...info,
      timestamp: new Date().toISOString(),
    });

    logger.info(`🐝 [HiveManager] Registered hive: ${info.hiveId}`);
  }

  /**
   * Discover other hives in Colony OS
   */
  async discoverHives(): Promise<HiveInfo[]> {
    if (!synapseBridge.isConnected()) {
      return Array.from(this.knownHives.values());
    }

    try {
      const hives = await synapseBridge.requestIntelligence("list_all_hives");
      if (Array.isArray(hives)) {
        hives.forEach((hive: HiveInfo) => {
          this.knownHives.set(hive.hiveId, hive);
        });
      }
    } catch (error) {
      logger.warn(`[HiveManager] Could not discover hives: ${error}`);
    }

    return Array.from(this.knownHives.values());
  }

  /**
   * Send task to another hive
   */
  async sendTaskToHive(
    targetHive: string,
    capability: string,
    payload: any,
    priority: "low" | "medium" | "high" | "urgent" = "medium",
  ): Promise<CrossHiveTask> {
    const task: CrossHiveTask = {
      id: `cross-hive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromHive: this.currentHiveId,
      toHive: targetHive,
      capability,
      payload,
      priority,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    this.crossHiveTasks.set(task.id, task);

    await synapseBridge.publishEvent("cross_hive.task", task);

    logger.info(`🐝 [HiveManager] Sent task to ${targetHive}: ${capability}`);

    // Wait for response (with timeout)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        task.status = "failed";
        reject(new Error(`Cross-hive task timeout: ${task.id}`));
      }, 30000);

      const handler = (response: any) => {
        if (response.taskId === task.id) {
          clearTimeout(timeout);
          task.status = response.status;
          task.result = response.result;
          this.emit("cross_hive.task.completed", task);
          resolve(task);
        }
      };

      synapseBridge.once("colony.cross_hive.task.response", handler);
    });
  }

  /**
   * Handle incoming cross-hive task
   */
  private async handleIncomingCrossHiveTask(
    task: CrossHiveTask,
  ): Promise<void> {
    logger.info(
      `🐝 [HiveManager] Received cross-hive task from ${task.fromHive}: ${task.capability}`,
    );

    task.status = "processing";

    try {
      // Route to appropriate bee
      const beeTask = await beeSystem.assignTask(
        task.capability as any,
        task.payload,
        { priority: task.priority },
      );

      // Wait for completion
      beeSystem.once(`task.completed`, (completedTask) => {
        if (completedTask.id === beeTask.id) {
          task.status = "completed";
          task.result = completedTask.result;

          // Send response back
          synapseBridge.publishEvent("cross_hive.task.response", {
            taskId: task.id,
            status: "completed",
            result: task.result,
            timestamp: new Date().toISOString(),
          });
        }
      });

      beeSystem.once(`task.failed`, (failedTask) => {
        if (failedTask.id === beeTask.id) {
          task.status = "failed";
          task.result = { error: failedTask.error };

          synapseBridge.publishEvent("cross_hive.task.response", {
            taskId: task.id,
            status: "failed",
            error: failedTask.error,
            timestamp: new Date().toISOString(),
          });
        }
      });
    } catch (error: any) {
      task.status = "failed";
      task.result = { error: error.message };

      await synapseBridge.publishEvent("cross_hive.task.response", {
        taskId: task.id,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get all known hives
   */
  getKnownHives(): HiveInfo[] {
    return Array.from(this.knownHives.values());
  }

  /**
   * Get hive info
   */
  getHiveInfo(hiveId: string): HiveInfo | undefined {
    return this.knownHives.get(hiveId);
  }

  /**
   * Report health to Colony OS
   */
  async reportHealth(): Promise<void> {
    const beeStatuses = beeSystem.getAllBeeStatuses();
    const activeBees = beeStatuses.filter((s) => s.status === "active").length;
    const busyBees = beeStatuses.filter((s) => s.status === "busy").length;

    const health = {
      hive: this.currentHiveId,
      activeBees,
      busyBees,
      totalBees: beeStatuses.length,
      capabilities: beeStatuses.flatMap((s) => s.capabilities),
      timestamp: new Date().toISOString(),
    };

    await synapseBridge.publishEvent("hive.health", health);
    this.emit("health.reported", health);
  }

  /**
   * Find hive with specific capability
   */
  async findHiveWithCapability(capability: string): Promise<HiveInfo | null> {
    // Check local hive first
    const localBees = beeSystem.getAllBeeStatuses();
    const hasLocalCapability = localBees.some((s) =>
      s.capabilities.includes(capability as any),
    );
    if (hasLocalCapability) {
      return this.knownHives.get(this.currentHiveId) || null;
    }

    // Query Colony OS
    if (synapseBridge.isConnected()) {
      try {
        const hiveId = await synapseBridge.requestIntelligence(
          `find_hive_with_capability ${capability}`,
        );
        if (hiveId) {
          return this.knownHives.get(hiveId) || null;
        }
      } catch (error) {
        logger.warn(
          `[HiveManager] Could not find hive with capability: ${error}`,
        );
      }
    }

    return null;
  }
}

export const hiveManager = new HiveManager();
