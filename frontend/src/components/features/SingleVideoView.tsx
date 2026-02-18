/**
 * SingleVideoView - Individual video view in continuous feed
 * Full-screen video with overlay UI matching app aesthetic
 */

import React, { useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { VideoPlayer } from "./VideoPlayer";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { Avatar } from "../Avatar";
import { Image } from "../Image";
import { useHaptics } from "@/hooks/useHaptics";
import { usePresence } from "@/hooks/usePresence";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { useAudioFocus } from "@/hooks/useAudioFocus";
import { InteractiveText } from "../InteractiveText";
import { TiGuyInsight } from "../TiGuyInsight";
import { EphemeralBadge } from "../ui/EphemeralBadge";
import type { Post, User } from "@/types";
import { useVideoVision } from "@/hooks/useVideoVision";
import { validatePostType } from "@/utils/validatePostType";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import { RemixModal } from "./RemixModal";
import { getRemixInfo } from "@/services/api";
import { Music } from "lucide-react";

interface SingleVideoViewProps {
  post: Post;
  user: User;
  isActive: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  videoSource?: import("@/hooks/usePrefetchVideo").VideoSource;
  isCached?: boolean;
  debug?: {
    activeRequests: number;
    concurrency: number;
    tier: number;
  };
  /** Called when playback reaches 70% (for prefetching next videos) */
  onVideoProgress?: (progress: number) => void;
}

export const SingleVideoView = React.memo<SingleVideoViewProps>(
  ({
    post,
    user,
    isActive,
    onFireToggle,
    onComment,
    onShare,
    onFollow,
    priority = false,
    preload = "metadata",
    videoSource,
    isCached,
    debug,
    onVideoProgress,
  }) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const { tap, impact } = useHaptics();
    const navigate = useNavigate();
    const { preferences } = useSettingsPreferences();

    // Audio Control State (TikTok-style tap to unmute)
    // Now using global audio focus manager for single-video playback
    const { isMuted, toggleMute: audioToggleMute } = useAudioFocus(post.id);
    const [showMuteIndicator, setShowMuteIndicator] = useState(false);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // AI Vision State
    const { analyzeFrame, isAnalyzing } = useVideoVision();
    const [localAiDescription, setLocalAiDescription] = useState<string | null>(
      post.ai_description || null,
    );
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    // Remix State (TikTok-style)
    const [showRemixModal, setShowRemixModal] = useState(false);
    const [remixCount, setRemixCount] = useState((post as any).remixCount || 0);

    // Load remix count
    useEffect(() => {
      if (post.type === "video" && isActive) {
        getRemixInfo(post.id).then((info) => {
          if (info) {
            setRemixCount(info.remixCount);
          }
        });
      }
    }, [post.id, post.type, isActive]);

    // Trigger Vision Analysis if missing
    useEffect(() => {
      if (
        isActive &&
        !localAiDescription &&
        !hasAnalyzed &&
        !isAnalyzing &&
        post.type === "video"
      ) {
        const timer = setTimeout(async () => {
          if (videoRef.current) {
            // Try to find the actual video tag inside the container
            const videoEl = videoRef.current.querySelector("video");
            if (videoEl) {
              console.log("[VideoVision] Analyzing frame for", post.id);
              setHasAnalyzed(true); // Prevent loop
              const result = await analyzeFrame(videoEl);
              if (result) {
                setLocalAiDescription(result.description);
              }
            }
          }
        }, 3000); // Wait 3s for meaningful frame
        return () => clearTimeout(timer);
      }
    }, [
      isActive,
      localAiDescription,
      hasAnalyzed,
      isAnalyzing,
      post.id,
      post.type,
      analyzeFrame,
    ]);

    // Get swipe gesture setting
    const swipeGesturesEnabled = preferences.interactions.swipeGestures;

    // Horizontal swipe gesture tracking
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const touchEndX = useRef<number>(0);
    const touchEndY = useRef<number>(0);
    const [swipeDirection, setSwipeDirection] = useState<
      "left" | "right" | null
    >(null);

    // Real-time Presence & Engagement
    const { viewerCount, engagement } = usePresence(post.id);
    const [isLiked, setIsLiked] = useState(false);
    const [showFireAnimation, setShowFireAnimation] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    // Derive counts from props OR real-time updates
    const fireCount = engagement.fireCount ?? post.fire_count;
    const commentCount = engagement.commentCount ?? post.comment_count;

    const handleFire = () => {
      // Only toggle if not already liked (or toggle off?)
      // Double tap usually only LIKES (doesn't unlike).
      // If double tap, we force like?
      // But handleFire toggles.
      // Let's make handleDoubleTap force like if not liked, or just trigger animation?
      // Usually double tap always shows animation.
      setIsLiked(true);
      if (!isLiked) {
        onFireToggle?.(post.id, fireCount);
      }
      impact();
    };

    const handleLikeToggle = () => {
      setIsLiked(!isLiked);
      onFireToggle?.(post.id, fireCount);
      impact();
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleFire();
      setShowFireAnimation(true);
      setTimeout(() => setShowFireAnimation(false), 800);
      impact();
    };

    // Single tap to toggle mute (TikTok-style)
    const handleSingleTap = (e: React.MouseEvent | React.TouchEvent) => {
      // Don't interfere with UI button clicks
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']")
      ) {
        return;
      }

      // Clear any pending double-tap timeout
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      // Debounce to avoid conflicts with double-tap
      tapTimeoutRef.current = setTimeout(() => {
        // Use global audio focus manager - previous video will auto-mute
        audioToggleMute();
        setShowMuteIndicator(true);
        tap();
        setTimeout(() => setShowMuteIndicator(false), 1000);
      }, 200); // 200ms debounce
    };

    const handleComment = () => {
      onComment?.(post.id);
      tap();
    };

    const handleShare = () => {
      onShare?.(post.id);
      tap();
    };

    const handleFollow = () => {
      setIsFollowing(!isFollowing);
      onFollow?.(user.id);
      tap();
      impact();
    };

    // Horizontal swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = async () => {
      if (!touchStartX.current || !touchEndX.current) return;

      const deltaX = touchStartX.current - touchEndX.current;
      const deltaY = Math.abs(touchStartY.current - touchEndY.current);
      const minSwipeDistance = 50; // Minimum distance for a swipe

      // Only trigger if horizontal swipe is more dominant than vertical
      if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > minSwipeDistance) {
        if (swipeGesturesEnabled) {
          // NEW MODE: Swipe Gestures (TikTok-style engagement)
          if (deltaX > 0) {
            // Swipe Left: Not Interested (hide similar content)
            setSwipeDirection("left");
            if (navigator.vibrate) {
              navigator.vibrate([30, 20, 30]); // Quick feedback
            }

            try {
              const response = await fetch(
                `/api/posts/${post.id}/not-interested`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                },
              );

              if (response.ok) {
                console.log("Marked as not interested");
              }
            } catch (error) {
              console.error("Failed to mark as not interested:", error);
            }

            setTimeout(() => setSwipeDirection(null), 500);
          } else {
            // Swipe Right: Fire/Like (quick engagement)
            setSwipeDirection("right");
            if (navigator.vibrate) {
              navigator.vibrate([20, 10, 20]); // Fire vibration
            }

            // Trigger fire action
            handleFire();

            setTimeout(() => setSwipeDirection(null), 500);
          }
        } else {
          // LEGACY MODE: Advanced features (Regenerate/Vault)
          if (deltaX > 0) {
            // Swipe Left: Regenerate/Modify
            setSwipeDirection("left");
            if (navigator.vibrate) {
              navigator.vibrate([50, 30, 50]); // Hammer pulse
            }

            try {
              const response = await fetch(`/api/ai/regenerate-video`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ postId: post.id }),
              });

              if (response.ok) {
                const data = await response.json();
                // Video will be updated via real-time subscription or page refresh
                console.log("Video regenerated:", data.videoUrl);
              }
            } catch (error) {
              console.error("Failed to regenerate video:", error);
            }

            setTimeout(() => setSwipeDirection(null), 500);
          } else {
            // Swipe Right: Save/Favorite (Vault)
            setSwipeDirection("right");
            if (navigator.vibrate) {
              navigator.vibrate([20, 10, 20]); // Vault click
            }

            try {
              const response = await fetch(`/api/posts/${post.id}/vault`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
              });

              if (response.ok) {
                console.log("Post vaulted");
              }
            } catch (error) {
              console.error("Failed to vault post:", error);
            }

            setTimeout(() => setSwipeDirection(null), 500);
          }
        }
      }

      // Reset touch positions
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    // Cleanup tap timeout on unmount
    useEffect(() => {
      return () => {
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }
      };
    }, []);

    // Deep Enhance: Select best video source
    // 🛡️ GUARDRAIL: Validate the actual type based on media URL (fallback safety)
    const mediaUrl = post.media_url || post.enhanced_url || post.original_url || "";
    const muxPlaybackId = post.mux_playback_id;
    const validatedType = validatePostType(
      mediaUrl,
      post.type as "video" | "photo",
    );
    const isVideo =
      validatedType === "video" || !!muxPlaybackId || post.type === "video";

    // Log if type was corrected
    if (validatedType !== post.type) {
      console.warn(
        `🛡️ [SingleVideoView] Type corrected: "${post.type}" → "${validatedType}" for post ${post.id}`,
      );
    }

    let videoSrc = "";

    if (isVideo) {
      // Priority: hls_url (adaptive) > enhanced_url > media_url > original_url
      const processingReady = post.processing_status === "completed";
      const hlsUrl = post.hls_url || (post as any).hlsUrl;
      if (hlsUrl) {
        videoSrc = hlsUrl;
      } else if (processingReady && post.enhanced_url) {
        videoSrc = post.enhanced_url;
      } else if (post.media_url) {
        videoSrc = post.media_url;
      } else if (post.original_url) {
        videoSrc = post.original_url;
      }

      // Debug log if video source is empty
      if (!videoSrc) {
        console.error(
          "[SingleVideoView] No valid video source found for post:",
          {
            postId: post.id,
            type: post.type,
            validatedType,
            enhanced_url: post.enhanced_url,
            media_url: post.media_url,
            original_url: post.original_url,
            processing_status: post.processing_status,
          },
        );
      } else {
        // Route external URLs (Mixkit, Unsplash, Pexels) through media proxy to fix 403/ORB
        videoSrc = getProxiedMediaUrl(videoSrc) || videoSrc;
        // Log valid video source for debugging
        console.debug("[SingleVideoView] Video source selected:", {
          postId: post.id,
          source: videoSrc.substring(0, 50) + "...",
          type: processingReady && post.enhanced_url ? "enhanced" : "original",
        });
      }
    }

    // Deep Enhance: Visual Filters
    const filterStyle =
      isVideo && post.visual_filter && post.visual_filter !== "none"
        ? { filter: post.visual_filter }
        : {};

    return (
      <div
        ref={videoRef}
        className="w-full h-full flex-shrink-0 snap-center snap-always relative bg-black select-none"
        onClick={handleSingleTap}
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Direction Indicator */}
        {swipeDirection && (
          <div
            className={`absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity ${swipeDirection === "left" ? "animate-pulse" : ""
              }`}
          >
            <div className="text-center">
              {swipeGesturesEnabled ? (
                // NEW MODE: Swipe Gestures
                swipeDirection === "left" ? (
                  <>
                    <div className="text-6xl mb-2">🚫</div>
                    <p className="text-gold-400 font-bold text-lg">
                      Pas intéressé
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-2">🔥</div>
                    <p className="text-orange-400 font-bold text-lg">Feu!</p>
                  </>
                )
              ) : // LEGACY MODE: Advanced Features
                swipeDirection === "left" ? (
                  <>
                    <div className="text-6xl mb-2">🔨</div>
                    <p className="text-gold-400 font-bold text-lg">
                      Régénération...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-2">🔒</div>
                    <p className="text-gold-400 font-bold text-lg">Sauvegardé!</p>
                  </>
                )}
            </div>
          </div>
        )}
        {/* Full-screen Media */}
        <div className="absolute inset-0 w-full h-full">
          {post.type === "video" ? (
            post.mux_playback_id ? (
              <MuxVideoPlayer
                playbackId={post.mux_playback_id}
                thumbnailUrl={
                  getProxiedMediaUrl(post.thumbnail_url || post.media_url) ||
                  post.thumbnail_url ||
                  post.media_url
                }
                className="w-full h-full object-cover"
                style={filterStyle}
                autoPlay={isActive}
                muted={isMuted}
                loop
              />
            ) : (
              <VideoPlayer
                src={videoSrc}
                poster={
                  getProxiedMediaUrl(post.thumbnail_url || post.media_url) ||
                  post.thumbnail_url ||
                  post.media_url
                }
                autoPlay={isActive}
                muted={isMuted}
                loop
                className="w-full h-full object-cover"
                style={filterStyle}
                priority={priority}
                preload={isActive ? "auto" : preload}
                videoSource={videoSource}
                debug={debug}
                onProgress={isActive ? onVideoProgress : undefined}
              />
            )
          ) : (
            <Image
              src={post.media_url}
              alt={post.caption || "Post media"}
              className="w-full h-full object-cover"
              style={filterStyle}
              fetchPriority={priority ? "high" : "auto"}
              loading={priority ? "eager" : "lazy"}
            />
          )}
        </div>

        {/* Double Tap Fire Animation */}
        {showFireAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-heart-pump">
            <div className="text-[120px] drop-shadow-[0_0_30px_rgba(255,100,0,0.9)] animate-pulse">
              🔥
            </div>
          </div>
        )}

        {/* Mute/Unmute Indicator (TikTok-style, bottom-right) */}
        {post.type === "video" && (
          <div className="absolute bottom-20 right-4 z-30 pointer-events-none">
            {/* Persistent mute icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${showMuteIndicator
                ? "bg-white/90 scale-125"
                : "bg-black/40 backdrop-blur-sm"
                }`}
            >
              {isMuted ? (
                <svg
                  className={`w-5 h-5 ${showMuteIndicator ? "text-black" : "text-white"}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg
                  className={`w-5 h-5 ${showMuteIndicator ? "text-black" : "text-white"}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Québec Or emblem — top right of video screen, small */}
        <img
          src="/quebec-emblem.png"
          alt="Québec Or"
          className="absolute top-4 right-4 h-7 w-auto object-contain opacity-90 z-20 pointer-events-none"
          width={28}
          height={28}
          loading="lazy"
        />

        {/* Deep Enhance Status Badge (Top Right) */}
        <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 items-end">
          <EphemeralBadge post={post} className="static bg-red-600/90" />

          {post.type === "video" &&
            post.processing_status === "completed" &&
            post.enhanced_url && (
              <div className="bg-gold-500/90 text-black px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                <span>✨</span>
                <span>4K ULTRA</span>
              </div>
            )}
          {post.type === "video" && post.processing_status === "processing" && (
            <div className="bg-black/60 text-white border border-white/20 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 backdrop-blur-md">
              <span className="animate-spin">⚙️</span>
              <span>Amélioration...</span>
            </div>
          )}
        </div>

        {/* User Info Overlay (Top Left) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
          <Link
            to={`/profile/${user.username}`}
            onClick={tap}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full border border-gold-500/50 blur-[2px]"></div>
            <Avatar
              src={user.avatar_url}
              size="md"
              isVerified={user.is_verified}
              className="ring-2 ring-gold-500/40"
              userId={user.id}
            />
          </Link>
          <div className="flex-1">
            <Link
              to={`/profile/${user.username}`}
              onClick={tap}
              className="font-bold text-white hover:text-gold-400 transition-colors flex items-center gap-1 text-sm"
            >
              {user.display_name || user.username}
              {user.is_verified && (
                <span className="text-gold-500 drop-shadow-[0_0_3px_rgba(255,191,0,0.8)]">
                  ✓
                </span>
              )}
            </Link>
            {post.region && (
              <p className="text-stone-300 text-xs flex items-center gap-1">
                <span>📍</span>
                <span>{post.city || post.region}</span>
              </p>
            )}
          </div>

          {/* Live Viewer Count (Zyeuteurs) */}
          {viewerCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-600/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-red-400/30 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.4)]">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_white]" />
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                {viewerCount} {viewerCount > 1 ? "Zyeuteurs" : "Zyeuteur"}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-20">
          {/* Ti-Guy Insight (Local or Server) */}
          {localAiDescription && (
            <div className="mb-4">
              <TiGuyInsight
                summary={localAiDescription}
                labels={post.ai_labels || (hasAnalyzed ? ["Live Vision"] : [])}
              />
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="mb-4">
              <Link
                to={`/profile/${user.username}`}
                onClick={tap}
                className="font-bold text-white hover:text-gold-400 transition-colors mr-2"
              >
                {user.username}
              </Link>
              <InteractiveText
                text={post.caption}
                className="text-white text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.hashtags.map((tag) => (
                <Link
                  key={tag}
                  to={`/explore?tag=${tag}`}
                  onClick={tap}
                  className="text-gold-400 hover:text-gold-300 text-xs font-medium transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Action Buttons (Right Side) */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
            {/* Fire Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLikeToggle();
              }}
              className={`flex flex-col items-center gap-1 transition-all press-scale ${isLiked ? "scale-110" : ""
                }`}
            >
              <div
                className={`text-4xl transition-all ${isLiked
                  ? "drop-shadow-[0_0_15px_rgba(255,100,0,0.8)] animate-pulse"
                  : "grayscale opacity-80"
                  }`}
              >
                🔥
              </div>
              <span className="font-bold text-sm font-mono text-white drop-shadow-lg">
                {fireCount}
              </span>
            </button>

            {/* Follow Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFollow();
              }}
              className={`flex flex-col items-center gap-1 transition-all press-scale ${isFollowing ? "scale-105" : ""
                }`}
            >
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${isFollowing
                  ? "border-gold-500 bg-gold-500/20"
                  : "border-white/80 bg-black/20 hover:border-gold-400"
                  }`}
              >
                <span
                  className={`text-2xl font-bold ${isFollowing ? "text-gold-500" : "text-white"
                    }`}
                >
                  {isFollowing ? "✓" : "+"}
                </span>
              </div>
              <span className="font-bold text-xs text-white drop-shadow-lg">
                {isFollowing ? "Abonné" : "Suivre"}
              </span>
            </button>

            {/* Comment Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComment();
              }}
              className="flex flex-col items-center gap-1 text-white hover:text-gold-400 transition-colors press-scale"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="font-bold text-sm font-mono text-white drop-shadow-lg">
                {commentCount}
              </span>
            </button>

            {/* Remix Button (TikTok-style) */}
            {post.type === "video" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRemixModal(true);
                  tap();
                }}
                className="flex flex-col items-center gap-1 text-white hover:text-gold-400 transition-colors press-scale"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="font-bold text-sm font-mono text-white drop-shadow-lg">
                  {remixCount > 0 ? remixCount : ""}
                </span>
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="text-white hover:text-gold-400 transition-colors press-scale"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>

          {/* Sound Attribution (TikTok-style) */}
          {(post as any).soundId && (
            <div className="absolute bottom-4 left-4 right-20 z-10">
              <div className="flex items-center gap-2 text-white text-sm">
                <Music className="w-4 h-4" />
                <span className="truncate">
                  {(post as any).soundTitle || "Son original"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Remix Modal */}
        {showRemixModal && (
          <RemixModal
            postId={post.id}
            postMediaUrl={post.media_url || ""}
            isOpen={showRemixModal}
            onClose={() => setShowRemixModal(false)}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Returns true if props are equal (no re-render needed)
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.post.fire_count === nextProps.post.fire_count &&
      prevProps.post.comment_count === nextProps.post.comment_count &&
      (prevProps.post.type === "video" && nextProps.post.type === "video"
        ? prevProps.post.processing_status === nextProps.post.processing_status
        : true)
    );
  },
);
