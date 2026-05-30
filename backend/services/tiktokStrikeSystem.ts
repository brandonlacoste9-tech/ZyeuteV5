/**
 * TikTok-Style Strike System
 * Implements TikTok's 5-strike system with 90-day rolling window
 */

import { storage } from "../storage.js";
import { db } from "../storage.js";
import { moderationLogs, users } from "../../shared/schema.js";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { logger } from "../utils/logger.js";

export type StrikeType =
  | "warning"
  | "feature_specific"
  | "policy_specific"
  | "cumulative"
  | "severe_violation";

export interface StrikeRecord {
  userId: string;
  strikeType: StrikeType;
  violationCategory: string;
  severity: number; // 1-10
  expiresAt: Date;
  createdAt: Date;
}

const STRIKE_EXPIRATION_DAYS = 90; // TikTok uses 90-day rolling window
const CUMULATIVE_STRIKE_THRESHOLD = 5; // 5+ strikes in 90 days = permanent ban risk

/**
 * Add a strike to a user (TikTok-style)
 */
export async function addStrike(
  userId: string,
  strikeType: StrikeType,
  violationCategory: string,
  severity: number = 5,
): Promise<StrikeRecord> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + STRIKE_EXPIRATION_DAYS);

  // Log as moderation action
  await storage.createModerationLog({
    userId,
    action: `strike_${strikeType}`,
    reason: `TikTok-style strike: ${strikeType}`,
    details: `Violation category: ${violationCategory}, Severity: ${severity}`,
    score: severity,
  });

  const strike: StrikeRecord = {
    userId,
    strikeType,
    violationCategory,
    severity,
    expiresAt,
    createdAt: new Date(),
  };

  // Check if user should be banned (cumulative strikes)
  const strikeCount = await getStrikeCount(userId);
  if (strikeCount >= CUMULATIVE_STRIKE_THRESHOLD) {
    logger.warn(
      `[TikTokStrikeSystem] User ${userId} has ${strikeCount} strikes (threshold: ${CUMULATIVE_STRIKE_THRESHOLD}) - Permanent ban risk`,
    );
    await handleCumulativeStrikes(userId, strikeCount);
  }

  return strike;
}

/**
 * Get strike count for a user (within 90-day window)
 */
export async function getStrikeCount(userId: string): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - STRIKE_EXPIRATION_DAYS);

  const strikes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(moderationLogs)
    .where(
      and(
        eq(moderationLogs.userId, userId),
        sql`${moderationLogs.action} LIKE 'strike_%'`,
        gte(moderationLogs.createdAt, ninetyDaysAgo),
      ),
    );

  return Number(strikes[0]?.count) || 0;
}

/**
 * Get all active strikes for a user
 */
export async function getActiveStrikes(
  userId: string,
): Promise<StrikeRecord[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - STRIKE_EXPIRATION_DAYS);

  const logs = await db
    .select()
    .from(moderationLogs)
    .where(
      and(
        eq(moderationLogs.userId, userId),
        sql`${moderationLogs.action} LIKE 'strike_%'`,
        gte(moderationLogs.createdAt, ninetyDaysAgo),
      ),
    )
    .orderBy(desc(moderationLogs.createdAt));

  return logs.map((log) => {
    const strikeType = log.action.replace("strike_", "") as StrikeType;
    const expiresAt = new Date(log.createdAt || new Date());
    expiresAt.setDate(expiresAt.getDate() + STRIKE_EXPIRATION_DAYS);

    return {
      userId: log.userId,
      strikeType,
      violationCategory: log.reason || "unknown",
      severity: log.score || 5,
      expiresAt,
      createdAt: log.createdAt || new Date(),
    };
  });
}

/**
 * Handle cumulative strikes (5+ in 90 days = permanent ban risk)
 */
async function handleCumulativeStrikes(
  userId: string,
  strikeCount: number,
): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user || user.role === "banned") {
    return; // Already banned
  }

  logger.warn(
    `[TikTokStrikeSystem] User ${userId} reached cumulative strike threshold (${strikeCount} strikes)`,
  );

  // Ban user (TikTok-style: 5+ strikes = permanent ban risk)
  await storage.updateUser(userId, {
    role: "banned",
    bio: "COMPTE DÉSACTIVÉ : Vous avez accumulé 5 violations ou plus dans les 90 derniers jours. Système de strikes TikTok.",
  });

  await storage.createModerationLog({
    userId,
    action: "ban",
    reason: "Cumulative strikes threshold reached (TikTok-style)",
    details: `${strikeCount} strikes within 90 days`,
    score: 10,
  });
}

/**
 * Check if user should receive a strike based on violation
 */
export async function shouldAddStrike(
  userId: string,
  violationSeverity: "low" | "medium" | "high" | "critical",
): Promise<{ shouldStrike: boolean; strikeType: StrikeType }> {
  // Severe violations = immediate permanent ban (no strike)
  if (violationSeverity === "critical") {
    return { shouldStrike: false, strikeType: "severe_violation" };
  }

  // High severity = policy-specific strike
  if (violationSeverity === "high") {
    return { shouldStrike: true, strikeType: "policy_specific" };
  }

  // Medium severity = feature-specific strike
  if (violationSeverity === "medium") {
    return { shouldStrike: true, strikeType: "feature_specific" };
  }

  // Low severity = warning strike
  if (violationSeverity === "low") {
    return { shouldStrike: true, strikeType: "warning" };
  }

  return { shouldStrike: false, strikeType: "warning" };
}

/**
 * Apply TikTok-style penalties based on strike type
 */
export async function applyStrikePenalties(
  userId: string,
  strikeType: StrikeType,
): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) return;

  switch (strikeType) {
    case "warning":
      // Educational notification, no reach reduction
      logger.info(
        `[TikTokStrikeSystem] Warning strike for ${userId} - No penalty`,
      );
      break;

    case "feature_specific":
      // Disable specific features for 24-168 hours
      // For now, we'll flag for manual feature restriction
      await storage.createModerationLog({
        userId,
        action: "feature_restriction",
        reason: "Feature-specific strike (TikTok-style)",
        details: "Disable comments, LIVE, DMs, duets/stitches for 24-168 hours",
        score: 3,
      });
      break;

    case "policy_specific":
      // Reduce For You page visibility by 60-80%
      await storage.createModerationLog({
        userId,
        action: "reach_reduction",
        reason: "Policy-specific strike (TikTok-style)",
        details: "Reduce For You page visibility by 60-80%",
        score: 5,
      });
      break;

    case "cumulative":
      // Already handled in handleCumulativeStrikes
      break;

    case "severe_violation":
      // Immediate permanent ban (handled elsewhere)
      break;
  }
}
