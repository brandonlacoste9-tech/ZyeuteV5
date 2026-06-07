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

/** Ti-Guy / Grand Castor / AI Studio clips — distinct from bulk Pexels/TikTok seed. */
export function isTiGuyCuratedPost(p: Record<string, unknown>): boolean {
  if (p.ai_generated === true || p.choix_du_castor === true) return true;
  const user = p.user as Record<string, unknown> | undefined;
  const username = String(user?.username ?? "").toLowerCase();
  if (
    username === "ti_guy_bot" ||
    username === "ti_guy" ||
    username.includes("tiguy")
  ) {
    return true;
  }
  const hay = `${p.caption ?? ""} ${p.content ?? ""}`;
  if (/généré par ti-guy|ti-guy ia|ti-guy ai|studio comète/i.test(hay))
    return true;
  const src = String(p.video_source ?? "");
  if (/seedance|studio|fal|ai/i.test(src) && p.mux_playback_id) return true;
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
