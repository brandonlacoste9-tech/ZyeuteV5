/**
 * SingleVideoView - High-performance vertical video view (TikTok-style)
 * Optimized for Zyeuté V5 with advanced prefetching and hardware acceleration
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Music,
  UserPlus,
  Flame,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Post, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHaptics } from "@/hooks/useHaptics";
import { usePrefetchVideo } from "@/hooks/usePrefetchVideo";
import { useNavigate } from "react-router-dom";
import { VideoPlayer } from "./VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import { useToast } from "@/hooks/use-toast";
import { VideoPlaybackDiagnostic } from "@/components/video/VideoPlaybackDiagnostic";
import { DoubleTapHeart } from "./DoubleTapHeart";
import { CommentBottomSheet } from "./CommentBottomSheet";
import { RemixModal } from "./RemixModal";
import { apiCall, togglePostFire, followUser } from "@/services/api";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videoError, setVideoError] = useState<Error | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [localFireCount, setLocalFireCount] = useState<number>(post.fireCount || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // 0–1

  // Dynamic Video Source Resolution
  const videoSrc = useMemo(() => {
    const rawUrl = post.hlsUrl || post.enhancedUrl || post.mediaUrl || "";
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

  // Watch tracking: fire-and-forget POST to /api/watch at 25/50/75/100% thresholds
  const watchPostIdRef = useRef<string | null>(null);
  // Reset tracked post when post changes
  useEffect(() => {
    watchPostIdRef.current = post.id;
  }, [post.id]);

  const handleWatchThreshold = useCallback(
    (pct: number, currentTimeMs: number) => {
      if (!currentUser) return;
      // Fire-and-forget: no await, no error handling
      apiCall("/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: watchPostIdRef.current || post.id,
          watch_pct: pct,
          watch_ms: currentTimeMs,
        }),
      });
    },
    [currentUser, post.id],
  );

  const handleLike = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!currentUser) {
        toast({ title: "Connecte-toi pour aimer! 🔥" });
        return;
      }
      impact();
      // Optimistic update
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLocalFireCount((n) => n + (wasLiked ? -1 : 1));
      // Persist to DB (fire-and-forget)
      togglePostFire(post.id, currentUser.id).then((ok) => {
        if (!ok) {
          // Rollback on failure
          setIsLiked(wasLiked);
          setLocalFireCount((n) => n + (wasLiked ? 1 : -1));
        }
      });
    },
    [impact, isLiked, currentUser, post.id, toast],
  );

  const handleDoubleTapLike = useCallback(() => {
    if (!currentUser) return;
    impact();
    if (!isLiked) {
      setIsLiked(true);
      setLocalFireCount((n) => n + 1);
      togglePostFire(post.id, currentUser.id).catch(() => {
        setIsLiked(false);
        setLocalFireCount((n) => n - 1);
      });
    }
  }, [impact, isLiked, currentUser, post.id]);

  const handleFollowFromFeed = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || !post.user) return;
    if (currentUser.id === post.user.id) return; // can't follow yourself
    tap();
    setIsFollowing((prev) => !prev);
    const ok = await followUser(post.user.id);
    if (!ok) {
      setIsFollowing((prev) => !prev); // rollback
      toast({ title: "Erreur lors de l'abonnement", variant: "destructive" });
    } else {
      toast({ title: isFollowing ? `Désabonné de @${post.user.username}` : `Abonné à @${post.user.username} ✅` });
    }
  }, [currentUser, post.user, isFollowing, tap, toast]);

  // Track video progress for the progress bar
  const handleVideoProgressInternal = useCallback((progress: number) => {
    setVideoProgress(progress);
    onVideoProgress?.(progress);
  }, [onVideoProgress]);

  const handleShareClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    tap();
    const url = `${window.location.origin}/p/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: (post as any).caption || "Vidéo Zyeuté",
          text: `@${post.user?.username || "anonyme"} sur Zyeuté ⚜️`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Lien copié! 📋", description: url });
      }
    } catch {
      // user cancelled or clipboard blocked — silently ignore
    }
    onShareClick?.();
  }, [post, tap, toast, onShareClick]);

  // Sound info derived from post
  const soundTitle = useMemo(() => {
    const title = (post as any).sound_title || (post as any).soundTitle;
    if (title) return title;
    return `Son original · @${post.user?.username || "anonyme"}`;
  }, [post]);

  // Render caption with clickable hashtags
  const renderCaption = useCallback(() => {
    const text = (post as any).caption || (post as any).content || "";
    if (!text) return null;

    // Split by #hashtag but keep the hashtag using regex capture
    const parts = text.split(/(#[\w\u00C0-\u017F]+)/g);
    
    return parts.map((part: string, i: number) => {
      if (part.startsWith("#")) {
        const tag = part.substring(1);
        return (
          <span
            key={i}
            className="text-[#FFD700] hover:underline cursor-pointer font-semibold relative z-50 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              tap();
              navigate(`/hashtag/${tag}`);
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }, [post, navigate, tap]);

  return (
    <DoubleTapHeart
      onDoubleTap={handleDoubleTapLike}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Background Blur for Portrait Videos */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none"
        style={{
          backgroundImage: `url(${post.thumbnailUrl})`,
        }}
      />

      {/* Main Video Layer */}
      <div className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-black shadow-2xl overflow-hidden z-10">
        {isActive && (
          <VideoPlaybackDiagnostic
            postId={post.id}
            postType={post.type ?? undefined}
            muxPlaybackId={post.muxPlaybackId}
            mediaUrl={videoSrc}
            videoSrc={videoSrc}
            playerPath={post.muxPlaybackId ? "mux" : "native"}
            isActive={isActive}
            error={videoError}
          />
        )}

        {/* Video Player Selection */}
        {!isActive && !priority ? (
          <img
            src={post.thumbnailUrl || ""}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : post.muxPlaybackId ? (
          <MuxVideoPlayer
            playbackId={post.muxPlaybackId ?? ""}
            thumbnailUrl={
              post.thumbnailUrl ||
              `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=2&width=400`
            }
            videoTitle={post.caption || undefined}
            viewerUserId={currentUser?.id || undefined}
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
              post.thumbnailUrl || post.mediaUrl || undefined,
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
            onProgress={isActive ? handleVideoProgressInternal : undefined}
            onWatchThreshold={isActive ? handleWatchThreshold : undefined}
            onEnded={onVideoEnd}
          />
        )}

        {/* TikTok-style video progress bar */}
        {isActive && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 z-40 pointer-events-none"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <div
              className="h-full transition-none"
              style={{
                width: `${Math.round(videoProgress * 100)}%`,
                background: "linear-gradient(90deg, #FFD700, #FFF)",
                boxShadow: "0 0 4px rgba(255,215,0,0.8)",
              }}
            />
          </div>
        )}

        {/* Right Action Bar (TikTok Style) */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-30">
          {/* Creator Avatar */}
          <div className="relative mb-2">
            <Avatar
              src={
                post.user?.avatarUrl ||
                (post.user as User & { avatar_url?: string })?.avatar_url
              }
              alt={post.user?.username || "User"}
              size="sm"
              className="border-2 shadow-lg border-amber-400"
              userId={post.user?.id}
            />
            <button
              onClick={handleFollowFromFeed}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 min-w-5 min-h-5 rounded-full flex items-center justify-center border-2 border-black transition-colors"
              style={{
                background: isFollowing ? "#22c55e" : "#FFD700",
              }}
            >
              {isFollowing ? (
                <span className="text-white text-[8px] font-black">✓</span>
              ) : (
                <UserPlus size={10} className="text-black" />
              )}
            </button>
          </div>

          {/* Fire / Like Action */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleLike}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: isLiked
                  ? "rgba(255,100,0,0.25)"
                  : "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Flame
                size={26}
                className={cn(
                  "transition-colors",
                  isLiked
                    ? "text-orange-400 fill-orange-400 drop-shadow-[0_0_6px_rgba(255,150,0,0.8)]"
                    : "text-white",
                )}
              />
            </button>
            <span
              className="text-xs font-bold mt-1"
              style={{
                color: isLiked ? "#FF8C00" : "white",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {localFireCount}
            </span>
          </div>

          {/* Comment Action */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowComments(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <MessageCircle size={26} />
            </button>
            <span
              className="text-white text-xs font-bold mt-1"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {post.commentCount || 0}
            </span>
          </div>

          {/* Share Action */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleShareClick}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Share2 size={26} />
            </button>
            <span
              className="text-white text-xs font-bold mt-1"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {(post as any).sharesCount || (post as any).shares_count || 0}
            </span>
          </div>

          {/* Remix Action (Duet/Stitch) */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                tap();
                setShowRemix(true);
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
              title="Remix"
            >
              <Scissors size={22} />
            </button>
            <span
              className="text-white text-xs font-bold mt-1"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {(post as any).remixCount || (post as any).remix_count || 0}
            </span>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute left-0 right-16 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
          <div className="flex flex-col gap-1.5">
            {/* Username with gold accent */}
            <div className="flex items-center gap-1.5">
              <span
                className="font-bold text-base"
                style={{
                  color: "#FFD700",
                  textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                }}
              >
                @{post.user?.username || "anonyme"}
              </span>
              {/* Region fleur-de-lis tag */}
              {post.region && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(212,175,55,0.2)",
                    border: "1px solid rgba(212,175,55,0.5)",
                    color: "#FFD700",
                  }}
                >
                  ⚜ {post.region}
                </span>
              )}
            </div>
            <p className="text-white/90 text-sm line-clamp-2 leading-relaxed pointer-events-auto relative z-50">
              {renderCaption()}
            </p>

            {/* ── Animated Sound Pill (TikTok-style) ── */}
            <div
              className="flex items-center gap-2 mt-0.5 overflow-hidden cursor-pointer pointer-events-auto relative z-50"
              style={{ maxWidth: "calc(100% - 4px)" }}
              onClick={(e) => {
                e.stopPropagation();
                tap();
                navigate(`/sound/${encodeURIComponent(soundTitle)}`);
              }}
            >
              {/* Spinning vinyl disc */}
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full border border-gold-400/60 flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, #2a2a2a 30%, #1a1a1a 60%, #3a3a2a 100%)",
                  animation: isActive ? "spin 4s linear infinite" : "none",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#FFD700" }}
                />
              </div>

              {/* Scrolling sound name */}
              <div className="flex-1 overflow-hidden">
                <div
                  className="text-white/80 text-xs font-medium whitespace-nowrap"
                  style={{
                    animation: isActive
                      ? "marquee 8s linear infinite"
                      : "none",
                  }}
                >
                  <Music
                    size={10}
                    className="inline mr-1 text-gold-400 align-middle"
                  />
                  {soundTitle}
                  <span className="mx-4 opacity-40">•</span>
                  {soundTitle}
                </div>
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

      {/* Comment Bottom Sheet */}
      <CommentBottomSheet
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentCount={post.commentCount || 0}
      />

      {/* Remix Modal */}
      <RemixModal
        postId={post.id}
        postMediaUrl={videoSrc}
        isOpen={showRemix}
        onClose={() => setShowRemix(false)}
      />

      {/* Marquee + Vinyl spin keyframes */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </DoubleTapHeart>
  );
}
