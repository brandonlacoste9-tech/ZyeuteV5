/**
 * DevTools Monitor Service
 * Connects to Chrome DevTools MCP for performance monitoring
 * NOTE: This is a placeholder implementation - full MCP integration requires chrome-devtools-mcp setup
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";

const devtoolsLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[DevToolsMonitor] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[DevToolsMonitor] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) =>
    logger.warn(`[DevToolsMonitor] ${msg}`, ...args),
};

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // MB
  droppedFrames: number;
  networkRequests: number;
  consoleErrors: string[];
  timestamp: number;
}

export interface DevToolsConfig {
  chromePort?: number;
  enabled?: boolean;
}

export class DevToolsMonitor extends EventEmitter {
  private recording: boolean = false;
  private metrics: PerformanceMetrics[] = [];
  private config: DevToolsConfig;
  private mcpClient: any = null; // Will be populated when chrome-devtools-mcp is integrated

  constructor(config: DevToolsConfig = {}) {
    super();
    this.config = {
      chromePort: config.chromePort || 9222,
      enabled: config.enabled !== false,
    };
  }

  /**
   * Connect to Chrome DevTools (placeholder - requires MCP setup)
   */
  async connect(): Promise<void> {
    if (!this.config.enabled) {
      devtoolsLogger.warn("DevTools monitoring is disabled");
      return;
    }

    // TODO: Integrate with chrome-devtools-mcp when available
    // This is a placeholder implementation
    devtoolsLogger.info(
      `DevTools monitor initialized (MCP integration pending, chrome port: ${this.config.chromePort})`,
    );
  }

  /**
   * Start recording performance metrics
   */
  async startRecording(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.recording = true;
    this.metrics = [];

    // TODO: Enable Chrome DevTools Performance, Network, and Console domains
    // await this.mcpClient.send('Performance.enable');
    // await this.mcpClient.send('Network.enable');
    // await this.mcpClient.send('Console.enable');

    devtoolsLogger.info("Started recording performance metrics");
    this.emit("recording.started");
  }

  /**
   * Stop recording and return metrics
   */
  async stopRecording(): Promise<PerformanceMetrics[]> {
    if (!this.config.enabled) {
      return [];
    }

    this.recording = false;

    // TODO: Disable Chrome DevTools domains
    // await this.mcpClient.send('Performance.disable');
    // await this.mcpClient.send('Network.disable');
    // await this.mcpClient.send('Console.disable');

    const metrics = [...this.metrics];
    this.metrics = [];

    devtoolsLogger.info(`Stopped recording, captured ${metrics.length} metrics`);
    this.emit("recording.stopped", metrics);
    return metrics;
  }

  /**
   * Capture metrics (called by MCP event handlers when integrated)
   */
  private captureMetrics(data: any): void {
    if (!this.recording) return;

    this.metrics.push({
      fps: this.calculateFPS(data),
      memoryUsage: (data.JSHeapUsedSize || 0) / 1024 / 1024, // Convert to MB
      droppedFrames: data.DroppedFrameCount || 0,
      networkRequests: data.RequestCount || 0,
      consoleErrors: [],
      timestamp: Date.now(),
    });

    this.emit("metrics.captured", this.metrics[this.metrics.length - 1]);
  }

  /**
   * Capture console error (called by MCP event handlers when integrated)
   */
  private captureConsoleError(message: any): void {
    if (!this.recording || message.level !== "error") return;

    const lastMetric = this.metrics[this.metrics.length - 1];
    if (lastMetric) {
      lastMetric.consoleErrors.push(message.text);
    }
  }

  /**
   * Calculate FPS from performance data
   */
  private calculateFPS(data: any): number {
    // TODO: Calculate FPS from frame timing data
    return data.FrameRate || 60;
  }

  /**
   * Get average metrics from all captured data
   */
  getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        fps: 0,
        memoryUsage: 0,
        droppedFrames: 0,
        networkRequests: 0,
        consoleErrors: [],
        timestamp: Date.now(),
      };
    }

    const avgFPS =
      this.metrics.reduce((sum, m) => sum + m.fps, 0) / this.metrics.length;
    const maxMemory = Math.max(...this.metrics.map((m) => m.memoryUsage));
    const totalDroppedFrames = this.metrics.reduce(
      (sum, m) => sum + m.droppedFrames,
      0,
    );
    const totalNetworkRequests = this.metrics.reduce(
      (sum, m) => sum + m.networkRequests,
      0,
    );
    const allErrors = [
      ...new Set(this.metrics.flatMap((m) => m.consoleErrors)),
    ];

    return {
      fps: avgFPS,
      memoryUsage: maxMemory,
      droppedFrames: totalDroppedFrames,
      networkRequests: totalNetworkRequests,
      consoleErrors: allErrors,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if monitoring is active
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Get current metrics count
   */
  getMetricsCount(): number {
    return this.metrics.length;
  }
}

// Export singleton instance
export const devToolsMonitor = new DevToolsMonitor({
  enabled: process.env.DEVTOOLS_MONITORING === "true", // Enable via environment variable
});
