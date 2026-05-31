import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

router.get("/", async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || "").trim();
    if (!query || query.length < 2)
      return res.status(400).json({ error: "Query required (min 2 chars)" });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(503).json({ error: "Search unavailable" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const pattern = `%${query}%`;
    const hive = (req.query.hive as string) || "quebec";

    const [usersResult, postsResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
        .limit(10),
      supabase
        .from("publications")
        .select("id, media_url, thumbnail_url, caption, type, mux_playback_id")
        .or(`caption.ilike.${pattern},content.ilike.${pattern}`)
        .eq("visibility", "public")
        .eq("processing_status", "completed")
        .eq("hive_id", hive)
        .limit(10),
    ]);

    const users = (usersResult.data || []).map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
    }));

    const posts = postsResult.data || [];

    res.json({ users, posts });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

export default router;
