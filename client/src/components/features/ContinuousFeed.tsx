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
import { List, ListImperativeAPI } from "react-window";

// Support for react-window 2.x which renamed FixedSizeList to List
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

interface FeedRowProps extends RowData {
  index: number;
  style: React.CSSProperties;
  ariaAttributes?: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}

import AutoSizer from "react-virtualized-auto-sizer";
import { SingleVideoView } from "./SingleVideoView";
import {
  getExplorePosts,
  togglePostFire,
  getCurrentUser,
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
    posts,
    currentIndex,
    handleFireToggle,
    handleComment,
    handleShare,
    isFastScrolling,
    isMediumScrolling,
    isSlowScrolling,
  }: FeedRowProps): ReactElement => {
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
        <SingleVideoView
          post={post}
          user={post.user}
          isActive={shouldPlay} // Controlled by Activation Logic now (was isActive from props)
          onFireToggle={handleFireToggle}
          onComment={handleComment}
          onShare={handleShare}
          priority={isPriority} // Keep priority for UI cues
          preload={
            preloadTier >= 2 ? "auto" : preloadTier === 1 ? "metadata" : "none"
          }
          videoSource={source} // Pass the full source object (MSE or Blob or URL)
          isCached={isCached}
          debug={debug}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if:
    // 1. Post changed
    // 2. Active index changed (affects priority)
    // 3. Scroll velocity category changed (affects tiering)
    // 4. Style changed

    // Note: We might NOT want to re-render on every tiny scroll velocity change,
    // but we DO want to re-render if it crosses the Fast/Medium threshold.

    return (
      prevProps.posts[prevProps.index] === nextProps.posts[nextProps.index] &&
      prevProps.currentIndex === nextProps.currentIndex &&
      prevProps.isFastScrolling === nextProps.isFastScrolling &&
      prevProps.isMediumScrolling === nextProps.isMediumScrolling &&
      prevProps.isSlowScrolling === nextProps.isSlowScrolling &&
      prevProps.style === nextProps.style
    );
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

  // Fetch video feed (Latest Public Videos)
  const fetchVideoFeed = useCallback(async () => {
    // If we already have posts (restored state), don't fetch initial
    if (savedState?.posts?.length) return;

    setIsLoading(true);
    try {
      // Fetch first page with Hive filtering
      const data = await getExplorePosts(0, 10, AppConfig.identity.hiveId);

      if (data) {
        const validPosts = data.filter((p) => {
          // Filter out invalid users
          if (!p.user) return false;
          // Filter out burned or expired posts (Client-side safety net)
          if (p.burned_at) return false;
          if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
          return true;
        }) as Array<Post & { user: User }>;
        setPosts(validPosts);
        setHasMore(data.length === 10);
        setPage(0);
      }
    } catch (error) {
      feedLogger.error("Error fetching video feed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [savedState]);

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

  // Initial fetch
  useEffect(() => {
    if (!savedState) {
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
          <List<RowData>
            listRef={listRef}
            className="no-scrollbar snap-y snap-mandatory scroll-smooth"
            style={{ height, width }}
            rowCount={posts.length}
            rowHeight={height} // Full screen height per item
            rowProps={itemData}
            rowComponent={
              FeedRow as unknown as (props: FeedRowProps) => ReactElement
            }
            onRowsRendered={onRowsRendered}
            overscanCount={1} // Only render 1 item above/below viewport
            onScroll={(props: any) => handleScroll(props.scrollOffset)}
          />
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
