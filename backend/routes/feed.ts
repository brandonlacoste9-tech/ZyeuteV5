import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheMiddleware } from "../utils/cache.js";
import { optionalAuth, verifyAuthToken } from "../supabase-auth.js";
import {
  isExplorePlayablePost,
  isReliablePlaybackMedia,
  isTiGuyCuratedPost,
} from "../utils/playable-media.js";
import {
  dedupePostsByContent,
  getPostContentKey,
  interleaveQueues,
  mergeFeedWithDedup,
  seededTierShuffle,
  shuffleWithSeed,
  spaceOutFeed,
  unseenFirst,
} from "../../shared/utils/feedDedup.js";
import {
  extractTagsFromPost,
  mergeAffinityTags,
  personalizePostOrder,
} from "../lib/personalization.js";

/** Original production DB may not ship get_localized_explore_feed. */
let exploreRpcDisabled = false;

/**
 * Resolve a stable numeric shuffle seed for the feed. A client-supplied session
 * token (persisted in sessionStorage) keeps order stable across paginated
 * requests; absence of one yields a fresh random order per request.
 */
function resolveFeedSeed(sessionParam: unknown, viewerId?: string): number {
  const session = typeof sessionParam === "string" ? sessionParam : "";
  if (!session) return Math.floor(Math.random() * 1e9) >>> 0;
  const base = `${session}:${viewerId ?? ""}`;
  let h = 2166136261;
  for (let i = 0; i < base.length; i++) {
    h ^= base.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

/** Sets req.userId when a valid Bearer token is present (does not 401). */
async function attachOptionalUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  (req as any).userId = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = await verifyAuthToken(token);
    if (userId) (req as any).userId = userId;
  }
  next();
}

/** Max client-supplied seen ids honored per request (mirrors client send cap). */
const GUEST_SEEN_LIMIT = 200;

/**
 * Recently-watched post ids supplied by a guest client. Read from the
 * `x-seen-ids` header (preferred — keeps the URL short) or the `seen` query
 * param as a fallback. Comma-separated, capped to the most recent ids.
 */
/** Post ids are UUIDs — anything else (e.g. local fallback clip ids like "qc-street-66") is dropped. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseSeenIds(req: Request): string[] {
  const raw =
    (req.headers["x-seen-ids"] as string | undefined) ||
    (typeof req.query.seen === "string" ? (req.query.seen as string) : "");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    // Drop non-UUID values: one bad id used to 500 the entire feed query,
    // trapping clients on the offline fallback clips forever.
    .filter((s) => UUID_RE.test(s))
    .slice(0, GUEST_SEEN_LIMIT);
}

/**
 * Cold-start freshness queue (2026-09-30): brand-new uploads score ~0 on
 * viral ranking and would never surface, so ~1 in 10 feed slots is reserved
 * for videos created in the last FRESH_WINDOW_HOURS. Slot assignment is
 * deterministic per session seed (fresh slot k serves
 * freshPool[(seed + k) % len]) so cursor pagination stays stable.
 */
const FRESH_WINDOW_HOURS = 48;
const FRESH_EVERY_N = 10;
const FRESH_SLOT_OFFSET = 3; // 0-indexed position within each group of 10

async function fetchFreshVideoPool(
  supabase: SupabaseClient,
  publicationSelect: string,
  hiveId: string,
  excludedIds: string[],
  poolLimit = 60,
): Promise<Record<string, unknown>[]> {
  try {
    const since = new Date(
      Date.now() - FRESH_WINDOW_HOURS * 3600 * 1000,
    ).toISOString();
    let q = supabase
      .from("publications")
      .select(publicationSelect)
      .filter("visibility::text", "eq", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .filter("processing_status::text", "neq", "no_audio")
      .filter("hive_id::text", "eq", hiveId || "quebec")
      .or(
        "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
      )
      .or(
        "media_url.not.is.null,mux_playback_id.not.is.null,hls_url.not.is.null",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(poolLimit);
    if (excludedIds.length > 0) {
      q = q.not(
        "id",
        "in",
        `(${excludedIds.join(",")})`,
      );
    }
    const { data, error } = await q;
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).filter((p) =>
      isExplorePlayablePost(p),
    );
  } catch {
    return [];
  }
}

/**
 * Newest uploads, same window Explore uses (created_at desc).
 * The viral/RPC block is ORDER BY viral_score and never contains score≈0 rows,
 * so this query is the only way those posts enter the ranked pool.
 */
const RECENT_CANDIDATE_LIMIT = 60;

async function fetchRecentCandidates(
  supabase: SupabaseClient,
  publicationSelect: string,
  hiveId: string,
  authorIds: string[] | null,
): Promise<Record<string, unknown>[]> {
  try {
    let q = supabase
      .from("publications")
      .select(publicationSelect)
      .filter("visibility::text", "eq", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .filter("processing_status::text", "neq", "no_audio")
      .filter("hive_id::text", "eq", hiveId || "quebec")
      .or(
        "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
      )
      .or(
        "media_url.not.is.null,mux_playback_id.not.is.null,hls_url.not.is.null",
      )
      .order("created_at", { ascending: false })
      .limit(RECENT_CANDIDATE_LIMIT);
    if (authorIds && authorIds.length > 0) {
      q = q.in("user_id", authorIds);
    }
    const { data, error } = await q;
    if (error || !data) {
      console.warn(
        "[FeedInfinite] recent candidates skipped:",
        (error as { message?: string } | null)?.message,
      );
      return [];
    }
    return (data as Record<string, unknown>[]).filter((p) =>
      isExplorePlayablePost(p),
    );
  } catch (err) {
    console.warn("[FeedInfinite] recent candidates skipped:", err);
    return [];
  }
}

function isRecentUpload(
  p: Record<string, unknown>,
  hours = FRESH_FLOOR_HOURS,
): boolean {
  const t = new Date(String(p.created_at ?? "")).getTime();
  return Number.isFinite(t) && Date.now() - t < hours * 3_600_000;
}

function mergeCandidates(
  base: Record<string, unknown>[],
  extra: Record<string, unknown>[],
  excluded: Set<string>,
): Record<string, unknown>[] {
  const merged = [...base];
  const seen = new Set(merged.map((p) => String(p.id)));
  for (const row of extra) {
    const id = String(row.id ?? "");
    if (!id || seen.has(id) || excluded.has(id)) continue;
    merged.push(row);
    seen.add(id);
  }
  return merged;
}

function isTikTokStylePost(p: Record<string, unknown>): boolean {
  const meta = p.media_metadata as Record<string, unknown> | undefined;
  if (meta?.tiktok_id) return true;
  const src = String(p.video_source ?? meta?.source ?? "");
  if (/tiktok|tikapi|apify/i.test(src)) return true;
  if (String(p.tiktok_url ?? "").includes("tiktok.com")) return true;
  return false;
}

function isPortraitPost(p: Record<string, unknown>): boolean {
  const ar = String(p.aspect_ratio ?? "");
  if (ar === "9:16" || ar.includes("9/16")) return true;
  const meta = p.media_metadata as Record<string, unknown> | undefined;
  const w = Number(meta?.width ?? p.width ?? 0);
  const h = Number(meta?.height ?? p.height ?? 0);
  if (h > 0 && w > 0) return h > w;
  return false;
}

function isReliableTikTokPlayback(p: Record<string, unknown>): boolean {
  return isReliablePlaybackMedia(
    String(p.media_url ?? ""),
    String(p.mux_playback_id ?? ""),
  );
}

/** Pexels/Pixabay landscape filler — not TikTok-style FYP content. */
function isStockFillerPost(p: Record<string, unknown>): boolean {
  if (isTikTokStylePost(p)) return false;
  const src = String(p.video_source ?? "").toLowerCase();
  if (/pexels|pixabay|stock/.test(src)) return true;
  const meta = p.media_metadata as Record<string, unknown> | undefined;
  if (/pexels|pixabay/i.test(String(meta?.source ?? ""))) return true;
  const media = String(p.media_url ?? "").toLowerCase();
  if (/pexels|pixabay|videos\.pexels/i.test(media)) return true;
  // Mux-hosted landscape clips without TikTok markers (common Pexels seed path)
  const onMux =
    !!p.mux_playback_id || /mux\.com/i.test(String(p.media_url ?? ""));
  const userUpload = src === "upload" || src === "mux";
  if (onMux && !userUpload && !isPortraitPost(p)) return true;
  return false;
}

/** ~24h half-life: score halves about once a day (e^(-0.028 * 24) ≈ 0.51). */
const RECENCY_LAMBDA_PER_HOUR = 0.028;

function recencyMultiplier(createdAt: unknown, now: number): number {
  const t = new Date(String(createdAt ?? "")).getTime();
  if (!Number.isFinite(t)) return 1;
  const ageHours = Math.max(0, (now - t) / 3_600_000);
  return Math.exp(-RECENCY_LAMBDA_PER_HOUR * ageHours);
}

/** Rank on decayed viral_score. Posts under 48h get a floor so a raw score of 0
 *  still enters the top tiers — decay alone cannot promote rows that score 0.
 *  Original viral_score is restored before the response.
 */
const FRESH_SCORE_FLOOR = 12000;
const FRESH_FLOOR_HOURS = 48;

function applyRecencyDecay(
  posts: Record<string, unknown>[],
): Record<string, unknown>[] {
  const now = Date.now();
  return posts.map((p) => {
    const base = Number(p.viral_score) || 0;
    const t = new Date(String(p.created_at ?? "")).getTime();
    const ageHours = Number.isFinite(t)
      ? Math.max(0, (now - t) / 3_600_000)
      : Number.POSITIVE_INFINITY;
    const mult = recencyMultiplier(p.created_at, now);
    const floor =
      ageHours <= FRESH_FLOOR_HOURS ? FRESH_SCORE_FLOOR * mult : 0;
    return {
      ...p,
      _raw_viral_score: base,
      viral_score: base * mult + floor,
    };
  });
}

function restoreViralScores(
  posts: Record<string, unknown>[],
): Record<string, unknown>[] {
  return posts.map((p) => {
    if (!("_raw_viral_score" in p)) return p;
    const raw = p._raw_viral_score;
    const next = { ...p, viral_score: raw };
    delete next._raw_viral_score;
    return next;
  });
}

/** Explore: TikTok first, then curated, then user content; stock landscapes last.
 *  Within each bucket, rank by decayed viral_score and shuffle only inside tiers.
 */
function orderExploreFeed(
  posts: Record<string, unknown>[],
  blockSeed: number,
): Record<string, unknown>[] {
  const tiktok: Record<string, unknown>[] = [];
  const curated: Record<string, unknown>[] = [];
  const stock: Record<string, unknown>[] = [];
  const other: Record<string, unknown>[] = [];

  for (const p of posts) {
    if (isTikTokStylePost(p) && isReliableTikTokPlayback(p)) {
      tiktok.push(p);
      continue;
    }
    if (isStockFillerPost(p)) {
      stock.push(p);
      continue;
    }
    if (isTiGuyCuratedPost(p)) {
      curated.push(p);
      continue;
    }
    other.push(p);
  }

  const sh = (arr: Record<string, unknown>[], seed: number) => {
    if (arr.length <= 1) return arr;
    const ranked = [...arr].sort(
      (a, b) => (Number(b.viral_score) || 0) - (Number(a.viral_score) || 0),
    );
    return seededTierShuffle(ranked, seed, 10);
  };

  const stockShuffled = sh(stock, blockSeed + 333);
  const stockTail = stockShuffled;

  return [
    ...interleaveQueues(
      [
        sh(tiktok, blockSeed),
        sh(curated, blockSeed + 77),
        sh(other, blockSeed + 111),
      ],
      blockSeed,
    ),
    ...stockTail,
  ];
}

function orderFeedPosts(
  posts: Record<string, unknown>[],
  feedType: string,
  blockSeed: number,
): Record<string, unknown>[] {
  if (feedType === "explore") return orderExploreFeed(posts, blockSeed);
  // Input is already best-first (decayed viral). Shuffle inside tiers only.
  return seededTierShuffle(posts, blockSeed, 10);
}

/** Explore (Pour toi): TikTok vertical first; demote Pexels landscape stock. */
function exploreFeedScore(p: Record<string, unknown>): number {
  let score = Number(p.viral_score) || 0;
  if (isTiGuyCuratedPost(p)) {
    score += 35000;
    if (p.choix_du_castor === true) score += 15000;
    if (p.mux_playback_id) score += 8000;
  }
  if (isTikTokStylePost(p)) {
    score += isReliableTikTokPlayback(p) ? 55000 : -50000;
  }
  if (isStockFillerPost(p)) score -= 50000;
  const media = String(p.media_url ?? "");
  if (media.includes("supabase.co/storage") && isTikTokStylePost(p))
    score += 15000;
  if (p.mux_playback_id || media.includes("mux.com")) {
    score += isTikTokStylePost(p) ? 12000 : 3000;
  }
  if (isPortraitPost(p)) score += 8000;
  else if (!isTikTokStylePost(p)) score -= 25000;
  return score;
}

const FEED_PUBLICATIONS_SELECT = `
  *,
  user:user_id (
    id,
    username,
    display_name,
    avatar_url,
    subscription_tier
  )
`;

/** Pull Ti-Guy / AI / Castor posts even when viral_score keeps them out of the top block. */
async function fetchTiGuyCuratedSupabase(
  supabase: SupabaseClient,
  hiveId: string,
  limit = 24,
): Promise<Record<string, unknown>[]> {
  const { data: botRow } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .maybeSingle();

  const { data } = await supabase
    .from("publications")
    .select(FEED_PUBLICATIONS_SELECT)
    .filter("visibility::text", "eq", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .filter("processing_status::text", "neq", "no_audio")
    .filter("hive_id::text", "eq", hiveId || "quebec")
    .not("media_url", "is", null)
    .or(
      "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
    )
    .order("created_at", { ascending: false })
    .limit(limit * 4);

  if (!data?.length) return [];

  return (data as Record<string, unknown>[])
    .filter((p) => {
      if (!isExplorePlayablePost(p)) return false;
      if (isTiGuyCuratedPost(p)) return true;
      return botRow?.id != null && p.user_id === botRow.id;
    })
    .slice(0, limit);
}

/** Pull playable TikTok imports (Apify/TikAPI) into Pour toi — often outranked by stock Mux. */
async function fetchTikTokExploreSupabase(
  supabase: SupabaseClient,
  hiveId: string,
  limit = 36,
): Promise<Record<string, unknown>[]> {
  const { data } = await supabase
    .from("publications")
    .select(FEED_PUBLICATIONS_SELECT)
    .filter("visibility::text", "eq", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .filter("hive_id::text", "eq", hiveId || "quebec")
    .not("media_url", "is", null)
    .in("video_source", ["tiktok", "tiktok_apify", "apify"])
    .or(
      "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
    )
    .order("viral_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (!data?.length) return [];

  return (data as Record<string, unknown>[])
    .filter(
      (p) =>
        isExplorePlayablePost(p) &&
        isTikTokStylePost(p) &&
        isReliableTikTokPlayback(p),
    )
    .slice(0, limit);
}

/**
 * Block size for seeded-shuffle pagination. We fetch one ranked block, shuffle
 * within quality tiers using the session seed, then slice the requested page out
 * of it. Pages within the same block + seed are stable (no dupes / skips); the
 * single block read keeps perf on par with the previous per-page query.
 */
const FEED_BLOCK_SIZE = 120;

/** Cap on how many recently-watched ids we pull from video_views per request. */
const WATCHED_LOOKBACK = 500;

/**
 * Recently-watched publication ids for an authenticated viewer, newest first.
 * Uses the Supabase JS client (service role) — the drizzle/pg pool times out
 * in production, so all reads here go through Supabase HTTP.
 */
async function fetchWatchedPostIds(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("video_views")
      .select("publication_id")
      .eq("user_id", viewerId)
      .order("watched_at", { ascending: false })
      .limit(WATCHED_LOOKBACK);
    if (error || !data) return [];
    return data
      .map((r: { publication_id: string | null }) => r.publication_id)
      .filter((id): id is string => !!id);
  } catch {
    return [];
  }
}

/** Fetch feed directly via Supabase HTTP — no DATABASE_URL needed */
async function getPostsViaSupabase(
  limit: number,
  page: number,
  _hiveId = "quebec",
  seed = 0,
  viewerId?: string,
  guestSeenIds: string[] = [],
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Map the requested page onto a ranked block, then shuffle within that block.
  const absoluteOffset = page * limit;
  const blockIndex = Math.floor(absoluteOffset / FEED_BLOCK_SIZE);
  const offsetInBlock = absoluteOffset % FEED_BLOCK_SIZE;
  const blockStart = blockIndex * FEED_BLOCK_SIZE;

  // Watched-video knowledge: authed users from video_views, guests from the
  // client-supplied list. Unseen posts are surfaced before watched ones.
  const seen = new Set<string>(guestSeenIds.map(String));
  if (viewerId) {
    const watchedIds = await fetchWatchedPostIds(supabase, viewerId);
    for (const id of watchedIds) seen.add(id);
  }

  const { data, error } = await supabase
    .from("publications")
    .select(`*, user:user_id(id, username, display_name, avatar_url)`)
    .filter("visibility::text", "eq", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .or(
      "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
    )
    .not("media_url", "is", null)
    // Exclude expired media-proxy URLs (signed TikTok CDN links that 403)
    .not("media_url", "ilike", "/api/media-proxy%")
    // Only serve permanent video sources (Mux HLS, Supabase storage, stock CDNs)
    .or(
      "media_url.ilike.%mux.com%,media_url.ilike.%supabase.co%,media_url.ilike.%.m3u8,media_url.ilike.%image.mux.com%,media_url.ilike.%pexels.com%,media_url.ilike.%videos.pexels.com%,media_url.ilike.%pixabay.com%,media_url.ilike.%cdn.pixabay.com%,media_url.ilike.%commondatastorage.googleapis.com%,media_url.ilike.%googleapis.com%",
    )
    .order("viral_score", { ascending: false })
    .order("reactions_count", { ascending: false })
    .range(blockStart, blockStart + FEED_BLOCK_SIZE - 1);

  if (error) throw new Error(error.message);

  const block = (data || []) as Record<string, unknown>[];
  if (seed === 0) {
    const ordered = unseenFirst(block, seen);
    return ordered.slice(offsetInBlock, offsetInBlock + limit);
  }

  // Quality-preserving seeded shuffle: viral content stays near top, order
  // varies per session. Tier offset by block keeps blocks from aligning.
  const shuffled = seededTierShuffle(
    block,
    (seed + blockIndex * 2654435761) >>> 0,
  );
  // Promote unseen posts ahead of watched ones while keeping the tier-shuffled
  // order within each group. Falls back to the full list when all are watched.
  const ordered = unseenFirst(shuffled, seen);
  return ordered.slice(offsetInBlock, offsetInBlock + limit);
}

const router = Router();

/** GET /api/feed/pool-stats — how many public videos are in the DB (debug) */
router.get("/pool-stats", async (_req, res) => {
  try {
    const { countPublicFeedPosts, countPlayableFeedPosts } =
      await import("../services/feed-replenish-tikapi.js");
    const { isMuxIngestConfigured } =
      await import("../services/tiktok-mux-ingest.js");
    const count = await countPublicFeedPosts("quebec");
    const playableCount = await countPlayableFeedPosts("quebec");
    const minPosts = parseInt(process.env.FEED_MIN_PLAYABLE_POSTS || "150", 10);
    res.json({
      hive: "quebec",
      publicVideoCount: count,
      playableVideoCount: playableCount,
      minThreshold: minPosts,
      needsReplenish: playableCount < minPosts,
      muxIngestConfigured: isMuxIngestConfigured(),
    });
  } catch (e: unknown) {
    res.status(500).json({
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

// Get feed posts — uses Supabase HTTP API (no DATABASE_URL dependency)
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const hive = (req.query.hive as string) || "quebec";
    const viewerId = (req as any).userId as string | undefined;
    const seed = resolveFeedSeed(req.query.session, viewerId);

    // Client-seen always applied (guests only; authed as backup before video_views).
    const guestSeenIds = parseSeenIds(req);

    // Try Supabase HTTP first (always works)
    if (SUPABASE_URL && SUPABASE_KEY) {
      const posts = await getPostsViaSupabase(
        limit,
        page,
        hive,
        seed,
        viewerId,
        guestSeenIds,
      );
      return res.json({
        posts,
        nextCursor: posts.length === limit ? String(page + 1) : null,
        seed,
        isGuestMode: !(req as any).userId,
        source: "supabase",
      });
    }

    // Fallback to pool if Supabase not configured
    if ((req as any).userId) {
      const posts = await storage.getFeedPosts(
        (req as any).userId,
        page,
        limit,
      );
      return res.json({ posts });
    }
    const posts = await storage.getExplorePosts(page, limit);
    res.json({ posts, isGuestMode: true });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ error: "Failed to get feed" });
  }
});

// Get Smart "Pour Toi" Feed - Uses Vector Recommendations
router.get("/smart", optionalAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const hive = (req.query.hive as string) || "quebec";
    const viewerId = (req as any).userId as string | undefined;
    const seed = resolveFeedSeed(req.query.session, viewerId);

    const embedding = req.query.embedding
      ? JSON.parse(req.query.embedding as string)
      : null;

    if (!embedding) {
      // Fallback: same Supabase path as GET /api/feed (avoid DATABASE_URL pool timeouts)
      if (SUPABASE_URL && SUPABASE_KEY) {
        const posts = await getPostsViaSupabase(
          limit,
          0,
          hive,
          seed,
          viewerId,
          parseSeenIds(req),
        );
        return res.json({ posts, isFallback: true, source: "supabase" });
      }
      const posts = await storage.getExplorePosts(0, limit);
      return res.json({ posts, isFallback: true, source: "pool" });
    }

    try {
      const posts = await storage.getSmartRecommendations(embedding, limit);
      return res.json({ posts });
    } catch (vectorErr) {
      console.error("Smart recommendations failed, falling back:", vectorErr);
      if (SUPABASE_URL && SUPABASE_KEY) {
        const posts = await getPostsViaSupabase(
          limit,
          0,
          hive,
          seed,
          viewerId,
          parseSeenIds(req),
        );
        return res.json({
          posts,
          isFallback: true,
          source: "supabase",
          vectorFailed: true,
        });
      }
      throw vectorErr;
    }
  } catch (error) {
    console.error("Get smart feed error:", error);
    res.status(500).json({ error: "Failed to get smart recommendations" });
  }
});

// [NEW] Infinite Scroll Feed - Cursor-based Pagination using Supabase HTTP API
// This bypasses DATABASE_URL issues by using Supabase HTTP API directly
router.get(
  "/infinite",
  attachOptionalUser,
  async (req: Request, res: Response) => {
    try {
      const supabaseUrl =
        process.env.VITE_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL;
      const anonKey =
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        console.error("[FeedInfinite] Missing Supabase anon config");
        return res
          .status(500)
          .json({ error: "Missing Supabase configuration" });
      }

      // Dynamically import to avoid top-level issues
      const { createClient } = await import("@supabase/supabase-js");
      const rawAuth = req.headers.authorization;
      const authLooksLikeJwt =
        typeof rawAuth === "string" &&
        /^Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/.test(
          rawAuth,
        );
      const supabase = authLooksLikeJwt
        ? createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: rawAuth } },
          })
        : createClient(supabaseUrl, anonKey);

      const limit = parseInt(req.query.limit as string) || 30;
      const cursorRaw = req.query.cursor as string | undefined;

      let pageOffset = 0;
      let seed = 0;
      if (cursorRaw) {
        const parts = cursorRaw.split("-");
        pageOffset = parseInt(parts[0], 10) || 0;
        seed = parseInt(parts[1], 10) || 0;
      }

      const feedType = (req.query.type as string) || "explore";
      const sortParam = (req.query.sort as string) || "";
      const hiveId = req.query.hive as string | undefined;

      const viewerId = (req as any).userId as string | undefined;

      if (pageOffset === 0 || seed === 0) {
        const userSeed = viewerId
          ? viewerId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
          : 0;
        const clientSession = (req.query.session as string) || "";
        const sessionSeed = clientSession
          ? clientSession.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
          : Math.floor(Math.random() * 1e9);
        const timeBucket = Math.floor(Date.now() / (30 * 60 * 1000));
        seed =
          (userSeed * 2654435761 + sessionSeed * 1597334677 + timeBucket) >>> 0;
        pageOffset = 0;
      }

      // Fetch viewer's region and affinities for region-aware feed weighting
      let viewerRegion = hiveId || "quebec";
      let viewerAffinities: string[] = [];
      if (viewerId) {
        const { data: viewerProfile } = await supabase
          .from("user_profiles")
          .select("region, affinity_tags")
          .eq("id", viewerId)
          .single();
        if (viewerProfile) {
          if (viewerProfile.region) viewerRegion = viewerProfile.region;
          if (viewerProfile.affinity_tags)
            viewerAffinities = viewerProfile.affinity_tags;
        }
      }

      // ── Exclude hidden + recently watched videos ─────────────────────────
      // Always MERGE hidden + watched + guest client-seen — never overwrite.
      let excludedIds: string[] = [];
      let hiddenIds: string[] = [];
      // Client-seen always merges in (guests only have this; authed use it as
      // a backup for watches not yet flushed to video_views).
      for (const id of parseSeenIds(req)) excludedIds.push(id);
      if (viewerId) {
        try {
          hiddenIds = await storage.getHiddenPostIds(viewerId);
          if (hiddenIds.length > 0) excludedIds.push(...hiddenIds);
        } catch {
          // non-critical
        }
      }
      if (viewerId && (feedType === "feed" || feedType === "explore")) {
        try {
          // 30 days + higher cap so logins don't re-serve the same block of clips
          const since = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString();
          const { data: watched } = await supabase
            .from("video_views")
            .select("publication_id")
            .eq("user_id", viewerId)
            .gte("watched_at", since)
            .order("watched_at", { ascending: false })
            .limit(500);
          if (watched?.length) {
            for (const r of watched as { publication_id: string }[]) {
              if (r.publication_id) excludedIds.push(r.publication_id);
            }
          }
        } catch {
          // non-critical
        }
      }
      excludedIds = [...new Set(excludedIds.filter(Boolean))];

      let authorIds: string[] | null = null;
      if (feedType === "feed" && viewerId) {
        const { data: subs, error: subErr } = await supabase
          .from("abonnements")
          .select("followee_id")
          .eq("follower_id", viewerId);
        if (!subErr && subs?.length) {
          const followed = subs
            .map((s: { followee_id: string }) => s.followee_id)
            .filter(Boolean);
          authorIds = [...new Set([...followed, viewerId])];
        } else {
          authorIds = [viewerId];
        }
      }

      const publicationSelect = `
            *,
            user:user_id (
              id,
              username,
              display_name,
              avatar_url,
              subscription_tier
            )
          `;

      const buildBaseQuery = () =>
        supabase
          .from("publications")
          .select(publicationSelect)
          .filter("visibility::text", "eq", "public")
          .eq("est_masque", false)
          .is("deleted_at", null)
          .filter("processing_status::text", "neq", "no_audio")
          .filter("hive_id::text", "eq", hiveId || "quebec")
          .or(
            "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
          )
          .or(
            "media_url.not.is.null,mux_playback_id.not.is.null,hls_url.not.is.null",
          )
          .not("caption", "ilike", "%DIAGNOSTIC%")
          .not("content", "ilike", "%DIAGNOSTIC%")
          .not("caption", "ilike", "%TEST VIDEO%")
          .not("content", "ilike", "%TEST VIDEO%");

      const buildTableQuery = () =>
        buildBaseQuery()
          .order("viral_score", { ascending: false })
          .order("reactions_count", { ascending: false })
          .order("created_at", { ascending: false });

      // ── sort=newest: strict chronological feed, no shuffle ─────────────
      // Lets viewers watch fresh imports land. Same filters as the table
      // path, primary order created_at desc, simple offset pagination.
      if (sortParam === "newest") {
        // Re-derive the offset from the raw cursor: the seed-regeneration
        // block above resets pageOffset to 0 when seed=0, which is always
        // true for newest cursors ("<offset>-0").
        const rawCursor = (req.query.cursor as string) || "";
        const newestOffset = parseInt(rawCursor.split("-")[0], 10) || 0;
        let nq = buildBaseQuery()
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
        if (excludedIds.length > 0) {
          nq = nq.not("id", "in", `(${excludedIds.join(",")})`);
        }
        nq = nq.range(newestOffset, newestOffset + limit - 1);
        const { data: newestPosts, error: newestError } = await nq;
        if (newestError) {
          console.error(
            "[FeedInfinite] newest sort error:",
            newestError,
          );
          return res.status(500).json({
            error: "Database error",
            details: (newestError as { message?: string }).message,
          });
        }
        const rows = (newestPosts || []) as Record<string, unknown>[];
        const hasMoreNewest = rows.length >= limit;
        return res.json({
          posts: rows,
          hasMore: hasMoreNewest,
          nextCursor: hasMoreNewest
            ? `${newestOffset + rows.length}-0`
            : null,
          source: "supabase-http-v2",
          feedType,
          sort: "newest",
          followingFiltered: false,
          excludedCount: excludedIds.length,
        });
      }

      const buildQuery = (
        offset: number,
        ignoreExclusions: boolean,
        fetchLimit: number,
      ) => {
        let q;

        if (feedType === "explore" && !exploreRpcDisabled) {
          q = supabase
            .rpc("get_localized_explore_feed", {
              p_viewer_id: viewerId || null,
              p_region_id: viewerRegion,
              p_affinity_tags: viewerAffinities || [],
              p_limit: 1000,
              p_seed: seed,
              p_seen_ids: excludedIds || [],
            })
            .select(publicationSelect);
        } else {
          q = buildTableQuery();
        }

        q = q.range(offset, offset + fetchLimit - 1);

        // Path A (explore RPC) handles exclusions in SQL. Table/following feeds
        // apply them in PostgREST.
        if (
          (feedType !== "explore" || exploreRpcDisabled) &&
          !ignoreExclusions &&
          excludedIds.length > 0
        ) {
          q = q.not("id", "in", `(${excludedIds.join(",")})`);
        }

        if (authorIds && authorIds.length > 0) {
          q = q.in("user_id", authorIds);
        }

        return q;
      };

      // ── Block-Shuffling Pagination ────────────────────────────────────────
      const BLOCK_SIZE = 240;
      let blockIndex = Math.floor(pageOffset / BLOCK_SIZE);
      let offsetInBlock = pageOffset % BLOCK_SIZE;
      let dbOffset = blockIndex * BLOCK_SIZE;

      let { data: posts, error } = await buildQuery(
        dbOffset,
        false,
        BLOCK_SIZE,
      );

      if (
        error &&
        feedType === "explore" &&
        !exploreRpcDisabled &&
        /get_localized_explore_feed|PGRST202|schema cache/i.test(
          String((error as { message?: string; code?: string }).message || "") +
            String((error as { code?: string }).code || ""),
        )
      ) {
        console.warn(
          "explore RPC unavailable, falling back to publications table:",
          (error as { message?: string }).message,
        );
        exploreRpcDisabled = true;
        const retry = await buildQuery(dbOffset, false, BLOCK_SIZE);
        posts = retry.data;
        error = retry.error;
      }

      // If we ran out of unseen posts, reshuffle seed but KEEP exclusions when
      // possible so users don't instantly re-see the same watched clips.
      // Only ignore exclusions if the pool is empty even with exclusions applied.
      let didWrap = false;
      if (!error && (!posts || posts.length === 0)) {
        blockIndex = 0;
        offsetInBlock = 0;
        dbOffset = 0;
        seed = (seed + 9876543) >>> 0;
        let fallback = await buildQuery(0, false, BLOCK_SIZE);
        if (!fallback.data?.length) {
          fallback = await buildQuery(0, true, BLOCK_SIZE);
        }
        posts = fallback.data;
        error = fallback.error;
        didWrap = true;
      }

      // If offset is past available posts in block, wrap back to block 0
      if (
        !error &&
        posts &&
        posts.length > 0 &&
        offsetInBlock >= posts.length
      ) {
        // This block is exhausted. Read the next viral/RPC block before
        // replaying block 0 — replaying is why the same ~25 clips loop.
        const nextBlockStart = (blockIndex + 1) * BLOCK_SIZE;
        const next = await buildQuery(nextBlockStart, false, BLOCK_SIZE);
        if (next.data?.length) {
          posts = next.data;
          error = next.error;
          blockIndex += 1;
          offsetInBlock = 0;
          dbOffset = nextBlockStart;
          pageOffset = nextBlockStart;
        } else {
          blockIndex = 0;
          offsetInBlock = 0;
          dbOffset = 0;
          seed = (seed + 9876543) >>> 0;
          let fallback = await buildQuery(0, false, BLOCK_SIZE);
          if (!fallback.data?.length || offsetInBlock >= fallback.data.length) {
            fallback = await buildQuery(0, true, BLOCK_SIZE);
          }
          posts = fallback.data;
          error = fallback.error;
          didWrap = true;
        }
      }

      if (error) {
        console.error("Supabase feed error:", error);
        return res
          .status(500)
          .json({ error: "Database error", details: error.message });
      }

      // Following feed empty → fall back to explore
      if (feedType === "feed" && (!posts || posts.length === 0)) {
        const savedAuthors = authorIds;
        authorIds = null;
        const fallback = await buildQuery(0, true, BLOCK_SIZE);
        authorIds = savedAuthors;
        posts = fallback.data;
        error = fallback.error;
      }

      // Count DB rows before curated/recent merges inflate the block.
      const dbRowCount = Array.isArray(posts) ? posts.length : 0;

      // Pour toi: inject Ti-Guy + TikTok clips (buried under bulk stock seed)
      if (feedType === "explore") {
        const excludedSetForMerge = new Set(excludedIds.map(String));
        const mergeCurated = (rows: Record<string, unknown>[]) => {
          if (!rows.length) return;
          const merged = [...(posts || [])] as Record<string, unknown>[];
          const seenIds = new Set(merged.map((p) => String(p.id)));
          const seenContent = new Set(merged.map((p) => getPostContentKey(p)));
          for (const row of rows) {
            const id = String(row.id);
            // Never re-inject clips the viewer already watched
            if (excludedSetForMerge.has(id)) continue;
            const contentKey = getPostContentKey(row);
            if (seenIds.has(id) || seenContent.has(contentKey)) continue;
            merged.push(row);
            seenIds.add(id);
            seenContent.add(contentKey);
          }
          posts = merged;
        };
        try {
          const blockSeed = (seed + blockIndex) >>> 0;
          const [curated, tiktokRows] = await Promise.all([
            fetchTiGuyCuratedSupabase(supabase, hiveId || "quebec"),
            fetchTikTokExploreSupabase(supabase, hiveId || "quebec"),
          ]);
          mergeCurated(shuffleWithSeed(tiktokRows, blockSeed).slice(0, 18));
          mergeCurated(shuffleWithSeed(curated, blockSeed + 99).slice(0, 12));
        } catch (curatedErr) {
          console.warn(
            "[FeedInfinite] Curated/TikTok fetch skipped:",
            curatedErr,
          );
        }
      }

      // Viral/RPC block is the top scores only. Union the newest uploads
      // (the Explore query) so score≈0 rows exist before decay and tiering.
      try {
        const recentRows = await fetchRecentCandidates(
          supabase,
          publicationSelect,
          hiveId || "quebec",
          authorIds,
        );
        posts = mergeCandidates(
          (posts || []) as Record<string, unknown>[],
          recentRows,
          new Set(excludedIds.map(String)),
        );
      } catch (recentErr) {
        console.warn("[FeedInfinite] recent merge skipped:", recentErr);
      }

      // ── Personalization: affinity tags + region soft re-rank (all feed types) ──
      // Decay viral_score first so old hits lose rank before affinity/boost/shuffle.
      let rankedPool = applyRecencyDecay(
        (posts || []) as Record<string, unknown>[],
      );
      if (
        viewerId &&
        (viewerAffinities.length > 0 || viewerRegion) &&
        rankedPool.length > 0
      ) {
        rankedPool = personalizePostOrder(rankedPool, {
          affinityTags: viewerAffinities,
          region: viewerRegion,
        });
      }

      // ── Subscription boost: multiply viral_score by tier multiplier then re-sort ──
      const BOOST: Record<string, number> = {
        gold: 5,
        silver: 3,
        bronze: 2,
        or: 5,
        argent: 3,
      };
      const boostedPosts = rankedPool.map((p: Record<string, unknown>) => {
        if (feedType === "explore") {
          // Keep personalization order; viral_score already blended in personalizePostOrder
          return {
            ...p,
            viral_score: Number(p.viral_score) || 0,
            _boost_tier: "explore",
            _personalized: Boolean(viewerAffinities.length),
          };
        }
        const tier = String(
          (p.user as { subscription_tier?: string } | undefined)
            ?.subscription_tier ?? "free",
        ).toLowerCase();
        const multiplier = BOOST[tier] ?? 1;
        return {
          ...p,
          viral_score: (Number(p.viral_score) || 0) * multiplier,
          _boost_tier: tier,
        };
      });
      // Sort candidates stably/deterministically before shuffling
      // Explore: only resort if we did NOT personalize (RPC order is fine as base)
      if (feedType !== "explore") {
        boostedPosts.sort(
          (a: any, b: any) =>
            b.viral_score - a.viral_score ||
            b.reactions_count - a.reactions_count ||
            b.id.localeCompare(a.id),
        );
      }

      // Deterministically shuffle block using block seed
      const blockSeed = (seed + blockIndex) >>> 0;
      const orderedPosts = orderFeedPosts(boostedPosts, feedType, blockSeed);
      const playableOrdered = orderedPosts.filter((p) =>
        isExplorePlayablePost(p),
      );
      const nonStockOrdered = playableOrdered.filter(
        (p) => !isStockFillerPost(p) || isRecentUpload(p),
      );
      const feedCandidates =
        feedType === "explore"
          ? nonStockOrdered.length >= 8
            ? nonStockOrdered
            : playableOrdered
          : orderedPosts;
      const dedupedCandidates = dedupePostsByContent(feedCandidates);
      // spaceOutFeed keeps tier order; prepareShuffledFeed would full-shuffle it away.
      const spacedCandidates =
        feedType === "explore"
          ? spaceOutFeed(dedupedCandidates, [], {
              minContentGap: 16,
              minAuthorGap: 6,
            })
          : dedupedCandidates;
      let finalPosts = spacedCandidates.slice(
        offsetInBlock,
        offsetInBlock + limit,
      );

      // If sliced posts are empty, wrap around block 0
      if (finalPosts.length === 0 && !didWrap) {
        blockIndex = 0;
        offsetInBlock = 0;
        dbOffset = 0;
        seed = (seed + 9876543) >>> 0;
        const fallback = await buildQuery(0, true, BLOCK_SIZE);
        posts = fallback.data;
        error = fallback.error;
        didWrap = true;

        if (!error && posts) {
          const boostedFallback = applyRecencyDecay(
            posts as Record<string, unknown>[],
          ).map((p: Record<string, unknown>) => {
            if (feedType === "explore") {
              return {
                ...p,
                // PATH A: Score is already calculated natively by the RPC decay algorithm.
                viral_score: Number(p.viral_score) || 0,
                _boost_tier: "explore",
              };
            }
            const tier = String(
              (p.user as { subscription_tier?: string } | undefined)
                ?.subscription_tier ?? "free",
            ).toLowerCase();
            const multiplier = BOOST[tier] ?? 1;
            return {
              ...p,
              viral_score: (Number(p.viral_score) || 0) * multiplier,
              _boost_tier: tier,
            };
          });
          if (feedType !== "explore") {
            boostedFallback.sort(
              (a: any, b: any) =>
                b.viral_score - a.viral_score ||
                b.reactions_count - a.reactions_count ||
                b.id.localeCompare(a.id),
            );
          }
          const shuffledFallback = orderFeedPosts(
            boostedFallback,
            feedType,
            seed,
          );
          const fallbackPlayable = shuffledFallback.filter((p) =>
            isExplorePlayablePost(p),
          );
          const fallbackNonStock = fallbackPlayable.filter(
            (p) => !isStockFillerPost(p) || isRecentUpload(p),
          );
          const fallbackCandidates =
            feedType === "explore"
              ? fallbackNonStock.length >= 8
                ? fallbackNonStock
                : fallbackPlayable
              : shuffledFallback;
          const dedupedFallback = dedupePostsByContent(fallbackCandidates);
          const spacedFallback =
            feedType === "explore"
              ? spaceOutFeed(dedupedFallback, [], {
                  minContentGap: 16,
                  minAuthorGap: 6,
                })
              : dedupedFallback;
          finalPosts = spacedFallback.slice(0, limit);
        }
      }

      // Hard-exclude watched/hidden after shuffle + curated inject. Soft
      // reordering alone was letting the same clips lead every app open.
      const hardExclude = new Set([
        ...hiddenIds.map(String),
        ...excludedIds.map(String),
      ]);
      if (hardExclude.size > 0) {
        const filtered = finalPosts.filter(
          (p: Record<string, unknown>) => !hardExclude.has(String(p.id)),
        );
        // Only fall back to watched clips when the unseen pool is exhausted
        if (filtered.length > 0) {
          finalPosts = filtered;
        } else if (!didWrap) {
          // Prefer unseen-first recycle of the spaced block over raw wrap
          const recycled = unseenFirst(
            spacedCandidates as { id?: unknown }[],
            hardExclude,
          ).slice(0, limit) as Record<string, unknown>[];
          finalPosts = recycled.length > 0 ? recycled : finalPosts;
        }
      }

      // ── Cold-start injection: 1 in 10 slots from the freshness queue ──
      // New uploads (last 48h) rank ~0 on viral score and would never surface.
      // Reserve deterministic slots so every session sees fresh content.
      // Skipped for sort=newest (that feed IS the freshness queue) and for
      // the following feed (subscribers expect their follows, not discovery).
      if (
        sortParam !== "newest" &&
        feedType !== "feed" &&
        finalPosts.length > 0
      ) {
        const freshPool = await fetchFreshVideoPool(
          supabase,
          publicationSelect,
          hiveId || "quebec",
          [...hardExclude].map(String),
        );
        if (freshPool.length > 0) {
          const baseOffset = didWrap ? 0 : pageOffset;
          const inFeed = new Set(
            finalPosts.map((p: Record<string, unknown>) => String(p.id)),
          );
          const freshUsed = new Set<string>();
          const injected = finalPosts.map((p) => p);
          for (let j = 0; j < injected.length; j++) {
            if ((baseOffset + j) % FRESH_EVERY_N !== FRESH_SLOT_OFFSET)
              continue;
            const freshSlotIndex = Math.floor(
              (baseOffset + j) / FRESH_EVERY_N,
            );
            let pick: Record<string, unknown> | null = null;
            for (let t = 0; t < freshPool.length; t++) {
              const cand =
                freshPool[(seed + freshSlotIndex + t) % freshPool.length];
              const cid = String(cand.id);
              if (!inFeed.has(cid) && !freshUsed.has(cid)) {
                pick = cand;
                break;
              }
            }
            if (pick) {
              const pid = String(pick.id);
              freshUsed.add(pid);
              inFeed.add(pid);
              injected[j] = pick;
            }
          }
          finalPosts = injected;
        }
      }

      // A short page (watch filter, dedupe) is not the end of the catalog.
      // Keep going through this ranked block, then the next DB block.
      // Only stop when the query itself ran dry, or we already replayed block 0.
      const windowEnd = offsetInBlock + limit;
      const moreInRankedBlock =
        !didWrap && windowEnd < spacedCandidates.length;
      const dbHasAnotherBlock = !didWrap && dbRowCount >= BLOCK_SIZE;
      const nextOffset = moreInRankedBlock
        ? blockIndex * BLOCK_SIZE + windowEnd
        : dbHasAnotherBlock
          ? (blockIndex + 1) * BLOCK_SIZE
          : null;
      const hasMore = nextOffset !== null;
      const nextCursor = hasMore ? `${nextOffset}-${seed || 1}` : null;

      res.json({
        posts: restoreViralScores(finalPosts),
        hasMore,
        nextCursor,
        source: "supabase-http-v2",
        feedType,
        followingFiltered: !!(feedType === "feed" && authorIds?.length),
        excludedCount: hardExclude.size,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to load feed",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  },
);

// ── Pour Toi: fetch watch history for personalization ───────────────────────
// GET /api/feed/watch-history?userId=...&limit=50
router.get("/watch-history", async (req: Request, res: Response) => {
  const { userId, limit: limitRaw } = req.query as {
    userId?: string;
    limit?: string;
  };

  if (!userId) return res.status(400).json({ error: "userId required" });

  const limit = Math.min(parseInt(limitRaw || "50", 10), 100);

  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.json({ posts: [] });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent watch events + join publication captions/hashtags
    const { data: views, error } = await supabase
      .from("watch_events")
      .select(
        `
        updated_at,
        watch_pct,
        publication:post_id (
          id,
          caption,
          content,
          hashtags
        )
      `,
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error || !views) {
      return res.json({ posts: [] });
    }

    const posts = views
      .filter((v: any) => v.publication)
      .map((v: any) => ({
        ...v.publication,
        completion_rate: (v.watch_pct || 0) / 100, // Normalize to 0-1
      }));

    res.json({ posts });
  } catch {
    res.json({ posts: [] });
  }
});

// ── Record a watched video ──────────────────────────────────────────────────
// POST /api/feed/watched  { publicationId, watchDurationMs? }
router.post(
  "/watched",
  attachOptionalUser,
  async (req: Request, res: Response) => {
    const viewerId = (req as any).userId as string | undefined;
    if (!viewerId) return res.status(401).json({ error: "Not authenticated" });

    const { publicationId, watchDurationMs, completionRate } = req.body as {
      publicationId: string;
      watchDurationMs?: number;
      completionRate?: number;
    };
    if (!publicationId)
      return res.status(400).json({ error: "publicationId required" });

    try {
      const supabaseUrl =
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY;
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl!, supabaseKey!);

      await supabase.from("video_views").upsert(
        {
          user_id: viewerId,
          publication_id: publicationId,
          watched_at: new Date().toISOString(),
          watch_duration_ms: watchDurationMs ?? null,
          completion_rate: completionRate ?? null,
        },
        { onConflict: "user_id,publication_id", ignoreDuplicates: false },
      );

      // Learn affinity tags from engaged watches (≥40% complete or ≥5s)
      const engaged =
        (typeof completionRate === "number" && completionRate >= 0.4) ||
        (typeof watchDurationMs === "number" && watchDurationMs >= 5000);
      if (engaged) {
        void (async () => {
          try {
            const { data: pub } = await supabase
              .from("publications")
              .select(
                "hashtags, detected_themes, caption, content, city, region, region_id",
              )
              .eq("id", publicationId)
              .maybeSingle();
            if (!pub) return;
            const learned = extractTagsFromPost(pub as any);
            if (!learned.length) return;
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("affinity_tags")
              .eq("id", viewerId)
              .maybeSingle();
            const merged = mergeAffinityTags(
              (profile?.affinity_tags as string[]) || [],
              learned,
              30,
            );
            await supabase
              .from("user_profiles")
              .update({
                affinity_tags: merged,
                updated_at: new Date().toISOString(),
              })
              .eq("id", viewerId);
          } catch {
            /* non-critical */
          }
        })();
      }

      res.json({ ok: true });
    } catch (err) {
      // fail silently — watch tracking is non-critical
      res.json({ ok: false });
    }
  },
);

export default router;

