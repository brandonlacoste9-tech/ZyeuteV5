/**
 * Stories Routes — 24h disappearing content
 */
import { Router } from "express";
import { supabaseAdmin } from "../supabase-auth.js";

const router = Router();

// GET /api/stories — get active stories grouped by user
router.get("/", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });
  try {
    const { data, error } = await supabaseAdmin
      .from("stories")
      .select(
        "*, user:user_profiles!stories_user_id_fkey(id, username, avatar_url, subscription_tier)",
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // Group by user
    const grouped = new Map<string, { user: any; stories: any[] }>();
    for (const story of data || []) {
      const uid = story.user_id;
      if (!grouped.has(uid)) {
        grouped.set(uid, { user: story.user, stories: [] });
      }
      grouped.get(uid)!.stories.push(story);
    }

    res.json({ storyGroups: Array.from(grouped.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories — create a story
router.post("/", async (req: any, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });

  try {
    const { mediaUrl, mediaType = "image", caption, duration = 5 } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: "mediaUrl requis" });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("stories")
      .insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        duration,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ story: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/stories/:id — delete own story
router.delete("/:id", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { error } = await supabaseAdmin
      .from("stories")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stories/:id/view — record a view
router.post("/:id/view", async (req: any, res) => {
  const viewerId = req.userId;
  if (!supabaseAdmin) return res.json({ success: true });

  try {
    if (viewerId) {
      await supabaseAdmin
        .from("story_views")
        .upsert({ story_id: req.params.id, viewer_id: viewerId });
    }
    // Increment views using raw SQL RPC (fails silently if not defined)
    await supabaseAdmin
      .rpc("increment_story_views", { story_id: req.params.id })
      .then(
        () => {},
        () => {},
      );
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // fail silently
  }
});

export default router;
