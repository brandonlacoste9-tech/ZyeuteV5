/**
 * Gamification Routes
 * Handles streak tracking, badge checks, and achievement awards
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";
const db =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const router = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

async function checkAndAwardAchievements(
  userId: string,
  trigger: { type: string; data?: Record<string, unknown> },
): Promise<string[]> {
  if (!db) return [];
  try {
    const { data: achievements } = await db
      .from("achievements")
      .select("*")
      .eq("is_active", true);

    if (!achievements?.length) return [];

    const { data: earned } = await db
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId)
      .eq("is_earned", true);

    const earnedIds = new Set((earned ?? []).map((r: any) => r.achievement_id));
    const newlyAwarded: string[] = [];

    for (const ach of achievements) {
      if (earnedIds.has(ach.id)) continue;
      const met = await conditionMet(userId, ach.unlock_condition, trigger);
      if (!met) continue;

      const { data: awarded } = await db.rpc("award_achievement", {
        p_user_id: userId,
        p_achievement_id: ach.id,
      });

      if (awarded) newlyAwarded.push(ach.id);
    }

    return newlyAwarded;
  } catch (err) {
    console.error("[gamification] checkAndAwardAchievements error:", err);
    return [];
  }
}

async function conditionMet(
  userId: string,
  condition: Record<string, unknown>,
  trigger: { type: string; data?: Record<string, unknown> },
): Promise<boolean> {
  if (!db) return false;
  try {
    switch (condition.type) {
      case "post_count": {
        if (trigger.type !== "post_created") return false;
        const { count } = await db
          .from("publications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .is("deleted_at", null);
        return (count ?? 0) >= (condition.count as number);
      }
      case "comments_made": {
        if (trigger.type !== "comment_created") return false;
        const { count } = await db
          .from("commentaires")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        return (count ?? 0) >= (condition.count as number);
      }
      case "fires_given": {
        if (trigger.type !== "fire_given") return false;
        const { count } = await db
          .from("reactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("type", "fire")
          .is("deleted_at", null);
        return (count ?? 0) >= (condition.count as number);
      }
      case "streak": {
        if (trigger.type !== "daily_interact") return false;
        const streak = (trigger.data?.current_streak as number) ?? 0;
        return streak >= (condition.count as number);
      }
      case "early_adopter": {
        if (
          trigger.type !== "post_created" &&
          trigger.type !== "daily_interact"
        )
          return false;
        // Get user's created_at
        const { data: me } = await db
          .from("user_profiles")
          .select("created_at")
          .eq("id", userId)
          .single();
        if (!me) return false;
        // Count users who signed up before or at the same time
        const { count } = await db
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .lte("created_at", me.created_at);
        return (count ?? 9999) <= (condition.max as number);
      }
      case "hashtag": {
        if (trigger.type !== "post_created") return false;
        const hashtags = (trigger.data?.hashtags as string[]) ?? [];
        return hashtags.some(
          (h) =>
            h.toLowerCase() === `#${String(condition.tag).toLowerCase()}` ||
            h.toLowerCase() === String(condition.tag).toLowerCase(),
        );
      }
      case "location_count": {
        if (trigger.type !== "post_created") return false;
        if ((trigger.data?.region as string) !== condition.region) return false;
        const { count } = await db
          .from("publications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("region_id", condition.region as string)
          .is("deleted_at", null);
        return (count ?? 0) >= (condition.count as number);
      }
      case "date_specific": {
        if (trigger.type !== "post_created") return false;
        const now = new Date();
        const [month, day] = String(condition.date).split("-");
        return (
          now.getMonth() + 1 === parseInt(month) &&
          now.getDate() === parseInt(day)
        );
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ─── routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/gamification/interact
 * Called on app load. Handles streak increment + streak badge checks.
 */
router.post("/interact", async (req, res) => {
  const userId: string | undefined = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!db) return res.status(503).json({ error: "DB not configured" });

  try {
    const { data: profile, error: profileErr } = await db
      .from("user_profiles")
      .select("current_streak, max_streak, last_daily_bonus")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastBonus = profile.last_daily_bonus
      ? new Date(profile.last_daily_bonus)
      : null;
    const lastBonusDay = lastBonus
      ? new Date(
          lastBonus.getFullYear(),
          lastBonus.getMonth(),
          lastBonus.getDate(),
        )
      : null;

    let newStreak = profile.current_streak ?? 0;
    let streakChanged = false;

    if (!lastBonusDay) {
      newStreak = 1;
      streakChanged = true;
    } else {
      const diffDays = Math.floor(
        (today.getTime() - lastBonusDay.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 0) {
        // already visited today — no change
      } else if (diffDays === 1) {
        newStreak = (profile.current_streak ?? 0) + 1;
        streakChanged = true;
      } else {
        newStreak = 1;
        streakChanged = true;
      }
    }

    const newMaxStreak = Math.max(profile.max_streak ?? 0, newStreak);

    if (streakChanged) {
      await db
        .from("user_profiles")
        .update({
          current_streak: newStreak,
          max_streak: newMaxStreak,
          last_daily_bonus: now.toISOString(),
        })
        .eq("id", userId);
    }

    // Check streak-based badges
    const newBadges = await checkAndAwardAchievements(userId, {
      type: "daily_interact",
      data: { current_streak: newStreak },
    });

    // Check early adopter badge on every interact (cheap — returns fast if already earned)
    const earlyBadges = await checkAndAwardAchievements(userId, {
      type: "daily_interact",
      data: {},
    });

    const allNew = [...new Set([...newBadges, ...earlyBadges])];

    return res.json({
      current_streak: newStreak,
      max_streak: newMaxStreak,
      streak_changed: streakChanged,
      new_badges: allNew,
    });
  } catch (err) {
    console.error("[gamification] /interact error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/gamification/award
 * Called from frontend after key actions: post, comment, fire.
 * Body: { trigger_type, data? }
 */
router.post("/award", async (req, res) => {
  const userId: string | undefined = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { trigger_type, data } = req.body as {
    trigger_type: string;
    data?: Record<string, unknown>;
  };

  if (!trigger_type) {
    return res.status(400).json({ error: "trigger_type required" });
  }

  const newBadges = await checkAndAwardAchievements(userId, {
    type: trigger_type,
    data,
  });

  return res.json({ new_badges: newBadges });
});

/**
 * GET /api/gamification/profile/:userId
 * Returns streak + tier + points + earned achievements for profile display.
 */
router.get("/profile/:userId", async (req, res) => {
  if (!db) return res.status(503).json({ error: "DB not configured" });
  const { userId } = req.params;

  try {
    const [profileRes, achievementsRes] = await Promise.all([
      db
        .from("user_profiles")
        .select(
          "current_streak, max_streak, total_points, current_tier, username_color, achievement_count",
        )
        .eq("id", userId)
        .single(),
      db
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", userId)
        .eq("is_earned", true)
        .order("earned_at", { ascending: false }),
    ]);

    return res.json({
      streak: profileRes.data?.current_streak ?? 0,
      max_streak: profileRes.data?.max_streak ?? 0,
      total_points: profileRes.data?.total_points ?? 0,
      tier: profileRes.data?.current_tier ?? "novice",
      username_color: profileRes.data?.username_color ?? "#FFFFFF",
      achievement_count: profileRes.data?.achievement_count ?? 0,
      achievements: achievementsRes.data ?? [],
    });
  } catch (err) {
    console.error("[gamification] /profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
