/**
 * UnifiedMediaCard - Wrapper component for video AND image content
 * Intelligently switches between SingleVideoView and SingleImageView
 * based on post.type
 */

import React from "react";
import { SingleVideoView } from "./SingleVideoView";
import { SingleImageView } from "./SingleImageView";
import type { Post, User } from "@/types";
import type { VideoSource } from "@/hooks/usePrefetchVideo";

interface UnifiedMediaCardProps {
  post: Post;
  user: User;
  isActive: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  videoSource?: VideoSource;
  isCached?: boolean;
  debug?: {
    activeRequests: number;
    concurrency: number;
    tier: number;
  };
  /** For image prefetching - whether to prefetch adjacent images */
  shouldPrefetch?: boolean;
  /** Called when video playback reaches 70% (for prefetching next videos) */
  onVideoProgress?: (progress: number) => void;
}

/**
 * UnifiedMediaCard renders the appropriate component based on post type.
 *
 * - Videos → SingleVideoView (with advanced prefetching, MSE, etc.)
 * - Images → SingleImageView (with GPU-accelerated blur backdrop)
 */
export const UnifiedMediaCard = React.memo<UnifiedMediaCardProps>(
  ({
    post,
    user,
    isActive,
    onFireToggle,
    onComment,
    onShare,
    priority = false,
    preload = "metadata",
    videoSource,
    isCached,
    debug,
    shouldPrefetch = false,
    onVideoProgress,
  }) => {
    // Route to appropriate component based on post type
    if (post.type === "video") {
      return (
        <SingleVideoView
          post={post}
          user={user}
          isActive={isActive}
          onFireToggle={onFireToggle}
          onComment={onComment}
          onShare={onShare}
          priority={priority}
          preload={preload}
          videoSource={videoSource}
          isCached={isCached}
          debug={debug}
          onVideoProgress={onVideoProgress}
        />
      );
    }

    // Default to image view (handles 'image', 'photo', or undefined types)
    return (
      <SingleImageView
        post={post}
        user={user}
        isActive={isActive}
        onFireToggle={onFireToggle}
        onComment={onComment}
        onShare={onShare}
        priority={priority}
        shouldPrefetch={shouldPrefetch}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo
    // Avoid unnecessary re-renders
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.post.fire_count === nextProps.post.fire_count &&
      prevProps.post.comment_count === nextProps.post.comment_count &&
      prevProps.priority === nextProps.priority &&
      prevProps.shouldPrefetch === nextProps.shouldPrefetch &&
      // Video-specific checks
      (prevProps.post.type === "video"
        ? prevProps.videoSource === nextProps.videoSource &&
          prevProps.isCached === nextProps.isCached
        : true)
    );
  },
);

export default UnifiedMediaCard;
