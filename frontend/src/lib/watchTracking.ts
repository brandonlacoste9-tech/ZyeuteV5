/**
 * Watched-video tracking. Authenticated users are recorded server-side in
 * video_views via POST /api/feed/watched; the feed reads that to surface unseen
 * videos first. Guests have no server rows, so we keep a capped list of watched
 * post ids in localStorage and send the most recent ones with each feed request.
 */
import { apiCall } from "@/services/api";
import { invalidatePourToiCache } from "@/lib/pourToiRanker";

const GUEST_SEEN_KEY = "zyeute_seen_posts";
/** Total ids retained locally for guests. */
const GUEST_SEEN_CAP = 200;
/** Ids sent per feed request — keep small so the header/URL stays short. */
const GUEST_SEEN_SEND = 50;

function readGuestSeen(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeGuestSeen(ids: string[]): void {
  try {
    localStorage.setItem(GUEST_SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* storage full / unavailable — non-critical */
  }
}

/** Record a watched post id locally (most-recent-first, deduped, capped). */
export function addGuestSeen(postId: string): void {
  if (!postId) return;
  const current = readGuestSeen().filter((id) => id !== postId);
  current.unshift(postId);
  writeGuestSeen(current.slice(0, GUEST_SEEN_CAP));
}

/** Most recently watched guest ids to send with a feed request. */
export function getGuestSeenForRequest(): string[] {
  return readGuestSeen().slice(0, GUEST_SEEN_SEND);
}

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
  addGuestSeen(postId);
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
