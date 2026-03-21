import { Router } from "express";
import { storage } from "../storage.js";
import { InsertPost } from "../../shared/schema.js";
import { TikTokScraperService } from "../services/tiktok-scraper-service.js";

const router = Router();

/**
 * GET /api/tiktok/search
 * Search for TikTok videos via Omkar Scraper API
 */
router.get("/search", async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const videos = await TikTokScraperService.search(q);
    res.json({ videos });
  } catch (error: any) {
    console.error("[TikTok Search Error]", error.message);
    res.status(500).json({ error: "Failed to fetch TikTok videos" });
  }
});

/**
 * GET /api/tiktok/trending
 * Get trending TikTok videos for the Canadian market
 */
router.get("/trending", async (req, res) => {
  try {
    const videos = await TikTokScraperService.getTrending();
    res.json({ videos });
  } catch (error: any) {
    console.error("[TikTok Trending Error]", error.message);
    res.status(500).json({ error: "Failed to fetch trending TikTok videos" });
  }
});

/**
 * POST /api/tiktok/import
 * Import a TikTok video into Zyeuté publications
 */
router.post("/import", async (req, res) => {
  const { video_url, metadata } = req.body;

  if (!video_url) {
    return res.status(400).json({ error: "video_url is required" });
  }

  try {
    // 1. Get or create a system user for imports (Ti-Guy Bot)
    let user = await storage.getUserByUsername("ti_guy_bot");
    if (!user) {
      // Fallback to any admin or first user if bot doesn't exist
      const recentPosts = await storage.getRecentPosts(1);
      if (recentPosts.length > 0) {
        user = recentPosts[0].user;
      } else {
        return res
          .status(500)
          .json({ error: "No user found to assign as author" });
      }
    }

    // 2. Prepare the post data - Use HD URL if available
    const postData: InsertPost = {
      userId: user.id,
      mediaUrl: video_url, // Always store the TikTok page URL (permanent for social embed)
      hlsUrl:
        metadata?.media?.hd_video_url || metadata?.media?.video_url || null, // Store temporary direct URL as fallback if needed
      thumbnailUrl: metadata?.thumbnails?.cover_url || "",
      caption: metadata?.caption || "Imported from TikTok",
      content: metadata?.caption || "TikTok Import",
      type: "video",
      visibility: "public",
      hiveId: "quebec",
      processingStatus: "completed",
      fireCount: metadata?.stats?.likes || 0,
      commentCount: metadata?.stats?.comments || 0,
      sharesCount: metadata?.stats?.shares || 0,
      viewCount: metadata?.stats?.views || 0,
      mediaMetadata: {
        tiktok_id: metadata?.video_id,
        author: metadata?.author?.handle,
        source: "tiktok-scraper",
        stats: metadata?.stats,
        original_url: video_url,
      },
    };

    // 3. Create the post in storage
    const newPost = await storage.createPost(postData);

    res.status(201).json(newPost);
  } catch (error: any) {
    console.error("[TikTok Import Error]", error.message);
    res.status(500).json({ error: "Failed to import TikTok video" });
  }
});

export default router;
