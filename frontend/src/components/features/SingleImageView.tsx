/**
 * SingleImageView - Individual image view in continuous feed
 * Full-screen image with overlay UI matching app aesthetic
 * Includes AI video generation feature
 */

import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "../Avatar";
import { Image } from "../Image";
import { useHaptics } from "@/hooks/useHaptics";
import { usePresence } from "@/hooks/usePresence";
import { InteractiveText } from "../InteractiveText";
import { TiGuyInsight } from "../TiGuyInsight";
import { EphemeralBadge } from "../ui/EphemeralBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { generateVideo } from "@/services/api";
import type { Post, User } from "@/types";

interface SingleImageViewProps {
  post: Post;
  user: User;
  isActive: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  priority?: boolean;
}

export const SingleImageView = React.memo<SingleImageViewProps>(
  ({
    post,
    user,
    isActive,
    onFireToggle,
    onComment,
    onShare,
    priority = false,
  }) => {
    const imageRef = useRef<HTMLDivElement>(null);
    const { tap, impact } = useHaptics();
    const navigate = useNavigate();

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
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);

    // AI Video Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
      null,
    );
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Derive counts from props OR real-time updates
    const fireCount = engagement.fireCount ?? post.fire_count;
    const commentCount = engagement.commentCount ?? post.comment_count;

    const handleFire = () => {
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
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
      impact();
    };

    const handleComment = () => {
      onComment?.(post.id);
      tap();
    };

    const handleShare = () => {
      onShare?.(post.id);
      tap();
    };

    const handleGenerateVideo = async () => {
      if (!post.media_url || isGenerating) return;

      setIsGenerating(true);
      tap();

      try {
        const result = await generateVideo(
          post.media_url,
          post.caption || "Animate this image with natural movement",
        );

        if (result?.videoUrl) {
          setGeneratedVideoUrl(result.videoUrl);
          setShowVideoModal(true);
        }
      } catch (error) {
        console.error("Failed to generate video:", error);
      } finally {
        setIsGenerating(false);
      }
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
      const minSwipeDistance = 50;

      // Only trigger if horizontal swipe is more dominant than vertical
      if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe Left: Regenerate/Modify
          setSwipeDirection("left");
          if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
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
            navigator.vibrate([20, 10, 20]);
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

      // Reset touch positions
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    // Visual Filters
    const filterStyle =
      post.visual_filter && post.visual_filter !== "none"
        ? { filter: post.visual_filter }
        : {};

    return (
      <>
        <div
          ref={imageRef}
          className="w-full h-full flex-shrink-0 snap-center snap-always relative bg-black select-none"
          onDoubleClick={handleDoubleTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe Direction Indicator */}
          {swipeDirection && (
            <div
              className={`absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity ${
                swipeDirection === "left" ? "animate-pulse" : ""
              }`}
            >
              <div className="text-center">
                {swipeDirection === "left" ? (
                  <>
                    <div className="text-6xl mb-2">🔨</div>
                    <p className="text-gold-400 font-bold text-lg">
                      Régénération...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-2">🔒</div>
                    <p className="text-gold-400 font-bold text-lg">
                      Sauvegardé!
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Full-screen Image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={post.media_url}
              alt={post.caption || "Post media"}
              className="w-full h-full object-cover"
              style={filterStyle}
              fetchPriority={priority ? "high" : "auto"}
              loading={priority ? "eager" : "lazy"}
            />
          </div>

          {/* Double Tap Heart Animation */}
          {showHeartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-heart-pump">
              <svg
                className="w-24 h-24 text-orange-500 drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

          {/* Status Badge (Top Right) */}
          <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 items-end">
            <EphemeralBadge post={post} className="static bg-red-600/90" />
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
            {/* Ti-Guy Insight */}
            {post.ai_description && (
              <div className="mb-4">
                <TiGuyInsight
                  summary={post.ai_description}
                  labels={post.ai_labels || []}
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
                className={`flex flex-col items-center gap-1 transition-all press-scale ${
                  isLiked
                    ? "text-orange-500 scale-110 drop-shadow-[0_0_10px_rgba(255,100,0,0.6)]"
                    : "text-white hover:text-gold-400"
                }`}
              >
                <svg
                  className="w-8 h-8"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                  />
                </svg>
                <span className="font-bold text-sm font-mono text-white drop-shadow-lg">
                  {fireCount}
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

              {/* AI Video Generation Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateVideo();
                }}
                disabled={isGenerating}
                className={`flex flex-col items-center gap-1 text-white hover:text-gold-400 transition-colors press-scale ${
                  isGenerating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="w-8 h-8 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="font-bold text-xs font-mono text-white drop-shadow-lg">
                      ...
                    </span>
                  </>
                ) : (
                  <>
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
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-bold text-xs font-mono text-white drop-shadow-lg">
                      ✨ AI
                    </span>
                  </>
                )}
              </button>

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
          </div>
        </div>

        {/* Video Generation Modal */}
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="max-w-2xl bg-zinc-900 border-gold-500/30">
            <DialogHeader>
              <DialogTitle className="text-gold-400">
                Vidéo générée par IA ✨
              </DialogTitle>
            </DialogHeader>
            {generatedVideoUrl && (
              <div className="mt-4">
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-lg"
                >
                  Votre navigateur ne supporte pas la balise vidéo.
                </video>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.post.fire_count === nextProps.post.fire_count &&
      prevProps.post.comment_count === nextProps.post.comment_count
    );
  },
);
