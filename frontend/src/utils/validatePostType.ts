/**
 * 🛡️ Post Type Validation Utility (Frontend)
 * Validates and auto-corrects post type based on media URL.
 * Prevents the "Image-in-a-Video-Player" bug.
 */

// Known video file extensions
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".webm",
  ".m3u8",
  ".avi",
  ".mkv",
  ".m4v",
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
];

// Known video hosting platforms
const VIDEO_HOSTS = [
  "mux.com",
  "stream.mux.com",
  "vimeo.com",
  "player.vimeo.com",
  "youtube.com",
  "mixkit.co",
  "gtv-videos-bucket",
];

// Known image hosting platforms
const IMAGE_HOSTS = [
  "unsplash.com",
  "images.unsplash.com",
  "pexels.com",
  "images.pexels.com",
  "pixabay.com",
  "imgur.com",
];

export type MediaType = "video" | "photo";

/**
 * Validates and potentially corrects the post type based on the media URL.
 */
export function validatePostType(
  url: string | null | undefined,
  reportedType: MediaType,
): MediaType {
  if (!url) return reportedType;

  const lowerUrl = url.toLowerCase();

  // Check for known image hosts FIRST
  const isKnownImageHost = IMAGE_HOSTS.some((host) => lowerUrl.includes(host));
  if (isKnownImageHost) {
    return "photo";
  }

  // Check for known video hosts
  const isKnownVideoHost = VIDEO_HOSTS.some((host) => lowerUrl.includes(host));
  if (isKnownVideoHost) {
    return "video";
  }

  // Check file extensions
  const hasVideoExt = VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
  const hasImageExt = IMAGE_EXTENSIONS.some((ext) => lowerUrl.includes(ext));

  if (hasVideoExt && !hasImageExt) return "video";
  if (hasImageExt && !hasVideoExt) return "photo";

  return reportedType;
}

/**
 * Infers the media type from a URL.
 */
export function inferMediaType(url: string | null | undefined): MediaType {
  return validatePostType(url, "photo");
}

/**
 * Checks if a URL represents a video file.
 */
export function isVideoUrl(url: string | null | undefined): boolean {
  return inferMediaType(url) === "video";
}

export default validatePostType;
