/**
 * lazy() wrapper that recovers from stale chunk loads after a deploy.
 *
 * When Vercel ships a new build, hashed chunk files change. A tab still running
 * the old index can fail with:
 *   "Failed to fetch dynamically imported module"
 * which our ErrorBoundary labels "Problème de connexion".
 *
 * Strategy: one hard reload per 15s window (sessionStorage), then rethrow.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RELOAD_KEY = "zyeute_chunk_reload_at";
const RELOAD_COOLDOWN_MS = 15_000;

export function isChunkLoadError(err: unknown): boolean {
  const msg = (
    err instanceof Error ? err.message : String(err ?? "")
  ).toLowerCase();
  return (
    msg.includes("dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("loading chunk") ||
    msg.includes("failed to fetch") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("unable to preload css")
  );
}

export function tryHardReloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    // Bust any intermediary HTML cache
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
    return true;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (isChunkLoadError(err) && tryHardReloadOnce()) {
        // Hold suspense while the page navigates away
        return new Promise(() => {});
      }
      throw err;
    }
  });
}
