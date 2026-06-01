/**
 * Watch Events Route
 * Tracks how far users watch videos — used for engagement scoring in the feed.
 */

import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const router = Router();

/**
 * POST /api/watch
 * Body: { post_id: string, watch_pct: number, watch_ms: number }
 * Upserts a watch event for the authenticated user.
 * Only updates watch_pct / watch_ms if the new watch_pct is higher.
 * Requires attachBearerUserId middleware (req.userId).
 */
router.post("/watch", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const { post_id, watch_pct, watch_ms } = req.body || {};

  if (
    !post_id ||
    typeof watch_pct !== "number" ||
    typeof watch_ms !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "post_id, watch_pct et watch_ms sont requis" });
  }

  const clampedPct = Math.max(0, Math.min(100, Math.floor(watch_pct)));
  const clampedMs = Math.max(0, Math.floor(watch_ms));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Insert or update — only update if the new watch_pct is greater than stored
    const { error } = await supabase.from("watch_events").upsert(
      {
        user_id: userId,
        post_id,
        watch_pct: clampedPct,
        watch_ms: clampedMs,
      },
      { onConflict: "user_id,post_id", ignoreDuplicates: false },
    );

    if (error) {
      console.error("[WatchEvents] Upsert error:", error.message);
      return res.status(500).json({ error: "Erreur lors de l'enregistrement" });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[WatchEvents] Unexpected error:", err?.message || err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
