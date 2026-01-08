/**
 * ⚡ Circuit Breaker Pattern for Colony OS
 *
 * Prevents cascade failures by:
 * 1. Tracking consecutive errors
 * 2. Opening circuit when threshold exceeded
 * 3. Allowing test requests after reset period
 * 4. Closing circuit on successful recovery
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failing, requests rejected immediately
 * - HALF_OPEN: Testing recovery with limited requests
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting recovery */
  resetTimeout: number;
  /** Number of test requests in half-open state before closing */
  successThreshold: number;
  /** Name for logging purposes */
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 3,
  name: "default",
};

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private lastStateChange: Date = new Date();
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if request should be allowed
   */
  canRequest(): boolean {
    this.checkStateTransition();

    switch (this.state) {
      case "CLOSED":
        return true;
      case "OPEN":
        return false;
      case "HALF_OPEN":
        // Allow limited requests for testing
        return true;
      default:
        return false;
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canRequest()) {
      throw new CircuitBreakerOpenError(
        `Circuit breaker ${this.config.name} is OPEN. Retry after ${this.getRemainingResetTime()}ms`,
      );
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Execute with fallback on circuit open or failure
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T> | T,
  ): Promise<T> {
    if (!this.canRequest()) {
      console.log(`⚡ Circuit ${this.config.name} OPEN - using fallback`);
      return fallback();
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      console.log(
        `⚡ Circuit ${this.config.name} error - using fallback:`,
        error,
      );
      return fallback();
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.lastSuccess = new Date();
    this.failures = 0; // Reset consecutive failures

    if (this.state === "HALF_OPEN") {
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo("CLOSED");
        console.log(
          `✅ Circuit ${this.config.name} CLOSED - service recovered`,
        );
      }
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailure = new Date();
    this.successes = 0; // Reset consecutive successes

    console.log(
      `⚠️ Circuit ${this.config.name} failure ${this.failures}/${this.config.failureThreshold}`,
    );

    if (
      this.state === "CLOSED" &&
      this.failures >= this.config.failureThreshold
    ) {
      this.transitionTo("OPEN");
      console.log(`🔴 Circuit ${this.config.name} OPENED - too many failures`);
    } else if (this.state === "HALF_OPEN") {
      // Any failure in half-open immediately opens circuit
      this.transitionTo("OPEN");
      console.log(`🔴 Circuit ${this.config.name} re-OPENED from HALF_OPEN`);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.successes = 0;
    this.lastStateChange = new Date();
    console.log(`🔄 Circuit ${this.config.name} manually reset to CLOSED`);
  }

  /**
   * Get remaining time before reset attempt (ms)
   */
  getRemainingResetTime(): number {
    if (this.state !== "OPEN") return 0;
    const elapsed = Date.now() - this.lastStateChange.getTime();
    return Math.max(0, this.config.resetTimeout - elapsed);
  }

  /**
   * Check if state should transition based on timeout
   */
  private checkStateTransition(): void {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastStateChange.getTime();
      if (elapsed >= this.config.resetTimeout) {
        this.transitionTo("HALF_OPEN");
        console.log(
          `🟡 Circuit ${this.config.name} HALF_OPEN - testing recovery`,
        );
      }
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = new Date();
    this.failures = 0;
    this.successes = 0;
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitBreakerOpenError";
  }
}

// ═══════════════════════════════════════════════════════════════
// PRE-CONFIGURED CIRCUIT BREAKERS FOR ZYEUTÉ
// ═══════════════════════════════════════════════════════════════

/**
 * Circuit breaker for DeepSeek API calls
 */
export const deepSeekCircuit = new CircuitBreaker({
  name: "DeepSeek",
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
});

/**
 * Circuit breaker for Colony OS swarm
 */
export const swarmCircuit = new CircuitBreaker({
  name: "ColonySwarm",
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 3,
});

/**
 * Circuit breaker for Supabase operations
 */
export const supabaseCircuit = new CircuitBreaker({
  name: "Supabase",
  failureThreshold: 5,
  resetTimeout: 15000, // 15 seconds
  successThreshold: 2,
});

/**
 * Circuit breaker for external APIs (Stripe, etc)
 */
export const externalApiCircuit = new CircuitBreaker({
  name: "ExternalAPI",
  failureThreshold: 3,
  resetTimeout: 45000, // 45 seconds
  successThreshold: 2,
});

// ═══════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * Example: Protected DeepSeek call with fallback
 *
 * ```typescript
 * import { deepSeekCircuit } from './CircuitBreaker';
 *
 * const response = await deepSeekCircuit.executeWithFallback(
 *   async () => {
 *     // Primary: Call DeepSeek API
 *     return await deepseek.chat.completions.create({...});
 *   },
 *   () => {
 *     // Fallback: Return cached or default response
 *     return { choices: [{ message: { content: "Tiguidou! 🐝" } }] };
 *   }
 * );
 * ```
 */

/**
 * Example: Monitor all circuits
 *
 * ```typescript
 * function getSystemHealth() {
 *   return {
 *     deepSeek: deepSeekCircuit.getStats(),
 *     swarm: swarmCircuit.getStats(),
 *     supabase: supabaseCircuit.getStats(),
 *     external: externalApiCircuit.getStats()
 *   };
 * }
 * ```
 */

export default {
  CircuitBreaker,
  CircuitBreakerOpenError,
  deepSeekCircuit,
  swarmCircuit,
  supabaseCircuit,
  externalApiCircuit,
};
