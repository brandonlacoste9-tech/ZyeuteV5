/**
 * Trending Routes — Hashtags and content trends
 */
import { Router } from "express";
import { supabaseAdmin } from "../supabase-auth.js";

const router = Router();

// GET /api/trending/hashtags — get trending hashtags from recent posts
router.get("/hashtags", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });
  try {
    const region = req.query.region as string | undefined;

    let query = supabaseAdmin
      .from("publications")
      .select("content, region")
      .gt(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ) // last 7 days
      .not("content", "is", null)
      .limit(500);

    if (region && region !== "all") {
      query = query.eq("region", region);
    }

    const { data } = await query;

    // Extract hashtags from content
    const hashtagCount = new Map<string, number>();
    for (const post of data || []) {
      const tags = (post.content || "").match(/#[\wÀ-ÿ]+/g) || [];
      for (const tag of tags) {
        const normalized = tag.toLowerCase();
        hashtagCount.set(normalized, (hashtagCount.get(normalized) || 0) + 1);
      }
    }

    const trending = Array.from(hashtagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    res.json({ trending });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
