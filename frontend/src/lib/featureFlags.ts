/**
 * Feature flags (Vite env). Set in .env / Vercel, e.g. VITE_FEATURE_CREATOR_HUB=true
 */
function truthy(v: string | undefined): boolean {
  return v === "1" || v?.toLowerCase() === "true";
}

export const featureFlags = {
  creatorHub: truthy(import.meta.env.VITE_FEATURE_CREATOR_HUB),
  apiHealthBanner: truthy(import.meta.env.VITE_FEATURE_API_HEALTH_BANNER),
  ageGate: truthy(import.meta.env.VITE_FEATURE_AGE_GATE),
  /** Default on in dev */
  apiHealthBannerDefault:
    import.meta.env.DEV ||
    truthy(import.meta.env.VITE_FEATURE_API_HEALTH_BANNER),
};
