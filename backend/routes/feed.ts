import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { cacheMiddleware } from "../utils/cache.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
};

/** Fetch feed directly via Supabase HTTP — no DATABASE_URL needed */
async function getPostsViaSupabase(limit: number, page: number, hiveId = "quebec") {
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
    // Only serve permanent video sources (Pexels, Mux, Supabase storage)
    .or("media_url.ilike.%pexels.com%,media_url.ilike.%mux.com%,media_url.ilike.%supabase.co%,media_url.ilike.%.m3u8")
    .eq("hive_id", hiveId)
    .order("viral_score", { ascending: false })
    .order("reactions_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return data || [];
}

const router = Router();

// Get feed posts — uses Supabase HTTP API (no DATABASE_URL dependency)
router.get(
  "/",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const hive = (req.query.hive as string) || "quebec";

      // Try Supabase HTTP first (always works)
      if (SUPABASE_URL && SUPABASE_KEY) {
        const posts = await getPostsViaSupabase(limit, page, hive);
        return res.json({ posts, isGuestMode: !req.userId, source: "supabase" });
      }

      // Fallback to pool if Supabase not configured
      if (req.userId) {
        const posts = await storage.getFeedPosts(req.userId, page, limit);
        return res.json({ posts });
      }
      const posts = await storage.getExplorePosts(page, limit);
      res.json({ posts, isGuestMode: true });
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Failed to get feed" });
    }
  },
);

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
router.get("/infinite", async (req: Request, res: Response) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    console.log("[FeedInfinite] Request received", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : null,
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error("[FeedInfinite] Missing Supabase config");
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    // Dynamically import to avoid top-level issues
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const feedType = (req.query.type as string) || "explore";
    const hiveId = req.query.hive as string | undefined;

    console.log("[FeedInfinite] Query params", {
      limit,
      cursor,
      feedType,
      hiveId,
    });

    let query = supabase
      .from("publications")
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("visibility", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .eq("hive_id", hiveId || "quebec") // Filter by hive, default to quebec
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

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

    let hasMore = false;
    let nextCursor = null;

    if (posts && posts.length > limit) {
      hasMore = true;
      posts.pop();
      nextCursor = posts[posts.length - 1].created_at;
    } else if (posts && posts.length > 0) {
      nextCursor = posts[posts.length - 1].created_at;
    }

    res.json({
      posts,
      hasMore,
      nextCursor,
      source: "supabase-http-v2",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load feed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

export default router;
