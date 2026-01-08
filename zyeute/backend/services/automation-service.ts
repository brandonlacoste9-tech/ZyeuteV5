/**
 * Automation Service
 * Coordinates Windows-Use automation tasks via Synapse Bridge
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";
import { windowsAutomationBridge } from "./windows-automation-bridge.js";
import { devToolsMonitor } from "./devtools-monitor.js";
import { synapseBridge } from "../colony/synapse-bridge.js";
import { storage } from "../storage.js";
import type { AutomationTask, AutomationResult } from "./windows-automation-bridge.js";

const automationLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[AutomationService] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[AutomationService] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) =>
    logger.warn(`[AutomationService] ${msg}`, ...args),
};

export interface AutomationTaskRequest {
  id: string;
  beeId: string;
  taskType: "test" | "debug" | "automation" | "monitoring";
  description: string;
  action: string;
  parameters?: Record<string, any>;
  llm_provider?: string;
  browser?: string;
  timeout?: number;
}

export class AutomationService extends EventEmitter {
  private initialized: boolean = false;

  /**
   * Initialize the automation service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      automationLogger.warn("Automation service already initialized");
      return;
    }

    try {
      // Start Windows Automation Bridge
      await windowsAutomationBridge.start();

      // Connect DevTools Monitor (optional)
      await devToolsMonitor.connect();

      // Listen to Synapse Bridge for automation task requests
      synapseBridge.on("automation:task:execute", async (task: AutomationTaskRequest) => {
        await this.handleAutomationTask(task);
      });

      // Listen to bridge events
      windowsAutomationBridge.on("ready", () => {
        automationLogger.info("Windows Automation Bridge is ready");
      });

      windowsAutomationBridge.on("unhealthy", () => {
        automationLogger.warn("Windows Automation Bridge is unhealthy");
      });

      this.initialized = true;
      automationLogger.info("Automation service initialized");
      this.emit("initialized");
    } catch (error: any) {
      automationLogger.error(`Failed to initialize automation service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle automation task request from Synapse Bridge
   */
  private async handleAutomationTask(task: AutomationTaskRequest): Promise<void> {
    try {
      automationLogger.info(`Handling automation task: ${task.id}`);

      // Store task in database
      await storage.createAutomationTask({
        id: task.id,
        beeId: task.beeId,
        taskType: task.taskType,
        description: task.description,
        status: "running",
      });

      // Start performance monitoring (if enabled)
      await devToolsMonitor.startRecording();

      // Execute task via bridge
      const bridgeTask: AutomationTask = {
        id: task.id,
        action: task.action,
        parameters: task.parameters || {},
        timeout: task.timeout || 300,
        llm_provider: task.llm_provider || "gemini",
        browser: task.browser || "edge",
      };

      const result: AutomationResult = await windowsAutomationBridge.executeTask(bridgeTask);

      // Stop performance monitoring
      const metrics = await devToolsMonitor.stopRecording();
      const avgMetrics = devToolsMonitor.getAverageMetrics();

      // Update task in database
      await storage.updateAutomationTask(task.id, {
        status: result.success ? "completed" : "failed",
        result: result.data,
        performanceMetrics: {
          ...avgMetrics,
          executionTime: result.performance_metrics?.execution_time || 0,
          memoryUsage: result.performance_metrics?.memory_usage_mb || 0,
        },
        completedAt: new Date(),
      });

      // Emit results via Synapse Bridge
      await synapseBridge.emitAutomationTaskComplete({
        taskId: task.id,
        beeId: task.beeId,
        success: result.success,
        data: result.data,
        error: result.error,
        performanceMetrics: avgMetrics,
      });

      // Emit metrics to observability dashboard
      await synapseBridge.emitObservabilityMetrics({
        beeType: "windows-automation",
        taskId: task.id,
        metrics: avgMetrics,
        timestamp: Date.now(),
      });

      automationLogger.info(`Automation task ${task.id} completed: ${result.success ? "success" : "failed"}`);
    } catch (error: any) {
      automationLogger.error(`Failed to handle automation task ${task.id}: ${error.message}`);

      // Update task status to failed
      await storage.updateAutomationTask(task.id, {
        status: "failed",
        result: { error: error.message },
        completedAt: new Date(),
      });

      // Emit error via Synapse Bridge
      await synapseBridge.emitAutomationTaskComplete({
        taskId: task.id,
        beeId: task.beeId,
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Execute automation task directly (bypassing Synapse Bridge)
   */
  async executeTask(task: AutomationTaskRequest): Promise<AutomationResult> {
    const bridgeTask: AutomationTask = {
      id: task.id,
      action: task.action,
      parameters: task.parameters || {},
      timeout: task.timeout || 300,
      llm_provider: task.llm_provider || "gemini",
      browser: task.browser || "edge",
    };

    return await windowsAutomationBridge.executeTask(bridgeTask);
  }

  /**
   * Get automation service status
   */
  getStatus(): {
    initialized: boolean;
    bridgeStatus: any;
    devToolsEnabled: boolean;
  } {
    return {
      initialized: this.initialized,
      bridgeStatus: windowsAutomationBridge.getStatus(),
      devToolsEnabled: devToolsMonitor.isRecording(),
    };
  }
}

// Export singleton instance
export const automationService = new AutomationService();
