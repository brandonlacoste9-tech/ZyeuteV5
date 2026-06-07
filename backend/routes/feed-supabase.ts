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
    const userId = (req as any).userId as string | undefined;

    // Determine user's preferred language if logged in
    let preferredLanguage: string | null = null;
    if (userId) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("preferred_language")
        .eq("user_id", userId)
        .single();
      if (profile?.preferred_language) {
        preferredLanguage = profile.preferred_language;
      }
    }

    const selectFields = `
        *,
        user:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `;

    const baseFilters = (
      q:
        | ReturnType<typeof supabase.from>
        | ReturnType<ReturnType<typeof supabase.from>["select"]>,
    ) =>
      (q as any)
        .eq("visibility", "public")
        .eq("est_masque", false)
        .is("deleted_at", null)
        .neq("processing_status", "no_audio")
        .or(
          "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
        )
        .order("created_at", { ascending: false });

    let formattedPosts: any[];

    if (preferredLanguage) {
      // Two-query language boost: same-language posts first
      const [
        { data: sameLang, error: err1 },
        { data: otherLang, error: err2 },
      ] = await Promise.all([
        baseFilters(
          supabase
            .from("publications")
            .select(selectFields)
            .eq("language", preferredLanguage),
        ).limit(15),
        baseFilters(
          supabase
            .from("publications")
            .select(selectFields)
            .neq("language", preferredLanguage),
        ).limit(5),
      ]);

      if (err1 || err2) {
        return res.status(500).json({
          error: "Database error",
          details: (err1 || err2)?.message,
        });
      }

      const merged = [...(sameLang || []), ...(otherLang || [])];
      formattedPosts = merged.map((post: any) => ({
        ...post,
        user: post.user || {
          id: post.user_id,
          username: "unknown",
          display_name: "Unknown User",
        },
      }));
    } else {
      // Default: no language boost
      const { data: posts, error } = await baseFilters(
        supabase.from("publications").select(selectFields),
      ).limit(limit);

      if (error) {
        return res.status(500).json({
          error: "Database error",
          details: error.message,
        });
      }

      formattedPosts =
        posts?.map((post: any) => ({
          ...post,
          user: post.user || {
            id: post.user_id,
            username: "unknown",
            display_name: "Unknown User",
          },
        })) || [];
    }

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
 * GET /api/feed/infinite/supabase - Infinite scroll feed using Supabase
 */
router.get("/feed/infinite/supabase", async (req, res) => {
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
    const cursor = req.query.cursor as string | undefined;

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
      .neq("processing_status", "no_audio")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

    const items = posts?.slice(0, limit) || [];
    const hasMore = (posts?.length || 0) > limit;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1].created_at : null;

    res.json({
      posts: items,
      nextCursor,
      hasMore,
      feedType: "explore",
    });
  } catch (error: any) {
    console.error("Infinite feed error:", error);
    res.status(500).json({
      error: "Feed failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/explore/supabase - Explore feed using Supabase (offset pagination + wrap)
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

    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 20),
    );
    const hiveId = (req.query.hive as string) || "quebec";
    const region = req.query.region as string | undefined;

    const selectFields = `
        *,
        user:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `;

    const buildQuery = (from: number, to: number) => {
      let q = supabase
        .from("publications")
        .select(selectFields)
        .eq("visibility", "public")
        .eq("est_masque", false)
        .is("deleted_at", null)
        .neq("processing_status", "no_audio")
        .eq("hive_id", hiveId)
        .or(
          "processing_status.eq.completed,processing_status.is.null,mux_playback_id.not.is.null",
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (region) {
        q = q.eq("region_id", region);
      }
      return q;
    };

    const from = page * limit;
    const to = from + limit - 1;

    let { data: posts, error } = await buildQuery(from, to);
    let didWrap = false;

    // Small pool: offset past end — recycle from start so scroll never dead-ends
    if (!error && (!posts || posts.length === 0) && page > 0) {
      const recycled = await buildQuery(0, limit - 1);
      posts = recycled.data;
      error = recycled.error;
      didWrap = true;
    }

    if (error) {
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }

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
      hasMore: formattedPosts.length > 0,
      page,
      didWrap,
      hiveId,
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
