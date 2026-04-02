/**
 * Storage Service - Supabase Storage backend
 * Replaces GCS with Supabase Storage (already configured, no extra credentials needed).
 * Falls back to Mux for HLS video hosting when MUX_TOKEN_ID is set.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import Mux from "@mux/mux-node";
import type { ProcessedHLSResult } from "./videoProcessor.js";

// ─── Supabase Storage client ───────────────────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vuanulvyqkfefmjcikfk.supabase.co"; // fallback: your zyeuté project
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const VIDEO_BUCKET = "zyeute-videos";

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log("✅ [Storage] Supabase Storage client initialized");
} else {
  console.warn(
    "⚠️ [Storage] Supabase credentials missing – uploads will fail. Set VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
  );
}

// ─── Mux client (for HLS re-ingestion) ────────────────────────────────────
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

let mux: Mux | null = null;
if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
  mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });
  console.log("✅ [Storage] Mux client initialized for HLS ingestion");
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface StorageUrls {
  videoHighUrl: string;
  videoMediumUrl: string;
  videoLowUrl: string;
  thumbnailUrl: string;
}

export interface ProcessedVideoFiles {
  videoHigh: string;
  videoMedium: string;
  videoLow: string;
  thumbnail: string;
}

export interface HLSStorageUrls {
  hlsUrl: string;
  thumbnailUrl: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Upload a local file to Supabase Storage and return its public URL */
export async function uploadToStorage(
  localPath: string,
  destination: string,
  contentType: string,
): Promise<string> {
  if (!supabase) {
    throw new Error(
      "[Storage] Supabase client not initialized. Check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const buffer = await fs.promises.readFile(localPath);

  const { error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(destination, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000", // 1 year
    });

  if (error) {
    throw new Error(`[Storage] Supabase upload failed for ${destination}: ${error.message}`);
  }

  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(destination);

  // Delete local temp file after successful upload
  try {
    await fs.promises.unlink(localPath);
  } catch {
    // ignore cleanup errors
  }

  return data.publicUrl;
}

// ─── Main: Upload processed video files ───────────────────────────────────

export async function uploadProcessedVideo(
  files: ProcessedVideoFiles,
  postId: string | number,
): Promise<StorageUrls> {
  const timestamp = Date.now();
  const basePath = `posts/${postId}/${timestamp}`;

  // Upload high-quality video + thumbnail in parallel
  const [videoHighUrl, thumbnailUrl] = await Promise.all([
    uploadToStorage(files.videoHigh, `${basePath}/high.mp4`, "video/mp4"),
    uploadToStorage(files.thumbnail, `${basePath}/thumbnail.jpg`, "image/jpeg"),
  ]);

  // Clean up medium/low files if they exist (not uploaded — HLS handles quality)
  for (const f of [files.videoMedium, files.videoLow]) {
    if (f) {
      try {
        if (fs.existsSync(f)) await fs.promises.unlink(f);
      } catch {
        // ignore
      }
    }
  }

  return {
    videoHighUrl,
    videoMediumUrl: "",
    videoLowUrl: "",
    thumbnailUrl,
  };
}

// ─── HLS Upload ─────────────────────────────────────────────────────────────
// Strategy:
//   1. If Mux is configured → ingest the processed high.mp4 into Mux for proper
//      adaptive HLS (best quality, CDN, thumbnail generation).
//   2. Otherwise → upload the raw HLS segments to Supabase Storage.

/** Content-type by file extension */
function getContentType(remoteKey: string): string {
  if (remoteKey.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (remoteKey.endsWith(".ts")) return "video/MP2T";
  if (remoteKey.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

export async function uploadHLSToStorage(
  result: ProcessedHLSResult,
  postId: string | number,
): Promise<HLSStorageUrls> {
  // ── Path A: Mux ingestion ──────────────────────────────────────────────
  if (mux) {
    try {
      // Find the 1080p rendition mp4 to feed back into Mux for proper HLS
      // Actually processVideoToHLS produces .ts segments — find the source high.mp4
      // from outDir's parent. We'll ingest the manifest URL via Mux URL ingest
      // using the Supabase-hosted manifest.

      // First upload all files to Supabase so Mux can access the manifest
      const timestamp = Date.now();
      const basePath = `posts/${postId}/${timestamp}/hls`;

      let manifestPublicUrl = "";
      let thumbnailUrl = "";

      for (const { localPath, remoteKey } of result.files) {
        const destination = `${basePath}/${remoteKey}`;
        const contentType = getContentType(remoteKey);
        const buffer = await fs.promises.readFile(localPath);

        const { error } = await supabase!.storage
          .from(VIDEO_BUCKET)
          .upload(destination, buffer, {
            contentType,
            upsert: true,
            cacheControl: remoteKey.endsWith(".ts") ? "86400" : "31536000",
          });

        if (error) {
          console.warn(
            `[Storage/HLS] Upload warning for ${remoteKey}: ${error.message}`,
          );
        }

        if (remoteKey === "manifest.m3u8") {
          const { data } = supabase!.storage
            .from(VIDEO_BUCKET)
            .getPublicUrl(destination);
          manifestPublicUrl = data.publicUrl;
        }
        if (remoteKey === "thumbs/thumb-0.png") {
          const { data } = supabase!.storage
            .from(VIDEO_BUCKET)
            .getPublicUrl(destination);
          thumbnailUrl = data.publicUrl;
        }

        try {
          await fs.promises.unlink(localPath);
        } catch {
          // ignore cleanup errors
        }
      }

      if (!manifestPublicUrl) {
        throw new Error("[Storage/HLS] manifest.m3u8 not found in result files");
      }

      // Ingest the Supabase-hosted HLS manifest into Mux for CDN delivery
      const asset = await mux.video.assets.create({
        input: [{ url: manifestPublicUrl }],
        playback_policy: ["public"],
      });

      const playbackId = asset.playback_ids?.[0]?.id;
      if (playbackId) {
        console.log(
          `✅ [Storage/HLS] Mux ingestion started for post ${postId}, playbackId: ${playbackId}`,
        );
        return {
          hlsUrl: `https://stream.mux.com/${playbackId}.m3u8`,
          thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
        };
      }

      // If Mux didn't return a playbackId yet (async), fall through to Supabase manifest
      return { hlsUrl: manifestPublicUrl, thumbnailUrl };
    } catch (muxErr: any) {
      console.warn(
        `[Storage/HLS] Mux ingestion failed, using Supabase manifest: ${muxErr.message}`,
      );
      // Fall through to plain Supabase upload below
    }
  }

  // ── Path B: Plain Supabase Storage (no Mux) ───────────────────────────
  const timestamp = Date.now();
  const basePath = `posts/${postId}/${timestamp}/hls`;
  let hlsUrl = "";
  let thumbnailUrl = "";

  for (const { localPath, remoteKey } of result.files) {
    const destination = `${basePath}/${remoteKey}`;
    const contentType = getContentType(remoteKey);
    const buffer = await fs.promises.readFile(localPath);

    const { error } = await supabase!.storage
      .from(VIDEO_BUCKET)
      .upload(destination, buffer, {
        contentType,
        upsert: true,
        cacheControl: remoteKey.endsWith(".ts") ? "86400" : "31536000",
      });

    if (error) {
      throw new Error(
        `[Storage/HLS] Supabase upload failed for ${remoteKey}: ${error.message}`,
      );
    }

    const { data } = supabase!.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(destination);
    const url = data.publicUrl;

    if (remoteKey === "manifest.m3u8") hlsUrl = url;
    if (remoteKey === "thumbs/thumb-0.png") thumbnailUrl = url;

    try {
      await fs.promises.unlink(localPath);
    } catch {
      // ignore cleanup errors
    }
  }

  if (!hlsUrl) throw new Error("[Storage/HLS] manifest.m3u8 not uploaded");

  return { hlsUrl, thumbnailUrl };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteVideo(videoUrl: string): Promise<void> {
  if (!supabase) return;
  try {
    // Extract the path after the bucket name from the Supabase public URL
    // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const url = new URL(videoUrl);
    const marker = `/object/public/${VIDEO_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return;
    const filePath = url.pathname.slice(idx + marker.length);
    await supabase.storage.from(VIDEO_BUCKET).remove([filePath]);
  } catch (error) {
    console.error(`[Storage] Failed to delete video ${videoUrl}:`, error);
    // Don't throw — best-effort cleanup
  }
}
