/**
 * Production-safe logging utility
 * Automatically disables or downgrades logs in production builds
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment =
  import.meta.env.MODE === "development" || import.meta.env.DEV;

/**
 * Logger configuration
 */
const config = {
  // In production, only show warnings and errors
  // In development, show everything
  levels: {
    debug: isDevelopment,
    info: isDevelopment,
    warn: true, // Always show warnings
    error: true, // Always show errors
  },
  // Prefix for all logs (helps identify source)
  prefix: "[Zyeuté]",
};

/**
 * Logger class with environment-aware logging
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    return config.levels[level] ?? false;
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const timestamp = new Date().toISOString();
    const prefix = `${config.prefix} [${level.toUpperCase()}] [${timestamp}]`;
    return [prefix, ...args];
  }

  /**
   * Debug logs - only in development
   */
  debug(...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(...this.formatMessage("debug", ...args));
    }
  }

  /**
   * Info logs - only in development
   */
  info(...args: any[]): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("info", ...args));
    }
  }

  /**
   * Warning logs - always shown
   */
  warn(...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", ...args));
    }
  }

  /**
   * Error logs - always shown
   */
  error(...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", ...args));
    }
  }

  /**
   * Group logs together (only in development)
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(`${config.prefix} ${label}`);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log with context (useful for API calls, user actions)
   */
  withContext(context: string) {
    return {
      debug: (...args: any[]) => this.debug(`[${context}]`, ...args),
      info: (...args: any[]) => this.info(`[${context}]`, ...args),
      warn: (...args: any[]) => this.warn(`[${context}]`, ...args),
      error: (...args: any[]) => this.error(`[${context}]`, ...args),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;
