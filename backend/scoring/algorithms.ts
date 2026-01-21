import { type Post } from "../../shared/schema.js";

/**
 * Cultural Momentum Algorithm
 * (Static Quality * Engagement Lift) / Time Gravity
 *
 * Weights:
 * - Fires: 1x
 * - Shares: 3x
 * - Piasse: 5x
 */
export function calculateCulturalMomentum(
  post: Partial<Post> & {
    fireCount: number;
    sharesCount: number;
    piasseCount: number;
  },
  hoursSincePosted: number,
): number {
  // 1. The Static Baseline (Ti-Guy's Analysis)
  const baseScore =
    (post as unknown as { quebecScore: number }).quebecScore || 0;

  // 2. The Soul Signal (The Hive's Reaction)
  // Weighted engagement
  const rawEngagement =
    post.fireCount * 1 + post.sharesCount * 3 + post.piasseCount * 5;
  const soulMultiplier = Math.log(rawEngagement + 1) + 1;

  // 3. The Recency Bias (Drift)
  // Content must prove its worth to stay alive.
  const gravity = 1.8;
  const timeDecay = Math.pow(hoursSincePosted + 2, gravity);

  // 4. The Synthesis
  const momentum = (baseScore * soulMultiplier) / timeDecay;

  return momentum;
}
