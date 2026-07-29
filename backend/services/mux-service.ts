import Mux from "@mux/mux-node";
import { fetch } from "undici";

export type MuxIngestResult = {
  muxAssetId: string;
  muxPlaybackId: string;
  hlsUrl: string;
  thumbnailUrl: string;
  originalUrl?: string; // Original URL if uploaded from URL
};

let muxClient: Mux | null | undefined;

export function getMuxClient(): Mux | null {
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

export function isMuxConfigured(): boolean {
  return getMuxClient() !== null;
}

export async function uploadBufferToMuxDirect(
  buffer: Buffer,
): Promise<MuxIngestResult | null> {
  const mux = getMuxClient();
  if (!mux) throw new Error("Mux is not configured");

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
      console.warn(`[MuxService] Direct upload PUT failed: ${putResp.status}`);
      return null;
    }

    // Wait for the asset to be created
    let assetId: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const status = await mux.video.uploads.retrieve(upload.id);
      if (status.asset_id) {
        assetId = status.asset_id;
        break;
      }
    }

    if (!assetId) {
      console.warn("[MuxService] Direct upload timed out waiting for asset");
      return null;
    }

    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) return null;

    return {
      muxAssetId: asset.id,
      muxPlaybackId: playbackId,
      hlsUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
    };
  } catch (err: unknown) {
    console.error(
      "[MuxService] Direct upload failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

export async function createMuxAssetFromUrl(
  ingestUrl: string,
): Promise<MuxIngestResult | null> {
  const mux = getMuxClient();
  if (!mux) throw new Error("Mux is not configured");

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
      originalUrl: ingestUrl,
    };
  } catch (err: unknown) {
    console.warn(
      "[MuxService] URL ingest failed:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}
