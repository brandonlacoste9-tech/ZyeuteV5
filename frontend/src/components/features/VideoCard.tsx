/**
 * VideoCard - Feed component for displaying video content in a grid
 * Optimized for Zyeuté V5 with advanced prefetching and unified playback
 */

import React, { useMemo, useState } from "react";
import { Play, Eye, Flame, MessageCircle, Flag, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post, User } from "@/types";
import { VideoPlayer } from "./VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import VideoErrorBoundary from "@/components/video/VideoErrorBoundary";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

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
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const muxPlaybackId = post.muxPlaybackId || post.mux_playback_id;
  const thumbnailUrl = post.thumbnailUrl || post.thumbnail_url || "";
  const fallbackMediaUrl = post.mediaUrl || post.media_url || "";

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/p/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: (post as any).caption?.substring(0, 60) || "Vidéo sur Zyeute",
          text: `@${post.user?.username || "zyeute"} — ${(post as any).caption?.substring(0, 80) || ""}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        toast.success("Lien copié!");
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard unavailable
    }
  };

  // Dynamic Video Source Resolution
  const videoSrc = useMemo(() => {
    const rawUrl =
      post.hlsUrl ||
      post.hls_url ||
      post.enhancedUrl ||
      post.enhanced_url ||
      fallbackMediaUrl ||
      "";
    return getProxiedMediaUrl(rawUrl) || rawUrl;
  }, [post, fallbackMediaUrl]);

  const isMux = !!muxPlaybackId;

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReporting || reported) return;
    setIsReporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("Connexion requise pour signaler.");
        setIsReporting(false);
        return;
      }
      const postUserId =
        (post as any).user_id || (post as any).userId || post.user?.id || "";
      const response = await fetch("/api/moderation/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: "post",
          contentId: post.id,
          userId: postUserId,
          reason: "user_report",
        }),
      });
      if (response.ok) {
        setReported(true);
        toast.success("Signalement envoyé. Merci!");
      } else {
        toast.error("Erreur lors du signalement.");
      }
    } catch {
      toast.error("Erreur lors du signalement.");
    } finally {
      setIsReporting(false);
    }
  };

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
        src={thumbnailUrl}
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
              playbackId={muxPlaybackId ?? ""}
              thumbnailUrl={getProxiedMediaUrl(
                thumbnailUrl || fallbackMediaUrl,
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
              poster={getProxiedMediaUrl(thumbnailUrl || fallbackMediaUrl)}
              autoPlay={autoPlay || isHovered}
              muted={muted}
              loop
              className="w-full h-full object-cover"
              priority={priority}
              preload={autoPlay ? "auto" : "metadata"}
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
            {(post as any).caption || ""}
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
              <span>{(post as any).view_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Indicator Badge */}
      <div className="absolute top-3 right-3 glass-amber-strong px-2 py-1 rounded-md flex items-center gap-1 text-gold-500 text-[10px] font-bold uppercase tracking-wider border-gold-500/30">
        <Play size={10} fill="currentColor" className="amber-glow-icon" />
        <span className="amber-glow">Vidéo</span>
      </div>

      {/* Report Button — visible on hover */}
      <button
        type="button"
        aria-label="Signaler ce contenu"
        onClick={handleReport}
        disabled={isReporting || reported}
        className={cn(
          "absolute top-3 left-3 p-1.5 rounded-full transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
          reported
            ? "bg-red-500/80 text-white"
            : "bg-black/50 text-white/70 hover:bg-red-500/60 hover:text-white",
          (isReporting || reported) && "cursor-not-allowed",
        )}
      >
        <Flag size={12} fill={reported ? "currentColor" : "none"} />
      </button>

      {/* Share Button — visible on hover */}
      <button
        type="button"
        aria-label="Partager"
        onClick={handleShare}
        className={cn(
          "absolute bottom-3 right-3 p-1.5 rounded-full transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
          shareCopied
            ? "bg-gold-500/80 text-black"
            : "bg-black/50 text-white/70 hover:bg-gold-500/60 hover:text-white",
        )}
      >
        <Share2 size={12} />
      </button>
    </div>
  );
}
