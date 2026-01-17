import Redis from "ioredis";
import { logger } from "./utils/logger.js";

/**
 * Centralized Redis client configuration and health monitoring
 * Used by: moderation cache, BullMQ queues, session storage
 *
 * Supports two configuration methods:
 * 1. REDIS_URL (e.g., redis://user:pass@host:port or rediss:// for TLS)
 * 2. Individual env vars (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, etc.)
 */

/**
 * Parse Redis URL into connection config
 * Supports: redis://[username:password@]host:port[/db]
 *           rediss://[username:password@]host:port[/db] (with TLS)
 */
function parseRedisUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const useTls = parsedUrl.protocol === "rediss:";

    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port || "6379"),
      password: parsedUrl.password || undefined,
      username: parsedUrl.username || undefined,
      tls: useTls ? {} : undefined,
      db: parsedUrl.pathname ? parseInt(parsedUrl.pathname.slice(1)) : 0,
    };
  } catch (error: any) {
    logger.error(`[Redis] Failed to parse REDIS_URL: ${error.message}`);
    return null;
  }
}

// Redis configuration from environment variables
// Priority: REDIS_URL > individual env vars
let redisConfig: any;

if (process.env.REDIS_URL) {
  logger.info("[Redis] Using REDIS_URL for configuration");
  const parsed = parseRedisUrl(process.env.REDIS_URL);
  if (parsed) {
    redisConfig = {
      ...parsed,
      maxRetriesPerRequest: null, // Required for BullMQ compatibility
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error("[Redis] Max retries reached, stopping reconnection attempts");
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        logger.warn(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
    };
  } else {
    logger.error("[Redis] Invalid REDIS_URL format, falling back to individual env vars");
    redisConfig = null;
  }
} else {
  // Use individual environment variables
  redisConfig = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    maxRetriesPerRequest: null, // Required for BullMQ compatibility
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.error("[Redis] Max retries reached, stopping reconnection attempts");
        return null; // Stop retrying after 3 attempts
      }
      const delay = Math.min(times * 50, 2000);
      logger.warn(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
  };
}

export { redisConfig };

// Singleton Redis client instance
let redisClient: Redis | null = null;
let redisConnectionStatus: "connected" | "disconnected" | "not_configured" =
  "not_configured";
let redisLastError: string | null = null;

/**
 * Initialize Redis client with proper error handling and logging
 */
export function initializeRedis(): Redis | null {
  // Return existing client if already initialized
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis is configured (either REDIS_URL or REDIS_HOST)
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    logger.info(
      "[Redis] Not configured (REDIS_URL or REDIS_HOST not set) - Running in degraded mode",
    );
    redisConnectionStatus = "not_configured";
    return null;
  }

  // Check if we have a valid config
  if (!redisConfig || !redisConfig.host) {
    logger.error("[Redis] Invalid configuration - check REDIS_URL or REDIS_HOST");
    redisConnectionStatus = "not_configured";
    return null;
  }

  try {
    logger.info(
      `[Redis] Initializing connection to ${redisConfig.host}:${redisConfig.port}`,
    );

    redisClient = new Redis(redisConfig);

    // Connection event handlers
    redisClient.on("connect", () => {
      logger.info("[Redis] ✅ Connection established");
      redisConnectionStatus = "connected";
      redisLastError = null;
    });

    redisClient.on("ready", () => {
      logger.info("[Redis] ✅ Client ready to receive commands");
    });

    redisClient.on("error", (err: any) => {
      logger.error(`[Redis] ❌ Connection error: ${err.message}`);
      redisConnectionStatus = "disconnected";
      redisLastError = err.message;
    });

    redisClient.on("close", () => {
      logger.warn("[Redis] Connection closed");
      redisConnectionStatus = "disconnected";
    });

    redisClient.on("reconnecting", (delay: number) => {
      logger.info(`[Redis] Reconnecting in ${delay}ms...`);
    });

    return redisClient;
  } catch (error: any) {
    logger.error(`[Redis] Failed to initialize: ${error.message}`);
    redisConnectionStatus = "disconnected";
    redisLastError = error.message;
    return null;
  }
}

/**
 * Get the shared Redis client instance
 * Returns null if Redis is not configured or connection failed
 */
export function getRedisClient(): Redis | null {
  if (!redisClient) {
    return initializeRedis();
  }
  return redisClient;
}

/**
 * Check Redis health status for monitoring endpoints
 */
export async function checkRedisHealth(): Promise<{
  status: "connected" | "disconnected" | "not_configured";
  message: string;
  error?: string;
  latency?: number;
}> {
  // Not configured - graceful degradation
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    return {
      status: "not_configured",
      message: "Redis not configured (REDIS_URL or REDIS_HOST not set) - Running in cache-free mode",
    };
  }

  const client = getRedisClient();

  // Failed to initialize
  if (!client) {
    return {
      status: "disconnected",
      message: "Redis client failed to initialize",
      error: redisLastError || "Unknown error",
    };
  }

  try {
    const startTime = Date.now();
    await client.ping();
    const latency = Date.now() - startTime;

    return {
      status: "connected",
      message: "Redis connection healthy",
      latency,
    };
  } catch (error: any) {
    return {
      status: "disconnected",
      message: "Redis ping failed",
      error: error.message,
    };
  }
}

/**
 * Get BullMQ-compatible connection configuration
 * Returns the same config object for connection pooling
 */
export function getBullMQConnection() {
  return redisConfig;
}

/**
 * Gracefully close Redis connection (for shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    logger.info("[Redis] Closing connection...");
    try {
      await redisClient.quit();
      logger.info("[Redis] Connection closed gracefully");
    } catch (error: any) {
      logger.error(`[Redis] Error closing connection: ${error.message}`);
    } finally {
      redisClient = null;
      redisConnectionStatus = "disconnected";
    }
  }
}

// Initialize Redis on module load
initializeRedis();
