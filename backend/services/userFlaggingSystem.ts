/**
 * User Flagging System
 * Automatically flags and manages users based on relationships with banned accounts
 */

import { storage } from "../storage.js";
import { db } from "../storage.js";
import { users, moderationLogs } from "../../shared/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import {
  analyzeUserRelationships,
  findRelatedUsersToBanned,
  RelatedUserAnalysis,
} from "./userRelationshipAnalyzer.js";
import {
  addStrike,
  shouldAddStrike,
  applyStrikePenalties,
  getStrikeCount,
} from "./tiktokStrikeSystem.js";

export interface UserFlag {
  userId: string;
  flagType: "association" | "pattern" | "manual" | "automated";
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  evidence: string[];
  relatedBannedUsers?: string[];
  riskScore: number;
  flaggedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  action?: "none" | "warn" | "flag" | "ban" | "shadowban";
}

export interface FlaggingRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    bannedConnections?: number; // Number of banned users connected
    riskScore?: number; // Minimum risk score
    relationshipStrength?: number; // Minimum relationship strength
    violationHistory?: boolean; // User has own violation history
  };
  action: "flag" | "review" | "ban" | "shadowban";
  autoExecute: boolean; // Whether to auto-execute or require review
}

// Default flagging rules
export const DEFAULT_FLAGGING_RULES: FlaggingRule[] = [
  {
    id: "critical_association",
    name: "Critical Association",
    description: "User has 3+ direct connections to banned users",
    conditions: {
      bannedConnections: 3,
      relationshipStrength: 50,
    },
    action: "ban",
    autoExecute: true,
  },
  {
    id: "high_risk_association",
    name: "High Risk Association",
    description:
      "User has 2+ direct connections to banned users with high risk score",
    conditions: {
      bannedConnections: 2,
      riskScore: 60,
    },
    action: "review",
    autoExecute: false,
  },
  {
    id: "moderate_association",
    name: "Moderate Association",
    description: "User has 1+ connection to banned user with moderate risk",
    conditions: {
      bannedConnections: 1,
      riskScore: 40,
    },
    action: "flag",
    autoExecute: false,
  },
  {
    id: "pattern_detection",
    name: "Pattern Detection",
    description: "User shows suspicious pattern of associations",
    conditions: {
      riskScore: 50,
      violationHistory: true,
    },
    action: "review",
    autoExecute: false,
  },
];

/**
 * Flag a user based on relationship analysis
 */
export async function flagUserForReview(
  userId: string,
  analysis: RelatedUserAnalysis,
  rule: FlaggingRule,
): Promise<UserFlag> {
  const flagLogger = {
    info: (msg: string, ...args: any[]) =>
      logger.info(`[FlaggingSystem] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) =>
      logger.error(`[FlaggingSystem] ${msg}`, ...args),
  };

  flagLogger.info(`Flagging user ${userId} based on rule: ${rule.name}`);

  // Find related banned users
  const relatedBannedUsers: string[] = [];
  for (const rel of analysis.relatedUsers) {
    const user = await storage.getUser(rel.relatedUserId);
    if (user?.role === "banned") {
      relatedBannedUsers.push(rel.relatedUserId);
    }
  }

  // Determine severity (TikTok-style: Lower thresholds for earlier detection)
  let severity: "low" | "medium" | "high" | "critical" = "low";
  if (analysis.riskScore >= 60 || relatedBannedUsers.length >= 2) {
    // Lowered from 70/3 to match TikTok's aggressive stance
    severity = "critical";
  } else if (analysis.riskScore >= 40 || relatedBannedUsers.length >= 1) {
    // Lowered from 50/2
    severity = "high";
  } else if (analysis.riskScore >= 25 || analysis.relatedUsers.length >= 5) {
    // Lowered from 30, added connection count check
    severity = "medium";
  }

  const flag: UserFlag = {
    userId,
    flagType: "automated",
    severity,
    reason: rule.description,
    evidence: analysis.flaggedReasons,
    relatedBannedUsers,
    riskScore: analysis.riskScore,
    flaggedAt: new Date(),
    action:
      rule.action === "ban"
        ? "ban"
        : rule.action === "review"
          ? "flag"
          : "flag",
  };

  // Log the flag
  await storage.createModerationLog({
    userId,
    action: "flag",
    reason: `Automated flag: ${rule.name}`,
    details: `Risk score: ${analysis.riskScore}, Related banned users: ${relatedBannedUsers.length}, Evidence: ${analysis.flaggedReasons.join("; ")}`,
    score:
      severity === "critical"
        ? 8
        : severity === "high"
          ? 5
          : severity === "medium"
            ? 3
            : 1,
  });

  // TikTok-style: Add strike if not auto-banning
  if (rule.action !== "ban" || !rule.autoExecute) {
    try {
      const strikeCheck = await shouldAddStrike(userId, severity);
      if (strikeCheck.shouldStrike) {
        await addStrike(
          userId,
          strikeCheck.strikeType,
          rule.name,
          severity === "critical"
            ? 8
            : severity === "high"
              ? 5
              : severity === "medium"
                ? 3
                : 1,
        );
        await applyStrikePenalties(userId, strikeCheck.strikeType);
      }
    } catch (strikeError: any) {
      flagLogger.error(`Error adding strike: ${strikeError.message}`);
      // Don't fail flagging if strike system fails
    }
  }

  // Auto-execute if rule allows
  if (rule.autoExecute && rule.action === "ban") {
    flagLogger.info(`Auto-banning user ${userId} based on rule: ${rule.name}`);
    await executeBan(userId, flag);
  } else if (rule.autoExecute && rule.action === "shadowban") {
    flagLogger.info(
      `Auto-shadowbanning user ${userId} based on rule: ${rule.name}`,
    );
    await executeShadowban(userId, flag);
  }

  return flag;
}

/**
 * Scan and flag users related to a newly banned user
 */
export async function scanAndFlagRelatedUsers(
  bannedUserId: string,
  rules: FlaggingRule[] = DEFAULT_FLAGGING_RULES,
): Promise<UserFlag[]> {
  const flagLogger = {
    info: (msg: string, ...args: any[]) =>
      logger.info(`[FlaggingSystem] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) =>
      logger.error(`[FlaggingSystem] ${msg}`, ...args),
  };

  flagLogger.info(`Scanning users related to banned user ${bannedUserId}`);

  const flags: UserFlag[] = [];

  try {
    // Find all related users
    const relatedUserIds = await findRelatedUsersToBanned(bannedUserId, 2);

    flagLogger.info(`Found ${relatedUserIds.length} related users to analyze`);

    // Analyze each related user
    for (const relatedUserId of relatedUserIds) {
      // Skip if user is already banned
      const user = await storage.getUser(relatedUserId);
      if (!user || user.role === "banned") {
        continue;
      }

      // Analyze relationships
      const analysis = await analyzeUserRelationships(relatedUserId, 2);

      // Check against each rule
      for (const rule of rules) {
        if (matchesRule(analysis, rule)) {
          const flag = await flagUserForReview(relatedUserId, analysis, rule);
          flags.push(flag);
          break; // Only flag once per user (use most severe rule)
        }
      }
    }

    flagLogger.info(
      `Flagged ${flags.length} users related to banned user ${bannedUserId}`,
    );

    return flags;
  } catch (error: any) {
    flagLogger.error(`Error scanning related users: ${error.message}`, error);
    return flags;
  }
}

/**
 * Check if analysis matches a flagging rule
 */
function matchesRule(
  analysis: RelatedUserAnalysis,
  rule: FlaggingRule,
): boolean {
  const conditions = rule.conditions;

  // Check banned connections
  if (conditions.bannedConnections !== undefined) {
    const bannedCount = analysis.relatedUsers.filter((r) => {
      // This would need to check if related user is banned
      // For now, we'll use risk score as proxy
      return r.strength >= (conditions.relationshipStrength || 0);
    }).length;

    if (bannedCount < conditions.bannedConnections) {
      return false;
    }
  }

  // Check risk score
  if (conditions.riskScore !== undefined) {
    if (analysis.riskScore < conditions.riskScore) {
      return false;
    }
  }

  // Check violation history
  if (conditions.violationHistory) {
    // Would need to check user's own moderation logs
    // For now, skip this check
  }

  return true;
}

/**
 * Execute ban on a user
 */
async function executeBan(userId: string, flag: UserFlag): Promise<void> {
  await storage.updateUser(userId, {
    role: "banned",
    bio: "COMPTE DÉSACTIVÉ : Compte banni automatiquement en raison d'associations avec des utilisateurs bannis.",
  });

  await storage.createModerationLog({
    userId,
    action: "ban",
    reason: `Auto-ban: ${flag.reason}`,
    details: `Risk score: ${flag.riskScore}, Evidence: ${flag.evidence.join("; ")}`,
    score: 10,
  });

  logger.info(`[FlaggingSystem] User ${userId} auto-banned`);
}

/**
 * Execute shadowban on a user
 */
async function executeShadowban(userId: string, flag: UserFlag): Promise<void> {
  // Shadowban: User can still use platform but content is hidden
  await storage.createModerationLog({
    userId,
    action: "shadowban",
    reason: `Auto-shadowban: ${flag.reason}`,
    details: `Risk score: ${flag.riskScore}, Evidence: ${flag.evidence.join("; ")}`,
    score: 7,
  });

  // Mark user as shadowbanned (would need schema update)
  // For now, we'll use a custom permission flag
  const user = await storage.getUser(userId);
  if (user) {
    const customPermissions = (user.customPermissions as any) || {};
    customPermissions.shadowbanned = true;
    await storage.updateUser(userId, {
      customPermissions,
    });
  }

  logger.info(`[FlaggingSystem] User ${userId} shadowbanned`);
}

/**
 * Get all flagged users
 */
export async function getFlaggedUsers(
  severity?: "low" | "medium" | "high" | "critical",
): Promise<UserFlag[]> {
  // This would query a flags table if we had one
  // For now, we'll use moderation logs with action="flag"
  const logs = await db
    .select()
    .from(moderationLogs)
    .where(
      and(
        eq(moderationLogs.action, "flag"),
        severity
          ? sql`${moderationLogs.score} >= ${
              severity === "critical"
                ? 8
                : severity === "high"
                  ? 5
                  : severity === "medium"
                    ? 3
                    : 1
            }`
          : undefined,
      ),
    )
    .orderBy(desc(moderationLogs.createdAt));

  // Convert logs to flags (simplified)
  const score = (s: number | null | undefined) => s ?? 0;
  return logs.map((log) => {
    const s = score(log.score);
    return {
      userId: log.userId,
      flagType: "automated",
      severity:
        s >= 8 ? "critical" : s >= 5 ? "high" : s >= 3 ? "medium" : "low",
      reason: log.reason || "",
      evidence: log.details ? [log.details] : [],
      riskScore: s * 10,
      flaggedAt: log.createdAt || new Date(),
    };
  });
}
