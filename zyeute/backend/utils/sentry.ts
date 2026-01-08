/**
 * Sentry Error Tracking Configuration
 * Provides centralized Sentry initialization and context helpers
 */

import * as Sentry from "@sentry/node";
import { readFileSync } from "fs";
import { join } from "path";

let isInitialized = false;

/**
 * Initialize Sentry with configuration from environment variables
 * Non-blocking: If Sentry DSN is not configured, initialization is skipped
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    // Sentry not configured - this is okay for development
    return;
  }

  if (isInitialized) {
    // Already initialized
    return;
  }

  try {
    // Get version from package.json
    let release: string | undefined;
    try {
      const packageJsonPath = join(process.cwd(), "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      release = packageJson.version || undefined;
    } catch {
      // Ignore if package.json not found
    }

    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
      release,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
          }
        }
        return event;
      },
    });

    isInitialized = true;
    console.log("✅ Sentry initialized");
  } catch (error) {
    console.error("⚠️  Sentry initialization failed:", error);
    // Don't throw - allow app to continue without Sentry
  }
}

/**
 * Wrap an async function with Sentry error tracking
 */
export function withSentryContext<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: {
    operation?: string;
    tags?: Record<string, string>;
    userId?: string;
  }
): T {
  return (async (...args: Parameters<T>) => {
    if (!isInitialized) {
      return fn(...args);
    }

    const transaction = Sentry.startTransaction({
      op: context.operation || "function",
      name: fn.name || "anonymous",
    });

    Sentry.getCurrentScope().setContext("function", {
      name: fn.name,
      ...context,
    });

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        Sentry.getCurrentScope().setTag(key, value);
      });
    }

    if (context.userId) {
      Sentry.getCurrentScope().setUser({ id: context.userId });
    }

    try {
      const result = await fn(...args);
      transaction.setStatus("ok");
      return result;
    } catch (error) {
      transaction.setStatus("internal_error");
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }) as T;
}

/**
 * Set user context for Sentry
 */
export function setUserContext(userId: string, metadata?: Record<string, any>): void {
  if (!isInitialized) return;
  
  Sentry.getCurrentScope().setUser({
    id: userId,
    ...metadata,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  if (!isInitialized) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  userId?: string;
}): void {
  if (!isInitialized) {
    // Fallback to console logging
    console.error("Error (Sentry not configured):", error);
    return;
  }

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      Sentry.getCurrentScope().setTag(key, value);
    });
  }

  if (context?.extra) {
    Sentry.getCurrentScope().setExtras(context.extra);
  }

  if (context?.userId) {
    Sentry.getCurrentScope().setUser({ id: context.userId });
  }

  Sentry.captureException(error);
}

/**
 * Flush Sentry events (important for background workers)
 * Call this before process exit to ensure events are sent
 */
export async function flushSentry(timeout: number = 2000): Promise<void> {
  if (!isInitialized) return;
  
  try {
    await Sentry.flush(timeout);
  } catch (error) {
    console.error("Failed to flush Sentry:", error);
  }
}
