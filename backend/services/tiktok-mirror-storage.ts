/**
 * Download TikTok MP4 while URLs are fresh, persist to Supabase Storage.
 * Raw TikTok CDN links expire and 403 from datacenter proxies — not feed-safe.
 */
import { randomUUID } from "crypto";
import { fetch } from "undici";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isExpiringTikTokCdnUrl } from "../utils/playable-media.js";

const VIDEO_BUCKET = "zyeute-videos";
const MAX_BYTES = 80 * 1024 * 1024; // 80 MB

const TIKTOK_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  Referer: "https://www.tiktok.com/",
  Origin: "https://www.tiktok.com",
};

export async function downloadTikTokMp4(
  sourceUrl: string,
): Promise<Buffer | null> {
  if (!sourceUrl.startsWith("http")) return null;

  const isTikTok = /tiktok|byteoversea|muscdn|tikcdn/i.test(sourceUrl);
  const headers = isTikTok
    ? TIKTOK_FETCH_HEADERS
    : {
        "User-Agent": TIKTOK_FETCH_HEADERS["User-Agent"],
        Accept: "*/*",
      };

  try {
    const resp = await fetch(sourceUrl, {
      headers,
      redirect: "follow",
    });

    if (!resp.ok) {
      console.warn(
        `[TikTokMirror] Download ${resp.status} for ${sourceUrl.slice(0, 80)}…`,
      );
      return null;
    }

    const len = Number(resp.headers.get("content-length") || 0);
    if (len > MAX_BYTES) {
      console.warn(`[TikTokMirror] Skip oversized video (${len} bytes)`);
      return null;
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.length < 4096 || buffer.length > MAX_BYTES) return null;
    return buffer;
  } catch (err: unknown) {
    console.warn(
      "[TikTokMirror] Download failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

export async function uploadMp4ToSupabase(
  supabase: SupabaseClient,
  storagePath: string,
  buffer: Buffer,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "video/mp4",
      upsert: true,
      cacheControl: "31536000",
    });

  if (error) {
    console.warn(`[TikTokMirror] Upload failed: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage
    .from(VIDEO_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl || null;
}

/** Returns Supabase public URL, or null if mirror failed. */
export async function mirrorTikTokVideoToSupabase(
  supabase: SupabaseClient,
  tiktokId: string,
  sourceUrl: string,
  prefix = "tikapi",
): Promise<string | null> {
  const buffer = await downloadTikTokMp4(sourceUrl);
  if (!buffer) return null;

  const path = `${prefix}/${tiktokId}-${randomUUID()}.mp4`;
  return uploadMp4ToSupabase(supabase, path, buffer);
}

/** Pick best source URL and mirror when needed. Skips returning raw CDN if mirror fails. */
export async function resolvePlayableTikTokMediaUrl(
  supabase: SupabaseClient | null,
  tiktokId: string,
  hdUrl: string | undefined,
  sdUrl: string | undefined,
  prefix = "tikapi",
): Promise<string | null> {
  const candidates = [hdUrl, sdUrl].filter(
    (u): u is string => typeof u === "string" && u.startsWith("http"),
  );
  if (candidates.length === 0) return null;

  const primary = candidates[0];

  if (supabase && isExpiringTikTokCdnUrl(primary)) {
    for (const url of candidates) {
      const mirrored = await mirrorTikTokVideoToSupabase(
        supabase,
        tiktokId,
        url,
        prefix,
      );
      if (mirrored) return mirrored;
    }
    return null;
  }

  return primary;
}
