/**
 * Seed Route - Emergency feed population endpoint
 * Populates the feed with sample Pexels videos when database is empty
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Sample Pexels video URLs for Quebec-themed content
const SAMPLE_VIDEOS = [
  {
    caption: "🎬 Bienvenue sur Zyeuté! #Quebec #Video",
    media_url: "https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/857251/pexels-photo-857251.jpeg",
  },
  {
    caption: "🌆 La ville de Montréal la nuit #Montreal #Night",
    media_url: "https://videos.pexels.com/video-files/3214448/3214448-uhd_2560_1440_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/3214448/pexels-photo-3214448.jpeg",
  },
  {
    caption: "🍁 Beauté du Québec #Nature #Quebec",
    media_url: "https://videos.pexels.com/video-files/4824363/4824363-uhd_2560_1440_30fps.mp4",
    thumbnail: "https://images.pexels.com/videos/4824363/pexels-photo-4824363.jpeg",
  },
  {
    caption: "💃 Danse et culture #Dance #Culture",
    media_url: "https://videos.pexels.com/video-files/5896379/5896379-uhd_2560_1440_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/5896379/pexels-photo-5896379.jpeg",
  },
  {
    caption: "🏙️ Vie urbaine #CityLife #Urban",
    media_url: "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_24fps.mp4",
    thumbnail: "https://images.pexels.com/videos/4763824/pexels-photo-4763824.jpeg",
  },
];

/**
 * POST /api/seed/feed - Seed the feed with sample videos
 */
router.post("/feed", async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
        details: "SUPABASE_SERVICE_ROLE_KEY not set",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if there's at least one user
    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    if (userError) {
      return res.status(500).json({
        error: "Database error checking users",
        details: userError.message,
      });
    }

    if (!users || users.length === 0) {
      return res.status(400).json({
        error: "No users found",
        details: "Create a user account first before seeding posts",
      });
    }

    const userId = users[0].id;

    // Insert sample videos
    const insertedPosts = [];
    for (const video of SAMPLE_VIDEOS) {
      const { data, error } = await supabase
        .from("publications")
        .insert({
          user_id: userId,
          caption: video.caption,
          content: video.caption,
          media_url: video.media_url,
          thumbnail_url: video.thumbnail,
          type: "video",
          visibility: "public",
          hive_id: "quebec",
          region_id: "montreal",
          city: "Montréal",
          reactions_count: Math.floor(Math.random() * 50) + 5,
          comments_count: Math.floor(Math.random() * 10),
          processing_status: "completed",
          est_masque: false,
        })
        .select("id, caption, media_url")
        .single();

      if (error) {
        console.error("Insert error:", error);
        continue;
      }

      insertedPosts.push(data);
    }

    res.json({
      success: true,
      message: `Seeded ${insertedPosts.length} videos to the feed`,
      posts: insertedPosts,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    res.status(500).json({
      error: "Seed failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/seed/status - Check if feed needs seeding
 */
router.get("/status", async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Count posts
    const { count, error } = await supabase
      .from("publications")
      .select("*", { count: "exact", head: true });

    if (error) {
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

    res.json({
      postsCount: count || 0,
      needsSeeding: (count || 0) === 0,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Status check failed",
      details: error.message,
    });
  }
});

export default router;
