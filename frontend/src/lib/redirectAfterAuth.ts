/**
 * Safe in-app return path after login (blocks open redirects).
 * Persisted in sessionStorage so Google OAuth round-trips keep the target.
 */

const STORAGE_KEY = "zyeute_return_to";

const AUTH_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/logout",
  "/auth/callback",
];

function isAuthPath(path: string): boolean {
  return AUTH_PATH_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`),
  );
}

/** Returns a safe internal path or null. */
export function sanitizeInternalPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) {
    return null;
  }
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  if (/[\r\n\0]/.test(raw)) return null;
  return raw;
}

/** Store return path (e.g. from React Router location.state). */
export function rememberReturnTo(raw: unknown): void {
  const path = sanitizeInternalPath(raw);
  if (!path || isAuthPath(path)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* private mode */
  }
}

/** Read and remove stored path; fallback when missing or invalid. */
export function consumeReturnTo(fallback = "/feed"): string {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return fallback;
  }
  const path = sanitizeInternalPath(raw);
  if (!path || isAuthPath(path)) return fallback;
  return path;
}

/** Read without removing (e.g. before OAuth redirect). */
export function peekReturnTo(fallback = "/feed"): string {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const path = sanitizeInternalPath(raw);
    if (!path || isAuthPath(path)) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
