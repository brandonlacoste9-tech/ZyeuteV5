import Redis from "ioredis";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

// Initialize Redis client using existing env vars
const redisHost = process.env.REDIS_HOST;
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD;
const redisUsername = process.env.REDIS_USERNAME;
const redisTLS = process.env.REDIS_TLS === "true";

// Initialize Redis client only if REDIS_HOST is set (graceful degradation)
let redis: Redis | null = null;

if (redisHost) {
  // Redis is configured - initialize connection
  redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    username: redisUsername,
    tls: redisTLS ? {} : undefined, // Support TLS for managed Redis (Railway/Upstash)
    // Ensure we don't crash if Redis is unavailable
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // stop retrying
      }
      return Math.min(times * 50, 2000);
    },
  });

  // Handle Redis errors to prevent unhandled exception crash
  redis.on("error", (err: any) => {
    logger.warn(`[ModerationCache] Redis Error: ${err.message}`);
  });

  redis.on("connect", () => {
    logger.info("[ModerationCache] Redis connection initialized");
  });
} else {
  // Redis not configured - graceful degradation
  logger.info("[ModerationCache] Redis disabled (REDIS_HOST not set)");
}

/**
 * Check if moderation result for content is in cache.
 */
export async function checkModerationCache(content: string) {
  // Skip cache if Redis is not available
  if (!redis) {
    return null;
  }

  try {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const cached = await redis.get(`mod:${hash}`);

    if (cached) {
      logger.info(
        `[ModerationCache] Cache hit for hash: ${hash.substring(0, 8)}`,
      );
      return JSON.parse(cached);
    }
  } catch (err) {
    // Silent fail for cache
  }
  return null;
}

/**
 * Store moderation result in cache.
 */
export async function setModerationCache(content: string, result: any) {
  // Skip cache if Redis is not available
  if (!redis) {
    return;
  }

  try {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    await redis.set(`mod:${hash}`, JSON.stringify(result), "EX", 86400); // 24 hours
  } catch (err) {
    // Silent fail
  }
}
