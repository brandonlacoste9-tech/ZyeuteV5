/**
 * Circuit Breaker for Vertex AI Models
 * Provides automatic failover from gemini-pro to gemini-flash when primary model fails
 * Prevents cascading failures and ensures zero-downtime AI responses
 */

import { logger } from "../utils/logger.js";

export type GeminiModel = 
  | "gemini-2.0-flash"
  | "gemini-1.5-pro"
  | "gemini-2.0-flash-exp"
  | "gemini-pro-vision";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface ModelState {
  state: CircuitState;
  failureCount: number;
  nextAttempt: number; // Timestamp
  lastError?: string;
}

interface CircuitBreakerOptions {
  failureThreshold?: number; // Default: 3 failures before opening
  resetTimeout?: number; // Default: 10000ms (10 seconds)
  fallbackModel?: GeminiModel; // Default: "gemini-2.0-flash"
}

interface ModelCallResult<T> {
  content: T;
  modelUsed: GeminiModel;
  circuitBreakerIntervened: boolean;
}

type ModelCallFunction<T> = (modelName: GeminiModel, ...args: any[]) => Promise<T>;

/**
 * Circuit Breaker for Vertex AI Model Calls
 * 
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker(vertexAIService.callModel);
 * const result = await breaker.callModel("gemini-1.5-pro", prompt);
 * // If pro fails, automatically uses gemini-2.0-flash
 * ```
 */
export class CircuitBreaker<T = any> {
  private modelStates: Map<GeminiModel, ModelState> = new Map();
  private failureThreshold: number;
  private resetTimeout: number;
  private fallbackModel: GeminiModel;
  private modelCallFn: ModelCallFunction<T>;

  constructor(
    modelCallFn: ModelCallFunction<T>,
    options: CircuitBreakerOptions = {}
  ) {
    this.modelCallFn = modelCallFn;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 10000;
    this.fallbackModel = options.fallbackModel || "gemini-2.0-flash";
  }

  /**
   * Call a model with circuit breaker protection
   * @param modelName - The intended model (e.g., "gemini-1.5-pro")
   * @param args - Arguments to pass to the model call function
   * @returns Result with metadata about which model was actually used
   */
  async callModel(
    modelName: GeminiModel,
    ...args: any[]
  ): Promise<ModelCallResult<T>> {
    // 1. Initialize state if new model
    if (!this.modelStates.has(modelName)) {
      this.modelStates.set(modelName, {
        state: "CLOSED",
        failureCount: 0,
        nextAttempt: 0,
      });
    }

    const state = this.modelStates.get(modelName)!;

    // 2. CRITICAL: If this IS the fallback model, bypass checks to prevent infinite loops
    if (modelName === this.fallbackModel) {
      logger.debug(`[CircuitBreaker] Bypassing checks for fallback model: ${modelName}`);
      try {
        const result = await this.modelCallFn(modelName, ...args);
        return {
          content: result,
          modelUsed: modelName,
          circuitBreakerIntervened: false,
        };
      } catch (error: any) {
        // Even fallback failed - this is a critical error
        logger.error(`[CircuitBreaker] ⚠️ Fallback model ${modelName} failed!`, error);
        throw error;
      }
    }

    // 3. Check Circuit State
    if (state.state === "OPEN") {
      if (Date.now() >= state.nextAttempt) {
        // Timeout passed: Let one request through to test stability (HALF_OPEN)
        logger.info(`[CircuitBreaker] ⏳ Half-Open: Testing ${modelName}...`);
        state.state = "HALF_OPEN";
      } else {
        // Circuit still Open: Fail fast to fallback
        const waitTime = Math.ceil((state.nextAttempt - Date.now()) / 1000);
        logger.warn(
          `[CircuitBreaker] ⛔ Open: Redirecting ${modelName} to ${this.fallbackModel} (cooldown: ${waitTime}s)`
        );
        return this.callModel(this.fallbackModel, ...args);
      }
    }

    // 4. Attempt Execution (CLOSED or HALF_OPEN)
    try {
      const result = await this.modelCallFn(modelName, ...args);

      // Success! Reset breaker
      if (state.failureCount > 0 || state.state === "HALF_OPEN") {
        logger.info(`[CircuitBreaker] 🟢 Recovered: ${modelName} is back online.`);
      }
      state.state = "CLOSED";
      state.failureCount = 0;
      state.lastError = undefined;

      return {
        content: result,
        modelUsed: modelName,
        circuitBreakerIntervened: false,
      };
    } catch (error: any) {
      // Failure Handling
      state.failureCount++;
      state.lastError = error.message;

      const isTripped =
        state.failureCount >= this.failureThreshold ||
        state.state === "HALF_OPEN";

      if (isTripped) {
        state.state = "OPEN";
        state.nextAttempt = Date.now() + this.resetTimeout;
        logger.error(
          `[CircuitBreaker] 💥 TRIPPED: ${modelName} failed ${state.failureCount} times. Cooldown for ${this.resetTimeout}ms.`,
          { error: error.message }
        );
      } else {
        logger.warn(
          `[CircuitBreaker] ⚠️ ${modelName} failed (${state.failureCount}/${this.failureThreshold})`
        );
      }

      // 5. Automatic Failover
      logger.warn(
        `[CircuitBreaker] 🔄 Failover: Swapping ${modelName} → ${this.fallbackModel}`
      );
      return this.callModel(this.fallbackModel, ...args);
    }
  }

  /**
   * Get current state of a model
   */
  getModelState(modelName: GeminiModel): ModelState | undefined {
    return this.modelStates.get(modelName);
  }

  /**
   * Manually reset a model's circuit breaker (for testing/admin)
   */
  resetModel(modelName: GeminiModel): void {
    const state = this.modelStates.get(modelName);
    if (state) {
      state.state = "CLOSED";
      state.failureCount = 0;
      state.nextAttempt = 0;
      state.lastError = undefined;
      logger.info(`[CircuitBreaker] 🔧 Manually reset ${modelName}`);
    }
  }

  /**
   * Get all model states (for monitoring/debugging)
   */
  getAllStates(): Map<GeminiModel, ModelState> {
    return new Map(this.modelStates);
  }
}
