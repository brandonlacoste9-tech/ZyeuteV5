/**
 * TikTok → Mux ingest for permanent Pour toi playback (HLS + MuxVideoPlayer).
 * Downloads while TikAPI URLs are fresh; avoids expiring TikTok CDN links.
 */
import Mux from "@mux/mux-node";
import { fetch } from "undici";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  downloadTikTokMp4,
  mirrorTikTokVideoToSupabase,
  uploadMp4ToSupabase,
} from "./tiktok-mirror-storage.js";

export type TikTokMuxIngestResult = {
  muxAssetId: string;
  muxPlaybackId: string;
  hlsUrl: string;
  thumbnailUrl: string;
  stagingUrl?: string;
};

let muxClient: Mux | null | undefined;

function getMuxClient(): Mux | null {
  if (muxClient !== undefined) return muxClient;
  const tokenId = process.env.MUX_TOKEN_ID?.trim();
  const tokenSecret = process.env.MUX_TOKEN_SECRET?.trim();
  if (!tokenId || !tokenSecret) {
    muxClient = null;
    return null;
  }
  muxClient = new Mux({ tokenId, tokenSecret });
  return muxClient;
}

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

async function createMuxAssetFromUrl(
  mux: Mux,
  ingestUrl: string,
): Promise<TikTokMuxIngestResult | null> {
  try {
    const asset = await mux.video.assets.create({
      inputs: [{ url: ingestUrl }],
      playback_policy: ["public"],
    });
    const muxAssetId = asset.id;
    const muxPlaybackId = asset.playback_ids?.[0]?.id;
    if (!muxAssetId || !muxPlaybackId) return null;

    return {
      muxAssetId,
      muxPlaybackId,
      hlsUrl: `https://stream.mux.com/${muxPlaybackId}.m3u8`,
      thumbnailUrl: `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg`,
      stagingUrl: ingestUrl,
    };
  } catch (err: unknown) {
    console.warn(
      "[TikTokMux] URL ingest failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

async function uploadBufferToMuxDirect(
  mux: Mux,
  buffer: Buffer,
): Promise<TikTokMuxIngestResult | null> {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ["public"] },
      cors_origin: process.env.FRONTEND_URL || "*",
    });

    if (!upload.url) return null;

    const putResp = await fetch(upload.url, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": "video/mp4" },
    });

    if (!putResp.ok) {
      console.warn(`[TikTokMux] Direct upload PUT ${putResp.status}`);
      return null;
    }

    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 500 : 1500));
      const status = await mux.video.uploads.retrieve(upload.id);
      if (!status.asset_id) continue;

      const asset = await mux.video.assets.retrieve(status.asset_id);
      const muxPlaybackId = asset.playback_ids?.[0]?.id;
      if (!muxPlaybackId) continue;

      return {
        muxAssetId: asset.id,
        muxPlaybackId,
        hlsUrl: `https://stream.mux.com/${muxPlaybackId}.m3u8`,
        thumbnailUrl: `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg`,
      };
    }

    console.warn("[TikTokMux] Direct upload timed out waiting for asset");
    return null;
  } catch (err: unknown) {
    console.warn(
      "[TikTokMux] Direct upload failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
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

    const direct = await uploadBufferToMuxDirect(mux, buffer);
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

  const direct = await uploadBufferToMuxDirect(mux, buffer);
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
