/** Per-app-session id so feed order reshuffles on close/reopen. */
const SESSION_KEY = "zyeute_feed_session";
const HIDDEN_AT_KEY = "zyeute_feed_hidden_at";

/** Treat long background as a new session (PWA resume without full kill). */
export const FEED_BACKGROUND_MS = 3 * 60 * 1000;

function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateFeedSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = newSessionId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return newSessionId();
  }
}

export function rotateFeedSessionId(): string {
  const id = newSessionId();
  try {
    sessionStorage.setItem(SESSION_KEY, id);
    for (const key of ["explore", "feed", "smart"]) {
      sessionStorage.removeItem(`zyeute_scroll_${key}`);
      sessionStorage.removeItem(`zyeute_la_scroll_${key}`);
    }
  } catch {
    /* ignore */
  }
  return id;
}

export function markFeedHidden(): void {
  try {
    sessionStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Returns true when background exceeded threshold and session was rotated. */
export function maybeRotateFeedSessionAfterBackground(): boolean {
  try {
    const raw = sessionStorage.getItem(HIDDEN_AT_KEY);
    if (!raw) return false;
    sessionStorage.removeItem(HIDDEN_AT_KEY);
    if (Date.now() - parseInt(raw, 10) >= FEED_BACKGROUND_MS) {
      rotateFeedSessionId();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
