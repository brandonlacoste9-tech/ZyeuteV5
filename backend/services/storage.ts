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
  "https://[REF].supabase.co"; // fallback: your zyeuté project
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
