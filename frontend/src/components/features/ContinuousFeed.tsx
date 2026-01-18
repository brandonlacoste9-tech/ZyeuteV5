/**
 * ContinuousFeed - Full-screen vertical video feed
 * Adapts the Player experience for the main feed
 * NOW WITH VIRTUALIZATION by REACT-WINDOW
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  ReactElement,
} from "react";
import { List, ListImperativeAPI, RowComponentProps } from "react-window";

// react-window 2.x types - RowData is passed via rowProps
interface RowData {
  posts: Array<Post & { user: User }>;
  currentIndex: number;
  handleFireToggle: (postId: string, currentFire: number) => Promise<void>;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => Promise<void>;
  isFastScrolling: boolean;
  isMediumScrolling: boolean;
  isSlowScrolling: boolean;
}

type FeedRowProps = RowComponentProps<RowData>;

import AutoSizer from "react-virtualized-auto-sizer";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import {
  getExplorePosts,
  togglePostFire,
  getCurrentUser,
  getPexelsCurated,
  type PexelsPhoto,
  type PexelsVideo,
} from "@/services/api";
import { useHaptics } from "@/hooks/useHaptics";
import type { Post, User } from "@/types";
import { logger } from "../../lib/logger";
import { cn } from "../../lib/utils";

const feedLogger = logger.withContext("ContinuousFeed");
import { AppConfig } from "@/config/factory";

import { useNavigationState } from "../../contexts/NavigationStateContext";
// Added in FE-06 for offline support
import { useNetworkQueue } from "../../contexts/NetworkQueueContext";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { useVideoActivation } from "@/hooks/useVideoActivation";
import { usePrefetchVideo } from "@/hooks/usePrefetchVideo";

// ... imports ...

interface ContinuousFeedProps {
  className?: string;
  onVideoChange?: (index: number, post: Post) => void;
  stateKey?: string;
}

const FeedRow = memo(
  ({
    index,
    style,
    ariaAttributes,
    posts,
    currentIndex,
    handleFireToggle,
    handleComment,
    handleShare,
    isFastScrolling,
    isMediumScrolling,
    isSlowScrolling,
  }: FeedRowProps): ReactElement | null => {
    const post = posts[index];
    const isPriority = index === currentIndex;
    const isPredictive = Math.abs(index - currentIndex) === 1;

    // Determine Video Source
    // Only video type posts need prefetching logic
    const videoUrl =
      post?.type === "video"
        ? post.enhanced_url || post.media_url || post.original_url || ""
        : "";

    // Smart Activation
    const { ref, shouldPlay, preloadTier } = useVideoActivation(
      isFastScrolling,
      isMediumScrolling,
      isSlowScrolling,
      isPriority,
      isPredictive,
    );

    // Smart Prefetching (Tier 2 only fetches full blob)
    // For Tier 0/1 we just pass the original URL and let SingleVideoView handle preload attr
    // But usePrefetchVideo handles cache lookup too
    const { source, isCached, debug } = usePrefetchVideo(videoUrl, preloadTier);

    if (!post) return <div style={style} />;

    return (
      <div
        style={style}
        ref={ref}
        data-video-index={index}
        className="w-full h-full"
      >
        <UnifiedMediaCard
          post={post}
          user={post.user}
          isActive={shouldPlay}
          onFireToggle={handleFireToggle}
          onComment={handleComment}
          onShare={handleShare}
          priority={isPriority}
          preload={
            preloadTier >= 2 ? "auto" : preloadTier === 1 ? "metadata" : "none"
          }
          videoSource={source}
          isCached={isCached}
          debug={debug}
          shouldPrefetch={isPredictive} // Prefetch adjacent images
        />
      </div>
    );
  },
  (prevProps: FeedRowProps, nextProps: FeedRowProps) => {
    // Only re-render if:
    // 1. Data changed (deep check specific fields)
    // 2. Active index changed (affects priority)
    // 3. Style changed

    if (prevProps.index !== nextProps.index) return false;
    if (prevProps.style !== nextProps.style) return false;

    // Safe handling for potentially undefined array access
    const prevPost = prevProps.posts[prevProps.index];
    const nextPost = nextProps.posts[nextProps.index];

    // Simple reference check first
    if (prevPost === nextPost) {
      // Check global transient flags
      return (
        prevProps.currentIndex === nextProps.currentIndex &&
        prevProps.isFastScrolling === nextProps.isFastScrolling &&
        prevProps.isMediumScrolling === nextProps.isMediumScrolling &&
        prevProps.isSlowScrolling === nextProps.isSlowScrolling
      );
    }

    // If posts differ by reference, we must re-render
    return false;
  },
);

// ...
export const ContinuousFeed: React.FC<ContinuousFeedProps> = ({
  className,
  onVideoChange,
  stateKey = "feed",
}) => {
  // Use any to handle potential library variations (react-window vs custom wrapper)
  const listRef = useRef<any>(null);
  const { tap } = useHaptics();
  const { getFeedState, saveFeedState } = useNavigationState();
  const { isOnline, addToQueue } = useNetworkQueue();

  // Initialize from saved state or defaults
  const savedState = getFeedState(stateKey);

  // Scroll Velocity Tracking
  const { handleScroll, isFast, isMedium, isSlow } = useScrollVelocity();

  // We use a ref for posts to ensure the cleanup function has the latest value
  // without triggering excessive re-renders/saves during normal operation
  const postsRef = useRef<Array<Post & { user: User }>>(
    savedState?.posts || [],
  );

  const [posts, setPosts] = useState<Array<Post & { user: User }>>(
    savedState?.posts || [],
  );
  const [page, setPage] = useState(savedState?.page || 0);
  const [currentIndex, setCurrentIndex] = useState(
    savedState?.currentIndex || 0,
  );

  // Only loading if we have no posts
  const [isLoading, setIsLoading] = useState(!savedState?.posts?.length);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync ref with state
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Save state on unmount
  useEffect(() => {
    return () => {
      if (postsRef.current.length > 0) {
        saveFeedState(stateKey, {
          posts: postsRef.current,
          page,
          currentIndex,
          scrollOffset: 0, // We use index for restoration
        });
      }
    };
  }, [saveFeedState, stateKey, page, currentIndex]); // Removed posts from deps, using ref

  // FIX: Hydrate state if savedState arrives late (after initial mount)
  useEffect(() => {
    // If we have no posts but savedState has posts, we likely missed the initialization
    if (posts.length === 0 && savedState?.posts?.length) {
      feedLogger.info(
        "Hydrating posts from delayed savedState",
        savedState.posts.length,
      );
      setPosts(savedState.posts);
      setPage(savedState.page || 0);
      setCurrentIndex(savedState.currentIndex || 0);
      // Ensure specific scroll restoration if needed, though the ref effect handles it
      setIsLoading(false);
    }
  }, [savedState, posts.length]);

  // Transform Pexels items to Post format
  const transformPexelsToPosts = useCallback(
    (
      photos: PexelsPhoto[],
      videos: PexelsVideo[],
    ): Array<Post & { user: User }> => {
      const transformed: Array<Post & { user: User }> = [];
      const pexelsUser: User = {
        id: "pexels",
        username: "pexels",
        display_name: "Pexels",
        avatar_url: null,
        bio: null,
        city: null,
        region: null,
        is_verified: false,
        coins: 0,
        fire_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        role: "citoyen" as const,
        custom_permissions: {},
        tiGuyCommentsEnabled: true,
        last_daily_bonus: null,
      } as User;

      // Transform photos
      photos.forEach((photo) => {
        transformed.push({
          id: `pexels-photo-${photo.id}`,
          user_id: "pexels",
          media_url: photo.src.original,
          thumbnail_url: photo.src.medium,
          caption: photo.alt || `Photo by ${photo.photographer}`,
          type: "photo" as const,
          fire_count: 0,
          comment_count: 0,
          created_at: new Date().toISOString(),
          user: pexelsUser,
        } as Post & { user: User });
      });

      // Transform videos
      videos.forEach((video) => {
        // Select best quality video file (prefer HD, then highest resolution)
        let videoUrl = video.image; // Fallback to thumbnail
        if (video.video_files && video.video_files.length > 0) {
          // Prefer HD quality videos
          const hdVideos = video.video_files.filter((f) => f.quality === "hd");
          if (hdVideos.length > 0) {
            // Sort by resolution (width * height) descending
            hdVideos.sort((a, b) => b.width * b.height - a.width * a.height);
            videoUrl = hdVideos[0].link;
          } else {
            // Fallback to SD quality, prefer higher resolution
            const sdVideos = video.video_files.filter(
              (f) => f.quality === "sd",
            );
            if (sdVideos.length > 0) {
              sdVideos.sort((a, b) => b.width * b.height - a.width * a.height);
              videoUrl = sdVideos[0].link;
            } else {
              // Last resort: use first available file
              videoUrl = video.video_files[0].link;
            }
          }
        }
        transformed.push({
          id: `pexels-video-${video.id}`,
          user_id: "pexels",
          media_url: videoUrl,
          thumbnail_url: video.image,
          caption: `Video from Pexels`,
          type: "video" as const,
          fire_count: 0,
          comment_count: 0,
          created_at: new Date().toISOString(),
          user: pexelsUser,
        } as Post & { user: User });
      });

      return transformed;
    },
    [],
  );

  // Fetch video feed (Latest Public Videos)
  const fetchVideoFeed = useCallback(async () => {
    // If we already have posts (restored state), don't fetch initial
    // Log the check to verify logic
    if (savedState?.posts?.length) {
      feedLogger.debug(
        `Skipping fetch, found ${savedState.posts.length} posts in savedState`,
      );
      return;
    }

    feedLogger.info("Fetching fresh video feed...");
    setIsLoading(true);
    try {
      // Fetch first page with Hive filtering
      const data = await getExplorePosts(0, 10, AppConfig.identity.hiveId);
      feedLogger.info(`fetchVideoFeed: API returned ${data?.length} posts`);

      let validPosts: Array<Post & { user: User }> = [];
      if (data) {
        validPosts = data.filter((p) => {
          // Filter out invalid users
          if (!p.user) return false;
          // Filter out burned or expired posts (Client-side safety net)
          if (p.burned_at) return false;
          if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
          return true;
        }) as Array<Post & { user: User }>;
      }

      // Fetch Pexels curated videos and merge with feed posts
      try {
        const pexelsData = await getPexelsCurated(10, 1);
        if (pexelsData && pexelsData.videos?.length) {
          const pexelsPosts = transformPexelsToPosts(
            [], // Curated endpoint returns videos, not photos
            pexelsData.videos || [],
          );
          // Merge Pexels posts at the beginning of the feed
          feedLogger.info(
            `Fetched ${pexelsPosts.length} Pexels items, merging with ${validPosts.length} regular posts`,
          );
          setPosts([...pexelsPosts, ...validPosts]);
        } else {
          feedLogger.warn(
            "Pexels curated returned empty or null, using regular posts only",
          );
          setPosts(validPosts);
        }
      } catch (error) {
        // If Pexels fails, just use regular posts
        feedLogger.warn(
          "Pexels curated fetch failed, using regular posts only",
          error,
        );
        setPosts(validPosts);
      }

      setHasMore(data?.length === 10 || false);
      setPage(0);
    } catch (error) {
      feedLogger.error("Error fetching video feed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [savedState, transformPexelsToPosts]);

  // Load more videos
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      // Fetch next page with Hive filtering
      const data = await getExplorePosts(
        nextPage,
        10,
        AppConfig.identity.hiveId,
      );

      if (data && data.length > 0) {
        const validPosts = data.filter((p) => {
          if (!p.user) return false;
          if (p.burned_at) return false;
          if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
          return true;
        }) as Array<Post & { user: User }>;
        setPosts((prev) => [...prev, ...validPosts]);
        setHasMore(data.length === 10);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      feedLogger.error("Error loading more videos:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore]);

  // Initial fetch - fetch if no saved state OR if saved state has no posts
  useEffect(() => {
    if (!savedState || !savedState.posts?.length) {
      fetchVideoFeed();
    }
  }, [fetchVideoFeed, savedState]);

  // Restore scroll position via ref
  useEffect(() => {
    if (savedState?.currentIndex && listRef.current) {
      // Robustly check for method name (react-window vs custom)
      if (typeof listRef.current.scrollToItem === "function") {
        // "start" alignment ensures the video snaps to top properly
        listRef.current.scrollToItem(savedState.currentIndex, "start");
      } else if (typeof listRef.current.scrollToRow === "function") {
        listRef.current.scrollToRow({
          index: savedState.currentIndex,
          align: "start",
        });
      }
    }
  }, [savedState]);

  // Handle rows rendered (new API name in 2.x)
  const onRowsRendered = useCallback(
    (visibleRows: { startIndex: number; stopIndex: number }) => {
      const { startIndex, stopIndex } = visibleRows;
      // We assume the top-most visible item is the "current" one in a snap-scroll context
      const newIndex = startIndex;

      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < posts.length
      ) {
        setCurrentIndex(newIndex);
        if (onVideoChange && posts[newIndex]) {
          onVideoChange(newIndex, posts[newIndex]);
        }
      }

      // Pagination trigger
      if (stopIndex >= posts.length - 2 && hasMore && !loadingMore) {
        loadMoreVideos();
      }
    },
    [currentIndex, posts, hasMore, loadingMore, loadMoreVideos, onVideoChange],
  );

  // Handle fire (like) toggle
  const handleFireToggle = useCallback(
    async (postId: string, _currentFire: number) => {
      feedLogger.debug("Fire toggle for post:", postId);

      if (!isOnline) {
        // Queue action if offline
        // We pass a placeholder userId since the actual API call will use the session
        addToQueue("FIRE_POST", { postId, userId: "session" });
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) return;
        await togglePostFire(postId, user.id);
      } catch (err) {
        console.error(err);
      }
    },
    [isOnline, addToQueue],
  );

  const handleComment = useCallback(
    (postId: string) => {
      // Save state before navigating
      saveFeedState(stateKey, {
        posts: postsRef.current,
        page,
        currentIndex,
        scrollOffset: 0,
      });
      window.location.href = `/p/${postId}`;
    },
    [saveFeedState, stateKey, page, currentIndex],
  );

  const handleShare = useCallback(async (postId: string) => {
    const url = `${window.location.origin}/p/${postId}`;
    if (navigator.share) {
      await navigator.share({ title: "Zyeuté", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, []);

  if (isLoading && posts.length === 0) {
    return (
      <div className={cn("w-full h-full bg-black", className)}>
        <FeedPostSkeleton />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-8 text-center",
          className,
        )}
      >
        <div className="text-4xl mb-4">📱</div>
        <p className="text-stone-400 mb-4">
          Aucun contenu disponible pour le moment.
        </p>
      </div>
    );
  }

  // Data object passed to rows
  const itemData: RowData = {
    posts,
    currentIndex,
    handleFireToggle,
    handleComment,
    handleShare,
    isFastScrolling: isFast,
    isMediumScrolling: isMedium,
    isSlowScrolling: isSlow,
  };

  return (
    <div className={cn("w-full h-full bg-black", className)}>
      <AutoSizer>
        {({ height, width }) => (
          <>
            {/* Debug Overlay */}
            {/* <div className="absolute top-0 left-0 z-50 bg-black/50 text-red-500 text-xs p-2 pointer-events-none">
              DEBUG: {width}x{height} | {posts.length} posts
            </div> */}

            <List<RowData>
              listRef={listRef}
              className="no-scrollbar snap-y snap-mandatory scroll-smooth"
              style={{ height, width }}
              rowCount={posts.length}
              rowHeight={height} // Full screen height per item
              rowComponent={FeedRow as unknown as (props: RowComponentProps<RowData>) => React.ReactElement | null}
              rowProps={itemData}
              overscanCount={1} // Only render 1 item above/below viewport
              onRowsRendered={(visible) => onRowsRendered(visible)}
            />
          </>
        )}
      </AutoSizer>

      {loadingMore && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
          <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
