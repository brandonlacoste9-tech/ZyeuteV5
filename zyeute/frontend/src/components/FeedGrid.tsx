/**
 * FeedGrid - Masonry grid layout for posts
 */

import React, { memo } from "react";
import { VideoCard } from "./features/VideoCard";
import type { Post } from "../types";
import { cn } from "../lib/utils";

export interface FeedGridProps {
  posts: Post[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

const FeedGridComponent: React.FC<FeedGridProps> = ({
  posts,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  className,
}) => {
  // Intersection observer for infinite scroll
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoading]);

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="text-6xl mb-4">⚜️</div>
        <h3 className="text-xl font-bold text-white mb-2">
          Aucun post pour l&apos;instant
        </h3>
        <p className="text-white/60 mb-6">
          Sois le premier à partager du contenu!
        </p>
        <a
          href="/upload"
          className="px-6 py-3 bg-gold-gradient text-black font-semibold rounded-xl hover:scale-105 transition-transform"
        >
          Créer un post
        </a>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map(
          (post) =>
            post.user && (
              <VideoCard key={post.id} post={post} user={post.user} />
            ),
        )}

        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="leather-card rounded-2xl overflow-hidden aspect-[9/16] animate-pulse bg-leather-700/50"
            />
          ))}
      </div>

      {/* Load more trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-20" />}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-2 text-gold-400">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-white/40 text-sm">
          Tu as tout vu! 🔥
        </div>
      )}
    </div>
  );
};

// Memoize FeedGrid to prevent unnecessary re-renders
// Performance optimization: Only re-render when posts array or loading state changes
export const FeedGrid = memo(FeedGridComponent, (prevProps, nextProps) => {
  return (
    prevProps.posts.length === nextProps.posts.length &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.hasMore === nextProps.hasMore &&
    prevProps.onLoadMore === nextProps.onLoadMore &&
    prevProps.className === nextProps.className
  );
});

FeedGrid.displayName = "FeedGrid";
