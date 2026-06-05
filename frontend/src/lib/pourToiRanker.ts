/**
 * pourToiRanker — "Pour Toi" Personalization Engine
 *
 * A lightweight keyword-frequency scorer that re-ranks the feed based on
 * the authenticated user's watch history stored in Supabase.
 *
 * Algorithm:
 *  1. Fetch the last 50 watch events for the user from the backend.
 *  2. Extract hashtags + keywords from captions of watched posts.
 *  3. Build a term-frequency map (keyword → normalized weight 0–1).
 *  4. For each candidate post, compute an affinity score based on
 *     how many of the user's interest keywords appear in the post's
 *     caption + hashtags.
 *  5. Blend: finalScore = 0.6 * affinityScore + 0.4 * normalized_viral_score
 *  6. Sort descending and return.
 *
 * Falls back gracefully: if watch history is empty or the fetch fails,
 * the original feed order is preserved.
 */

import type { Post } from "@/types";

interface WatchHistoryItem {
  caption?: string;
  content?: string;
  hashtags?: string[];
}

/** Normalize a string into cleaned keywords. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[#@]/g, " ")
    .split(/[\s,;:.!?'"()\[\]{}|<>\/\\]+/)
    .filter((t) => t.length > 2); // drop 1-2 char tokens
}

/** Build a TF map from watched post text. Returns keyword → weight (0-1). */
function buildInterestVector(
  watched: WatchHistoryItem[],
): Map<string, number> {
  const tf = new Map<string, number>();

  for (const item of watched) {
    const text = [
      item.caption || "",
      item.content || "",
      ...(item.hashtags || []),
    ].join(" ");

    for (const token of tokenize(text)) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }
  }

  if (tf.size === 0) return tf;

  // Normalize: divide by max frequency so weights are 0–1
  const max = Math.max(...tf.values());
  for (const [k, v] of tf) {
    tf.set(k, v / max);
  }

  return tf;
}

/** Compute affinity score for a post given the interest vector. */
function scorePost(
  post: Post,
  interests: Map<string, number>,
): number {
  if (interests.size === 0) return 0;

  const text = [
    (post as any).caption || "",
    (post as any).content || "",
    ...((post as any).hashtags || []),
  ].join(" ");

  const tokens = new Set(tokenize(text));
  let score = 0;

  for (const token of tokens) {
    const w = interests.get(token);
    if (w) score += w;
  }

  // Cap at 1.0
  return Math.min(score / 3, 1.0);
}

/** Normalize viral scores to 0-1 range within the candidate pool. */
function normalizeViralScores(posts: Post[]): Map<string, number> {
  const scores = new Map<string, number>();
  const maxViral = Math.max(
    ...posts.map((p) => (p as any).viral_score || (p as any).fire_count || 0),
    1,
  );

  for (const p of posts) {
    const raw = (p as any).viral_score || (p as any).fire_count || 0;
    scores.set(p.id, raw / maxViral);
  }

  return scores;
}

/**
 * Re-rank a list of posts using the "Pour Toi" algorithm.
 *
 * @param posts - Candidate posts from the feed API (already pre-filtered)
 * @param watchedItems - Last N watched post objects (captions/hashtags)
 * @returns Posts sorted by blended affinity + viral score
 */
export function pourToiRank(
  posts: Post[],
  watchedItems: WatchHistoryItem[],
): Post[] {
  if (posts.length === 0) return posts;
  if (watchedItems.length === 0) return posts; // no history → keep original order

  const interests = buildInterestVector(watchedItems);
  const viralNorm = normalizeViralScores(posts);

  const AFFINITY_WEIGHT = 0.6;
  const VIRAL_WEIGHT = 0.4;

  const scored = posts.map((post) => {
    const affinity = scorePost(post, interests);
    const viral = viralNorm.get(post.id) ?? 0;
    const blended = AFFINITY_WEIGHT * affinity + VIRAL_WEIGHT * viral;
    return { post, blended };
  });

  scored.sort((a, b) => b.blended - a.blended);
  return scored.map((s) => s.post);
}

/** Cache key for watch history (session-scoped). */
const WATCH_CACHE_KEY = "zyeute_pour_toi_history";
const WATCH_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

interface WatchCache {
  items: WatchHistoryItem[];
  ts: number;
}

/** Fetch watch history from the Supabase-backed API.
 *  Returns an empty array on any failure. */
export async function fetchWatchHistory(
  userId: string,
): Promise<WatchHistoryItem[]> {
  if (!userId) return [];

  // Check session cache
  try {
    const raw = sessionStorage.getItem(WATCH_CACHE_KEY);
    if (raw) {
      const cached: WatchCache = JSON.parse(raw);
      if (Date.now() - cached.ts < WATCH_CACHE_TTL_MS) {
        return cached.items;
      }
    }
  } catch {
    // ignore parse errors
  }

  try {
    const res = await fetch(`/api/feed/watch-history?userId=${encodeURIComponent(userId)}&limit=50`);
    if (!res.ok) return [];
    const data = await res.json();
    const items: WatchHistoryItem[] = (data.posts || []).map((p: any) => ({
      caption: p.caption || p.content || "",
      hashtags: p.hashtags || [],
    }));

    // Cache result
    try {
      sessionStorage.setItem(
        WATCH_CACHE_KEY,
        JSON.stringify({ items, ts: Date.now() } as WatchCache),
      );
    } catch {
      // storage full — ignore
    }

    return items;
  } catch {
    return [];
  }
}

/** Invalidate the Pour Toi cache (call after a new video is watched). */
export function invalidatePourToiCache(): void {
  try {
    sessionStorage.removeItem(WATCH_CACHE_KEY);
  } catch {
    // ignore
  }
}
