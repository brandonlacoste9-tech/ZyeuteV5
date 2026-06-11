/**
 * Feed deduplication + spacing — avoid the same TikTok/Mux clip or creator
 * appearing back-to-back when the pool is small or curated rows are re-injected.
 */

export type FeedSpacingOptions = {
  /** Min slots between posts with the same content fingerprint. */
  minContentGap?: number;
  /** Min slots between posts from the same author. */
  minAuthorGap?: number;
};

export function getPostContentKey(post: Record<string, unknown>): string {
  const meta = post.media_metadata as
    | Record<string, unknown>
    | null
    | undefined;
  if (meta?.tiktok_id) return `tiktok:${String(meta.tiktok_id)}`;

  const tiktokUrl = String(post.tiktok_url ?? "");
  if (tiktokUrl.includes("tiktok.com")) {
    const match = tiktokUrl.match(/video\/(\d+)/);
    if (match) return `tiktok:${match[1]}`;
  }

  const mux = post.mux_playback_id ?? post.muxPlaybackId;
  if (mux) return `mux:${String(mux)}`;

  const url = String(post.media_url ?? post.hls_url ?? "")
    .split("?")[0]
    .toLowerCase()
    .replace(/\/+$/, "");
  if (url.length > 8) return `url:${url}`;

  return `id:${String(post.id)}`;
}

export function getPostAuthorKey(post: Record<string, unknown>): string {
  const user = post.user as { id?: string } | undefined;
  return String(user?.id ?? post.user_id ?? "");
}

export function dedupePostsByContent<T extends Record<string, unknown>>(
  posts: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of posts) {
    const key = getPostContentKey(p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/** Deterministic Fisher–Yates shuffle (same seed → same order per session). */
export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Quality-preserving seeded shuffle: keep the ranked pool's bias toward viral/
 * fresh content by splitting it into fixed-size tiers (top-ranked items first)
 * and shuffling only *within* each tier with the seed. Same seed → same order
 * (pagination-safe); different seed → different order. Viral content stays near
 * the top across sessions; only the intra-tier ordering varies.
 *
 * The input is expected to be pre-sorted best-first (e.g. by viral_score).
 */
export function seededTierShuffle<T>(
  ranked: T[],
  seed: number,
  tierSize = 10,
): T[] {
  if (ranked.length <= 1) return [...ranked];
  const size = Math.max(1, Math.floor(tierSize));
  const out: T[] = [];
  for (let start = 0; start < ranked.length; start += size) {
    const tier = ranked.slice(start, start + size);
    // Offset the seed per tier so tiers don't all permute identically.
    out.push(...shuffleWithSeed(tier, (seed + start * 2654435761) >>> 0));
  }
  return out;
}

/**
 * Stable partition that surfaces unwatched posts before watched ones. Posts
 * whose id is NOT in `seen` keep their relative order and come first; watched
 * posts keep their relative order and follow. When every post is watched (or
 * `seen` is empty) the input order is returned unchanged, so the feed is never
 * emptied or reordered without reason.
 */
export function unseenFirst<T extends { id?: unknown }>(
  posts: T[],
  seen: Set<string>,
): T[] {
  if (seen.size === 0) return posts;
  const unseen: T[] = [];
  const watched: T[] = [];
  for (const p of posts) {
    if (seen.has(String(p.id))) watched.push(p);
    else unseen.push(p);
  }
  if (unseen.length === 0) return posts;
  return [...unseen, ...watched];
}

/** Round-robin across creators so one account cannot dominate consecutive slots. */
export function interleaveByAuthor<T extends Record<string, unknown>>(
  posts: T[],
  shuffleSeed?: number,
): T[] {
  if (posts.length <= 1) return [...posts];

  const buckets = new Map<string, T[]>();
  for (const p of posts) {
    const key = getPostAuthorKey(p) || `post:${getPostContentKey(p)}`;
    const list = buckets.get(key) ?? [];
    list.push(p);
    buckets.set(key, list);
  }

  if (buckets.size <= 1) {
    return shuffleWithSeed(posts, shuffleSeed ?? posts.length * 7919);
  }

  const lists = [...buckets.values()].sort((a, b) => b.length - a.length);
  const result: T[] = [];
  while (result.length < posts.length) {
    let placed = false;
    for (const list of lists) {
      if (list.length === 0) continue;
      result.push(list.shift()!);
      placed = true;
    }
    if (!placed) break;
  }
  return result;
}

/** Interleave category queues (TikTok / curated / other) instead of stacking blocks. */
export function interleaveQueues<T>(queues: T[][], seed = 0): T[] {
  const lists = queues.filter((q) => q.length > 0).map((q) => [...q]);
  if (lists.length === 0) return [];
  if (lists.length === 1) return lists[0];

  const result: T[] = [];
  const total = lists.reduce((n, l) => n + l.length, 0);
  let round = 0;
  while (result.length < total) {
    for (let i = 0; i < lists.length; i++) {
      const idx = (i + round + (seed % lists.length)) % lists.length;
      const list = lists[idx];
      if (list.length > 0) result.push(list.shift()!);
    }
    round++;
  }
  return result;
}

function countUniqueAuthors(posts: Record<string, unknown>[]): number {
  return new Set(posts.map(getPostAuthorKey).filter(Boolean)).size;
}

/**
 * Dedupe → shuffle → interleave creators → space identical clips apart.
 * Use on each feed page and after personalization re-rank.
 */
export function prepareShuffledFeed<T extends Record<string, unknown>>(
  posts: T[],
  options: FeedSpacingOptions & {
    shuffleSeed?: number;
    recentContext?: T[];
    recycleMinGap?: number;
  } = {},
): T[] {
  const deduped = dedupePostsByContent(posts);
  if (deduped.length <= 1) return deduped;

  const seed = options.shuffleSeed ?? deduped.length * 2654435761;
  const interleaved = interleaveByAuthor(shuffleWithSeed(deduped, seed), seed);
  const uniqueAuthors = countUniqueAuthors(interleaved);

  const spacing: Required<FeedSpacingOptions> = {
    minContentGap: options.minContentGap ?? (uniqueAuthors <= 1 ? 20 : 16),
    minAuthorGap: options.minAuthorGap ?? (uniqueAuthors <= 2 ? 10 : 6),
  };
  if (uniqueAuthors <= 1) spacing.minAuthorGap = 0;

  return spaceOutFeed(interleaved, options.recentContext ?? [], spacing);
}

function violatesGap(
  post: Record<string, unknown>,
  recent: Record<string, unknown>[],
  opts: Required<FeedSpacingOptions>,
): boolean {
  const contentKey = getPostContentKey(post);
  const authorKey = getPostAuthorKey(post);

  for (let i = 0; i < recent.length; i++) {
    const distance = recent.length - i;
    const other = recent[i];
    if (
      distance < opts.minContentGap &&
      getPostContentKey(other) === contentKey
    ) {
      return true;
    }
    if (
      distance < opts.minAuthorGap &&
      authorKey &&
      getPostAuthorKey(other) === authorKey
    ) {
      return true;
    }
  }
  return false;
}

/** Re-order posts so identical clips and same creators are spaced apart. */
export function spaceOutFeed<T extends Record<string, unknown>>(
  posts: T[],
  recentContext: T[] = [],
  options: FeedSpacingOptions = {},
): T[] {
  const opts = {
    minContentGap: options.minContentGap ?? 12,
    minAuthorGap: options.minAuthorGap ?? 3,
  };
  if (posts.length <= 1) return [...posts];

  const pool = [...posts];
  const result: T[] = [];
  const context: Record<string, unknown>[] = [...recentContext];
  const windowSize = Math.max(opts.minContentGap, opts.minAuthorGap);

  while (pool.length > 0) {
    let placed = false;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      if (!violatesGap(candidate, context.slice(-windowSize), opts)) {
        result.push(candidate);
        context.push(candidate);
        pool.splice(i, 1);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const fallback = pool.shift();
      if (!fallback) break;
      result.push(fallback);
      context.push(fallback);
    }
  }

  return result;
}

export function mergeFeedWithDedup<T extends Record<string, unknown>>(
  prev: T[],
  incoming: T[],
  options: FeedSpacingOptions & {
    recycleMinGap?: number;
    shuffleSeed?: number;
  } = {},
): T[] {
  const recycleMinGap = options.recycleMinGap ?? 24;
  const prevKeys = new Set(prev.map((p) => getPostContentKey(p)));
  const prevIds = new Set(prev.map((p) => String(p.id)));

  let fresh = incoming.filter(
    (p) => !prevIds.has(String(p.id)) && !prevKeys.has(getPostContentKey(p)),
  );
  fresh = dedupePostsByContent(fresh);

  if (fresh.length === 0 && incoming.length > 0) {
    const recentWindow = prev.slice(-recycleMinGap);
    const recentKeys = new Set(recentWindow.map((p) => getPostContentKey(p)));
    fresh = dedupePostsByContent(incoming).filter(
      (p) => !recentKeys.has(getPostContentKey(p)),
    );
  }

  if (fresh.length === 0) return prev;

  const tail = prev.slice(
    -Math.max(options.minContentGap ?? 12, options.minAuthorGap ?? 3),
  );
  const spaced = prepareShuffledFeed(fresh, {
    ...options,
    recentContext: tail as T[],
    shuffleSeed:
      options.shuffleSeed ?? (prev.length + fresh.length) * 2246822519,
  });
  const base = prev.length;

  return [
    ...prev,
    ...spaced.map((p, i) => {
      if (prevIds.has(String(p.id))) {
        return { ...p, _feedSlot: `${String(p.id)}-cycle-${base + i}` };
      }
      return p;
    }),
  ];
}
