/**
 * Video Helper Utilities
 * Detect video sources and extract metadata
 */

export interface VideoSource {
  type: "mux" | "tiktok" | "youtube" | "pexels" | "direct" | "hls";
  url: string;
  id?: string;
}

/**
 * Detect video source type from URL
 */
export function detectVideoSource(url: string): VideoSource {
  if (!url) {
    return { type: "direct", url: "" };
  }

  // TikTok
  if (url.includes("tiktok.com")) {
    const videoId = extractTikTokVideoId(url);
    return { type: "tiktok", url, id: videoId || undefined };
  }

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = extractYouTubeVideoId(url);
    return { type: "youtube", url, id: videoId || undefined };
  }

  // Pexels
  if (url.includes("pexels.com")) {
    return { type: "pexels", url };
  }

  // HLS (.m3u8)
  if (url.includes(".m3u8") || url.includes("cloudflarestream.com")) {
    return { type: "hls", url };
  }

  // Direct video file
  return { type: "direct", url };
}

/**
 * Extract TikTok video ID from URL
 * Example: https://www.tiktok.com/@username/video/1234567890 → 1234567890
 */
export function extractTikTokVideoId(url: string): string | null {
  try {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extract YouTube video ID from URL
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    // youtu.be/ID
    let match = url.match(/youtu\.be\/([^?&]+)/);
    if (match) return match[1];

    // youtube.com/watch?v=ID
    match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    // youtube.com/embed/ID
    match = url.match(/\/embed\/([^?&]+)/);
    if (match) return match[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is a TikTok video
 */
export function isTikTokUrl(url: string): boolean {
  return url.includes("tiktok.com") && url.includes("/video/");
}

/**
 * Check if URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Check if URL is an HLS stream
 */
export function isHLSUrl(url: string): boolean {
  return url.includes(".m3u8") || url.includes("cloudflarestream.com");
}
