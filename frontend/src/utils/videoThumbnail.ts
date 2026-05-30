/**
 * Video Thumbnail Generator
 * Generates a client-side thumbnail from a video file using Canvas API.
 * Includes timeout, proper cleanup on error/timeout, and no resource leaks.
 */

const DEFAULT_SEEK_TIME = 1;

/** Default timeout (ms). Configurable for production telemetry (e.g. track timeout rate). */
export const VIDEO_THUMBNAIL_TIMEOUT_MS = 15000;

export interface GenerateVideoThumbnailOptions {
  /** Time (s) into the video to capture the frame. Default 1. */
  seekTime?: number;
  /** Max wait (ms) before rejecting. Default VIDEO_THUMBNAIL_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Called when timeout occurs (for telemetry). */
  onTimeout?: () => void;
}

export async function generateVideoThumbnail(
  file: File,
  seekTimeOrOptions: number | GenerateVideoThumbnailOptions = DEFAULT_SEEK_TIME,
): Promise<string> {
  const options: Required<Omit<GenerateVideoThumbnailOptions, "onTimeout">> & {
    onTimeout?: () => void;
  } =
    typeof seekTimeOrOptions === "object"
      ? {
          seekTime: seekTimeOrOptions.seekTime ?? DEFAULT_SEEK_TIME,
          timeoutMs:
            seekTimeOrOptions.timeoutMs ?? VIDEO_THUMBNAIL_TIMEOUT_MS,
          onTimeout: seekTimeOrOptions.onTimeout,
        }
      : {
          seekTime: seekTimeOrOptions,
          timeoutMs: VIDEO_THUMBNAIL_TIMEOUT_MS,
          onTimeout: undefined,
        };

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    let settled = false;
    const cleanup = (reason: "success" | "error" | "timeout") => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      video.remove();
    };

    const rejectWithError = (err: Error | Event) => {
      cleanup("error");
      const message =
        err instanceof Error ? err.message : "Video thumbnail failed";
      reject(new Error(message));
    };

    const timeoutMs = options.timeoutMs;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      options.onTimeout?.();
      cleanup("timeout");
      reject(new Error("Video thumbnail timed out"));
    }, timeoutMs);

    video.onloadedmetadata = () => {
      if (settled) return;
      video.currentTime = Math.min(options.seekTime, video.duration);
    };

    video.onseeked = () => {
      if (settled) return;
      clearTimeout(timeoutId);

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup("error");
        reject(new Error("Failed to get canvas context"));
        return;
      }

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        cleanup("success");
        canvas.remove();
        resolve(dataUrl);
      } catch (e) {
        cleanup("error");
        reject(e instanceof Error ? e : new Error("Canvas draw failed"));
      }
    };

    video.onerror = (e) => {
      if (settled) return;
      clearTimeout(timeoutId);
      const message =
        video.error?.message ?? "Video failed to load for thumbnail";
      rejectWithError(new Error(message));
    };
  });
}
