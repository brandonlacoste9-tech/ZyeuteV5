/**
 * BugBot Rate Limiter
 * Prevents BugBot from overwhelming the system
 */

export interface RateLimitConfig {
  maxBugsPerMinute: number;
  maxBugsPerHour: number;
  maxBugsPerDay: number;
  backpressureThreshold: number; // Max bugs in queue
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxBugsPerMinute: 100,
  maxBugsPerHour: 1000,
  maxBugsPerDay: 10000,
  backpressureThreshold: 500,
};

/**
 * BugBot Rate Limiter
 * Tracks bug detection rates and applies backpressure
 */
export class BugBotRateLimiter {
  private config: RateLimitConfig = DEFAULT_CONFIG;
  private bugCounts: {
    minute: Array<{ timestamp: number }>;
    hour: Array<{ timestamp: number }>;
    day: Array<{ timestamp: number }>;
  } = {
    minute: [],
    hour: [],
    day: [],
  };
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  /**
   * Check if bug detection is allowed
   */
  canDetectBug(): { allowed: boolean; reason?: string } {
    const now = Date.now();

    // Clean old entries
    this.bugCounts.minute = this.bugCounts.minute.filter(
      (entry) => now - entry.timestamp < 60000
    );
    this.bugCounts.hour = this.bugCounts.hour.filter(
      (entry) => now - entry.timestamp < 3600000
    );
    this.bugCounts.day = this.bugCounts.day.filter(
      (entry) => now - entry.timestamp < 86400000
    );

    // Check limits
    if (this.bugCounts.minute.length >= this.config.maxBugsPerMinute) {
      return { allowed: false, reason: "Rate limit: too many bugs per minute" };
    }

    if (this.bugCounts.hour.length >= this.config.maxBugsPerHour) {
      return { allowed: false, reason: "Rate limit: too many bugs per hour" };
    }

    if (this.bugCounts.day.length >= this.config.maxBugsPerDay) {
      return { allowed: false, reason: "Rate limit: too many bugs per day" };
    }

    // Check backpressure
    if (this.queue.length >= this.config.backpressureThreshold) {
      return { allowed: false, reason: "Backpressure: queue is full" };
    }

    return { allowed: true };
  }

  /**
   * Record bug detection
   */
  recordBugDetection(): void {
    const now = Date.now();
    this.bugCounts.minute.push({ timestamp: now });
    this.bugCounts.hour.push({ timestamp: now });
    this.bugCounts.day.push({ timestamp: now });
  }

  /**
   * Queue bug detection (for async processing)
   */
  async queueBugDetection(fn: () => Promise<void>): Promise<void> {
    if (this.queue.length >= this.config.backpressureThreshold) {
      throw new Error("Bug detection queue is full");
    }

    this.queue.push(fn);
    this.processQueue();
  }

  /**
   * Process queued bug detections
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        try {
          await fn();
        } catch (error) {
          console.error("[BugBotRateLimiter] Error processing queued bug:", error);
        }
      }

      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.processing = false;
  }

  /**
   * Get current rate statistics
   */
  getRateStats(): {
    bugsPerMinute: number;
    bugsPerHour: number;
    bugsPerDay: number;
    queueLength: number;
  } {
    return {
      bugsPerMinute: this.bugCounts.minute.length,
      bugsPerHour: this.bugCounts.hour.length,
      bugsPerDay: this.bugCounts.day.length,
      queueLength: this.queue.length,
    };
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const bugBotRateLimiter = new BugBotRateLimiter();
