/**
 * 🎬 VIDEO SERVICE - AI Video Editing
 * Ti-Guy Studio - Smart video processing
 *
 * Real implementations:
 * - extractThumbnail(): canvas-based frame grab (real)
 * - getVideoMetadata(): reads actual video file metadata (real)
 * - generateCaptions(): calls backend /api/mux/captions which uses Mux Text Tracks (real)
 *
 * Honest stubs (not supported yet in this stack without server-side ffmpeg):
 * - processVideo(): returns real metadata + honest message (no fake captions)
 * - smartTrim(): returns full video range — no AI trim without ffmpeg backend
 * - addBackgroundMusic(): not supported client-side, returns original URL
 * - cropToVertical(): not supported client-side, returns original URL
 */

import { logger } from "@/lib/logger";

const videoServiceLogger = logger.withContext("VideoService");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

export interface VideoProcessResult {
  url: string;
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  captions?: CaptionLine[];
  highlights?: { start: number; end: number }[];
}

export interface CaptionLine {
  startTime: number; // seconds
  endTime: number;
  text: string;
}

export interface VideoEditOptions {
  trim?: { start: number; end: number };
  addCaptions?: boolean;
  addMusic?: boolean;
  autoEnhance?: boolean;
  removeDeadAir?: boolean;
  cropToVertical?: boolean;
}

/**
 * Process video — reads real metadata, optionally fetches real captions via Mux.
 * Does NOT fake results. crop/music/trim require a ffmpeg backend (not yet available).
 */
export async function processVideo(
  file: File,
  options: VideoEditOptions = {},
): Promise<VideoProcessResult> {
  const url = URL.createObjectURL(file);

  // Get real metadata from the file
  const meta = await getVideoMetadata(file);

  let thumbnail: string | undefined;
  try {
    thumbnail = await extractThumbnail(file, 0);
  } catch {
    thumbnail = undefined;
  }

  // Captions: only attempt if caller asks and file is ≤60 MB (Mux Text Tracks limit)
  let captions: CaptionLine[] | undefined;
  if (options.addCaptions && file.size <= 60 * 1024 * 1024) {
    try {
      captions = await generateCaptionsFromFile(file);
    } catch (err) {
      videoServiceLogger.warn("Caption generation failed:", err);
    }
  }

  return {
    url,
    duration: meta.duration,
    width: meta.width,
    height: meta.height,
    thumbnail,
    captions,
    highlights: undefined, // smartTrim not yet available
  };
}

/**
 * Generate captions for a video by:
 * 1. Uploading to backend /api/mux/create-upload (gets Mux asset)
 * 2. Polling until asset is ready
 * 3. Calling /api/mux/asset-captions/:assetId to get Mux Text Tracks
 *
 * Falls back gracefully if the asset isn't uploaded through Mux yet.
 */
export async function generateCaptions(
  fileOrPlaybackId: File | string,
): Promise<CaptionLine[]> {
  if (typeof fileOrPlaybackId === "string") {
    // It's a Mux playback ID — fetch text tracks directly
    return fetchMuxTextTracks(fileOrPlaybackId);
  }
  return generateCaptionsFromFile(fileOrPlaybackId);
}

async function generateCaptionsFromFile(file: File): Promise<CaptionLine[]> {
  videoServiceLogger.debug("Requesting Mux captions for file:", file.name);

  // Step 1: Create a Mux upload for this file
  const uploadRes = await fetch(`${API_BASE}/api/mux/create-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cors_origin: window.location.origin }),
    credentials: "include",
  });

  if (!uploadRes.ok) {
    throw new Error("Mux upload creation failed for captions");
  }

  const { data: uploadData } = await uploadRes.json();
  const { uploadUrl, uploadId } = uploadData;

  // Step 2: Upload the raw file to Mux's GCS URL
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "video/mp4" },
  });

  // Step 3: Poll upload-status until asset_id appears (max ~90s)
  let assetId: string | null = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(
      `${API_BASE}/api/mux/upload-status/${uploadId}`,
      { credentials: "include" },
    );
    if (statusRes.ok) {
      const { data } = await statusRes.json();
      if (data.assetId && data.status === "ready") {
        assetId = data.assetId;
        break;
      }
    }
  }

  if (!assetId) {
    throw new Error("Mux asset never became ready for captions");
  }

  // Step 4: Fetch Text Tracks (auto-generated transcription) from backend
  const tracksRes = await fetch(
    `${API_BASE}/api/mux/asset-captions/${assetId}`,
    { credentials: "include" },
  );

  if (!tracksRes.ok) {
    throw new Error("Failed to fetch Mux text tracks");
  }

  const { data: tracks } = await tracksRes.json();
  return tracks as CaptionLine[];
}

async function fetchMuxTextTracks(playbackId: string): Promise<CaptionLine[]> {
  videoServiceLogger.debug(
    "Fetching Mux text tracks for playback:",
    playbackId,
  );

  const res = await fetch(
    `${API_BASE}/api/mux/playback-captions/${playbackId}`,
    { credentials: "include" },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch Mux text tracks: ${res.status}`);
  }

  const { data } = await res.json();
  return (data as CaptionLine[]) || [];
}

/**
 * Smart trim — returns the full video range.
 * Real AI-based dead-air detection requires server-side ffmpeg + audio analysis.
 * This is an honest stub — it does not fake highlight data.
 */
export async function smartTrim(
  file: File | string,
): Promise<{ start: number; end: number }[]> {
  videoServiceLogger.debug(
    "smartTrim: server-side ffmpeg not yet available, returning full range",
  );

  if (typeof file === "string") {
    // Can't read duration from a URL client-side without fetching
    return [{ start: 0, end: 60 }];
  }

  const meta = await getVideoMetadata(file);
  return [{ start: 0, end: meta.duration }];
}

/**
 * Add background music to video.
 * Requires server-side ffmpeg mixing — not available client-side.
 * Returns the original video URL unchanged.
 */
export async function addBackgroundMusic(
  videoFile: File,
  musicTrack: "upbeat" | "chill" | "epic" | "quebec",
): Promise<string> {
  videoServiceLogger.debug(
    `addBackgroundMusic: server-side mixing required for "${musicTrack}" — returning original`,
  );
  return URL.createObjectURL(videoFile);
}

/**
 * Crop video to vertical format (9:16).
 * Requires server-side ffmpeg — not available client-side.
 * Returns the original video URL unchanged.
 */
export async function cropToVertical(file: File): Promise<string> {
  videoServiceLogger.debug(
    "cropToVertical: server-side ffmpeg required — returning original",
  );
  return URL.createObjectURL(file);
}

/**
 * Extract thumbnail from video using canvas (real implementation).
 */
export async function extractThumbnail(
  file: File,
  timeInSeconds: number = 0,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error("Failed to create thumbnail"));
          }
        },
        "image/jpeg",
        0.9,
      );

      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };
  });
}

/**
 * Get real video metadata from a File object.
 */
export async function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };
  });
}

export default {
  processVideo,
  generateCaptions,
  smartTrim,
  addBackgroundMusic,
  cropToVertical,
  extractThumbnail,
  getVideoMetadata,
};
