/**
 * FEATURE FLAGS
 * 
 * Allows gradual rollout of new services (Clerk, Neon, etc.) without breaking
 * existing functionality.
 */

export const FEATURES = {
  /**
   * Use Clerk for authentication instead of Supabase Auth
   * TODO: Set VITE_USE_CLERK=true when Clerk is fully integrated
   */
  USE_CLERK_AUTH: process.env.VITE_USE_CLERK === "true" || process.env.USE_CLERK === "true",

  /**
   * Use Neon Postgres instead of Supabase Postgres
   * TODO: Set VITE_USE_NEON=true when Neon is fully configured
   */
  USE_NEON_DB: process.env.VITE_USE_NEON === "true" || process.env.USE_NEON === "true",

  /**
   * Use external storage (S3/R2) instead of Supabase Storage
   * TODO: Set VITE_USE_EXTERNAL_STORAGE=true when S3/R2 is configured
   */
  USE_EXTERNAL_STORAGE: process.env.VITE_USE_EXTERNAL_STORAGE === "true" || process.env.USE_EXTERNAL_STORAGE === "true",

  /**
   * Use alternative realtime service (Soketi/Pusher) instead of Supabase Realtime
   * TODO: Set VITE_USE_ALT_REALTIME=true when alternative is configured
   */
  USE_ALT_REALTIME: process.env.VITE_USE_ALT_REALTIME === "true" || process.env.USE_ALT_REALTIME === "true",
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}
