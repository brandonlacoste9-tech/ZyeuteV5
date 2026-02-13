/**
 * 🛡️ Post Type Validation Utility
 * Validates and auto-corrects post type based on media URL.
 * Prevents the "Image-in-a-Video-Player" bug.
 *
 * @example
 * validatePostType('https://images.unsplash.com/photo.jpg', 'video') // → 'photo'
 * validatePostType('https://vimeo.com/video.mp4', 'photo') // → 'video'
 */

// Known video file extensions
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".webm",
  ".m3u8", // HLS streaming (Mux uses this)
  ".avi",
  ".mkv",
  ".m4v",
  ".flv",
  ".wmv",
  ".3gp",
];

// Known image file extensions
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".bmp",
  ".ico",
  ".tiff",
];

// Known video hosting platforms
const VIDEO_HOSTS = [
  "vimeo.com",
  "player.vimeo.com",
  "youtube.com",
  "youtu.be",
  "mixkit.co",
  "assets.mixkit.co",
  "cloudflare-stream.com",
  "bunnycdn.com",
  "gtv-videos-bucket", // Google sample videos
];

// Known image hosting platforms
const IMAGE_HOSTS = [
  "unsplash.com",
  "images.unsplash.com",
  "pexels.com",
  "images.pexels.com",
  "pixabay.com",
  "imgur.com",
  "i.imgur.com",
  "cloudinary.com",
  "res.cloudinary.com",
  "imgix.net",
  "picsum.photos",
];

export type MediaType = "video" | "photo";

/**
 * Validates and potentially corrects the post type based on the media URL.
 * Uses host detection and file extension analysis.
 *
 * @param url - The media URL to analyze
 * @param reportedType - The type that was reported/assigned
 * @returns The validated (and possibly corrected) type
 */
export function validatePostType(
  url: string | null | undefined,
  reportedType: MediaType,
): MediaType {
  // If no URL, trust the reported type
  if (!url) return reportedType;

  const lowerUrl = url.toLowerCase();

  // Check for known image hosts FIRST (highest priority)
  const isKnownImageHost = IMAGE_HOSTS.some((host) => lowerUrl.includes(host));
  if (isKnownImageHost) {
    if (reportedType === "video") {
      console.warn(
        `⚠️ [validatePostType] URL from image host marked as video, correcting to photo: ${url.substring(0, 60)}...`,
      );
    }
    return "photo";
  }

  // Check for known video hosts
  const isKnownVideoHost = VIDEO_HOSTS.some((host) => lowerUrl.includes(host));
  if (isKnownVideoHost) {
    if (reportedType === "photo") {
      console.warn(
        `⚠️ [validatePostType] URL from video host marked as photo, correcting to video: ${url.substring(0, 60)}...`,
      );
    }
    return "video";
  }

  // Check file extensions
  const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
  const hasImageExt = IMAGE_EXTENSIONS.some((ext) => lowerUrl.includes(ext));

  // Clear video extension
  if (hasVideoExt && !hasImageExt) {
    if (reportedType === "photo") {
      console.warn(
        `⚠️ [validatePostType] Video extension detected but marked as photo, correcting: ${url.substring(0, 60)}...`,
      );
    }
    return "video";
  }

  // Clear image extension
  if (hasImageExt && !hasVideoExt) {
    if (reportedType === "video") {
      console.warn(
        `⚠️ [validatePostType] Image extension detected but marked as video, correcting: ${url.substring(0, 60)}...`,
      );
    }
    return "photo";
  }

  // If ambiguous (has both or neither), trust the reported type but log for debugging
  if (hasVideoExt && hasImageExt) {
    console.debug(
      `[validatePostType] URL has both video and image extensions, using reported type: ${reportedType}`,
    );
  }

  return reportedType;
}

/**
 * Infers the media type from a URL without a reported type.
 * Defaults to 'photo' if the type cannot be determined.
 *
 * @param url - The media URL to analyze
 * @returns The inferred media type
 */
export function inferMediaType(url: string | null | undefined): MediaType {
  return validatePostType(url, "photo"); // Default to photo if unknown
}

/**
 * Checks if a URL represents a video file.
 *
 * @param url - The URL to check
 * @returns true if the URL is likely a video
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  return inferMediaType(url) === "video";
}

/**
 * Checks if a URL represents an image file.
 *
 * @param url - The URL to check
 * @returns true if the URL is likely an image
 */
export function isImageUrl(url: string | null | undefined): boolean {
  return inferMediaType(url) === "photo";
}

export default validatePostType;
