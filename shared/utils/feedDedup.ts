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
  options: FeedSpacingOptions & { recycleMinGap?: number } = {},
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
  const spaced = spaceOutFeed(fresh, tail as T[], options);
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
