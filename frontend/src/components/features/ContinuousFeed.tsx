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
  useMemo,
  memo,
  ReactElement,
} from "react";
import { List, ListImperativeAPI } from "react-window";

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
  isSystemOverloaded: boolean;
}

// Relax type check for react-window compatibility
type FeedRowProps = any;

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
  ({ index, style, data }: FeedRowProps): ReactElement | null => {
    const {
      posts,
      currentIndex,
      handleFireToggle,
      handleComment,
      handleShare,
      isFastScrolling,
      isMediumScrolling,
      isSlowScrolling,
      isSystemOverloaded,
    } = data;

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

    // Circuit Breaker: If system is overloaded (high latency), kill prefetching
    const effectivePreloadTier = isSystemOverloaded ? 0 : preloadTier;

    // Smart Prefetching (Tier 2 only fetches full blob)
    // For Tier 0/1 we just pass the original URL and let SingleVideoView handle preload attr
    // But usePrefetchVideo handles cache lookup too
    const { source, isCached, debug } = usePrefetchVideo(
      videoUrl,
      effectivePreloadTier,
    );

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
            effectivePreloadTier >= 2
              ? "auto"
              : effectivePreloadTier === 1
                ? "metadata"
                : "none"
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

    // Compare data objects
    const prevData = prevProps.data;
    const nextData = nextProps.data;

    // 1. If the post data itself changed, we must re-render
    if (prevData.posts !== nextData.posts) return false;

    // 2. If global scroll speed changed, we re-render to adjust quality
    if (
      prevData.isFastScrolling !== nextData.isFastScrolling ||
      prevData.isMediumScrolling !== nextData.isMediumScrolling ||
      prevData.isSlowScrolling !== nextData.isSlowScrolling ||
      prevData.isSystemOverloaded !== nextData.isSystemOverloaded
    )
      return false;

    // 3. ZERO-GRAVITY CALCULATION:
    // Only re-render if this specific row's relationship to the "current" index changed.
    const prevIsPriority = prevProps.index === prevData.currentIndex;
    const nextIsPriority = nextProps.index === nextData.currentIndex;
    if (prevIsPriority !== nextIsPriority) return false;

    const prevIsPredictive =
      Math.abs(prevProps.index - prevData.currentIndex) === 1;
    const nextIsPredictive =
      Math.abs(nextProps.index - nextData.currentIndex) === 1;
    if (prevIsPredictive !== nextIsPredictive) return false;

    return true; // Everything else is identical; skip render.
  },
);

// ...
import { ZeroGravityHUD } from "./ZeroGravityHUD";

export const ContinuousFeed: React.FC<ContinuousFeedProps> = ({
  className,
  onVideoChange,
  stateKey = "feed",
}) => {
  // ... existing hooks ...

  const listRef = useRef<any>(null);
  const { tap } = useHaptics();
  const { getFeedState, saveFeedState } = useNavigationState();
  const { isOnline, addToQueue } = useNetworkQueue();

  const hasInitializedRef = useRef(false); // Prevent double-fetch in StrictMode
  // Initialize from saved state or defaults
  const savedState = getFeedState(stateKey);

  // Scroll Velocity Tracking
  const { handleScroll, isFast, isMedium, isSlow } = useScrollVelocity();
  const [isSystemOverloaded, setIsSystemOverloaded] = useState(false);

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

    let validPosts: Array<Post & { user: User }> = [];
    let apiSuccess = false;

    try {
      // Fetch first page with Hive filtering
      const data = await getExplorePosts(0, 10, AppConfig.identity.hiveId);
      feedLogger.info(`fetchVideoFeed: API returned ${data?.length} posts`);

      if (data) {
        validPosts = data.filter((p) => {
          // Filter out invalid users
          if (!p.user) return false;
          // Filter out burned or expired posts (Client-side safety net)
          if (p.burned_at) return false;
          if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
          return true;
        }) as Array<Post & { user: User }>;
        apiSuccess = true;
      }
    } catch (error) {
      feedLogger.error(
        "Error fetching API posts, will use Pexels fallback:",
        error,
      );
      // Don't rethrow - we'll try Pexels fallback below
    }

    // Always try to fetch Pexels content (as fallback or to supplement)
    try {
      const pexelsData = await getPexelsCurated(10, 1);
      if (pexelsData && pexelsData.videos?.length) {
        const pexelsPosts = transformPexelsToPosts(
          [], // Curated endpoint returns videos, not photos
          pexelsData.videos || [],
        );

        if (apiSuccess && validPosts.length > 0) {
          // Merge Pexels posts at the beginning of the feed
          feedLogger.info(
            `Fetched ${pexelsPosts.length} Pexels items, merging with ${validPosts.length} regular posts`,
          );
          setPosts([...pexelsPosts, ...validPosts]);
        } else {
          // API failed or returned nothing - use ONLY Pexels as fallback
          feedLogger.warn(
            `Using ${pexelsPosts.length} Pexels items as FALLBACK (API returned no posts)`,
          );
          setPosts(pexelsPosts);
        }
      } else if (validPosts.length > 0) {
        // Pexels returned nothing, but we have API posts
        feedLogger.warn("Pexels curated returned empty, using API posts only");
        setPosts(validPosts);
      } else {
        // Both failed - this is a real problem
        feedLogger.error("CRITICAL: Both API and Pexels returned no posts!");
        setPosts([]);
      }
    } catch (pexelsError) {
      feedLogger.error("Pexels fallback also failed:", pexelsError);
      // Last resort: use whatever API posts we got (even if empty)
      setPosts(validPosts);
    }

    setHasMore(validPosts.length === 10 || false);
    setPage(0);
    setIsLoading(false);
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
    let callbackId: any = null;

    if (!savedState || !savedState.posts?.length || posts.length === 0) {
      // Prevent double-fetch in React StrictMode
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      // Use requestIdleCallback to avoid blocking main thread (Perplexity fix)
      if ("requestIdleCallback" in window) {
        callbackId = requestIdleCallback(() => fetchVideoFeed());
      } else {
        callbackId = setTimeout(() => fetchVideoFeed(), 1);
      }
    }

    return () => {
      // Cleanup: cancel callback if component unmounts
      if (callbackId !== null) {
        if ("cancelIdleCallback" in window) {
          cancelIdleCallback(callbackId);
        } else {
          clearTimeout(callbackId);
        }
      }
    };
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

  // Smart Prefetching: Load heavy chunks (Mux, Camera) when main thread is idle
  // This ensures they are ready in the browser cache when the user needs them
  useEffect(() => {
    const prefetchHeavyChunks = () => {
      feedLogger.debug(
        "Prefetching heavy chunks (Mux, Camera) in background...",
      );
      // Trigger dynamic imports to populate browser cache without executing render logic
      import("@/components/features/CameraView").catch(() => {});
      import("./MuxVideoPlayer").catch(() => {});
    };

    let idleId: any = null;
    let timeoutId: any = null;

    if ("requestIdleCallback" in window) {
      idleId = requestIdleCallback(prefetchHeavyChunks, { timeout: 4000 });
    } else {
      timeoutId = setTimeout(prefetchHeavyChunks, 3000);
    }

    return () => {
      if (idleId && "cancelIdleCallback" in window) cancelIdleCallback(idleId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const prevIndexRef = useRef(currentIndex);
  const lastSwitchTimeRef = useRef(Date.now());

  // Structured Logging for Critical State Changes
  useEffect(() => {
    const isSwitch = currentIndex !== prevIndexRef.current;

    // Circuit Breaker & Trace Logging
    if (isSwitch && posts[currentIndex] && posts[prevIndexRef.current]) {
      const latency = Date.now() - lastSwitchTimeRef.current;

      // Circuit Breaker: Drop prefetching if frame rate is tanking during fast scroll
      if (isFast && latency > 200) {
        if (!isSystemOverloaded) setIsSystemOverloaded(true);
      } else if (latency < 100) {
        if (isSystemOverloaded) setIsSystemOverloaded(false);
      }

      if (
        process.env.NODE_ENV === "development" ||
        process.env.LOG_LEVEL === "trace"
      ) {
        const currentPost = posts[currentIndex];
        const prevPost = posts[prevIndexRef.current];
        feedLogger.info(
          `Trace: Media Transition (${prevPost.type} -> ${currentPost.type})`,
          {
            fromId: prevPost.id,
            toId: currentPost.id,
            latencyMs: latency,
            direction: currentIndex > prevIndexRef.current ? "next" : "prev",
          },
        );
      }
    }

    if (
      process.env.NODE_ENV === "development" ||
      process.env.LOG_LEVEL === "trace"
    ) {
      feedLogger.info("Feed State Update", {
        currentIndex,
        page,
        postsCount: posts.length,
        velocity: { isFast, isMedium, isSlow },
      });
    }

    if (isSwitch) {
      prevIndexRef.current = currentIndex;
      lastSwitchTimeRef.current = Date.now();
    }
  }, [currentIndex, page, posts, isFast, isMedium, isSlow, isSystemOverloaded]);

  // Handle rows rendered (new API name in 2.x)
  const onRowsRendered = useCallback(
    ({
      visibleStartIndex,
      visibleStopIndex,
    }: {
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => {
      const startIndex = visibleStartIndex;
      const stopIndex = visibleStopIndex;

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

      if (postId.startsWith("pexels-")) return;

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

  // Data object passed to rows
  const itemData: RowData = useMemo(
    () => ({
      posts,
      currentIndex,
      handleFireToggle,
      handleComment,
      handleShare,
      isFastScrolling: isFast,
      isMediumScrolling: isMedium,
      isSlowScrolling: isSlow,
      isSystemOverloaded,
    }),
    [
      posts,
      currentIndex,
      handleFireToggle,
      handleComment,
      handleShare,
      isFast,
      isMedium,
      isSlow,
      isSystemOverloaded,
    ],
  );

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

  return (
    <div className={cn("w-full h-full leather-dark feed-root", className)}>
      <ZeroGravityHUD />
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
              rowHeight={height}
              itemData={itemData}
              overscanCount={isFast ? 3 : 1}
              onItemsRendered={onRowsRendered}
              children={FeedRow}
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
