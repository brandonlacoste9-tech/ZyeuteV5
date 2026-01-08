import Redis from "ioredis";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

// Initialize Redis client ONLY if REDIS_HOST provides a specific value (not just default localhost logic if we want to be safe)
// But for safety, let's wrap it.
let redis: Redis | null = null;

if (process.env.REDIS_HOST) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    // Ensure we don't crash if Redis is unavailable
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn(
          "[ModerationCache] Redis connection failed (Max retries). Caching disabled.",
        );
        return null; // stop retrying
      }
      return Math.min(times * 50, 2000);
    },
  });

  // Prevent crash on unhandled error
  redis.on("error", (err) => {
    logger.warn(`[ModerationCache] Redis error: ${err.message}`);
    // Don't crash
  });
} else {
  logger.info("[ModerationCache] REDIS_HOST not set. Caching disabled.");
}

/**
 * Check if moderation result for content is in cache.
 */
export async function checkModerationCache(content: string) {
  try {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    if (!redis) return null;
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
  try {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    if (!redis) return;
    await redis.set(`mod:${hash}`, JSON.stringify(result), "EX", 86400); // 24 hours
  } catch (err) {
    // Silent fail
  }
}
