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
  prepareShuffledFeed,
  seededTierShuffle,
  shuffleWithSeed,
} from "../../shared/utils/feedDedup.js";

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

/** Explore: TikTok first, then curated, then user content; stock landscapes last. */
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

  const sh = (arr: Record<string, unknown>[], seed: number) =>
    arr.length <= 1 ? arr : shuffleWithSeed(arr, seed);

  const stockShuffled = sh(stock, blockSeed + 333);
  const stockTail = stockShuffled.slice(0, Math.min(8, stockShuffled.length));

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
  return shuffleWithSeed(posts, blockSeed);
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
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", hiveId || "quebec")
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
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", hiveId || "quebec")
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

/** Fetch feed directly via Supabase HTTP — no DATABASE_URL needed */
async function getPostsViaSupabase(
  limit: number,
  page: number,
  _hiveId = "quebec",
  seed = 0,
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Map the requested page onto a ranked block, then shuffle within that block.
  const absoluteOffset = page * limit;
  const blockIndex = Math.floor(absoluteOffset / FEED_BLOCK_SIZE);
  const offsetInBlock = absoluteOffset % FEED_BLOCK_SIZE;
  const blockStart = blockIndex * FEED_BLOCK_SIZE;

  const { data, error } = await supabase
    .from("publications")
    .select(`*, user:user_id(id, username, display_name, avatar_url)`)
    .eq("visibility", "public")
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

  const block = data || [];
  if (seed === 0) return block.slice(offsetInBlock, offsetInBlock + limit);

  // Quality-preserving seeded shuffle: viral content stays near top, order
  // varies per session. Tier offset by block keeps blocks from aligning.
  const shuffled = seededTierShuffle(
    block as Record<string, unknown>[],
    (seed + blockIndex * 2654435761) >>> 0,
  );
  return shuffled.slice(offsetInBlock, offsetInBlock + limit);
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
    const seed = resolveFeedSeed(req.query.session, (req as any).userId);

    // Try Supabase HTTP first (always works)
    if (SUPABASE_URL && SUPABASE_KEY) {
      const posts = await getPostsViaSupabase(limit, page, hive, seed);
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

    const embedding = req.query.embedding
      ? JSON.parse(req.query.embedding as string)
      : null;

    if (!embedding) {
      // Fallback: Just return explore posts if no vector provided yet
      const posts = await storage.getExplorePosts(0, limit);
      return res.json({ posts, isFallback: true });
    }

    const posts = await storage.getSmartRecommendations(embedding, limit);
    res.json({ posts });
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
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY;

      console.log("[FeedInfinite] Request received", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : null,
      });

      if (!supabaseUrl || !supabaseKey) {
        console.error("[FeedInfinite] Missing Supabase config");
        return res
          .status(500)
          .json({ error: "Missing Supabase configuration" });
      }

      // Dynamically import to avoid top-level issues
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);

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

      console.log("[FeedInfinite] Query params", {
        limit,
        pageOffset,
        seed,
        feedType,
        hiveId,
        userId: (req as any).userId || null,
        hasClientSession: !!(req.query.session as string),
      });

      // Fetch viewer's region for region-aware feed weighting
      if (viewerId) {
        const { data: viewerProfile } = await supabase
          .from("user_profiles")
          .select("region")
          .eq("id", viewerId)
          .single();
        void viewerProfile;
      }

      // ── Exclude hidden + recently watched videos ─────────────────────────
      let excludedIds: string[] = [];
      let hiddenIds: string[] = [];
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
          const sevenDaysAgo = new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString();
          const { data: watched } = await supabase
            .from("video_views")
            .select("publication_id")
            .eq("user_id", viewerId)
            .gte("watched_at", sevenDaysAgo)
            .order("watched_at", { ascending: false })
            .limit(100);
          if (watched?.length) {
            excludedIds = watched.map(
              (r: { publication_id: string }) => r.publication_id,
            );
          }
        } catch {
          // non-critical
        }
      }

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

      const buildQuery = (
        offset: number,
        ignoreExclusions: boolean,
        fetchLimit: number,
      ) => {
        let q = supabase
          .from("publications")
          .select(
            `
          *,
          user:user_id (
            id,
            username,
            display_name,
            avatar_url,
            subscription_tier
          )
        `,
          )
          .eq("visibility", "public")
          .eq("est_masque", false)
          .is("deleted_at", null)
          .neq("processing_status", "no_audio") // Strict filter out silent videos
          .eq("hive_id", hiveId || "quebec")
          .or(
            "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
          )
          .not("media_url", "is", null)
          .not("caption", "ilike", "%DIAGNOSTIC%")
          .not("content", "ilike", "%DIAGNOSTIC%")
          .not("caption", "ilike", "%TEST VIDEO%")
          .not("content", "ilike", "%TEST VIDEO%")
          .order("viral_score", { ascending: false })
          .order("reactions_count", { ascending: false })
          .order("created_at", { ascending: false })
          .range(offset, offset + fetchLimit - 1);

        if (!ignoreExclusions && excludedIds.length > 0) {
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

      // If we ran out of unseen posts, wrap back to block 0
      let didWrap = false;
      if (!error && (!posts || posts.length === 0)) {
        blockIndex = 0;
        offsetInBlock = 0;
        dbOffset = 0;
        seed = (seed + 9876543) >>> 0;
        const fallback = await buildQuery(0, true, BLOCK_SIZE);
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
        blockIndex = 0;
        offsetInBlock = 0;
        dbOffset = 0;
        seed = (seed + 9876543) >>> 0;
        const fallback = await buildQuery(0, true, BLOCK_SIZE);
        posts = fallback.data;
        error = fallback.error;
        didWrap = true;
      }

      console.log("[FeedInfinite] Supabase result", {
        postsCount: posts?.length,
        hasError: !!error,
        didWrap,
      });

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

      // Pour toi: inject Ti-Guy + TikTok clips (buried under bulk stock seed)
      if (feedType === "explore") {
        const mergeCurated = (rows: Record<string, unknown>[]) => {
          if (!rows.length) return;
          const merged = [...(posts || [])] as Record<string, unknown>[];
          const seenIds = new Set(merged.map((p) => String(p.id)));
          const seenContent = new Set(merged.map((p) => getPostContentKey(p)));
          for (const row of rows) {
            const id = String(row.id);
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

      // ── Subscription boost: multiply viral_score by tier multiplier then re-sort ──
      const BOOST: Record<string, number> = {
        gold: 5,
        silver: 3,
        bronze: 2,
        or: 5,
        argent: 3,
      };
      const boostedPosts = (posts || []).map((p: Record<string, unknown>) => {
        if (feedType === "explore") {
          return {
            ...p,
            viral_score: exploreFeedScore(p),
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
      // Sort candidates stably/deterministically before shuffling
      boostedPosts.sort(
        (a: any, b: any) =>
          b.viral_score - a.viral_score ||
          b.reactions_count - a.reactions_count ||
          b.id.localeCompare(a.id),
      );

      // Deterministically shuffle block using block seed
      const blockSeed = (seed + blockIndex) >>> 0;
      const orderedPosts = orderFeedPosts(boostedPosts, feedType, blockSeed);
      const feedCandidates =
        feedType === "explore"
          ? orderedPosts.filter(
              (p) => isExplorePlayablePost(p) && !isStockFillerPost(p),
            )
          : orderedPosts;
      const dedupedCandidates = dedupePostsByContent(feedCandidates);
      const spacedCandidates =
        feedType === "explore"
          ? prepareShuffledFeed(dedupedCandidates, {
              shuffleSeed: (blockSeed + seed) >>> 0,
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
          const boostedFallback = posts.map((p: Record<string, unknown>) => {
            if (feedType === "explore") {
              return {
                ...p,
                viral_score: exploreFeedScore(p),
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
          boostedFallback.sort(
            (a: any, b: any) =>
              b.viral_score - a.viral_score ||
              b.reactions_count - a.reactions_count ||
              b.id.localeCompare(a.id),
          );
          const shuffledFallback = orderFeedPosts(
            boostedFallback,
            feedType,
            seed,
          );
          const fallbackCandidates =
            feedType === "explore"
              ? shuffledFallback.filter(
                  (p) => isExplorePlayablePost(p) && !isStockFillerPost(p),
                )
              : shuffledFallback;
          const dedupedFallback = dedupePostsByContent(fallbackCandidates);
          const spacedFallback =
            feedType === "explore"
              ? prepareShuffledFeed(dedupedFallback, {
                  shuffleSeed: seed >>> 0,
                  minContentGap: 16,
                  minAuthorGap: 6,
                })
              : dedupedFallback;
          finalPosts = spacedFallback.slice(0, limit);
        }
      }

      if (hiddenIds.length > 0) {
        const hiddenSet = new Set(hiddenIds);
        finalPosts = finalPosts.filter(
          (p: Record<string, unknown>) => !hiddenSet.has(String(p.id)),
        );
      }

      const activeOffset = didWrap ? 0 : pageOffset;
      const hasMore = finalPosts.length >= limit && !didWrap;
      const nextCursor = hasMore
        ? String(activeOffset + finalPosts.length) + "-" + seed
        : null;

      res.json({
        posts: finalPosts,
        hasMore,
        nextCursor,
        source: "supabase-http-v2",
        feedType,
        followingFiltered: !!(feedType === "feed" && authorIds?.length),
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
      res.json({ ok: true });
    } catch (err) {
      // fail silently — watch tracking is non-critical
      res.json({ ok: false });
    }
  },
);

export default router;
