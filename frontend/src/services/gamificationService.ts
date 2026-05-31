/**
 * Gamification Service
 * Streak tracking, badge awards, and profile gamification data
 */

import { apiCall } from "./api";
import { toast } from "../components/Toast";

export interface GamificationProfile {
  streak: number;
  max_streak: number;
  total_points: number;
  tier: string;
  username_color: string;
  achievement_count: number;
  achievements: EarnedAchievement[];
}

export interface EarnedAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  is_earned: boolean;
  earned_at?: string;
  achievement?: {
    id: string;
    name_fr: string;
    icon: string;
    color: string;
    points: number;
    rarity: string;
  };
}

export interface InteractResult {
  current_streak: number;
  max_streak: number;
  streak_changed: boolean;
  new_badges: string[];
}

// Map rarity to French label
const RARITY_LABEL: Record<string, string> = {
  legendary: "LÉGENDAIRE",
  epic: "ÉPIQUE",
  rare: "RARE",
  uncommon: "INHABITUEL",
  common: "COMMUN",
};

/**
 * Called on app load — updates streak and returns new badge IDs if any.
 */
export async function trackDailyInteract(): Promise<InteractResult | null> {
  const { data, error } = await apiCall<InteractResult>(
    "/api/gamification/interact",
    { method: "POST" },
  );

  if (error || !data) return null;

  // Show toast for new streak milestones
  if (data.streak_changed && data.current_streak > 1) {
    const milestones = [3, 7, 14, 30, 60, 100];
    if (milestones.includes(data.current_streak)) {
      toast.success(
        `🔥 ${data.current_streak} jours de suite ! Continuez comme ça !`,
      );
    }
  }

  return data;
}

/**
 * Called after a key action to check and award badges.
 * trigger_type: 'post_created' | 'comment_created' | 'fire_given'
 */
export async function triggerBadgeCheck(
  triggerType: string,
  data?: Record<string, unknown>,
): Promise<string[]> {
  const { data: result, error } = await apiCall<{ new_badges: string[] }>(
    "/api/gamification/award",
    {
      method: "POST",
      body: JSON.stringify({ trigger_type: triggerType, data }),
    },
  );

  if (error || !result) return [];

  // Show achievement toast for each new badge
  if (result.new_badges?.length) {
    // Fetch achievement details to show nice toast
    for (const badgeId of result.new_badges) {
      showBadgeToast(badgeId);
    }
  }

  return result.new_badges ?? [];
}

function showBadgeToast(badgeId: string) {
  // Friendly badge names — fallback if we can't fetch
  const BADGE_NAMES: Record<string, string> = {
    premier_post: "🎬 Premier Post débloqué!",
    dix_posts: "📱 Dix Publications débloqué!",
    cent_posts: "💯 Cent Publications débloqué!",
    bavasseux: "💬 Le Bavasseux débloqué!",
    grand_bavasseux: "🗣️ Le Grand Bavasseux débloqué!",
    gros_donneur: "🔥 Le Gros Donneur débloqué!",
    roi_du_feu: "👑 Le Roi du Feu débloqué!",
    streak_7: "🔥 Feu de 7 Jours débloqué!",
    streak_30: "🌟 Feu du Mois débloqué!",
    streak_100: "💎 Centenaire de Feu débloqué!",
    king_local: "🏔️ Le King Local débloqué!",
    montrealer: "🏙️ Le Montréalais débloqué!",
    pur_laine_badge: "⚜️ Pur Laine débloqué!",
    poutine_lover: "🍟 Amateur de Poutine débloqué!",
    hockey_fan: "🏒 Fan de Hockey débloqué!",
  };

  const msg = BADGE_NAMES[badgeId] ?? `🏆 Badge débloqué: ${badgeId}`;
  toast.success(msg);

  // Fire custom event so AchievementModal can intercept if needed
  window.dispatchEvent(
    new CustomEvent("badge-awarded", { detail: { badge_id: badgeId } }),
  );
}

/**
 * Fetch full gamification profile for a user (for Profile page display).
 */
export async function fetchGamificationProfile(
  userId: string,
): Promise<GamificationProfile | null> {
  const { data, error } = await apiCall<GamificationProfile>(
    `/api/gamification/profile/${userId}`,
  );
  if (error || !data) return null;
  return data;
}

/**
 * Tier display helpers
 */
export const TIER_META: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  novice: { name: "Novice Québécois", icon: "🥉", color: "#CD7F32" },
  vrai: { name: "Vrai Québécois", icon: "🥈", color: "#C0C0C0" },
  pur_laine: { name: "Pur Laine", icon: "🥇", color: "#FFD700" },
  legende: { name: "Légende", icon: "💎", color: "#B9F2FF" },
  icone: { name: "Icône Québécoise", icon: "👑", color: "#FF6B6B" },
};

export function getTierMeta(tier: string) {
  return TIER_META[tier] ?? TIER_META.novice;
}
