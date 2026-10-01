/**
 * Persistent feed memory used to make each app session start differently.
 *
 * This intentionally lives outside React state so it survives reloads/app
 * restarts. Only lightweight ids are stored — never full post payloads.
 */

const RECENT_VIDEO_IDS_KEY = "zyeute_recent_video_ids_v2";
const SESSION_START_KEY = "zyeute_feed_session_start_v1";
const LAST_VIEWED_KEY = "zyeute_last_viewed_video_id_v1";

export const RECENT_VIDEO_HISTORY_LIMIT = 100;
export const SESSION_START_HISTORY_LIMIT = 20;
const FEED_EXCLUSION_LIMIT = 180;

type StoredSessionStart = {
  sessionId: string;
  videoIds: string[];
  savedAt: number;
};

function readStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, values: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    /* persistent feed memory is best-effort */
  }
}

function readSessionStart(): StoredSessionStart | null {
  try {
    const raw = localStorage.getItem(SESSION_START_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSessionStart>;
    if (
      typeof parsed.sessionId !== "string" ||
      !Array.isArray(parsed.videoIds)
    ) {
      return null;
    }
    return {
      sessionId: parsed.sessionId,
      videoIds: parsed.videoIds
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .slice(0, SESSION_START_HISTORY_LIMIT),
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function getRecentVideoIds(): string[] {
  return readStringArray(RECENT_VIDEO_IDS_KEY).slice(
    0,
    RECENT_VIDEO_HISTORY_LIMIT,
  );
}

/** Add a viewed video to the rolling 100-item recent history. */
export function addRecentVideoId(videoId: string): void {
  if (!videoId) return;
  const next = [
    videoId,
    ...getRecentVideoIds().filter((id) => id !== videoId),
  ].slice(0, RECENT_VIDEO_HISTORY_LIMIT);
  writeStringArray(RECENT_VIDEO_IDS_KEY, next);
}

export function getLastViewedVideoId(): string | null {
  try {
    return localStorage.getItem(LAST_VIEWED_KEY);
  } catch {
    return null;
  }
}

export function setLastViewedVideoId(videoId: string): void {
  if (!videoId) return;
  try {
    localStorage.setItem(LAST_VIEWED_KEY, videoId);
  } catch {
    /* best-effort */
  }
}

/**
 * Returns the opening ids from the previous feed session only.
 * Once the current session writes its own opening batch, this returns [] so
 * pagination in the same session is not unnecessarily restricted.
 */
export function getPreviousSessionStartingVideoIds(
  currentSessionId: string,
): string[] {
  const stored = readSessionStart();
  if (!stored || stored.sessionId === currentSessionId) return [];
  return stored.videoIds.slice(0, SESSION_START_HISTORY_LIMIT);
}

/** Preserve the first opening batch for a session; do not replace it later. */
export function saveSessionStartingVideoIds(
  sessionId: string,
  videoIds: string[],
): void {
  if (!sessionId) return;
  const existing = readSessionStart();
  if (existing?.sessionId === sessionId && existing.videoIds.length > 0) return;

  const unique = [...new Set(videoIds.filter(Boolean))].slice(
    0,
    SESSION_START_HISTORY_LIMIT,
  );
  if (unique.length === 0) return;

  try {
    localStorage.setItem(
      SESSION_START_KEY,
      JSON.stringify({
        sessionId,
        videoIds: unique,
        savedAt: Date.now(),
      } satisfies StoredSessionStart),
    );
  } catch {
    /* best-effort */
  }
}

/**
 * IDs that should be deprioritized/excluded at the start of this session:
 * previous session opening batch first, then last viewed, then the rolling
 * recent history. The backend accepts up to 200 ids, so stay below that.
 */
export function getFeedExclusionIds(currentSessionId: string): string[] {
  const previousStart = getPreviousSessionStartingVideoIds(currentSessionId);
  const lastViewed = getLastViewedVideoId();
  const recent = getRecentVideoIds();

  return [
    ...new Set([
      ...previousStart,
      ...(lastViewed ? [lastViewed] : []),
      ...recent,
    ]),
  ].slice(0, FEED_EXCLUSION_LIMIT);
}
