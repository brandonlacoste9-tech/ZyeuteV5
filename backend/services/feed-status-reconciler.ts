/**
 * Feed status reconciler.
 *
 * The Mux webhook flips `processing_status` to 'completed' via the Drizzle
 * direct-DB pool, but those connections time out in production, leaving
 * playable assets (Mux playback id + hls_url present) stuck as 'processing'
 * or 'pending' and excluded from the feed. This reconciler patches that state
 * over the Supabase HTTP client, which is reliable in prod.
 *
 * It is fail-safe by design: any error is logged and swallowed so it can never
 * crash boot or the interval tick.
 */

import { createClient } from "@supabase/supabase-js";

const RECONCILE_INTERVAL_MS = 10 * 60 * 1000;

async function reconcileFeedStatuses(): Promise<void> {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceKey) {
      console.warn(
        "[FeedReconciler] Skipped — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
      );
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("publications")
      .update({ processing_status: "completed" })
      .in("processing_status", ["processing", "pending"])
      .not("hls_url", "is", null)
      .lt("created_at", fiveMinutesAgo)
      .select("id");

    if (error) {
      console.warn("[FeedReconciler] Update failed:", error.message);
      return;
    }

    const count = data?.length ?? 0;
    if (count > 0) {
      console.log(
        `[FeedReconciler] Marked ${count} stuck publication(s) as completed`,
      );
    }
  } catch (err) {
    console.warn(
      "[FeedReconciler] Reconcile tick failed:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/** Runs the reconciler once on boot, then every 10 minutes. Never throws. */
export function startFeedStatusReconciler(): void {
  try {
    void reconcileFeedStatuses();
    setInterval(() => {
      void reconcileFeedStatuses();
    }, RECONCILE_INTERVAL_MS);
    console.log("✅ [Startup] Feed status reconciler scheduled (every 10 min)");
  } catch (err) {
    console.warn(
      "[FeedReconciler] Failed to schedule:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
