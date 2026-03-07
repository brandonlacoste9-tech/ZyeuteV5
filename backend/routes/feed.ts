import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { cacheMiddleware } from "../utils/cache.js";

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Pass through, token extracted asynchronously if needed
  next();
};

const router = Router();

// Get feed posts - supports guest mode (returns explore posts for guests)
// Cached for 30 seconds to handle viral spike loads
router.get(
  "/",
  cacheMiddleware(30),
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;

      // If authenticated, return personalized feed
      // If guest (no auth), return explore posts
      if (req.userId) {
        const posts = await storage.getFeedPosts(req.userId, page, limit);
        res.json({ posts });
      } else {
        // Guest mode: return explore posts
        const posts = await storage.getExplorePosts(page, limit);
        res.json({ posts, isGuestMode: true });
      }
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

    console.log("[FeedInfinite] Query params", { limit, cursor, feedType });

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

    // Fallback to Pexels if no posts in database
    if (!posts || posts.length === 0) {
      console.log(
        "[FeedInfinite] No database posts, falling back to Pexels...",
      );
      try {
        const { PexelsService } = await import("../services/pexels-service.js");
        const pexelsData = await PexelsService.getCuratedVideos(limit, 1);

        // Transform Pexels videos to match post format
        const pexelsPosts = (pexelsData.videos || []).map((video: any) => ({
          id: `pexels-${video.id}`,
          type: "video",
          caption: `🎬 Pexels Video #${video.id}`,
          content: `🎬 Pexels Video #${video.id}`,
          media_url: video.video_files?.[0]?.link || video.image,
          thumbnail_url: video.image,
          video_duration: video.duration,
          visibility: "public",
          est_masque: false,
          created_at: new Date().toISOString(),
          reactions_count: 0,
          comments_count: 0,
          user: {
            id: "pexels",
            username: "Pexels",
            display_name: "Pexels",
            avatar_url:
              "https://images.pexels.com/videos/3045163/pexels-photo-3045163.jpeg",
          },
          // Flag for frontend to use SimpleVideoPlayer
          is_pexels: true,
        }));

        return res.json({
          posts: pexelsPosts,
          hasMore: pexelsPosts.length >= limit,
          nextCursor:
            pexelsPosts.length > 0
              ? pexelsPosts[pexelsPosts.length - 1].created_at
              : null,
          source: "pexels-fallback",
        });
      } catch (pexelsError) {
        console.error("[FeedInfinite] Pexels fallback failed:", pexelsError);
        // Return empty rather than error
        return res.json({
          posts: [],
          hasMore: false,
          nextCursor: null,
          source: "empty",
        });
      }
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
