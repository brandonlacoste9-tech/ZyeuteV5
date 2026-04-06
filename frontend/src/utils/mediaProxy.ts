/**
 * Media Proxy - Route external video/image URLs through backend
 * Fixes 403 (Mixkit hotlinking) and ORB (Unsplash cross-origin) blocking
 */

const PROXY_DOMAINS = [
  "mixkit.co",
  "assets.mixkit.co",
  "unsplash.com",
  "images.unsplash.com",
  "videos.pexels.com",
  "images.pexels.com",
  // Note: stream.mux.com is intentionally excluded — MuxVideoPlayer handles
  // its own HLS streaming natively and must never go through this proxy.
  // Note: supabase.co is excluded — direct Supabase storage URLs work without
  // proxy in production and proxying them breaks byte-range seeking.
  // Note: storage.googleapis.com / commondatastorage.googleapis.com are excluded —
  // public bucket MP4s (e.g. La Zyeute demo clips) play fine in <video> without
  // the backend; routing them through /api/media-proxy broke playback when only
  // Vite was running (no server on :3000).
  "fal.media",
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
