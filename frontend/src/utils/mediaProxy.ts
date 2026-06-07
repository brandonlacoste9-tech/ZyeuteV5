/**
 * Media Proxy - Route external video/image URLs through backend
 * Fixes 403 (Mixkit hotlinking) and ORB (Unsplash cross-origin) blocking
 */

const PROXY_DOMAINS = [
  "mixkit.co",
  "assets.mixkit.co",
  "unsplash.com",
  "images.unsplash.com",
  // Note: videos.pexels.com and images.pexels.com are intentionally excluded —
  // Pexels enforces hotlink protection on server-side requests (returns 403 via
  // /api/media-proxy) but allows direct browser playback. Pexels URLs must be
  // returned as-is so the browser <video> tag fetches them directly.
  // Note: stream.mux.com is intentionally excluded — MuxVideoPlayer handles
  // its own HLS streaming natively and must never go through this proxy.
  // Note: supabase.co is excluded — direct Supabase storage URLs work without
  // proxy in production and proxying them breaks byte-range seeking.
  // Note: storage.googleapis.com / commondatastorage.googleapis.com are excluded —
  // public bucket MP4s (e.g. La Zyeute demo clips) play fine in <video> without
  // the backend; routing them through /api/media-proxy broke playback when only
  // Vite was running (no server on :3000).
  "fal.media",
  "tiktok.com",
  "tiktokv.com",
  "tiktokcdn.com",
  "byteoversea.com",
  "muscdn.com",
];

export function needsMediaProxy(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return PROXY_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function getProxiedMediaUrl(url: string | undefined): string {
  if (!url || typeof url !== "string") return "";
  if (!needsMediaProxy(url)) return url;
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}
