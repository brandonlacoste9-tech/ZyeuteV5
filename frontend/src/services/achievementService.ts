/**
 * Achievement Service - Quebec Gamification System
 * Tracks and awards achievements, manages tiers, rewards users
 */

import { supabase } from "../lib/supabase";
import { logger } from "@/lib/logger";

const achievementServiceLogger = logger.withContext("AchievementService");
import { toast } from "../components/Toast";

export type AchievementCategory =
  | "cultural"
  | "regional"
  | "engagement"
  | "tiguy"
  | "elite"
  | "seasonal";
export type AchievementRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";
export type UserTier = "novice" | "vrai" | "pur_laine" | "legende" | "icone";

export interface Achievement {
  id: string;
  name: string;
  name_fr: string;
  description: string;
  category: AchievementCategory;
  points: number;
  rarity: AchievementRarity;
  icon: string;
  color: string;
  unlock_condition: any;
  reward_cennes: number;
  reward_description?: string;
  is_secret: boolean;
  sort_order: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  progress_max: number;
  is_earned: boolean;
  earned_at?: string;
  achievement?: Achievement;
}

export interface TierInfo {
  current: UserTier;
  name: string;
  icon: string;
  color: string;
  min_points: number;
  max_points: number;
  next_tier?: string;
  points_to_next?: number;
}

const TIER_THRESHOLDS = {
  novice: {
    min: 0,
    max: 99,
    name: "Novice Québécois",
    icon: "🥉",
    color: "#CD7F32",
  },
  vrai: {
    min: 100,
    max: 499,
    name: "Vrai Québécois",
    icon: "🥈",
    color: "#C0C0C0",
  },
  pur_laine: {
    min: 500,
    max: 1999,
    name: "Pur Laine",
    icon: "🥇",
    color: "#FFD700",
  },
  legende: {
    min: 2000,
    max: 9999,
    name: "Légende",
    icon: "💎",
    color: "#B9F2FF",
  },
  icone: {
    min: 10000,
    max: Infinity,
    name: "Icône Québécoise",
    icon: "👑",
    color: "#FF6B6B",
  },
};

/**
 * Get all available achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    achievementServiceLogger.error("Error fetching achievements:", error);
    return [];
  }
}

/**
 * Get user's achievement progress
 */
export async function getUserAchievements(
  userId: string,
): Promise<UserAchievement[]> {
  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    achievementServiceLogger.error("Error fetching user achievements:", error);
    return [];
  }
}

/**
 * Get user's tier information
 */
export async function getUserTier(userId: string): Promise<TierInfo | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("total_points, current_tier")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const currentTier = (data.current_tier || "novice") as UserTier;
    const totalPoints = data.total_points || 0;
    const tierData = TIER_THRESHOLDS[currentTier];

    // Find next tier
    const tiers = Object.entries(TIER_THRESHOLDS);
    const currentIndex = tiers.findIndex(([key]) => key === currentTier);
    const nextTier =
      currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

    return {
      current: currentTier,
      name: tierData.name,
      icon: tierData.icon,
      color: tierData.color,
      min_points: tierData.min,
      max_points: tierData.max,
      next_tier: nextTier ? nextTier[1].name : undefined,
      points_to_next: nextTier ? nextTier[1].min - totalPoints : undefined,
    };
  } catch (error) {
    achievementServiceLogger.error("Error fetching user tier:", error);
    return null;
  }
}

/**
 * Award achievement to user
 */
export async function awardAchievement(
  userId: string,
  achievementId: string,
  showNotification = true,
): Promise<boolean> {
  try {
    // Call Supabase function to award achievement
    const { data, error } = await supabase.rpc("award_achievement", {
      p_user_id: userId,
      p_achievement_id: achievementId,
    });

    if (error) throw error;

    if (data === true && showNotification) {
      // Fetch achievement details
      const { data: achievement } = await supabase
        .from("achievements")
        .select("*")
        .eq("id", achievementId)
        .single();

      if (achievement) {
        // Show achievement notification
        toast.success(
          `🏆 ${achievement.icon} ${achievement.name_fr} débloqué! +${achievement.points} pts`,
        );

        // Dispatch custom event for achievement modal
        window.dispatchEvent(
          new CustomEvent("achievement-unlocked", {
            detail: achievement,
          }),
        );
      }
    }

    return data === true;
  } catch (error) {
    achievementServiceLogger.error("Error awarding achievement:", error);
    return false;
  }
}

/**
 * Check and award achievements based on conditions
 */
export async function checkAchievements(
  userId: string,
  trigger: {
    type: string;
    data?: any;
  },
): Promise<void> {
  try {
    // Get all achievements
    const achievements = await getAllAchievements();

    // Get user's current achievements
    const userAchievements = await getUserAchievements(userId);
    const earnedIds = userAchievements
      .filter((ua) => ua.is_earned)
      .map((ua) => ua.achievement_id);

    // Check each achievement
    for (const achievement of achievements) {
      // Skip if already earned
      if (earnedIds.includes(achievement.id)) continue;

      // Check if condition is met
      const isMet = await checkAchievementCondition(
        userId,
        achievement.unlock_condition,
        trigger,
      );

      if (isMet) {
        await awardAchievement(userId, achievement.id);
      }
    }
  } catch (error) {
    achievementServiceLogger.error("Error checking achievements:", error);
  }
}

/**
 * Check if achievement condition is met
 */
async function checkAchievementCondition(
  userId: string,
  condition: any,
  trigger: { type: string; data?: any },
): Promise<boolean> {
  try {
    const conditionType = condition.type;

    // Match trigger type to condition type
    switch (conditionType) {
      case "post_count":
        if (trigger.type === "post_created") {
          const { count } = await supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          return (count || 0) >= condition.count;
        }
        break;

      case "fires_received":
        if (trigger.type === "fire_received") {
          const { count } = await supabase
            .from("fires")
            .select("id", { count: "exact", head: true })
            .eq("post_user_id", userId);
          return (count || 0) >= condition.count;
        }
        break;

      case "comments_made":
        if (trigger.type === "comment_created") {
          const { count } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          return (count || 0) >= condition.count;
        }
        break;

      case "followers":
        if (trigger.type === "follow_received") {
          const { count } = await supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", userId);
          return (count || 0) >= condition.count;
        }
        break;

      case "hashtag":
        if (trigger.type === "post_created" && trigger.data?.hashtags) {
          return trigger.data.hashtags.includes(`#${condition.tag}`);
        }
        break;

      case "location":
        if (trigger.type === "post_created" && trigger.data?.region) {
          return trigger.data.region === condition.region;
        }
        break;

      case "location_count":
        if (
          trigger.type === "post_created" &&
          trigger.data?.region === condition.region
        ) {
          const { count } = await supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("region", condition.region);
          return (count || 0) >= condition.count;
        }
        break;

      case "ai_use":
        if (trigger.type === "ai_used") {
          // Track AI usage count (would need separate table or counter)
          return trigger.data?.aiUseCount >= condition.count;
        }
        break;

      case "points":
        if (trigger.type === "points_earned") {
          const { data } = await supabase
            .from("user_profiles")
            .select("total_points")
            .eq("id", userId)
            .single();
          return (data?.total_points || 0) >= condition.count;
        }
        break;

      case "date_specific":
        if (trigger.type === "post_created") {
          const now = new Date();
          const targetDate = condition.date; // Format: "MM-DD"
          const [month, day] = targetDate.split("-");
          return (
            now.getMonth() + 1 === parseInt(month) &&
            now.getDate() === parseInt(day)
          );
        }
        break;

      case "account_age_days":
        if (trigger.type === "daily_check") {
          const { data } = await supabase
            .from("user_profiles")
            .select("created_at")
            .eq("id", userId)
            .single();

          if (data) {
            const accountAge = Date.now() - new Date(data.created_at).getTime();
            const days = accountAge / (1000 * 60 * 60 * 24);
            return days >= condition.count;
          }
        }
        break;

      default:
        return false;
    }

    return false;
  } catch (error) {
    achievementServiceLogger.error("Error checking condition:", error);
    return false;
  }
}

/**
 * Get achievement statistics for user
 */
export async function getAchievementStats(userId: string): Promise<{
  total_achievements: number;
  earned_count: number;
  total_points: number;
  tier: TierInfo | null;
  completion_percentage: number;
  recent_achievements: UserAchievement[];
}> {
  try {
    const [allAchievements, userAchievements, tierInfo] = await Promise.all([
      getAllAchievements(),
      getUserAchievements(userId),
      getUserTier(userId),
    ]);

    const earnedCount = userAchievements.filter((ua) => ua.is_earned).length;
    const recentAchievements = userAchievements
      .filter((ua) => ua.is_earned)
      .sort(
        (a, b) =>
          new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime(),
      )
      .slice(0, 5);

    const { data: userData } = await supabase
      .from("user_profiles")
      .select("total_points")
      .eq("id", userId)
      .single();

    return {
      total_achievements: allAchievements.length,
      earned_count: earnedCount,
      total_points: userData?.total_points || 0,
      tier: tierInfo,
      completion_percentage: Math.round(
        (earnedCount / allAchievements.length) * 100,
      ),
      recent_achievements: recentAchievements,
    };
  } catch (error) {
    achievementServiceLogger.error("Error fetching achievement stats:", error);
    return {
      total_achievements: 0,
      earned_count: 0,
      total_points: 0,
      tier: null,
      completion_percentage: 0,
      recent_achievements: [],
    };
  }
}

/**
 * Get leaderboard (top users by points)
 */
export async function getLeaderboard(limit = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "id, username, avatar_url, total_points, current_tier, achievement_count, is_verified",
      )
      .order("total_points", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    achievementServiceLogger.error("Error fetching leaderboard:", error);
    return [];
  }
}

/**
 * Get user's rank on leaderboard
 */
export async function getUserRank(userId: string): Promise<number> {
  try {
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("total_points")
      .eq("id", userId)
      .single();

    if (!userData) return 0;

    const { count } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .gt("total_points", userData.total_points);

    return (count || 0) + 1;
  } catch (error) {
    achievementServiceLogger.error("Error fetching user rank:", error);
    return 0;
  }
}

export default {
  getAllAchievements,
  getUserAchievements,
  getUserTier,
  awardAchievement,
  checkAchievements,
  getAchievementStats,
  getLeaderboard,
  getUserRank,
};
