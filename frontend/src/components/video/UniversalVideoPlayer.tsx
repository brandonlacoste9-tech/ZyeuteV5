/**
 * UniversalVideoPlayer - Handles all video sources
 * Supports: Mux, TikTok, YouTube, Pexels, HLS, Direct MP4
 * Zyeuté V5 - Quebec social media
 */

import { MuxVideoPlayer } from "./MuxVideoPlayer";
import { TikTokVideoPlayer } from "./TikTokVideoPlayer";
import { VideoPlayer } from "../features/VideoPlayer";
import { SimpleVideoPlayer } from "./SimpleVideoPlayer";
import { VideoErrorBoundary } from "./VideoErrorBoundary";
import { detectVideoSource, isTikTokUrl, isHLSUrl } from "@/utils/videoHelpers";
import { cn } from "@/lib/utils";

interface UniversalVideoPlayerProps {
  /** Mux playback ID (highest priority) */
  muxPlaybackId?: string;
  /** TikTok video URL */
  tiktokUrl?: string;
  /** YouTube video URL */
  youtubeUrl?: string;
  /** HLS stream URL (.m3u8) */
  hlsUrl?: string;
  /** Direct video URL (MP4, etc.) */
  mediaUrl?: string;
  /** Fallback URLs */
  enhancedUrl?: string;
  originalUrl?: string;
  /** Thumbnail/poster image */
  thumbnailUrl?: string;
  /** CSS classes */
  className?: string;
  /** Auto-play video */
  autoPlay?: boolean;
  /** Mute video */
  muted?: boolean;
  /** Loop video */
  loop?: boolean;
  /** Priority loading */
  priority?: boolean;
}

export function UniversalVideoPlayer({
  muxPlaybackId,
  tiktokUrl,
  youtubeUrl,
  hlsUrl,
  mediaUrl,
  enhancedUrl,
  originalUrl,
  thumbnailUrl,
  className = "",
  autoPlay = false,
  muted = true,
  loop = true,
  priority = false,
}: UniversalVideoPlayerProps) {
  // Priority 1: Mux (best quality, adaptive streaming)
  if (muxPlaybackId) {
    return (
      <VideoErrorBoundary>
        <MuxVideoPlayer
          playbackId={muxPlaybackId}
          thumbnailUrl={thumbnailUrl}
          className={className}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
        />
      </VideoErrorBoundary>
    );
  }

  // Priority 2: TikTok embed
  if (tiktokUrl) {
    return (
      <VideoErrorBoundary>
        <TikTokVideoPlayer
          videoUrl={tiktokUrl}
          className={className}
          autoPlay={autoPlay}
        />
      </VideoErrorBoundary>
    );
  }

  // Priority 3: YouTube embed (future)
  if (youtubeUrl) {
    return (
      <VideoErrorBoundary>
        <div className={cn("aspect-video", className)}>
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(youtubeUrl)}?autoplay=${autoPlay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`}
            className="w-full h-full rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      </VideoErrorBoundary>
    );
  }

  // Priority 4: HLS stream
  const videoUrl = hlsUrl || enhancedUrl || mediaUrl || originalUrl || "";

  if (isHLSUrl(videoUrl)) {
    return (
      <VideoErrorBoundary>
        <VideoPlayer
          src={videoUrl}
          poster={thumbnailUrl}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          priority={priority}
        />
      </VideoErrorBoundary>
    );
  }

  // Priority 5: Direct MP4/video file
  if (videoUrl) {
    return (
      <VideoErrorBoundary>
        <SimpleVideoPlayer
          src={videoUrl}
          poster={thumbnailUrl}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          priority={priority}
        />
      </VideoErrorBoundary>
    );
  }

  // No video source available
  return (
    <div
      className={cn("flex items-center justify-center bg-black/80", className)}
    >
      <p className="text-white/60 text-sm">Vidéo non disponible</p>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  );
  return match ? match[1] : "";
}
