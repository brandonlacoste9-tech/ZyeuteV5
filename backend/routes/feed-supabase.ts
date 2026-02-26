/**
 * Feed Route using Supabase HTTP API (works without DATABASE_URL)
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

/**
 * GET /api/feed/supabase - Get feed using Supabase HTTP API
 */
router.get("/feed/supabase", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const limit = parseInt(req.query.limit as string) || 20;

    // Get posts with user data using Supabase
    const { data: posts, error } = await supabase
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
      .limit(limit);

    if (error) {
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

    // Format posts to match expected structure
    const formattedPosts =
      posts?.map((post: any) => ({
        ...post,
        user: post.user || {
          id: post.user_id,
          username: "unknown",
          display_name: "Unknown User",
        },
      })) || [];

    res.json({
      posts: formattedPosts,
      count: formattedPosts.length,
      source: "supabase-http",
    });
  } catch (error: any) {
    console.error("Feed error:", error);
    res.status(500).json({
      error: "Feed failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/explore/supabase - Explore feed using Supabase
 */
router.get("/explore/supabase", async (req, res) => {
  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const limit = parseInt(req.query.limit as string) || 20;

    const { data: posts, error } = await supabase
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
      .limit(limit);

    if (error) {
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

    res.json({
      posts: posts || [],
      hiveId: "quebec",
    });
  } catch (error: any) {
    console.error("Explore error:", error);
    res.status(500).json({
      error: "Explore failed",
      details: error.message,
    });
  }
});

export default router;
