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
import { List } from "react-window";

// react-window 2.x types - RowData is passed via rowProps
interface RowData {
  posts: Array<Post & { user: User }>;
  currentIndex: number;
  handleFireToggle: (postId: string, currentFire: number) => Promise<void>;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => Promise<void>;
  handleOpenActions: (postId: string) => void;
  isFastScrolling: boolean;
  isMediumScrolling: boolean;
  isSlowScrolling: boolean;
  isSystemOverloaded: boolean;
  /** When false, active video is paused (tab hidden) */
  isPageVisible: boolean;
  /** Real-time engagement getter */
  getEngagement: (postId: string) => {
    fireCount?: number;
    commentCount?: number;
    shareCount?: number;
  };
  /** Called when active video hits 70% - prefetch next 2 videos */
  onVideoProgress?: (progress: number) => void;
}

// Relax type check for react-window compatibility
type FeedRowProps = any;

import AutoSizer from "react-virtualized-auto-sizer";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { FeedPostActionsSheet } from "@/components/feed/FeedPostActionsSheet";
import {
  getExplorePosts,
  getFeedPosts,
  togglePostFire,
  getCurrentUser,
  postHasPlayableMedia,
  postLooksLikeTestInject,
} from "@/services/api";
import { triggerBadgeCheck } from "@/services/gamificationService";
import { pourToiRank, fetchWatchHistory } from "@/lib/pourToiRanker";
import { recordWatch } from "@/lib/watchTracking";
import { useAuth } from "@/hooks/useAuth";

function allowDemoVideos(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  );
}
import { useHaptics } from "@/hooks/useHaptics";
import type { Post, User } from "@/types";
import { logger } from "../../lib/logger";
import { cn } from "../../lib/utils";

const feedLogger = logger.withContext("ContinuousFeed");
const FEED_PAGE_SIZE = 15;

function getHiveId(): string {
  try {
    return localStorage.getItem("zyeute_hive_id") || "quebec";
  } catch {
    return "quebec";
  }
}

type FeedPost = Post & { user: User; _feedSlot?: string };

function filterPlayablePosts(items: Post[]): FeedPost[] {
  return items.filter((p) => {
    if (!p || !(p as Post & { user?: User }).user) return false;
    if (p.burned_at) return false;
    if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
    if (postLooksLikeTestInject(p)) return false;
    if (!postHasPlayableMedia(p)) return false;
    return true;
  }) as FeedPost[];
}

const FEED_SPACING = {
  minContentGap: 16,
  minAuthorGap: 6,
  recycleMinGap: 40,
};

function getFeedShuffleSeed(): number {
  try {
    const key = "zyeute_feed_shuffle_seed";
    let stored = sessionStorage.getItem(key);
    if (!stored) {
      stored = String((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
      sessionStorage.setItem(key, stored);
    }
    return parseInt(stored, 10) || Date.now() >>> 0;
  } catch {
    return Date.now() >>> 0;
  }
}

function prepareFeedPage(posts: FeedPost[], pageOffset = 0): FeedPost[] {
  return prepareShuffledFeed(posts, {
    ...FEED_SPACING,
    shuffleSeed: (getFeedShuffleSeed() + pageOffset) >>> 0,
  }) as FeedPost[];
}

/** Append new page; dedupe by clip fingerprint and space repeats apart. */
function mergeFeedPages(prev: FeedPost[], incoming: FeedPost[]): FeedPost[] {
  return mergeFeedWithDedup(prev, incoming, {
    ...FEED_SPACING,
    shuffleSeed: (getFeedShuffleSeed() + prev.length) >>> 0,
  }) as FeedPost[];
}

import { useNavigationState } from "../../contexts/NavigationStateContext";
// Added in FE-06 for offline support
import { useNetworkQueue } from "../../contexts/NetworkQueueContext";
import {
  FeedStateView,
  FeedFallbackBanner,
} from "@/components/feed/FeedStateView";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { useMotionSmooth } from "@/hooks/useMotionSmooth";
import { useVideoActivation } from "@/hooks/useVideoActivation";
import { usePrefetchVideo } from "@/hooks/usePrefetchVideo";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { videoCache } from "@/lib/videoWarmCache";
import { useFeedEngagement } from "@/hooks/useFeedEngagement";
import { usePreloadHint } from "@/hooks/useVideoTransition";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import {
  mergeFeedWithDedup,
  prepareShuffledFeed,
} from "@shared/utils/feedDedup";

// ... imports ...

interface ContinuousFeedProps {
  className?: string;
  onVideoChange?: (index: number, post: Post) => void;
  stateKey?: string;
  /** 'decouverte' = explore/FYP (default), 'abonnements' = following feed */
  feedType?: "decouverte" | "abonnements";
  /** Increment to force a fresh fetch (e.g. double-tap active tab). */
  refreshToken?: number;
}

const FeedRow = memo(
  ({ index, style, data }: FeedRowProps): ReactElement | null => {
    const {
      posts,
      currentIndex,
      handleFireToggle,
      handleComment,
      handleShare,
      handleOpenActions,
      isFastScrolling,
      isMediumScrolling,
      isSlowScrolling,
      isSystemOverloaded,
      isPageVisible = true,
      onVideoProgress,
    } = data;

    const post = posts[index];
    if (!post) return <div style={style} />;

    const isPriority = index === currentIndex;
    const isNext = index === currentIndex + 1;

    // Determine Video Source — skip prefetch for Mux (MuxVideoPlayer handles its own streaming)
    const hasMux = !!(
      (post as any).mux_playback_id || (post as any).muxPlaybackId
    );
    const rawVideoUrl = hasMux
      ? ""
      : (post as Post).hls_url ||
        (post as Post).enhanced_url ||
        (post as Post).media_url ||
        (post as Post).original_url ||
        "";
    // Proxy the URL now — SingleVideoView also proxies via getProxiedMediaUrl,
    // so we pass the SAME proxied URL here to avoid src/chunk mismatch in MSE pipeline.
    const videoUrl = rawVideoUrl
      ? getProxiedMediaUrl(rawVideoUrl) || rawVideoUrl
      : "";

    // Smart Activation
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { ref, shouldPlay, preloadTier } = useVideoActivation(
      isFastScrolling,
      isMediumScrolling,
      isSlowScrolling,
      isPriority,
      isNext,
    );

    // Circuit Breaker: If system is overloaded (high latency), kill prefetching
    const effectivePreloadTier = isSystemOverloaded ? 0 : preloadTier;

    // Smart Prefetching (Tier 2 only fetches full blob)
    // For Tier 0/1 we just pass the original URL and let SingleVideoView handle preload attr
    // But usePrefetchVideo handles cache lookup too
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { source, isCached, debug } = usePrefetchVideo(
      videoUrl,
      effectivePreloadTier,
    );

    return (
      <div
        style={style}
        ref={ref}
        data-video-index={index}
        className="w-full h-full video-stabilized"
      >
        <UnifiedMediaCard
          key={(post as FeedPost)._feedSlot ?? `${post.id}-${index}`}
          post={post}
          user={post.user}
          isActive={shouldPlay && isPageVisible}
          onFireToggle={handleFireToggle}
          onComment={handleComment}
          onShare={handleShare}
          onOpenActions={handleOpenActions}
          priority={isPriority}
          preload={
            // Adjacent video (Next): aggressively buffer for instant swipe
            isNext && !isFastScrolling
              ? "auto"
              : effectivePreloadTier >= 2
                ? "auto"
                : effectivePreloadTier === 1
                  ? "metadata"
                  : "none"
          }
          videoSource={source}
          isCached={isCached}
          debug={debug}
          shouldPrefetch={isNext}
          onVideoProgress={isPriority ? onVideoProgress : undefined}
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

    const prevIsNext = prevProps.index === prevData.currentIndex + 1;
    const nextIsNext = nextProps.index === nextData.currentIndex + 1;
    if (prevIsNext !== nextIsNext) return false;

    if (prevData.isPageVisible !== nextData.isPageVisible) return false;

    return true; // Everything else is identical; skip render.
  },
);

// ...
import { ZeroGravityHUD } from "./ZeroGravityHUD";

export const ContinuousFeed: React.FC<ContinuousFeedProps> = ({
  className,
  onVideoChange,
  stateKey = "feed",
  feedType = "decouverte",
  refreshToken = 0,
}) => {
  // ... existing hooks ...

  const listRef = useRef<any>(null);
  const { tap } = useHaptics();
  const { getFeedState, saveFeedState } = useNavigationState();
  const { isOnline, addToQueue } = useNetworkQueue();
  const { user } = useAuth();

  const hasInitializedRef = useRef(false); // Prevent double-fetch in StrictMode
  const isFetchingRef = useRef(false); // Prevent concurrent fetches
  const lastFetchTimeRef = useRef(0); // Rate limit fetches
  // Initialize from saved state or defaults - memoize to prevent loop
  const savedState = useMemo(
    () => getFeedState(stateKey),
    [stateKey, getFeedState],
  );

  // Scroll Velocity Tracking — EMA-smoothed for clean motion decisions
  const {
    handleScroll,
    smoothVelocity,
    isFast,
    isMedium,
    isSlow,
    isDecelerating,
  } = useScrollVelocity();
  const [isSystemOverloaded, setIsSystemOverloaded] = useState(false);
  const isPageVisible = usePageVisibility();

  // Motion Smooth System — provides GPU-accelerated blur/stabilization during scroll
  const { motionClass, motionStyle } = useMotionSmooth(
    smoothVelocity,
    isDecelerating,
    { maxBlurPx: 1.5, enableMotionBlur: true, enableStabilization: true },
  );

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
  const [fetchError, setFetchError] = useState(false);
  const [isFollowingFallback, setIsFollowingFallback] = useState(false);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsCtx, setActionsCtx] = useState<{
    postId: string;
    authorUserId?: string;
  } | null>(null);

  // Real-time engagement: subscribe to live fire/comment count updates
  // Uses a single Supabase channel for all visible posts (efficient)
  const visiblePostIds = useMemo(() => {
    // Batch: current ±3 posts
    const ids: string[] = [];
    for (
      let i = Math.max(0, currentIndex - 3);
      i < Math.min(posts.length, currentIndex + 4);
      i++
    ) {
      if (posts[i]?.id) ids.push(posts[i].id);
    }
    return ids;
  }, [currentIndex, posts]);
  const { getEngagement } = useFeedEngagement(visiblePostIds);

  // Browser-level preload hint for next video URL (n+1)
  const nextVideoUrl = useMemo(() => {
    const nextPost = posts[currentIndex + 1];
    if (!nextPost || nextPost.type !== "video") return null;
    return (
      nextPost.enhanced_url ||
      nextPost.media_url ||
      nextPost.original_url ||
      null
    );
  }, [currentIndex, posts]);
  usePreloadHint(nextVideoUrl);

  // Sync ref with state
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Record the active video as watched after a 2s dwell so the feed can surface
  // unseen videos first on the next visit. Fire-and-forget; fast scroll-through
  // (< 2s) is not counted as a watch. Guests are tracked in localStorage,
  // authenticated users additionally persist to video_views.
  useEffect(() => {
    const active = posts[currentIndex];
    if (!active?.id || String(active.id).startsWith("demo-")) return;
    const postId = String(active.id);
    const isAuthed = !!user;
    const timer = setTimeout(() => {
      recordWatch(postId, { isAuthenticated: isAuthed });
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentIndex, posts, user]);

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

  // Hardcoded demo videos - guaranteed to work without API keys
  const DEMO_VIDEOS: Array<Post & { user: User }> = [
    {
      id: "demo-1",
      user_id: "demo-user-1",
      type: "video" as const,
      caption: "Welcome to Zyeuté! 🍁 Bienvenue au Québec!",
      media_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      mediaUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail_url: "/demo/branding.png",
      thumbnailUrl: "/demo/branding.png",
      user: {
        id: "demo-user-1",
        username: "zyeute",
        display_name: "Zyeuté Officiel",
        avatar_url: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        coins: 0,
        piasse_balance: 0,
        total_karma: 0,
        fire_score: 0,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        role: "citoyen",
      } as User,
      fire_count: 1337,
      comment_count: 42,
      created_at: new Date().toISOString(),
      visibility: "public",
      hive_id: "quebec",
      is_moderated: false,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
    },
    {
      id: "demo-2",
      user_id: "demo-user-2",
      type: "video" as const,
      caption: "Montreal vibes 🏙️⚜️ #Montreal #Quebec",
      media_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      mediaUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnail_url: "/demo/montreal.png",
      thumbnailUrl: "/demo/montreal.png",
      user: {
        id: "demo-user-2",
        username: "montreal",
        display_name: "Montréal",
        avatar_url: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        coins: 0,
        piasse_balance: 0,
        total_karma: 0,
        fire_score: 0,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        role: "citoyen",
      } as User,
      fire_count: 856,
      comment_count: 23,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      visibility: "public",
      hive_id: "quebec",
      is_moderated: false,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
    },
    {
      id: "demo-3",
      user_id: "demo-user-3",
      type: "video" as const,
      caption: "Beautiful Quebec nature 🍁🌲",
      media_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      mediaUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnail_url: "/demo/nature.png",
      thumbnailUrl: "/demo/nature.png",
      user: {
        id: "demo-user-3",
        username: "quebec_nature",
        display_name: "Nature Québec",
        avatar_url: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        coins: 0,
        piasse_balance: 0,
        total_karma: 0,
        fire_score: 0,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        role: "citoyen",
      } as User,
      fire_count: 421,
      comment_count: 15,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      visibility: "public",
      hive_id: "quebec",
      is_moderated: false,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
    },
    {
      id: "demo-4",
      user_id: "demo-user-4",
      type: "video" as const,
      caption: "Winter in Quebec ❄️❄️❄️",
      media_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      mediaUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      thumbnail_url: "/demo/winter.png",
      thumbnailUrl: "/demo/winter.png",
      user: {
        id: "demo-user-4",
        username: "quebec_winter",
        display_name: "Hiver Québécois",
        avatar_url: null,
        is_verified: false,
        created_at: new Date().toISOString(),
        coins: 0,
        piasse_balance: 0,
        total_karma: 0,
        fire_score: 0,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        role: "citoyen",
      } as User,
      fire_count: 692,
      comment_count: 31,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      visibility: "public",
      hive_id: "quebec",
      is_moderated: false,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
    },
    {
      id: "demo-5",
      user_id: "demo-user-5",
      type: "video" as const,
      caption: "Quebec City old town 🏰⚜️",
      media_url:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      mediaUrl:
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      thumbnail_url: "/demo/quebec_city.png",
      thumbnailUrl: "/demo/quebec_city.png",
      user: {
        id: "demo-user-5",
        username: "vieux_quebec",
        display_name: "Vieux Québec",
        avatar_url: null,
        is_verified: true,
        created_at: new Date().toISOString(),
        coins: 0,
        piasse_balance: 0,
        total_karma: 0,
        fire_score: 0,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        is_following: false,
        role: "citoyen",
      } as User,
      fire_count: 1024,
      comment_count: 56,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      visibility: "public",
      hive_id: "quebec",
      is_moderated: false,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
    },
  ];

  // Fetch video feed (Latest Public Videos)
  const fetchVideoFeed = useCallback(async () => {
    // GUARD: Prevent concurrent fetches
    if (isFetchingRef.current) {
      feedLogger.debug("Fetch already in progress, skipping");
      return;
    }

    // GUARD: Rate limit - wait at least 1s between fetches
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      feedLogger.debug("Rate limited, skipping fetch");
      return;
    }

    // Restore scroll position from saved state, but refetch if cache is a tiny stale slice
    const savedCount = savedState?.posts?.length ?? 0;
    if (savedCount >= FEED_PAGE_SIZE * 2) {
      feedLogger.debug(
        `Skipping fetch, using ${savedCount} posts from savedState`,
      );
      return;
    }
    if (savedCount > 0) {
      feedLogger.info(
        `Saved feed has only ${savedCount} posts — refreshing from API`,
      );
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = Date.now();
    feedLogger.info("Fetching fresh video feed...");
    setIsLoading(true);
    setFetchError(false);
    setIsFollowingFallback(false);
    setShowFallbackBanner(false);
    setLoadMoreError(false);

    let validPosts: Array<Post & { user: User }> = [];
    let apiHasMore: boolean;

    try {
      if (feedType === "abonnements") {
        // Following feed — uses /api/feed which filters to followed creators
        const followingPosts = await getFeedPosts(0, FEED_PAGE_SIZE);
        validPosts = prepareFeedPage(filterPlayablePosts(followingPosts));
        if (validPosts.length === 0) {
          // Fallback: show explore if not following anyone yet
          feedLogger.info(
            "[Abonnements] No following posts, falling back to explore",
          );
          setIsFollowingFallback(true);
          setShowFallbackBanner(true);
          const { posts: data, hasMore } = await getExplorePosts(
            0,
            FEED_PAGE_SIZE,
            undefined,
            getHiveId(),
          );
          validPosts = prepareFeedPage(filterPlayablePosts(data));
          apiHasMore = hasMore;
        } else {
          apiHasMore = followingPosts.length === FEED_PAGE_SIZE;
        }
      } else {
        const { posts: data, hasMore } = await getExplorePosts(
          0,
          FEED_PAGE_SIZE,
          undefined,
          getHiveId(),
        );
        apiHasMore = hasMore;
        feedLogger.info(
          "[ContinuousFeed] API returned:",
          data?.length || 0,
          "posts",
        );

        if (data?.length) {
          validPosts = prepareFeedPage(filterPlayablePosts(data));

          // ── Pour Toi: re-rank based on watch history ─────────────────────
          try {
            const me = await getCurrentUser();
            if (me?.id) {
              const watchHistory = await fetchWatchHistory(me.id);
              if (watchHistory.length > 0) {
                validPosts = prepareFeedPage(
                  pourToiRank(validPosts, watchHistory) as Array<
                    Post & { user: User }
                  >,
                );
                feedLogger.info(
                  `[PourToi] Re-ranked ${validPosts.length} posts from ${watchHistory.length} watch events`,
                );
              }
            }
          } catch (rankErr) {
            feedLogger.warn("[PourToi] Ranking skipped:", rankErr);
          }
        }
        setHasMore(apiHasMore);
      }

      if (validPosts.length === 0) {
        if (allowDemoVideos()) {
          feedLogger.info("Using demo videos (?demo=1)");
          setPosts(DEMO_VIDEOS);
          setHasMore(false);
          setFetchError(false);
          return;
        }
        feedLogger.info("No posts and no ?demo=1 — empty feed");
        setPosts([]);
        setHasMore(false);
        setFetchError(false);
        return;
      } else {
        setPosts(validPosts);
        setHasMore(apiHasMore);
      }

      setPage(0);
    } catch (error) {
      feedLogger.error("Error fetching API posts:", error);
      setPosts(
        allowDemoVideos() ? (DEMO_VIDEOS as Array<Post & { user: User }>) : [],
      );
      setHasMore(false);
      setFetchError(!allowDemoVideos());
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [savedState, feedType]);

  // Reset feed when tab changes (Découverte ↔ Abonnements)
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setCurrentIndex(0);
    setHasMore(true);
    setFetchError(false);
    setIsFollowingFallback(false);
    setShowFallbackBanner(false);
    setLoadMoreError(false);
    isFetchingRef.current = false;
    hasInitializedRef.current = false;
    // fetchVideoFeed will be triggered by the initial-fetch effect reacting to posts.length === 0
  }, [feedType]);

  // Pull-to-refresh equivalent: parent increments refreshToken (double-tap tab)
  const refreshTokenRef = useRef(refreshToken);
  useEffect(() => {
    if (refreshTokenRef.current === refreshToken) return;
    refreshTokenRef.current = refreshToken;
    setPosts([]);
    setPage(0);
    setCurrentIndex(0);
    setHasMore(true);
    setFetchError(false);
    setIsFollowingFallback(false);
    setShowFallbackBanner(false);
    setLoadMoreError(false);
    isFetchingRef.current = false;
    hasInitializedRef.current = false;
    setIsLoading(true);
  }, [refreshToken]);

  // Load more videos
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const nextPage = page + 1;
      let data: Post[] = [];
      let apiHasMore = false;

      if (feedType === "abonnements" && !isFollowingFallback) {
        const followingPosts = await getFeedPosts(nextPage, FEED_PAGE_SIZE);
        data = followingPosts;
        apiHasMore = followingPosts.length === FEED_PAGE_SIZE;
      } else {
        const result = await getExplorePosts(
          nextPage,
          FEED_PAGE_SIZE,
          undefined,
          getHiveId(),
        );
        data = result.posts;
        apiHasMore = result.hasMore;
      }

      if (data.length > 0) {
        const validPosts = prepareFeedPage(filterPlayablePosts(data), nextPage);
        if (validPosts.length > 0) {
          setPosts((prev) => mergeFeedPages(prev, validPosts));
        }
      }

      setHasMore(apiHasMore);
      if (apiHasMore) {
        setPage(nextPage);
      }
    } catch (error) {
      feedLogger.error("Error loading more videos:", error);
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, feedType, isFollowingFallback]);

  // [SURGICAL] Momentum Check: Show content within 2 seconds max
  useEffect(() => {
    if (!isLoading || posts.length > 0) return;

    const timer = setTimeout(() => {
      if (isLoading && posts.length === 0) {
        feedLogger.warn("⏱️ DB response slow (>2s).");
        // [SOVEREIGN] No fallback fetch
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, posts.length, fetchVideoFeed]);

  // Initial fetch - fetch if no saved state OR if saved state has no posts
  useEffect(() => {
    let callbackId: any = null;
    let cancelled = false;

    const savedCount = savedState?.posts?.length ?? 0;
    const shouldFetchFresh =
      !savedState ||
      savedCount === 0 ||
      posts.length === 0 ||
      savedCount < FEED_PAGE_SIZE * 2;

    if (shouldFetchFresh) {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      callbackId = setTimeout(() => {
        if (!cancelled) fetchVideoFeed();
      }, 50);
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
      // Reset so the second StrictMode mount can re-initialize
      hasInitializedRef.current = false;
      if (callbackId !== null) {
        clearTimeout(callbackId);
      }
    };
  }, [fetchVideoFeed, savedState, posts.length]);

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

  // Sliding-window memory: evict blob/chunk data outside active ±2
  // Keep current ±2 videos in memory, aggressively clean the rest
  const evictTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedVideosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const retainUrls: string[] = [];
    const windowSize = 2; // Keep current ±2 videos

    for (
      let i = currentIndex - windowSize;
      i <= currentIndex + windowSize;
      i++
    ) {
      if (i >= 0 && i < posts.length) {
        const p = posts[i];
        if (p?.type === "video") {
          const url =
            (p as Post).hls_url ||
            (p as Post).enhanced_url ||
            (p as Post).media_url ||
            (p as Post).original_url;
          if (url) {
            retainUrls.push(url);
            loadedVideosRef.current.add(p.id);
          }
        }
      }
    }

    if (evictTimeoutRef.current) clearTimeout(evictTimeoutRef.current);
    evictTimeoutRef.current = setTimeout(() => {
      evictTimeoutRef.current = null;
      videoCache.evictUrlsNotIn(retainUrls);

      // Log memory cleanup for debugging
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Memory] Retaining ${retainUrls.length} videos, cleaned ${posts.length - (windowSize * 2 + 1)}`,
        );
      }
    }, 500); // Increased debounce for smoother scrolling

    return () => {
      if (evictTimeoutRef.current) {
        clearTimeout(evictTimeoutRef.current);
        evictTimeoutRef.current = null;
      }
    };
  }, [currentIndex, posts]);

  // Douyin-level Preloading Strategy
  // Preload next 2 videos aggressively for instant swipe experience
  const preloadNextVideos = useCallback(() => {
    const nextIndices = [currentIndex + 1, currentIndex + 2];

    nextIndices.forEach((idx, priority) => {
      if (idx >= 0 && idx < posts.length) {
        const post = posts[idx];
        if (post?.type === "video") {
          const url = post.hls_url || post.media_url || post.original_url;
          if (url && !url.includes("mux")) {
            // Don't preload MUX - it handles its own
            // Preload with low priority (not blocking current playback)
            const link = document.createElement("link");
            link.rel = "preload";
            link.href = url;
            link.as = "fetch";
            link.fetchPriority = priority === 0 ? "high" : "low";
            document.head.appendChild(link);

            // Cleanup after load
            setTimeout(() => link.remove(), 10000);
          }
        }
      }
    });
  }, [currentIndex, posts]);

  // Trigger preload when current video is stable (not scrolling fast)
  useEffect(() => {
    if (isFast) return; // Don't preload during fast scroll

    const timer = setTimeout(() => {
      preloadNextVideos();
    }, 1000); // Wait 1s after scroll stops

    return () => clearTimeout(timer);
  }, [currentIndex, isFast, preloadNextVideos]);

  // Smart Prefetching: Load heavy chunks (Camera) when main thread is idle
  useEffect(() => {
    const prefetchHeavyChunks = () => {
      feedLogger.debug("Prefetching heavy chunks (Camera) in background...");
      import("@/components/features/CameraView").catch(() => {});
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
  const lastSwitchTimeRef = useRef(0);

  // Structured Logging for Critical State Changes
  useEffect(() => {
    const isSwitch = currentIndex !== prevIndexRef.current;

    // Circuit Breaker & Trace Logging
    if (isSwitch && posts[currentIndex] && posts[prevIndexRef.current]) {
      const latency = Date.now() - lastSwitchTimeRef.current;

      // Circuit Breaker: Drop prefetching if frame rate is tanking during fast scroll
      if (isFast && latency > 200) {
        if (!isSystemOverloaded)
          setTimeout(() => setIsSystemOverloaded(true), 0);
      } else if (latency < 100) {
        if (isSystemOverloaded)
          setTimeout(() => setIsSystemOverloaded(false), 0);
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
        // Fire-and-forget badge check
        triggerBadgeCheck("fire_given").catch(() => {});
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

  const handleOpenActions = useCallback((postId: string) => {
    const post = postsRef.current.find((p) => p.id === postId);
    setActionsCtx({
      postId,
      authorUserId: post?.user?.id,
    });
    setActionsOpen(true);
  }, []);

  const handlePostRemoved = useCallback((postId: string) => {
    const prev = postsRef.current;
    const removedIdx = prev.findIndex((p) => p.id === postId);
    const next = prev.filter((p) => p.id !== postId);
    postsRef.current = next;
    setPosts(next);
    setCurrentIndex((idx) => {
      if (removedIdx < 0) return Math.min(idx, Math.max(0, next.length - 1));
      if (idx > removedIdx) return idx - 1;
      if (idx >= next.length) return Math.max(0, next.length - 1);
      return idx;
    });
  }, []);

  // Prefetch next 2 videos when active video hits 70% playback
  const handleVideoProgress = useCallback(
    (_progress: number) => {
      const next1 = posts[currentIndex + 1];
      const next2 = posts[currentIndex + 2];
      const urls: string[] = [];
      for (const p of [next1, next2]) {
        if (p?.type === "video") {
          const url =
            (p as Post).hls_url ||
            (p as Post).enhanced_url ||
            (p as Post).media_url ||
            (p as Post).original_url;
          if (url) urls.push(url);
        }
      }
      urls.forEach((url) => {
        const proxiedUrl = getProxiedMediaUrl(url) || url;
        fetch(proxiedUrl, { method: "HEAD" }).catch(() => {});
      });
    },
    [posts, currentIndex],
  );

  // Data object passed to rows
  const itemData: RowData = useMemo(
    () => ({
      posts,
      currentIndex,
      handleFireToggle,
      handleComment,
      handleShare,
      handleOpenActions,
      isFastScrolling: isFast,
      isMediumScrolling: isMedium,
      isSlowScrolling: isSlow,
      isSystemOverloaded,
      isPageVisible,
      getEngagement,
      onVideoProgress: handleVideoProgress,
    }),
    [
      posts,
      currentIndex,
      handleFireToggle,
      handleComment,
      handleShare,
      handleOpenActions,
      isFast,
      isMedium,
      isSlow,
      isSystemOverloaded,
      isPageVisible,
      getEngagement,
      handleVideoProgress,
    ],
  );

  const handleFeedRetry = useCallback(() => {
    hasInitializedRef.current = false;
    isFetchingRef.current = false;
    void fetchVideoFeed();
  }, [fetchVideoFeed]);

  if (isLoading && posts.length === 0) {
    return <FeedStateView variant="loading" className={className} />;
  }

  if (posts.length === 0) {
    const variant = !isOnline
      ? "offline"
      : fetchError
        ? "error"
        : feedType === "abonnements"
          ? "abonnements-empty"
          : "empty";

    return (
      <FeedStateView
        variant={variant}
        className={className}
        onRetry={handleFeedRetry}
        isRetrying={isLoading}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full h-full leather-dark feed-root",
        motionClass,
        className,
      )}
      style={motionStyle}
    >
      {!isOnline && posts.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500/90 text-black text-center py-2 text-sm font-medium">
          Tu es hors ligne. Les actions seront synchronisées à la reconnexion.
        </div>
      )}
      {showFallbackBanner && isFollowingFallback && (
        <FeedFallbackBanner onDismiss={() => setShowFallbackBanner(false)} />
      )}
      <ZeroGravityHUD />
      <AutoSizer>
        {({ height, width }) => (
          <>
            {/* Debug Overlay */}
            {/* <div className="absolute top-0 left-0 z-50 bg-black/50 text-red-500 text-xs p-2 pointer-events-none">
              DEBUG: {width}x{height} | {posts.length} posts
            </div> */}

            <List
              listRef={listRef}
              className="no-scrollbar snap-smooth-decel"
              style={
                {
                  height,
                  width,
                  willChange: "scroll-position",
                  WebkitOverflowScrolling: "touch",
                } as React.CSSProperties
              }
              rowCount={posts.length}
              rowHeight={height}
              rowProps={{ data: itemData }}
              overscanCount={isFast ? 3 : 2}
              onRowsRendered={onRowsRendered}
              rowComponent={FeedRow}
            />
          </>
        )}
      </AutoSizer>

      {(loadingMore || loadMoreError) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          {loadingMore && (
            <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin pointer-events-none" />
          )}
          {loadMoreError && !loadingMore && (
            <button
              type="button"
              onClick={() => void loadMoreVideos()}
              className="px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm border border-white/15 text-white/80 text-xs font-medium hover:bg-black/90 transition-colors"
            >
              Impossible de charger plus — Réessayer
            </button>
          )}
        </div>
      )}

      <FeedPostActionsSheet
        open={actionsOpen && !!actionsCtx}
        postId={actionsCtx?.postId || ""}
        authorUserId={actionsCtx?.authorUserId}
        source="feed"
        onPostRemoved={handlePostRemoved}
        onClose={() => {
          setActionsOpen(false);
          setActionsCtx(null);
        }}
      />
    </div>
  );
};
