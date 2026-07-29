/**
 * TikTok → Mux ingest for permanent Pour toi playback (HLS + MuxVideoPlayer).
 * Downloads while TikAPI URLs are fresh; avoids expiring TikTok CDN links.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  downloadTikTokMp4,
  mirrorTikTokVideoToSupabase,
  uploadMp4ToSupabase,
} from "./tiktok-mirror-storage.js";
import {
  getMuxClient,
  uploadBufferToMuxDirect,
  createMuxAssetFromUrl,
  MuxIngestResult,
} from "./mux-service.js";

export type TikTokMuxIngestResult = MuxIngestResult & {
  stagingUrl?: string;
};

export function isMuxIngestConfigured(): boolean {
  return getMuxClient() !== null;
}

function pickSourceUrls(
  hdUrl: string | undefined,
  sdUrl: string | undefined,
): string[] {
  return [hdUrl, sdUrl].filter(
    (u): u is string => typeof u === "string" && u.startsWith("http"),
  );
}

/**
 * Best-effort: Mux HLS (preferred) → Supabase MP4 fallback inside mirror layer.
 */
export async function ingestTikTokVideoToMux(options: {
  tiktokId: string;
  hdUrl?: string;
  sdUrl?: string;
  supabase?: SupabaseClient | null;
}): Promise<TikTokMuxIngestResult | null> {
  const mux = getMuxClient();
  if (!mux) return null;

  const sources = pickSourceUrls(options.hdUrl, options.sdUrl);
  if (sources.length === 0) return null;

  for (const sourceUrl of sources) {
    const buffer = await downloadTikTokMp4(sourceUrl);
    if (!buffer) continue;

    const direct = await uploadBufferToMuxDirect(buffer);
    if (direct) {
      console.log(
        `[TikTokMux] Direct upload OK for ${options.tiktokId} → ${direct.muxPlaybackId}`,
      );
      return direct;
    }

    if (options.supabase) {
      const stagingPath = `mux-staging/tikapi/${options.tiktokId}-${Date.now()}.mp4`;
      const stagingUrl = await uploadMp4ToSupabase(
        options.supabase,
        stagingPath,
        buffer,
      );
      if (stagingUrl) {
        const fromStaging = await createMuxAssetFromUrl(mux, stagingUrl);
        if (fromStaging) {
          console.log(
            `[TikTokMux] Staging ingest OK for ${options.tiktokId} → ${fromStaging.muxPlaybackId}`,
          );
          return { ...fromStaging, stagingUrl };
        }
      }
    }
  }

  if (options.supabase) {
    for (const sourceUrl of sources) {
      const mirrored = await mirrorTikTokVideoToSupabase(
        options.supabase,
        options.tiktokId,
        sourceUrl,
        "mux-fallback",
      );
      if (!mirrored) continue;
      const fromMirror = await createMuxAssetFromUrl(mux, mirrored);
      if (fromMirror) return { ...fromMirror, stagingUrl: mirrored };
    }
  }

  return null;
}

/** Download any MP4 URL and ingest to Mux (Seedance, etc.). */
export async function ingestVideoUrlToMux(options: {
  sourceUrl: string;
  storageId: string;
  supabase?: SupabaseClient | null;
}): Promise<TikTokMuxIngestResult | null> {
  const mux = getMuxClient();
  if (!mux) return null;

  const buffer = await downloadTikTokMp4(options.sourceUrl);
  if (!buffer) {
    const fromUrl = await createMuxAssetFromUrl(mux, options.sourceUrl);
    if (fromUrl) return fromUrl;
    return null;
  }

  const direct = await uploadBufferToMuxDirect(buffer);
  if (direct) return direct;

  if (options.supabase) {
    const stagingPath = `mux-staging/seedance/${options.storageId}-${Date.now()}.mp4`;
    const stagingUrl = await uploadMp4ToSupabase(
      options.supabase,
      stagingPath,
      buffer,
    );
    if (stagingUrl) {
      return createMuxAssetFromUrl(mux, stagingUrl);
    }
  }

  return null;
}
