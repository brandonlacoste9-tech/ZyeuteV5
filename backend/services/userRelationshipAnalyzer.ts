/**
 * User Relationship Analyzer
 * Analyzes social graph to identify related users for moderation purposes
 */

import { storage } from "../storage.js";
import { db } from "../storage.js";
import {
  follows,
  posts,
  comments,
  users,
  moderationLogs,
} from "../../shared/schema.js";
import { eq, and, or, sql, desc } from "drizzle-orm";
import { logger } from "../utils/logger.js";

export interface UserRelationship {
  userId: string;
  relatedUserId: string;
  relationshipType:
    | "follow"
    | "follower"
    | "mutual_follow"
    | "interaction"
    | "shared_content";
  strength: number; // 0-100, how strong the relationship is
  evidence: string[]; // List of evidence (e.g., "follows", "commented on 5 posts", "shared 3 posts")
  firstInteractionAt?: Date;
  lastInteractionAt?: Date;
}

export interface RelatedUserAnalysis {
  userId: string;
  relatedUsers: UserRelationship[];
  riskScore: number; // 0-100, overall risk based on associations
  flaggedReasons: string[];
  recommendedAction: "none" | "flag" | "review" | "ban";
}

/**
 * Analyze all relationships for a given user
 */
export async function analyzeUserRelationships(
  userId: string,
  maxDepth: number = 2,
): Promise<RelatedUserAnalysis> {
  const relationshipLogger = {
    info: (msg: string, ...args: any[]) =>
      logger.info(`[RelationshipAnalyzer] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) =>
      logger.error(`[RelationshipAnalyzer] ${msg}`, ...args),
  };

  relationshipLogger.info(`Analyzing relationships for user ${userId}`);

  const relationships: UserRelationship[] = [];
  const flaggedReasons: string[] = [];
  let riskScore = 0;

  try {
    // 1. Get direct follows (users this user follows)
    const following = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    for (const follow of following) {
      relationships.push({
        userId,
        relatedUserId: follow.followingId,
        relationshipType: "follow",
        strength: 50,
        evidence: [`Follows user ${follow.followingId}`],
        firstInteractionAt: follow.createdAt || undefined,
        lastInteractionAt: follow.createdAt || undefined,
      });
    }

    // 2. Get followers (users who follow this user)
    const followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));

    for (const follower of followers) {
      // Check if mutual follow
      const isMutual = following.some(
        (f) => f.followingId === follower.followerId,
      );

      relationships.push({
        userId,
        relatedUserId: follower.followerId,
        relationshipType: isMutual ? "mutual_follow" : "follower",
        strength: isMutual ? 80 : 40,
        evidence: [isMutual ? "Mutual follow" : "Follower"],
        firstInteractionAt: follower.createdAt || undefined,
        lastInteractionAt: follower.createdAt || undefined,
      });
    }

    // 3. Get interaction relationships (comments, reactions)
    const userPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.userId, userId))
      .limit(100); // Limit to recent posts

    const postIds = userPosts.map((p) => p.id);

    if (postIds.length > 0) {
      // Get users who commented on this user's posts
      const commenters = await db
        .select({
          userId: comments.userId,
          count: sql<number>`count(*)::int`,
          lastComment: sql<Date>`max(${comments.createdAt})`,
        })
        .from(comments)
        .where(sql`${comments.postId} = ANY(${postIds})`)
        .groupBy(comments.userId);

      for (const commenter of commenters) {
        if (commenter.userId === userId) continue; // Skip self

        const count = Number(commenter.count) || 0;
        const existingRel = relationships.find(
          (r) => r.relatedUserId === commenter.userId,
        );

        if (existingRel) {
          existingRel.strength = Math.min(
            100,
            existingRel.strength + count * 5,
          );
          existingRel.evidence.push(`Commented on ${count} posts`);
          if (commenter.lastComment) {
            existingRel.lastInteractionAt = commenter.lastComment;
          }
        } else {
          relationships.push({
            userId,
            relatedUserId: commenter.userId,
            relationshipType: "interaction",
            strength: Math.min(100, count * 10),
            evidence: [`Commented on ${count} posts`],
            lastInteractionAt: commenter.lastComment || undefined,
          });
        }
      }
    }

    // 4. Check for shared content (users who posted similar content or reposted)
    // This is a simplified version - could be enhanced with content similarity analysis
    const userPostTags = await db
      .select({ tags: posts.aiLabels })
      .from(posts)
      .where(eq(posts.userId, userId))
      .limit(50);

    // 5. Calculate risk score based on banned/flagged related users
    const relatedUserIds = relationships.map((r) => r.relatedUserId);

    if (relatedUserIds.length > 0) {
      const relatedUsersData = await db
        .select({
          id: users.id,
          role: users.role,
          username: users.username,
        })
        .from(users)
        .where(sql`${users.id} = ANY(${relatedUserIds})`);

      // Check moderation logs for related users
      const relatedModerationLogs = await db
        .select()
        .from(moderationLogs)
        .where(sql`${moderationLogs.userId} = ANY(${relatedUserIds})`)
        .orderBy(desc(moderationLogs.createdAt));

      // Calculate risk based on banned/flagged connections
      let bannedConnections = 0;
      let flaggedConnections = 0;
      let highSeverityConnections = 0;

      for (const userData of relatedUsersData) {
        if (userData.role === "banned") {
          bannedConnections++;
          const relationship = relationships.find(
            (r) => r.relatedUserId === userData.id,
          );
          if (relationship) {
            relationship.strength = 100; // Maximum strength for banned connections
            flaggedReasons.push(
              `Connected to banned user: ${userData.username}`,
            );
            riskScore += 30;
          }
        }
      }

      for (const log of relatedModerationLogs) {
        if (log.score >= 8) {
          highSeverityConnections++;
          flaggedReasons.push(
            `Connected to user with high-severity violation (score: ${log.score})`,
          );
          riskScore += 15;
        } else if (log.score >= 5) {
          flaggedConnections++;
          riskScore += 5;
        }
      }

      // Risk calculation (TikTok-style: More aggressive scoring)
      riskScore += bannedConnections * 40; // Increased from 30 (TikTok is more aggressive)
      riskScore += highSeverityConnections * 20; // Increased from 15
      riskScore += flaggedConnections * 8; // Increased from 5
      riskScore = Math.min(100, riskScore);

      // Update relationship strengths based on violations
      for (const log of relatedModerationLogs) {
        const relationship = relationships.find(
          (r) => r.relatedUserId === log.userId,
        );
        if (relationship) {
          relationship.strength = Math.min(
            100,
            relationship.strength + log.score * 5,
          );
          relationship.evidence.push(
            `Related user has ${log.action} violation (score: ${log.score})`,
          );
        }
      }
    }

    // 6. Determine recommended action (TikTok-style: More aggressive thresholds)
    let recommendedAction: "none" | "flag" | "review" | "ban" = "none";

    if (riskScore >= 60 || bannedConnections >= 2) {
      // Lowered from 70/3 to match TikTok
      recommendedAction = "ban";
    } else if (riskScore >= 40 || bannedConnections >= 1) {
      // Lowered from 40/1 (same but clearer)
      recommendedAction = "review";
    } else if (riskScore >= 25 || flaggedConnections >= 2) {
      // Lowered from 20 for earlier detection
      recommendedAction = "flag";
    }

    relationshipLogger.info(
      `Analysis complete: ${relationships.length} relationships, risk score: ${riskScore}, action: ${recommendedAction}`,
    );

    return {
      userId,
      relatedUsers: relationships,
      riskScore,
      flaggedReasons,
      recommendedAction,
    };
  } catch (error: any) {
    relationshipLogger.error(
      `Error analyzing relationships: ${error.message}`,
      error,
    );
    return {
      userId,
      relatedUsers: relationships,
      riskScore: 0,
      flaggedReasons: [`Analysis error: ${error.message}`],
      recommendedAction: "review",
    };
  }
}

/**
 * Find all users related to a banned user (for propagation analysis)
 */
export async function findRelatedUsersToBanned(
  bannedUserId: string,
  maxDepth: number = 2,
): Promise<string[]> {
  const relatedUserIds = new Set<string>();

  try {
    // Direct connections (1st degree)
    const following = await db
      .select({ userId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, bannedUserId));

    const followers = await db
      .select({ userId: follows.followerId })
      .from(follows)
      .where(eq(follows.followingId, bannedUserId));

    for (const f of following) {
      relatedUserIds.add(f.userId);
    }
    for (const f of followers) {
      relatedUserIds.add(f.userId);
    }

    // 2nd degree connections (if maxDepth > 1)
    if (maxDepth > 1) {
      const secondDegreeIds = Array.from(relatedUserIds);
      for (const secondDegreeId of secondDegreeIds) {
        const secondFollowing = await db
          .select({ userId: follows.followingId })
          .from(follows)
          .where(eq(follows.followerId, secondDegreeId))
          .limit(50); // Limit to prevent explosion

        const secondFollowers = await db
          .select({ userId: follows.followerId })
          .from(follows)
          .where(eq(follows.followingId, secondDegreeId))
          .limit(50);

        for (const f of secondFollowing) {
          if (f.userId !== bannedUserId) {
            relatedUserIds.add(f.userId);
          }
        }
        for (const f of secondFollowers) {
          if (f.userId !== bannedUserId) {
            relatedUserIds.add(f.userId);
          }
        }
      }
    }

    return Array.from(relatedUserIds);
  } catch (error: any) {
    logger.error(`Error finding related users: ${error.message}`, error);
    return [];
  }
}

/**
 * Calculate relationship strength between two users
 */
export async function calculateRelationshipStrength(
  userId1: string,
  userId2: string,
): Promise<number> {
  let strength = 0;

  try {
    // Check if they follow each other
    const mutualFollow = await db
      .select()
      .from(follows)
      .where(
        and(
          or(
            and(
              eq(follows.followerId, userId1),
              eq(follows.followingId, userId2),
            ),
            and(
              eq(follows.followerId, userId2),
              eq(follows.followingId, userId1),
            ),
          ),
        ),
      )
      .limit(2);

    if (mutualFollow.length === 2) {
      strength += 40; // Mutual follow
    } else if (mutualFollow.length === 1) {
      strength += 20; // One-way follow
    }

    // Check interactions (comments)
    const interactions = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(
        and(
          or(
            and(
              eq(comments.userId, userId1),
              sql`${comments.postId} IN (SELECT id FROM ${posts} WHERE ${posts.userId} = ${userId2})`,
            ),
            and(
              eq(comments.userId, userId2),
              sql`${comments.postId} IN (SELECT id FROM ${posts} WHERE ${posts.userId} = ${userId1})`,
            ),
          ),
        ),
      );

    const interactionCount = Number(interactions[0]?.count) || 0;
    strength += Math.min(40, interactionCount * 5);

    return Math.min(100, strength);
  } catch (error: any) {
    logger.error(
      `Error calculating relationship strength: ${error.message}`,
      error,
    );
    return 0;
  }
}
