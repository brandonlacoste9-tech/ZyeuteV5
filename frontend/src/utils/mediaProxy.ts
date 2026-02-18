/**
 * Media Proxy - Route external video/image URLs through backend
 * Fixes 403 (Mixkit hotlinking) and ORB (Unsplash cross-origin) blocking
 */

const PROXY_DOMAINS = [
  "mixkit.co",
  "assets.mixkit.co",
  "unsplash.com",
  "images.unsplash.com",
  "pexels.com",
  "videos.pexels.com",
  "images.pexels.com",
  "supabase.co",
  "supabase.in",
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
