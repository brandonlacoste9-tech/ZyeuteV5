/**
 * SingleVideoView - High-performance vertical video view (TikTok-style)
 * Optimized for Zyeuté V5 with advanced prefetching and hardware acceleration
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  MoreVertical,
  Music,
  AlertCircle,
  Eye,
  Flag,
  UserPlus,
  Ban,
  Trash2,
  Edit,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Post, User } from "@shared/schema";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { usePrefetchVideo } from "@/hooks/usePrefetchVideo";
import { VideoPlayer } from "./VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import { useToast } from "@/hooks/use-toast";
import { VideoPlaybackDiagnostic } from "@/components/video/VideoPlaybackDiagnostic";

interface SingleVideoViewProps {
  post: Post & { user?: User };
  isActive: boolean;
  priority?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onVideoProgress?: (progress: number) => void;
  onVideoEnd?: () => void;
}

export function SingleVideoView({
  post,
  isActive,
  priority = false,
  isMuted,
  onToggleMute,
  onCommentClick,
  onShareClick,
  onVideoProgress,
  onVideoEnd,
}: SingleVideoViewProps) {
  const { user: currentUser } = useAuth();
  const { impact, tap } = useHaptics();
  const { toast } = useToast();
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

  // Video Activation & Prefetching
  const { source: videoSource, debug } = usePrefetchVideo(
    videoSrc,
    isActive ? 3 : priority ? 2 : 0,
  );

  const filterStyle = useMemo(() => {
    if (!post.visualFilter || post.visualFilter === "none") return {};
    return { filter: post.visualFilter };
  }, [post.visualFilter]);

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      impact("medium");
      // Like logic would go here
    },
    [impact],
  );

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Background Blur for Portrait Videos */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none"
        style={{
          backgroundImage: `url(${post.thumbnail_url || post.thumbnailUrl})`,
        }}
      />

      {/* Main Video Layer */}
      <div className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-black shadow-2xl overflow-hidden z-10">
        {isActive && (
          <VideoPlaybackDiagnostic
            postId={post.id}
            postType={post.type ?? undefined}
            muxPlaybackId={post.mux_playback_id || post.muxPlaybackId}
            mediaUrl={videoSrc}
            videoSrc={videoSrc}
            playerPath={
              post.mux_playback_id || post.muxPlaybackId ? "mux" : "native"
            }
            isActive={isActive}
            error={videoError}
          />
        )}

        {/* Video Player Selection */}
        {!isActive && !priority ? (
          <img
            src={post.thumbnail_url || post.thumbnailUrl || ""}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : post.mux_playback_id || post.muxPlaybackId ? (
          <MuxVideoPlayer
            playbackId={(post.mux_playback_id || post.muxPlaybackId) ?? ""}
            thumbnailUrl={getProxiedMediaUrl(
              post.thumbnail_url ||
                post.thumbnailUrl ||
                post.media_url ||
                post.mediaUrl,
            )}
            className="w-full h-full object-cover"
            style={filterStyle}
            autoPlay={isActive}
            muted={isMuted}
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
            autoPlay={isActive}
            muted={isMuted}
            loop
            className="w-full h-full object-cover"
            style={filterStyle}
            priority={priority}
            preload={isActive ? "auto" : "metadata"}
            videoSource={videoSource}
            debug={debug}
            onProgress={isActive ? onVideoProgress : undefined}
            onEnded={onVideoEnd}
          />
        )}

        {/* Right Action Bar (TikTok Style) */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30">
          {/* Creator Avatar */}
          <div className="relative mb-2">
            <Avatar
              src={
                post.user?.avatarUrl ||
                (post.user as User & { avatar_url?: string })?.avatar_url
              }
              alt={post.user?.username || "User"}
              size="sm"
              className="border-2 border-white shadow-lg"
              userId={post.user?.id}
            />
            <Button
              size="sm"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 min-w-5 min-h-5 rounded-full bg-gold-500 hover:bg-gold-600 text-black p-0 border-2 border-black"
            >
              <UserPlus size={12} />
            </Button>
          </div>

          {/* Like Action */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="w-12 h-12 min-w-12 min-h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-0"
            >
              <Heart
                size={28}
                className={cn(
                  post.fireCount &&
                    post.fireCount > 0 &&
                    "text-red-500 fill-red-500",
                )}
              />
            </Button>
            <span className="text-white text-xs font-bold mt-1 shadow-sm">
              {post.fireCount || 0}
            </span>
          </div>

          {/* Comment Action */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCommentClick}
              className="w-12 h-12 min-w-12 min-h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-0"
            >
              <MessageCircle size={28} />
            </Button>
            <span className="text-white text-xs font-bold mt-1 shadow-sm">
              {post.commentCount || 0}
            </span>
          </div>

          {/* Share Action */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShareClick}
              className="w-12 h-12 min-w-12 min-h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-0"
            >
              <Share2 size={28} />
            </Button>
            <span className="text-white text-xs font-bold mt-1 shadow-sm">
              {post.sharesCount || 0}
            </span>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute left-0 right-16 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
          <div className="flex flex-col gap-2">
            <h3 className="text-white font-bold text-base">
              @{post.user?.username || "anonyme"}
            </h3>
            <p className="text-white/90 text-sm line-clamp-2 leading-relaxed">
              {post.content}
            </p>

            {/* Music/Sound Info */}
            <div className="flex items-center gap-2 text-white/80 text-xs mt-1 overflow-hidden">
              <Music size={14} className="flex-shrink-0" />
              <div className="flex gap-4 animate-marquee whitespace-nowrap">
                <span>Son original - @{post.user?.username || "anonyme"}</span>
                <span>Zyeuté V5 • {post.region || "Québec"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mute/Unmute Overlay */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="absolute top-4 right-4 w-10 h-10 min-w-10 min-h-10 rounded-full bg-black/20 backdrop-blur-sm text-white z-30 p-0"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </Button>
      </div>
    </div>
  );
}
