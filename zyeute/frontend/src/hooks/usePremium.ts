/**
 * 💎 usePremium Hook
 * Check user's premium subscription status
 */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

const usePremiumLogger = logger.withContext("UsePremium");

export type PremiumTier = "free" | "bronze" | "silver" | "gold";

export interface PremiumStatus {
  tier: PremiumTier;
  isActive: boolean;
  expiresAt?: string;
  features: {
    aiImagesPerMonth: number;
    aiVideosPerMonth: number;
    analytics: boolean;
    priorityFeed: boolean;
    noAds: boolean;
    badge: string;
    monthlyCennes: number;
  };
}

const TIER_FEATURES = {
  free: {
    aiImagesPerMonth: 0,
    aiVideosPerMonth: 0,
    analytics: false,
    priorityFeed: false,
    noAds: false,
    badge: "",
    monthlyCennes: 0,
  },
  bronze: {
    aiImagesPerMonth: 10,
    aiVideosPerMonth: 5,
    analytics: false,
    priorityFeed: false,
    noAds: true,
    badge: "🥉",
    monthlyCennes: 0,
  },
  silver: {
    aiImagesPerMonth: 50,
    aiVideosPerMonth: 20,
    analytics: true,
    priorityFeed: true,
    noAds: true,
    badge: "🥈",
    monthlyCennes: 0,
  },
  gold: {
    aiImagesPerMonth: 999999, // Unlimited
    aiVideosPerMonth: 999999, // Unlimited
    analytics: true,
    priorityFeed: true,
    noAds: true,
    badge: "🥇",
    monthlyCennes: 500,
  },
};

export function usePremium() {
  const [status, setStatus] = useState<PremiumStatus>({
    tier: "free",
    isActive: false,
    features: TIER_FEATURES.free,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus({
          tier: "free",
          isActive: false,
          features: TIER_FEATURES.free,
        });
        setIsLoading(false);
        return;
      }

      // Check for active subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*, tier:subscription_tiers(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (subscription && subscription.tier) {
        const tierName = subscription.tier.name.toLowerCase() as PremiumTier;
        setStatus({
          tier: tierName,
          isActive: true,
          expiresAt: subscription.current_period_end,
          features: TIER_FEATURES[tierName] || TIER_FEATURES.free,
        });
      } else {
        // No active subscription - free tier
        setStatus({
          tier: "free",
          isActive: false,
          features: TIER_FEATURES.free,
        });
      }
    } catch (error) {
      usePremiumLogger.error("Error loading premium status:", error);
      // Default to free on error
      setStatus({
        tier: "free",
        isActive: false,
        features: TIER_FEATURES.free,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    setIsLoading(true);
    loadPremiumStatus();
  };

  return {
    ...status,
    isLoading,
    refresh,
    isPremium: status.tier !== "free",
    isBronze: status.tier === "bronze",
    isSilver: status.tier === "silver",
    isGold: status.tier === "gold",
  };
}

export default usePremium;
