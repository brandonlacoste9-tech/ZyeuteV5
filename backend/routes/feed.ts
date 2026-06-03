import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { createClient } from "@supabase/supabase-js";
import { cacheMiddleware } from "../utils/cache.js";
import { optionalAuth, verifyAuthToken } from "../supabase-auth.js";

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

/** Fetch feed directly via Supabase HTTP — no DATABASE_URL needed */
async function getPostsViaSupabase(
  limit: number,
  page: number,
  _hiveId = "quebec",
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const offset = page * limit;

  const { data, error } = await supabase
    .from("publications")
    .select(`*, user:user_id(id, username, display_name, avatar_url)`)
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("processing_status", "completed")
    .not("media_url", "is", null)
    // Only serve permanent video sources (Mux HLS, Supabase storage, reliable CDNs)
    .or(
      "media_url.ilike.%mux.com%,media_url.ilike.%supabase.co%,media_url.ilike.%.m3u8,media_url.ilike.%image.mux.com%,media_url.ilike.%pexels.com%,media_url.ilike.%videos.pexels.com%,media_url.ilike.%pixabay.com%,media_url.ilike.%cdn.pixabay.com%,media_url.ilike.%commondatastorage.googleapis.com%",
    )
    .order("viral_score", { ascending: false })
    .order("reactions_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return data || [];
}

const router = Router();

// Get feed posts — uses Supabase HTTP API (no DATABASE_URL dependency)
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const hive = (req.query.hive as string) || "quebec";

    // Try Supabase HTTP first (always works)
    if (SUPABASE_URL && SUPABASE_KEY) {
      const posts = await getPostsViaSupabase(limit, page, hive);
      return res.json({
        posts,
        nextCursor: posts.length === limit ? String(page + 1) : null,
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
      // cursor is now a numeric page offset (0-based), not a created_at timestamp
      const cursorRaw = req.query.cursor as string | undefined;
      const pageOffset = cursorRaw ? parseInt(cursorRaw, 10) || 0 : 0;
      const feedType = (req.query.type as string) || "explore";
      const hiveId = req.query.hive as string | undefined;

      console.log("[FeedInfinite] Query params", {
        limit,
        pageOffset,
        feedType,
        hiveId,
        userId: (req as any).userId || null,
      });

      const viewerId = (req as any).userId as string | undefined;

      // Fetch viewer's region for region-aware feed weighting (informational — ordering done via viral_score)
      if (viewerId) {
        const { data: viewerProfile } = await supabase
          .from("user_profiles")
          .select("region")
          .eq("id", viewerId)
          .single();
        // viewerProfile.region is available for future region-boost logic
        void viewerProfile;
      }

      // ── Exclude already-watched videos for authenticated users ──────────
      // Only exclude videos watched in the last 7 days — beyond that, recycle is fine.
      // This prevents the feed from running dry when the video pool is small.
      let excludedIds: string[] = [];
      if (viewerId) {
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
            .limit(100); // cap at 100 recent — never starve the feed
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

      const buildQuery = (offset: number, ignoreExclusions: boolean) => {
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
          .eq("hive_id", hiveId || "quebec") // Filter by hive, default to quebec
          .eq("processing_status", "completed")
          .not("media_url", "is", null)
          // Drop obvious QA / inject rows and stuck pipeline posts (blank players)
          .not("caption", "ilike", "%DIAGNOSTIC%")
          .not("content", "ilike", "%DIAGNOSTIC%")
          .not("caption", "ilike", "%TEST VIDEO%")
          .not("content", "ilike", "%TEST VIDEO%")
          .not("media_url", "ilike", "%fal.media%")
          .not("media_url", "ilike", "%.fal.run%")
          .order("viral_score", { ascending: false })
          .order("reactions_count", { ascending: false })
          .order("created_at", { ascending: false })
          // Use range-based offset pagination — consistent with viral_score sort
          .range(offset, offset + limit - 1);

        if (!ignoreExclusions && excludedIds.length > 0) {
          q = q.not("id", "in", `(${excludedIds.join(",")})`);
        }

        if (authorIds && authorIds.length > 0) {
          q = q.in("user_id", authorIds);
        }

        return q;
      };

      let { data: posts, error } = await buildQuery(pageOffset, false);

      // If we ran out of unseen posts, wrap around to offset 0 and IGNORE exclusions to recycle videos endlessly
      let didWrap = false;
      if (!error && (!posts || posts.length === 0)) {
        const { data: recycledPosts, error: recycledErr } = await buildQuery(0, true);
        posts = recycledPosts;
        error = recycledErr;
        didWrap = true;
      }

      console.log("[FeedInfinite] Supabase result", {
        postsCount: posts?.length,
        hasError: !!error,
      });

      if (error) {
        console.error("Supabase feed error:", error);
        return res
          .status(500)
          .json({ error: "Database error", details: error.message });
      }

      // ── Subscription boost: multiply viral_score by tier multiplier then re-sort ──
      const BOOST: Record<string, number> = {
        gold: 5,
        silver: 3,
        bronze: 2,
        // Legacy French aliases
        or: 5,
        argent: 3,
      };
      const boostedPosts = (posts || []).map((p: any) => {
        const tier: string = p.user?.subscription_tier?.toLowerCase() || "free";
        const multiplier = BOOST[tier] ?? 1;
        return {
          ...p,
          viral_score: (p.viral_score || 0) * multiplier,
          _boost_tier: tier,
        };
      });
      boostedPosts.sort(
        (a: any, b: any) =>
          b.viral_score - a.viral_score ||
          b.reactions_count - a.reactions_count,
      );

      // Offset-based pagination: if we got a full page there are likely more
      // If we wrapped, the new offset is 0
      const activeOffset = didWrap ? 0 : pageOffset;
      const hasMore = true; // ALWAYS return true for infinite feed
      const nextCursor =
        boostedPosts.length > 0
          ? String(activeOffset + boostedPosts.length)
          : "0";

      res.json({
        posts: boostedPosts,
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

// ── Record a watched video ──────────────────────────────────────────────────
// POST /api/feed/watched  { publicationId, watchDurationMs? }
router.post(
  "/watched",
  attachOptionalUser,
  async (req: Request, res: Response) => {
    const viewerId = (req as any).userId as string | undefined;
    if (!viewerId) return res.status(401).json({ error: "Not authenticated" });

    const { publicationId, watchDurationMs } = req.body as {
      publicationId: string;
      watchDurationMs?: number;
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
