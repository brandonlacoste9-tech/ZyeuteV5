/**
 * Media Proxy - Route external video/image URLs through backend
 * Fixes 403 (Mixkit hotlinking) and ORB (Unsplash cross-origin) blocking
 *
 * TikTok CDN signed URLs (x-expires) expire — never proxy those once stale
 * (they spam console 403s and waste rate limit). Prefer Mux thumbnails when available.
 */

const PROXY_DOMAINS = [
  "mixkit.co",
  "assets.mixkit.co",
  "unsplash.com",
  "images.unsplash.com",
  "fal.media",
  "tiktok.com",
  "tiktokv.com",
  "tiktokcdn.com",
  "byteoversea.com",
  "muscdn.com",
];

/** 1×1 transparent PNG — used when a cover is known-dead (expired TikTok, etc.) */
export const PLACEHOLDER_THUMB =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
      <rect fill="#1A0F0A" width="720" height="1280"/>
      <text x="50%" y="50%" fill="#C9A227" font-family="system-ui,sans-serif" font-size="28" text-anchor="middle" opacity="0.5">Zyeuté</text>
    </svg>`,
  );

/** TikTok and mirror CDNs use many regional hostnames (e.g. tiktokcdn-us.com). */
export function isTikTokOrMirrorCdn(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.includes("tiktok") ||
    h.includes("tiktokv") ||
    h.includes("tikcdn") ||
    h.includes("byteoversea") ||
    h.includes("muscdn")
  );
}

/**
 * TikTok signed URLs include x-expires=UNIX_SECONDS.
 * Once past, CDN returns 403 — do not request / proxy.
 */
export function isExpiredSignedCdnUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const exp =
      u.searchParams.get("x-expires") ||
      u.searchParams.get("expires") ||
      u.searchParams.get("Expire");
    if (!exp) return false;
    const expSec = parseInt(exp, 10);
    if (!Number.isFinite(expSec) || expSec < 1e9) return false;
    // 60s skew — treat near-expiry as dead to avoid race
    return expSec < Math.floor(Date.now() / 1000) - 60;
  } catch {
    return false;
  }
}

export function needsMediaProxy(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (isTikTokOrMirrorCdn(host)) {
      // Never proxy expired TikTok — would 403 forever
      if (isExpiredSignedCdnUrl(url)) return false;
      return true;
    }
    return PROXY_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function getProxiedMediaUrl(url: string | undefined): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  try {
    const host = new URL(url).hostname;
    // Expired TikTok signed URLs: do not proxy (403 spam). Empty = skip load.
    if (isTikTokOrMirrorCdn(host) && isExpiredSignedCdnUrl(url)) {
      return "";
    }
  } catch {
    /* ignore */
  }
  if (!needsMediaProxy(url)) return url;
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

/** Prefer durable posters (Mux / our storage) over TikTok CDN covers. */
export function resolvePosterUrl(opts: {
  muxPlaybackId?: string | null;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
}): string {
  const muxId = (opts.muxPlaybackId || "").trim();
  if (muxId.length >= 8) {
    return `https://image.mux.com/${muxId}/thumbnail.jpg?time=0`;
  }

  const thumb = opts.thumbnailUrl || "";
  if (thumb) {
    try {
      const host = new URL(thumb).hostname;
      if (isTikTokOrMirrorCdn(host) && isExpiredSignedCdnUrl(thumb)) {
        // fall through
      } else if (
        thumb.includes("supabase.co/storage") ||
        thumb.includes("image.mux.com")
      ) {
        return thumb;
      } else {
        return getProxiedMediaUrl(thumb) || PLACEHOLDER_THUMB;
      }
    } catch {
      if (thumb.startsWith("/")) return thumb;
    }
  }

  const media = opts.mediaUrl || "";
  if (
    media.includes("supabase.co/storage") ||
    /stream\.mux\.com|mux\.com/i.test(media)
  ) {
    return media.includes(".m3u8") ? PLACEHOLDER_THUMB : media;
  }
  if (media) {
    try {
      const host = new URL(media).hostname;
      if (isTikTokOrMirrorCdn(host) && isExpiredSignedCdnUrl(media)) {
        return PLACEHOLDER_THUMB;
      }
    } catch {
      /* ignore */
    }
    return getProxiedMediaUrl(media) || PLACEHOLDER_THUMB;
  }

  return PLACEHOLDER_THUMB;
}
