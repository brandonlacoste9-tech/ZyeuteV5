/**
 * SingleImageView - Individual image view in continuous feed
 * Full-screen image with GPU-accelerated "Blurred Backdrop" effect
 * Matches aesthetic and UI of SingleVideoView
 */

import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../Avatar";
import { generateVideo } from "@/services/api";
import { Image } from "../Image";
import { useHaptics } from "@/hooks/useHaptics";
import { usePresence } from "@/hooks/usePresence";
import { usePrefetchImage } from "@/hooks/usePrefetchImage";
import { InteractiveText } from "../InteractiveText";
import { TiGuyInsight } from "../TiGuyInsight";
import { EphemeralBadge } from "../ui/EphemeralBadge";
import { VerifiedBadge } from "../ui/VerifiedBadge";
import type { Post, User } from "@/types";

interface SingleImageViewProps {
  post: Post;
  user: User;
  isActive: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  priority?: boolean;
  shouldPrefetch?: boolean;
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
    shouldPrefetch = false,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { tap, impact } = useHaptics();

    // Prefetch image when approaching viewport
    usePrefetchImage(post.media_url, {
      enabled: shouldPrefetch || priority,
      priority: priority ? "high" : "auto",
    });

    // Real-time Presence & Engagement
    const { viewerCount, engagement } = usePresence(post.id);
    const [isLiked, setIsLiked] = useState(false);
    const [showFireAnimation, setShowFireAnimation] = useState(false);

    // AI Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

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
      setShowFireAnimation(true);
      setTimeout(() => setShowFireAnimation(false), 800);
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

    const handleGenerate = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isGenerating) return;

      setIsGenerating(true);
      try {
        const result = await generateVideo(post.caption || "Animate this aesthetic scene naturally", post.media_url);
        if (result?.videoUrl) {
          setGeneratedVideoUrl(result.videoUrl);
        }
      } catch (err) {
        console.error("Failed to generate video", err);
      } finally {
        setIsGenerating(false);
      }
    };

    const imageSrc = post.media_url || (post as any).original_url || "";

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex-shrink-0 snap-center snap-always relative bg-black select-none overflow-hidden"
        onDoubleClick={handleDoubleTap}
      >
        {/* Generated Video Overlay */}
        {generatedVideoUrl && (
          <div className="absolute inset-0 z-30 bg-black flex items-center justify-center animate-in fade-in duration-500">
            <video
              src={generatedVideoUrl}
              autoPlay
              loop
              playsInline
              controls
              className="w-full h-full object-contain"
            />
            <button
              onClick={(e) => { e.stopPropagation(); setGeneratedVideoUrl(null); }}
              className="absolute top-20 left-4 text-white bg-black/40 backdrop-blur-md rounded-full p-2 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* GPU-Accelerated Blurred Background Layer */}
        <div
          className="absolute inset-0 scale-110"
          style={{
            // GPU acceleration signals
            willChange: "transform",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <Image
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: "blur(30px) brightness(0.6)",
              // Ensure blur is GPU-composited
              willChange: "filter",
            }}
            loading="eager"
            decoding="async"
            aria-hidden="true"
          />
        </div>

        {/* Sharp Foreground Image */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            // GPU layer for smooth scrolling
            willChange: "transform",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <Image
            src={imageSrc}
            alt={post.caption || "Post image"}
            className="max-w-full max-h-full object-contain shadow-2xl"
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        </div>

        {/* Double Tap Fire Animation */}
        {showFireAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-heart-pump">
            <div className="text-[120px] drop-shadow-[0_0_30px_rgba(255,100,0,0.9)] animate-pulse">
              🔥
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

        {/* Badges (Top Right) */}
        <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 items-end">
          <EphemeralBadge post={post} className="static bg-red-600/90" />
          {/* Vérifié par Zyeuté watermark */}
          <VerifiedBadge variant="default" />
        </div>

        {/* User Info Overlay (Top Left) */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
          <Link
            to={`/profile/${user.username}`}
            onClick={tap}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full border border-gold-500/50 blur-[2px]" />
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

          {/* Live Viewer Count */}
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

            {/* AI Generator Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex flex-col items-center gap-1 transition-all press-scale ${isGenerating ? 'animate-pulse opacity-80' : 'text-white hover:text-purple-400'}`}
            >
              <div className={`text-3xl filter drop-shadow-lg ${isGenerating ? 'animate-spin' : ''}`}>✨</div>
              <span className="font-bold text-xs font-mono text-white drop-shadow-lg uppercase">
                {isGenerating ? '...' : 'AI'}
              </span>
            </button>

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
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.post.fire_count === nextProps.post.fire_count &&
      prevProps.post.comment_count === nextProps.post.comment_count
    );
  },
);
