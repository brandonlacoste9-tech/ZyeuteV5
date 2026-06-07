/** Shared feed playback rules (Pour toi + replenish thresholds). */

export function isExpiringTikTokCdnUrl(url: string): boolean {
  if (!url) return false;
  return /tiktok|tiktokv|tikcdn|byteoversea|muscdn|v\d+-webapp/i.test(url);
}

export function isReliablePlaybackMedia(
  mediaUrl: string,
  muxPlaybackId?: string | null,
): boolean {
  if (muxPlaybackId && String(muxPlaybackId).trim().length >= 8) return true;
  if (mediaUrl.includes("supabase.co/storage")) return true;
  if (/mux\.com|stream\.mux/i.test(mediaUrl)) return true;
  return false;
}

export function isExplorePlayablePost(p: Record<string, unknown>): boolean {
  if (p.mux_playback_id) return true;
  const hls = String(p.hls_url ?? "");
  if (hls.length >= 12 && /^https?:\/\//i.test(hls)) {
    if (/fal\.media|\.fal\.run/i.test(hls)) return false;
    if (!isExpiringTikTokCdnUrl(hls)) return true;
  }
  const media = String(p.media_url ?? "");
  if (media.length < 12 || !/^https?:\/\//i.test(media)) return false;
  if (/fal\.media|\.fal\.run/i.test(media)) return false;
  if (isReliablePlaybackMedia(media, String(p.mux_playback_id ?? "")))
    return true;
  if (isExpiringTikTokCdnUrl(media)) return false;
  return true;
}
