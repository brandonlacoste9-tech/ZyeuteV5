import { Router } from "express";
import { requireAuth, supabaseAdmin } from "../supabase-auth.js";

const router = Router();

// GET /api/notifications
// Returns notifications for the authenticated user, enriched with actor profile.
// Real DB schema: id, user_id, type, payload (jsonb), lu (bool), created_at, entity_id, actor_id, post_id
router.get("/", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;

    const { data: rows, error } = await supabaseAdmin
      .from("notifications")
      .select("id, type, payload, lu, created_at, entity_id, actor_id, post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    // Collect unique actor IDs to batch-fetch profiles
    const actorIds = [
      ...new Set((rows || []).map((r) => r.actor_id).filter(Boolean)),
    ] as string[];

    const profiles: Record<
      string,
      { id: string; username: string; avatar_url?: string }
    > = {};
    if (actorIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("user_profiles")
        .select("id, username, avatar_url")
        .in("id", actorIds);
      (users || []).forEach((u) => (profiles[u.id] = u));
    }

    const notifications = (rows || []).map((r) => {
      const actor = r.actor_id ? profiles[r.actor_id] : undefined;
      // Extract message from payload if present (payload is jsonb, may have a 'message' key)
      const payloadMsg =
        r.payload && typeof r.payload === "object" && "message" in r.payload
          ? ((r.payload as Record<string, unknown>).message as
              | string
              | undefined)
          : undefined;

      return {
        id: r.id,
        type: r.type,
        isRead: r.lu ?? false,
        createdAt: r.created_at,
        postId: r.post_id ?? null,
        entityId: r.entity_id ?? null,
        message: payloadMsg ?? null,
        fromUser: actor
          ? {
              id: actor.id,
              username: actor.username,
              avatarUrl: actor.avatar_url ?? null,
            }
          : undefined,
      };
    });

    return res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ error: "Failed to get notifications" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ lu: true })
      .eq("id", req.params.id)
      .eq("user_id", req.userId!); // safety: only own notifications
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ error: "Failed to mark notification read" });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ lu: true })
      .eq("user_id", req.userId!)
      .eq("lu", false);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

export default router;
