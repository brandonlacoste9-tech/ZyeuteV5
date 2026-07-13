import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/**
 * Feed health – checks that the feed pipeline can return data.
 *
 * Prefer Supabase HTTP (same path as GET /api/feed) so free-tier pooler
 * saturation on DATABASE_URL does not false-alarm while the FYP still works.
 * Falls back to Drizzle pool only when Supabase env is missing.
 *
 * Returns 503 only when both paths fail.
 */
router.get("/feed", async (req: Request, res: Response) => {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  // Primary: Supabase REST (matches production feed)
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase
        .from("publications")
        .select("id")
        .filter("visibility::text", "eq", "public")
        .eq("est_masque", false)
        .is("deleted_at", null)
        .limit(1);

      if (error) throw new Error(error.message);

      const count = Array.isArray(data) ? data.length : 0;
      return res.status(200).json({
        status: count > 0 ? "ok" : "empty",
        feed: count > 0 ? "ready" : "no_content",
        count,
        source: "supabase",
      });
    } catch (error: any) {
      console.error(
        "[Health] Supabase feed check failed, trying pool:",
        error?.message || error,
      );
      // fall through to pool
    }
  }

  // Fallback: direct Postgres pool (Drizzle) with a hard timeout so health
  // checks never hang 15s+ when the pooler is saturated.
  try {
    const { storage } = await import("../storage.js");
    const posts = await Promise.race([
      storage.getExplorePosts(0, 1, "quebec"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("pool_health_timeout_3s")), 3000),
      ),
    ]);
    const hasPosts = Array.isArray(posts) && posts.length > 0;
    return res.status(200).json({
      status: hasPosts ? "ok" : "empty",
      feed: hasPosts ? "ready" : "no_content",
      count: posts?.length ?? 0,
      source: "pool",
    });
  } catch (error: any) {
    console.error("[Health] Feed check failed:", error?.message || error);
    return res.status(503).json({
      status: "unhealthy",
      feed: "error",
      code: "FEED_HEALTH_FAIL",
      message: error?.message || "Feed check failed",
      hint: "Prefer Supabase REST for feed; set DATABASE_URL to session pooler :5432",
    });
  }
});

export default router;
