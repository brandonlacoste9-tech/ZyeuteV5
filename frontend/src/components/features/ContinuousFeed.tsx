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
// HARDCODED: Always use Quebec hive to prevent switching loops
const HIVE_ID = "quebec";

import { useNavigationState } from "../../contexts/NavigationStateContext";
// Added in FE-06 for offline support
import { useNetworkQueue } from "../../contexts/NetworkQueueContext";
import { FeedPostSkeleton } from "@/components/ui/Skeleton";
import { useScrollVelocity } from "@/hooks/useScrollVelocity";
import { useMotionSmooth } from "@/hooks/useMotionSmooth";
import { useVideoActivation } from "@/hooks/useVideoActivation";
import { usePrefetchVideo } from "@/hooks/usePrefetchVideo";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { videoCache } from "@/lib/videoWarmCache";
import { useFeedEngagement } from "@/hooks/useFeedEngagement";
import { usePreloadHint } from "@/hooks/useVideoTransition";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";

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
      isPageVisible = true,
      onVideoProgress,
    } = data;

    const post = posts[index];
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
        className="w-full h-full video-stabilized"
      >
        <UnifiedMediaCard
          key={post.id}
          post={post}
          user={post.user}
          isActive={shouldPlay && isPageVisible}
          onFireToggle={handleFireToggle}
          onComment={handleComment}
          onShare={handleShare}
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
}) => {
  // ... existing hooks ...

  const listRef = useRef<any>(null);
  const { tap } = useHaptics();
  const { getFeedState, saveFeedState } = useNavigationState();
  const { isOnline, addToQueue } = useNetworkQueue();

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
        avatar_url: "https://images.pexels.com/lib/api/pexels.png",
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
        avatar_url: "https://images.pexels.com/lib/api/pexels.png",
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
        avatar_url: "https://images.pexels.com/lib/api/pexels.png",
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
        avatar_url: "https://images.pexels.com/lib/api/pexels.png",
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
        avatar_url: "https://images.pexels.com/lib/api/pexels.png",
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

  // Transform Pexels videos to Post format for fallback
  const transformPexelsToPosts = useCallback((pexelsVideos: any[]) => {
    // Pick best video quality: HD first, then SD, then anything
    const getBestVideoUrl = (videoFiles: any[]): string => {
      if (!videoFiles?.length) return "";
      const hd = videoFiles.find((f) => f.quality === "hd");
      const sd = videoFiles.find((f) => f.quality === "sd");
      return hd?.link || sd?.link || videoFiles[0]?.link || "";
    };

    return pexelsVideos.map((video, index) => ({
      id: `pexels-${video.id}`,
      user_id: "pexels-user",
      type: "video" as const,
      caption:
        video.url?.split("/").pop()?.replace(/-/g, " ") || "Video from Pexels",
      media_url: getBestVideoUrl(video.video_files) || video.url,
      original_url: getBestVideoUrl(video.video_files) || video.url,
      thumbnail_url: video.image,
      user: {
        id: "pexels-user",
        username: "pexels",
        display_name: "Pexels",
        avatar_url: "https://images.pexels.com/lib/api/pexels.png",
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
      fire_count: Math.floor(Math.random() * 1000),
      comment_count: Math.floor(Math.random() * 100),
      created_at: new Date(Date.now() - index * 3600000).toISOString(),
      visibility: "public",
      hive_id: "quebec",
      is_moderated: false,
      moderation_approved: true,
      is_hidden: false,
      is_ephemeral: false,
      view_count: 0,
      max_views: 1,
    }));
  }, []);

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

    // If we already have posts (restored state), don't fetch initial
    if (savedState?.posts?.length) {
      feedLogger.debug(
        `Skipping fetch, found ${savedState.posts.length} posts in savedState`,
      );
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = Date.now();
    feedLogger.info("Fetching fresh video feed...");
    setIsLoading(true);
    setFetchError(false);

    let validPosts: Array<Post & { user: User }> = [];

    try {
      // Fetch first page with Hive filtering
      const data = await getExplorePosts(0, 10, HIVE_ID);
      console.log(
        "[ContinuousFeed] API returned:",
        data?.length || 0,
        "posts",
        data,
      );

      if (data && Array.isArray(data)) {
        validPosts = data.filter((p) => {
          // [SURGICAL FIX] Ensure post and user exist to prevent crashes
          if (!p || !p.user) return false;
          // Filter out burned or expired posts (Client-side safety net)
          if (p.burned_at) return false;
          if (p.expires_at && new Date(p.expires_at) < new Date()) return false;
          return true;
        }) as Array<Post & { user: User }>;
      }

      // If API has no posts, try to auto-seed DB first, then Pexels fallback
      if (validPosts.length === 0) {
        feedLogger.info(
          "No API posts — attempting auto-seed then Pexels fallback...",
        );
        // Try to auto-seed the DB with sample videos
        try {
          const seedRes = await fetch("/api/seed/feed", { method: "POST" });
          if (seedRes.ok) {
            const seedData = await seedRes.json();
            if (seedData.posts?.length > 0) {
              feedLogger.info("Auto-seed successful, re-fetching feed...");
              const reseeded = await getExplorePosts(0, 10, HIVE_ID);
              if (reseeded && reseeded.length > 0) {
                const valid = reseeded.filter((p: any) => p && p.user) as Array<
                  Post & { user: User }
                >;
                if (valid.length > 0) {
                  setPosts(valid);
                  setHasMore(valid.length === 10);
                  setPage(0);
                  return;
                }
              }
            }
          }
        } catch (seedErr) {
          feedLogger.warn("Auto-seed failed:", seedErr);
        }
        feedLogger.info("No API posts, fetching Pexels fallback...");
        try {
          const pexelsRes = await fetch("/api/pexels/curated?per_page=10");
          if (pexelsRes.ok) {
            const pexelsData = await pexelsRes.json();
            if (pexelsData.videos?.length > 0) {
              const pexelsPosts = transformPexelsToPosts(pexelsData.videos);
              setPosts(pexelsPosts as unknown as Array<Post & { user: User }>);
              setHasMore(false); // Pexels is one-time fetch
              setFetchError(false);
              return;
            }
          }
        } catch (pexelsErr) {
          feedLogger.error("Pexels fallback failed:", pexelsErr);
        }

        // FINAL FALLBACK: Use hardcoded demo videos (guaranteed to work)
        feedLogger.info("Using demo videos as final fallback");
        setPosts(DEMO_VIDEOS);
        setHasMore(false);
        setFetchError(false);
        return;
      } else {
        setPosts(validPosts);
        setHasMore(validPosts.length === 10);
      }

      setPage(0);
    } catch (error) {
      feedLogger.error("Error fetching API posts:", error);
      // Use demo videos as fallback on error
      setPosts(DEMO_VIDEOS as Array<Post & { user: User }>);
      setHasMore(false);
      setFetchError(false);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [savedState, transformPexelsToPosts]);

  // Load more videos
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      // Fetch next page with Hive filtering
      const data = await getExplorePosts(nextPage, 10, HIVE_ID);

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
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!savedState || !savedState.posts?.length || posts.length === 0) {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      // Set a timeout to use demo videos if API takes too long (3 seconds)
      fallbackTimeout = setTimeout(() => {
        if (posts.length === 0) {
          feedLogger.info("API timeout - using demo videos");
          setPosts(DEMO_VIDEOS);
          setHasMore(false);
          setIsLoading(false);
        }
      }, 3000);

      if ("requestIdleCallback" in window) {
        callbackId = (window as any).requestIdleCallback(() =>
          fetchVideoFeed(),
        );
      } else {
        callbackId = setTimeout(() => fetchVideoFeed(), 1);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      if (callbackId !== null) {
        if ("cancelIdleCallback" in window) {
          (window as any).cancelIdleCallback(callbackId);
        } else {
          clearTimeout(callbackId);
        }
      }
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
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
      isFast,
      isMedium,
      isSlow,
      isSystemOverloaded,
      isPageVisible,
      getEngagement,
      handleVideoProgress,
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
          "w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-8 text-center",
          className,
        )}
      >
        <div className="text-6xl mb-6 animate-pulse">🎥</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Bienvenue sur Zyeuté
        </h2>
        <p className="text-white/60 mb-8 max-w-xs mx-auto">
          Le fil est vide. Sois le premier à partager un moment unique avec le
          Québec.
        </p>

        <button
          onClick={() => {
            // Navigate to upload or trigger refresh
            fetchVideoFeed();
          }}
          className="px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-full hover:bg-[#C5A028] transition-transform active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        >
          Rafraîchir
        </button>
      </div>
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

      {loadingMore && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
          <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
