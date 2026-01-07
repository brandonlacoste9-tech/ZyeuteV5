/**
 * Bee Communication System
 * Enables bees to communicate, learn, and help each other across hives
 */

import { beeSystem } from "./bee-system.js";
import { synapseBridge } from "./synapse-bridge.js";
import { logger } from "../utils/logger.js";
import type { BeeMessage, BeeMemory } from "./bee-system.js";

/**
 * Bee Communication Hub
 * Manages all inter-bee communication
 */
export class BeeCommunication {
  private messageHistory: BeeMessage[] = [];
  private maxHistorySize = 1000;

  /**
   * Send message to another bee (same hive or different hive)
   */
  async sendMessage(
    fromBee: string,
    toBee: string,
    message: string,
    payload?: any,
    options: {
      priority?: "low" | "medium" | "high" | "urgent";
      targetHive?: string; // If different hive
    } = {},
  ): Promise<void> {
    const { priority = "medium", targetHive } = options;

    // If target hive specified, route through Colony OS
    if (targetHive && targetHive !== "zyeute") {
      await synapseBridge.publishEvent("bee.message.cross_hive", {
        fromBee,
        fromHive: "zyeute",
        toBee,
        toHive: targetHive,
        message,
        payload,
        priority,
        timestamp: new Date().toISOString(),
      });
      logger.info(
        `🐝 [BeeComm] Cross-hive message: ${fromBee}@zyeute → ${toBee}@${targetHive}`,
      );
      return;
    }

    // Local message
    await beeSystem.sendMessage(fromBee, toBee, message, payload, priority);
  }

  /**
   * Broadcast message to all bees (same hive or all hives)
   */
  async broadcast(
    fromBee: string,
    message: string,
    payload?: any,
    options: {
      scope?: "local" | "colony"; // Local hive or all hives in Colony OS
      priority?: "low" | "medium" | "high" | "urgent";
    } = {},
  ): Promise<void> {
    const { scope = "local", priority = "medium" } = options;

    if (scope === "colony") {
      // Broadcast to all hives via Colony OS
      await synapseBridge.publishEvent("bee.message.broadcast", {
        fromBee,
        fromHive: "zyeute",
        message,
        payload,
        priority,
        timestamp: new Date().toISOString(),
      });
      logger.info(`🐝 [BeeComm] Colony-wide broadcast from ${fromBee}`);
    } else {
      // Local broadcast
      await beeSystem.sendMessage(
        fromBee,
        "broadcast",
        message,
        payload,
        priority,
      );
    }
  }

  /**
   * Ask for help - bees can request assistance from others
   */
  async askForHelp(
    fromBee: string,
    capability: string,
    problem: string,
    payload?: any,
  ): Promise<any> {
    logger.info(`🐝 [BeeComm] ${fromBee} asking for help with ${capability}`);

    // Broadcast help request
    await this.broadcast(
      fromBee,
      `Help needed: ${capability}`,
      {
        type: "help_request",
        capability,
        problem,
        payload,
      },
      { scope: "colony", priority: "high" },
    );

    // Wait for responses (would implement timeout and response collection)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null); // No help received
      }, 5000);

      beeSystem.once(`bee.help.${fromBee}`, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  /**
   * Share knowledge with other bees
   */
  async shareKnowledge(
    fromBee: string,
    key: string,
    value: any,
    options: {
      scope?: "local" | "colony";
      tags?: string[];
    } = {},
  ): Promise<void> {
    const { scope = "colony", tags = [] } = options;

    await beeSystem.storeMemory(fromBee, key, value, true); // Always shared

    if (scope === "colony") {
      // Share with all hives via Colony OS
      await synapseBridge.publishEvent("bee.knowledge.shared", {
        fromBee,
        fromHive: "zyeute",
        key,
        value,
        tags,
        timestamp: new Date().toISOString(),
      });
      logger.info(
        `🐝 [BeeComm] ${fromBee} shared knowledge: ${key} (colony-wide)`,
      );
    } else {
      logger.info(`🐝 [BeeComm] ${fromBee} shared knowledge: ${key} (local)`);
    }
  }

  /**
   * Learn from other bees - retrieve shared knowledge
   */
  async learnFromOthers(
    beeId: string,
    key: string,
    options: {
      scope?: "local" | "colony";
      fromBee?: string; // Specific bee to learn from
    } = {},
  ): Promise<any> {
    const { scope = "colony", fromBee } = options;

    // Try local memory first
    const localMemory = await beeSystem.getMemory(beeId, key);
    if (localMemory) {
      return localMemory;
    }

    // Query Colony OS for shared knowledge
    if (scope === "colony" && synapseBridge.isConnected()) {
      try {
        const query = fromBee
          ? `get_bee_knowledge ${fromBee} ${key}`
          : `get_shared_knowledge ${key}`;

        const knowledge = await synapseBridge.requestIntelligence(query);
        if (knowledge) {
          // Store locally for future use
          await beeSystem.storeMemory(beeId, key, knowledge, false);
          logger.info(`🐝 [BeeComm] ${beeId} learned: ${key} from Colony OS`);
          return knowledge;
        }
      } catch (error) {
        logger.warn(
          `[BeeComm] Could not retrieve knowledge from Colony OS: ${error}`,
        );
      }
    }

    return null;
  }

  /**
   * Get message history
   */
  getMessageHistory(beeId?: string, limit: number = 50): BeeMessage[] {
    let messages = this.messageHistory;

    if (beeId) {
      messages = messages.filter(
        (msg) =>
          msg.fromBee === beeId ||
          msg.toBee === beeId ||
          msg.toBee === "broadcast",
      );
    }

    return messages.slice(-limit);
  }
}

export const beeCommunication = new BeeCommunication();
