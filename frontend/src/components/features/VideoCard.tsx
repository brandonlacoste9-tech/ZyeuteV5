/**
 * VideoCard - Feed component for displaying video content in a grid
 * Optimized for Zyeuté V5 with advanced prefetching and unified playback
 */

import React, { useMemo, useState } from "react";
import {
  Play,
  Volume2,
  VolumeX,
  Eye,
  Flame,
  Share2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Post, User } from "@shared/schema";
import { VideoPlayer } from "./VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import VideoErrorBoundary from "@/components/video/VideoErrorBoundary";

interface VideoCardProps {
  post: Post & { user?: User };
  autoPlay?: boolean;
  muted?: boolean;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
}

export function VideoCard({
  post,
  autoPlay = false,
  muted = true,
  priority = false,
  className,
  onClick,
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoError, setVideoError] = useState<Error | null>(null);

  // Dynamic Video Source Resolution
  const videoSrc = useMemo(() => {
    const rawUrl =
      post.hls_url ||
      post.hlsUrl ||
      post.enhanced_url ||
      post.enhancedUrl ||
      post.media_url ||
      post.mediaUrl ||
      "";
    return getProxiedMediaUrl(rawUrl) || rawUrl;
  }, [post]);

  const isMux = !!(post.mux_playback_id || post.muxPlaybackId);

  return (
    <div
      className={cn(
        "relative w-full aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group shadow-lg",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background Image (Poster) */}
      <img
        src={post.thumbnail_url || post.thumbnailUrl || ""}
        alt=""
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
          (autoPlay || isHovered) && !videoError ? "opacity-0" : "opacity-100",
        )}
        loading={priority ? "eager" : "lazy"}
      />

      {/* Video Player Selection */}
      <div className="absolute inset-0 w-full h-full">
        <VideoErrorBoundary>
          {isMux ? (
            <MuxVideoPlayer
              playbackId={(post.mux_playback_id || post.muxPlaybackId) ?? ""}
              thumbnailUrl={getProxiedMediaUrl(
                post.thumbnail_url ||
                  post.thumbnailUrl ||
                  post.media_url ||
                  post.mediaUrl,
              )}
              className="w-full h-full object-cover"
              autoPlay={autoPlay || isHovered}
              muted={muted}
              loop
              onError={setVideoError}
            />
          ) : (
            <VideoPlayer
              src={videoSrc}
              poster={getProxiedMediaUrl(
                post.thumbnail_url ||
                  post.thumbnailUrl ||
                  post.media_url ||
                  post.mediaUrl,
              )}
              autoPlay={autoPlay || isHovered}
              muted={muted}
              loop
              className="w-full h-full object-cover"
              priority={priority}
              preload={autoPlay ? "auto" : "metadata"}
              onError={setVideoError}
            />
          )}
        </VideoErrorBoundary>
      </div>

      {/* Overlay Info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-3 left-3 right-3 p-3 glass-amber rounded-lg flex flex-col gap-1 border-gold-500/20">
          <h4 className="text-gold-500 text-sm font-bold truncate amber-glow">
            @{post.user?.username || "anonyme"}
          </h4>
          <p className="text-white/90 text-[11px] line-clamp-2 leading-tight">
            {post.content}
          </p>

          <div className="flex items-center gap-3 mt-2 text-white/90 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/30 rounded-full border border-gold-500/20">
              <Flame size={12} className="text-gold-500 amber-glow-icon" />
              <span className="text-gold-100">{post.fireCount || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/30 rounded-full border border-white/10">
              <MessageCircle size={12} className="text-white/70" />
              <span>{post.commentCount || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/30 rounded-full border border-white/10">
              <Eye size={12} className="text-white/70" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Indicator Badge */}
      <div className="absolute top-3 right-3 glass-amber-strong px-2 py-1 rounded-md flex items-center gap-1 text-gold-500 text-[10px] font-bold uppercase tracking-wider border-gold-500/30">
        <Play size={10} fill="currentColor" className="amber-glow-icon" />
        <span className="amber-glow">Vidéo</span>
      </div>
    </div>
  );
}
