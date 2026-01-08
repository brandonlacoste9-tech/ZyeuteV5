/**
 * Windows-Use Automation Bridge
 * TypeScript client for communicating with the Python FastAPI bridge service
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger.js";
import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import os from "os";

const bridgeLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[WindowsAutomationBridge] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[WindowsAutomationBridge] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) =>
    logger.warn(`[WindowsAutomationBridge] ${msg}`, ...args),
};

export interface AutomationTask {
  id: string;
  action: string;
  parameters: Record<string, any>;
  timeout?: number;
  llm_provider?: string;
  browser?: string;
}

export interface AutomationResult {
  task_id: string;
  success: boolean;
  data?: any;
  error?: string;
  performance_metrics?: {
    execution_time: number;
    memory_usage_mb: number;
  };
}

export interface BridgeConfig {
  pythonExecutable: string;
  scriptPath: string;
  servicePort: number;
  serviceHost?: string;
  autoStart?: boolean;
}

export class WindowsAutomationBridge extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private taskQueue: Map<string, AutomationTask> = new Map();
  private config: BridgeConfig;
  private serviceUrl: string;
  private isReady: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<BridgeConfig> = {}) {
    super();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, "../../../");

    this.config = {
      pythonExecutable: config.pythonExecutable || this.findPythonExecutable(),
      scriptPath:
        config.scriptPath ||
        join(projectRoot, "Windows-Use", "bridge_service.py"),
      servicePort: config.servicePort || 8001,
      serviceHost: config.serviceHost || "127.0.0.1",
      autoStart: config.autoStart !== false,
    };

    this.serviceUrl = `http://${this.config.serviceHost}:${this.config.servicePort}`;

    bridgeLogger.info(
      `Initialized bridge with config: ${JSON.stringify(this.config)}`,
    );
  }

  /**
   * Start the Python bridge service
   */
  async start(): Promise<void> {
    if (this.pythonProcess) {
      bridgeLogger.warn("Bridge service already running");
      return;
    }

    bridgeLogger.info(`Starting Python bridge service at ${this.serviceUrl}`);

    try {
      // Start Python service as subprocess
      this.pythonProcess = spawn(this.config.pythonExecutable, [
        this.config.scriptPath,
        "--port",
        this.config.servicePort.toString(),
        "--host",
        this.config.serviceHost || "127.0.0.1",
      ]);

      // Handle stdout
      this.pythonProcess.stdout?.on("data", (data: Buffer) => {
        const message = data.toString();
        bridgeLogger.info(`Python stdout: ${message.trim()}`);
        this.emit("log", message);
      });

      // Handle stderr
      this.pythonProcess.stderr?.on("data", (data: Buffer) => {
        const error = data.toString();
        bridgeLogger.error(`Python stderr: ${error.trim()}`);
        this.emit("error", error);
      });

      // Handle process exit
      this.pythonProcess.on("exit", (code, signal) => {
        bridgeLogger.warn(
          `Python process exited with code ${code}, signal ${signal}`,
        );
        this.pythonProcess = null;
        this.isReady = false;
        this.emit("exit", code, signal);
      });

      // Wait for service to be ready
      await this.waitForReady();

      // Start health check
      this.startHealthCheck();
    } catch (error: any) {
      bridgeLogger.error(`Failed to start Python service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the Python bridge service
   */
  async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pythonProcess) {
      bridgeLogger.info("Stopping Python bridge service");
      this.pythonProcess.kill("SIGTERM");
      this.pythonProcess = null;
      this.isReady = false;
    }
  }

  /**
   * Execute an automation task
   */
  async executeTask(task: AutomationTask): Promise<AutomationResult> {
    // Auto-check health if not ready
    if (!this.isReady) {
      const isHealthy = await this.checkHealth();
      if (isHealthy) {
        this.isReady = true;
      } else {
        throw new Error("Bridge service is not ready");
      }
    }

    this.taskQueue.set(task.id, task);

    try {
      const response = await fetch(`${this.serviceUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const result: AutomationResult = await response.json();
      this.taskQueue.delete(task.id);

      this.emit("task.completed", task.id, result);
      return result;
    } catch (error: any) {
      this.taskQueue.delete(task.id);
      bridgeLogger.error(`Task ${task.id} failed: ${error.message}`);

      const errorResult: AutomationResult = {
        task_id: task.id,
        success: false,
        error: error.message,
      };

      this.emit("task.failed", task.id, errorResult);
      return errorResult;
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === "ready";
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service metrics
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.serviceUrl}/metrics`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      bridgeLogger.error(`Failed to get metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Wait for service to be ready (polling)
   */
  private async waitForReady(): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      const isReady = await this.checkHealth();
      if (isReady) {
        this.isReady = true;
        bridgeLogger.info("Bridge service is ready");
        this.emit("ready");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(
      `Python service failed to start within ${maxAttempts * delayMs}ms`,
    );
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkHealth();
      if (!isHealthy && this.isReady) {
        bridgeLogger.warn("Service health check failed");
        this.isReady = false;
        this.emit("unhealthy");
      } else if (isHealthy && !this.isReady) {
        bridgeLogger.info("Service health check passed");
        this.isReady = true;
        this.emit("ready");
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Find Python executable on the system
   */
  private findPythonExecutable(): string {
    const candidates = ["python3", "python", "py"];
    const platform = os.platform();

    // On Windows, try common paths
    if (platform === "win32") {
      const winCandidates = [
        "python.exe",
        "py.exe",
        join(process.env.PYTHON_HOME || "", "python.exe"),
        join(process.env.LOCALAPPDATA || "", "Programs", "Python", "python.exe"),
      ];

      // Check environment variable first
      if (process.env.PYTHON_PATH) {
        return process.env.PYTHON_PATH;
      }

      // Try common Windows paths
      for (const candidate of winCandidates) {
        try {
          require("child_process").execSync(
            `"${candidate}" --version`,
            { stdio: "ignore" },
          );
          return candidate;
        } catch {
          // Continue to next candidate
        }
      }
    }

    // For Unix-like systems, try standard commands
    for (const candidate of candidates) {
      try {
        require("child_process").execSync(`${candidate} --version`, {
          stdio: "ignore",
        });
        return candidate;
      } catch {
        // Continue to next candidate
      }
    }

    // Default fallback
    return "python";
  }

  /**
   * Get service status
   */
  getStatus(): {
    isReady: boolean;
    serviceUrl: string;
    queuedTasks: number;
  } {
    return {
      isReady: this.isReady,
      serviceUrl: this.serviceUrl,
      queuedTasks: this.taskQueue.size,
    };
  }
}

// Export singleton instance
export const windowsAutomationBridge = new WindowsAutomationBridge({
  autoStart: false, // Don't auto-start, let backend initialize it
});
