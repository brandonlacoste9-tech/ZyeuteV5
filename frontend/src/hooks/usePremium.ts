/**
 * usePremium — Checks the user's real Stripe subscription status
 * Reads from GET /api/stripe/status (backed by subscription_tiers table)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { apiCall } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export type PremiumTier = "free" | "bronze" | "argent" | "or";

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

const TIER_FEATURES: Record<PremiumTier, PremiumStatus["features"]> = {
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
  argent: {
    aiImagesPerMonth: 50,
    aiVideosPerMonth: 20,
    analytics: true,
    priorityFeed: true,
    noAds: true,
    badge: "🥈",
    monthlyCennes: 100,
  },
  or: {
    aiImagesPerMonth: 999999,
    aiVideosPerMonth: 999999,
    analytics: true,
    priorityFeed: true,
    noAds: true,
    badge: "🥇",
    monthlyCennes: 500,
  },
};

interface StripeStatusResponse {
  isPremium: boolean;
  tier?: string;
  status?: string;
  currentPeriodEnd?: string;
  stripeSubscriptionId?: string;
}

function normalizeTier(raw?: string): PremiumTier {
  if (!raw) return "free";
  const map: Record<string, PremiumTier> = {
    bronze: "bronze",
    argent: "argent",
    silver: "argent",
    or: "or",
    gold: "or",
  };
  return map[raw.toLowerCase()] ?? "free";
}

export function usePremium() {
  const { user: authUser } = useAuth();
  const [status, setStatus] = useState<PremiumStatus>({
    tier: "free",
    isActive: false,
    features: TIER_FEATURES.free,
  });
  const [isLoading, setIsLoading] = useState(true);
  // Refresh counter — increment to trigger a re-fetch
  const [refreshCount, setRefreshCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const userId = authUser?.id;

    // Wrap everything in a resolved promise so no setState runs synchronously
    Promise.resolve(userId).then((uid) => {
      if (!mountedRef.current) return;

      if (!uid) {
        setStatus({
          tier: "free",
          isActive: false,
          features: TIER_FEATURES.free,
        });
        setIsLoading(false);
        return;
      }

      apiCall<StripeStatusResponse>("/stripe/status").then(
        ({ data, error }) => {
          if (!mountedRef.current) return;

          if (error || !data) {
            setStatus({
              tier: "free",
              isActive: false,
              features: TIER_FEATURES.free,
            });
            setIsLoading(false);
            return;
          }

          if (!data.isPremium) {
            setStatus({
              tier: "free",
              isActive: false,
              features: TIER_FEATURES.free,
            });
          } else {
            const tier = normalizeTier(data.tier);
            setStatus({
              tier,
              isActive: true,
              expiresAt: data.currentPeriodEnd,
              features: TIER_FEATURES[tier],
            });
          }
          setIsLoading(false);
        },
      );
    });
  }, [authUser, refreshCount]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshCount((c) => c + 1);
  }, []);

  return {
    ...status,
    isLoading,
    refresh,
    isPremium: status.tier !== "free",
    isBronze: status.tier === "bronze",
    isArgent: status.tier === "argent",
    isOr: status.tier === "or",
    // Legacy aliases
    isSilver: status.tier === "argent",
    isGold: status.tier === "or",
  };
}

export default usePremium;
