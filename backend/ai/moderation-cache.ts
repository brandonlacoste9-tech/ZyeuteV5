import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { getRedisClient } from "../redis.js";

/**
 * Moderation cache using centralized Redis client
 * Caches AI moderation results with SHA256 hash keys
 */

/**
 * Check if moderation result for content is in cache.
 */
export async function checkModerationCache(content: string) {
  const redis = getRedisClient();

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
    logger.warn(`[ModerationCache] Cache read error: ${err}`);
  }
  return null;
}

/**
 * Store moderation result in cache.
 */
export async function setModerationCache(content: string, result: any) {
  const redis = getRedisClient();

  // Skip cache if Redis is not available
  if (!redis) {
    return;
  }

  try {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    await redis.set(`mod:${hash}`, JSON.stringify(result), "EX", 86400); // 24 hours
  } catch (err) {
    logger.warn(`[ModerationCache] Cache write error: ${err}`);
  }
}
