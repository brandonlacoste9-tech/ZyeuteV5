/**
 * Watched-video tracking. Authenticated users are recorded server-side in
 * video_views via POST /api/feed/watched; the feed reads that to surface unseen
 * videos first. Guests have no server rows, so we keep a capped list of watched
 * post ids in localStorage and send the most recent ones with each feed request.
 */
import { apiCall } from "@/services/api";
import { invalidatePourToiCache } from "@/lib/pourToiRanker";
import { addRecentVideoId, setLastViewedVideoId } from "@/lib/feedSessionMemory";

/**
 * Record that a video was watched. Fire-and-forget: always update the local
 * guest list, and additionally persist to video_views when authenticated.
 * `isAuthenticated` lets callers skip the network round-trip for guests.
 */
export function recordWatch(
  postId: string,
  opts: {
    isAuthenticated: boolean;
    watchDurationMs?: number;
    completionRate?: number;
  } = {
    isAuthenticated: false,
  },
): void {
  if (!postId) return;
  addRecentVideoId(postId);
  setLastViewedVideoId(postId);
  if (!opts.isAuthenticated) return;
  invalidatePourToiCache();
  void apiCall("/feed/watched", {
    method: "POST",
    body: JSON.stringify({
      publicationId: postId,
      watchDurationMs: opts.watchDurationMs,
      completionRate: opts.completionRate,
    }),
  }).catch(() => {
    /* watch tracking is non-critical */
  });
}
