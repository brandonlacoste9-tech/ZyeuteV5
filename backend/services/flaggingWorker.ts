/**
 * Flagging Worker
 * Background job to periodically scan and flag users based on relationships
 */

import { storage } from "../storage.js";
import { db } from "../storage.js";
import { users, moderationLogs } from "../../shared/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { scanAndFlagRelatedUsers } from "./userFlaggingSystem.js";
import { analyzeUserRelationships } from "./userRelationshipAnalyzer.js";

const workerLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[FlaggingWorker] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[FlaggingWorker] ${msg}`, ...args),
};

/**
 * Scan all recently banned users and flag their related users
 */
export async function scanRecentBans(): Promise<number> {
  workerLogger.info("Starting scan of recent bans...");

  try {
    // Get users banned in the last 24 hours
    const recentBans = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "banned"),
          sql`${users.updatedAt} > NOW() - INTERVAL '24 hours'`,
        ),
      );

    workerLogger.info(`Found ${recentBans.length} recently banned users`);

    let totalFlags = 0;

    for (const bannedUser of recentBans) {
      try {
        const flags = await scanAndFlagRelatedUsers(bannedUser.id);
        totalFlags += flags.length;
        workerLogger.info(
          `Scanned ${bannedUser.username} (${bannedUser.id}): ${flags.length} users flagged`,
        );
      } catch (error: any) {
        workerLogger.error(`Error scanning ${bannedUser.id}: ${error.message}`);
      }
    }

    workerLogger.info(`Scan complete: ${totalFlags} total users flagged`);
    return totalFlags;
  } catch (error: any) {
    workerLogger.error(`Error in scanRecentBans: ${error.message}`, error);
    return 0;
  }
}

/**
 * Scan high-risk users (users with high risk scores but not yet flagged)
 */
export async function scanHighRiskUsers(): Promise<number> {
  workerLogger.info("Starting scan of high-risk users...");

  try {
    // Get users with recent moderation violations
    const usersWithViolations = await db
      .select({
        userId: moderationLogs.userId,
        maxScore: sql<number>`MAX(${moderationLogs.score})`,
        violationCount: sql<number>`COUNT(*)::int`,
      })
      .from(moderationLogs)
      .where(
        and(
          sql`${moderationLogs.createdAt} > NOW() - INTERVAL '7 days'`,
          sql`${moderationLogs.score} >= 3`,
        ),
      )
      .groupBy(moderationLogs.userId)
      .having(sql`MAX(${moderationLogs.score}) >= 5 OR COUNT(*) >= 3`);

    workerLogger.info(`Found ${usersWithViolations.length} high-risk users`);

    let flaggedCount = 0;

    for (const userViolation of usersWithViolations) {
      try {
        // Skip if already banned
        const user = await storage.getUser(userViolation.userId);
        if (!user || user.role === "banned") {
          continue;
        }

        // Analyze relationships
        const analysis = await analyzeUserRelationships(
          userViolation.userId,
          2,
        );

        // Flag if risk score is high
        if (analysis.riskScore >= 40 || analysis.recommendedAction !== "none") {
          const { flagUserForReview, DEFAULT_FLAGGING_RULES } =
            await import("./userFlaggingSystem.js");

          // Use pattern detection rule
          const patternRule = DEFAULT_FLAGGING_RULES.find(
            (r) => r.id === "pattern_detection",
          );
          if (patternRule) {
            await flagUserForReview(
              userViolation.userId,
              analysis,
              patternRule,
            );
            flaggedCount++;
            workerLogger.info(
              `Flagged high-risk user ${userViolation.userId} (risk score: ${analysis.riskScore})`,
            );
          }
        }
      } catch (error: any) {
        workerLogger.error(
          `Error analyzing ${userViolation.userId}: ${error.message}`,
        );
      }
    }

    workerLogger.info(`High-risk scan complete: ${flaggedCount} users flagged`);
    return flaggedCount;
  } catch (error: any) {
    workerLogger.error(`Error in scanHighRiskUsers: ${error.message}`, error);
    return 0;
  }
}

/**
 * Run all flagging scans
 */
export async function runFlaggingScans(): Promise<{
  recentBansScanned: number;
  highRiskScanned: number;
  totalFlags: number;
}> {
  workerLogger.info("Running all flagging scans...");

  const recentBansFlags = await scanRecentBans();
  const highRiskFlags = await scanHighRiskUsers();

  const result = {
    recentBansScanned: recentBansFlags,
    highRiskScanned: highRiskFlags,
    totalFlags: recentBansFlags + highRiskFlags,
  };

  workerLogger.info(`All scans complete: ${result.totalFlags} total flags`);
  return result;
}

/**
 * Start periodic flagging worker (call this from your job scheduler)
 */
export function startFlaggingWorker(intervalMinutes: number = 60) {
  workerLogger.info(
    `Starting flagging worker (interval: ${intervalMinutes} minutes)`,
  );

  // Run immediately
  runFlaggingScans().catch((error) => {
    workerLogger.error(`Error in initial flagging scan: ${error.message}`);
  });

  // Then run periodically
  const interval = setInterval(
    () => {
      runFlaggingScans().catch((error) => {
        workerLogger.error(`Error in periodic flagging scan: ${error.message}`);
      });
    },
    intervalMinutes * 60 * 1000,
  );

  return () => clearInterval(interval);
}
