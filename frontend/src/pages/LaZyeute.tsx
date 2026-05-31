/**
 * Zyeute - TikTok-style Vertical Swipe Feed
 * Full-screen vertical scroll experience with snap scrolling
 * Edge lighting effects when content is playing
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  getCurrentUser,
  togglePostFire,
  toggleFollow,
  toggleSavePost,
  apiCall,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInfiniteFeed, type FeedType } from "@/hooks/useInfiniteFeed";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { VideoPlayer } from "@/components/features/VideoPlayer";
import { VideoPlaybackDiagnostic } from "@/components/video/VideoPlaybackDiagnostic";
import { TiGuyMessaging } from "@/components/features/TiGuyMessaging";
import { getProxiedMediaUrl } from "@/utils/mediaProxy";
import { FlameEyeIcon } from "@/components/ui/Logo";
import { CaptionWithHashtags } from "@/components/feed/CaptionWithHashtags";
import { ShareSheet } from "@/components/feed/ShareSheet";
import { FeedCommentsSheet } from "@/components/feed/FeedCommentsSheet";
import { ReportPostSheet } from "@/components/feed/ReportPostSheet";
import { GiftPicker } from "@/components/features/GiftPicker";
import { FeedErrorBoundary } from "@/components/feed/FeedErrorBoundary";
import { SubscriberBadge } from "@/components/ui/SubscriberBadge";
import usePremium from "@/hooks/usePremium";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import type { Post, User } from "@/types";

// ── Watch history: fire-and-forget POST to backend ───────────────────────
async function markVideoWatched(postId: string): Promise<void> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return; // guest — skip
    fetch("/api/feed/watched", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ publicationId: postId }),
    }).catch(() => {}); // truly fire-and-forget
  } catch {
    // non-critical
  }
}

// ========================
// DEMO FALLBACK VIDEOS
// ========================
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

/** Post with optional engagement fields from API */
type PostWithEngagement = Post & {
  is_fired?: boolean;
  fire_count?: number;
  fireCount?: number;
  comment_count?: number;
  commentCount?: number;
};

export const Zyeute: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { edgeLighting } = useTheme();
  const { user: authUser, isGuest } = useAuth();
  const { isPremium } = usePremium();

  /** Pour toi = explore; Abonnements = people you follow (requires auth for filtering). */
  const [feedSource, setFeedSource] = useState<FeedType>("explore");

  // Infinite scroll hook
  const {
    posts: apiPosts,
    loadMoreRef,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteFeed(feedSource);

  // Demo clips only with ?demo=1 — avoids filling the feed with test videos in production
  const demoFeed = useMemo(
    () => new URLSearchParams(location.search).get("demo") === "1",
    [location.search],
  );
  const posts = useMemo(() => {
    if (apiPosts.length > 0) return apiPosts;
    if (!isLoading && demoFeed) return DEMO_VIDEOS;
    return [];
  }, [apiPosts, isLoading, demoFeed]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTiGuyChat, setShowTiGuyChat] = useState(false);
  const [forceEnter, setForceEnter] = useState(false);
  const [tiGuyUnread, setTiGuyUnread] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCtx, setReportCtx] = useState<{
    postId: string;
    authorUserId?: string;
  } | null>(null);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [firedMap, setFiredMap] = useState<Record<string, boolean>>({});
  const [fireCountMap, setFireCountMap] = useState<Record<string, number>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  // Double-tap detection
  const lastTapRef = useRef<{ postId: string; time: number } | null>(null);
  // Heart burst animation
  const { tap, impact, success } = useHaptics();
  const [uiVisible, setUiVisible] = useState(true);
  const [heartBurst, setHeartBurst] = useState<{
    postId: string;
    key: number;
  } | null>(null);

  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // Current post for edge lighting
  const currentPost = useMemo(() => posts[currentIndex], [posts, currentIndex]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Poll unread DM count for Ti-Guy badge (every 30s)
  useEffect(() => {
    if (!isPremium) return;
    const fetchUnread = async () => {
      const { data } = await apiCall<{
        conversations: { unreadCount: number }[];
      }>("/messaging/conversations");
      const total = (data?.conversations ?? []).reduce(
        (s, c) => s + (c.unreadCount || 0),
        0,
      );
      setTiGuyUnread(total);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [isPremium]);

  // Mark the previous video as watched when currentIndex changes
  const prevIndexRef = useRef<number>(-1);
  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev >= 0 && prev !== currentIndex && posts[prev]?.id) {
      markVideoWatched(posts[prev].id);
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex, posts]);

  // Pre-fetch next page when user is 3 videos from the end
  useEffect(() => {
    if (
      posts.length > 0 &&
      currentIndex >= posts.length - 3 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      // Trigger will load more automatically via Intersection Observer
      console.log("Near end of feed, pre-fetching...");
    }
  }, [currentIndex, posts.length, hasNextPage, isFetchingNextPage]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const viewportHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / viewportHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
    }
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      const idx = Math.round(scrollTop / viewportHeight);
      if (idx >= 0 && idx < posts.length) {
        try {
          sessionStorage.setItem(`zyeute_scroll_${feedSource}`, String(idx));
        } catch {
          /* */
        }
      }
    }, 400);
  }, [currentIndex, posts.length, feedSource]);

  // Touch gesture handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    touchStartY.current = y;
    touchEndY.current = y; // Initialize to same value to prevent false swipes on taps
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Use changedTouches for accurate end position
      const endY = e.changedTouches[0]?.clientY ?? touchEndY.current;
      const diff = touchStartY.current - endY;
      const threshold = 50;

      // Only swipe if there was actual movement (not a tap)
      if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < posts.length - 1) {
          // Swipe up - next post
          setCurrentIndex((prev) => prev + 1);
          containerRef.current?.scrollTo({
            top: (currentIndex + 1) * window.innerHeight,
            behavior: "smooth",
          });
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe down - previous post
          setCurrentIndex((prev) => prev - 1);
          containerRef.current?.scrollTo({
            top: (currentIndex - 1) * window.innerHeight,
            behavior: "smooth",
          });
        }
      }
    },
    [currentIndex, posts.length],
  );

  const uid = authUser?.id ?? currentUser?.id;

  const handleFireToggle = async (postId: string, fromDoubleTap = false) => {
    if (!uid) {
      toast.error("Connecte-toi pour mettre du feu.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const post = posts.find((p) => p.id === postId);
    const currentFired =
      firedMap[postId] ??
      (post as PostWithEngagement | undefined)?.is_fired ??
      false;
    const currentCount =
      fireCountMap[postId] ??
      (post as PostWithEngagement | undefined)?.fireCount ??
      (post as PostWithEngagement | undefined)?.fire_count ??
      0;
    // Optimistic update
    const newFired = !currentFired;
    setFiredMap((m) => ({ ...m, [postId]: newFired }));
    setFireCountMap((m) => ({
      ...m,
      [postId]: currentCount + (newFired ? 1 : -1),
    }));
    // Heart burst animation on double-tap fire
    if (fromDoubleTap && newFired) {
      setHeartBurst({ postId, key: Date.now() });
      setTimeout(() => setHeartBurst(null), 900);
    }
    try {
      await togglePostFire(postId, uid);
    } catch (error) {
      console.error("Error toggling fire:", error);
      // Revert on failure
      setFiredMap((m) => ({ ...m, [postId]: currentFired }));
      setFireCountMap((m) => ({ ...m, [postId]: currentCount }));
      toast.error("Impossible pour l'instant.");
    }
  };

  const handleSaveToggle = async (postId: string) => {
    if (!uid) {
      toast.error("Connecte-toi pour sauvegarder.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const currentSaved = savedMap[postId] ?? false;
    setSavedMap((m) => ({ ...m, [postId]: !currentSaved }));
    toast.success(currentSaved ? "Retiré des sauvegardés" : "Sauvegardé! 🔖");
    try {
      await toggleSavePost(postId, currentSaved);
    } catch (error) {
      console.error("Error toggling save:", error);
      setSavedMap((m) => ({ ...m, [postId]: currentSaved }));
      toast.error("Impossible pour l'instant.");
    }
  };

  // Double-tap on video → fire
  const handleVideoTap = useCallback(
    (postId: string) => {
      const now = Date.now();
      if (
        lastTapRef.current &&
        lastTapRef.current.postId === postId &&
        now - lastTapRef.current.time < 300
      ) {
        lastTapRef.current = null;
        impact();
        handleFireToggle(postId, true);
      } else {
        lastTapRef.current = { postId, time: now };
        // Single tap → toggle UI visibility (immersive mode)
        tap();
        setUiVisible((v) => !v);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, posts, firedMap, fireCountMap],
  );

  const openShare = (postId: string) => {
    setSharePostId(postId);
    setShareOpen(true);
  };

  const openComments = (postId: string) => {
    setCommentsPostId(postId);
    setCommentsOpen(true);
  };

  const handleFollowToggle = async (author: User | undefined) => {
    if (!author?.id) return;
    if (!authUser?.id) {
      toast.error("Connecte-toi pour suivre.");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (author.id === authUser.id) return;
    const isF =
      followedMap[author.id] ??
      (author as { is_following?: boolean }).is_following ??
      false;
    const ok = await toggleFollow(authUser.id, author.id, isF);
    if (ok) {
      setFollowedMap((m) => ({ ...m, [author.id]: !isF }));
      toast.success(isF ? "Désabonné" : "Abonné!");
    } else {
      toast.error("Action impossible pour l’instant.");
    }
  };

  const feedRestoreOnce = useRef(false);
  useEffect(() => {
    feedRestoreOnce.current = false;
  }, [feedSource]);

  useEffect(() => {
    if (posts.length === 0 || feedRestoreOnce.current) return;
    const raw =
      sessionStorage.getItem(`zyeute_scroll_${feedSource}`) ??
      sessionStorage.getItem(`zyeute_la_scroll_${feedSource}`); // legacy key
    const el = containerRef.current;
    if (!el) return;
    const idx = raw
      ? Math.min(
          Math.max(0, parseInt(raw, 10) || 0),
          Math.max(0, posts.length - 1),
        )
      : 0;
    requestAnimationFrame(() => {
      el.scrollTo({ top: idx * window.innerHeight, behavior: "auto" });
      setCurrentIndex(idx);
      feedRestoreOnce.current = true;
    });
  }, [posts.length, feedSource]);

  if (isLoading && !forceEnter) {
    return (
      <div className="fixed inset-0 leather-dark flex flex-col overflow-hidden items-center justify-center">
        <div className="relative">
          {/* Outer AG Glow Ring */}
          <div className="absolute inset-0 -m-4 rounded-full bg-gold-500/10 blur-xl animate-pulse" />

          <div className="relative text-center">
            {/* Custom Premium Spinner */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-gold-900/40 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-gold-500 rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
              <div className="absolute inset-4 border-2 border-transparent border-b-gold-200/50 rounded-full animate-spin-slow rotate-45" />

              {/* AG Center Logo Placeholder/Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gold-400 font-black text-xl tracking-tighter">
                  AG
                </span>
              </div>
            </div>

            <h2 className="text-gold-400 font-black text-2xl tracking-tight mb-2 uppercase">
              Zyeute
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-300 animate-bounce" />
            </div>
            <p className="mt-4 text-gold-200/60 text-[0.7rem] uppercase tracking-[0.3em] font-medium">
              Initialisation Sécurisée AG
            </p>

            {/* Failsafe for stuck loading */}
            <button
              onClick={() => {
                tap();
                setForceEnter(true);
              }}
              className="mt-12 px-6 py-2 rounded-full border border-gold-500/30 text-gold-500/80 text-[10px] uppercase tracking-widest hover:bg-gold-500/10 transition-all"
            >
              Accès Manuel Direct
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - lightweight inline message, NOT a full-screen replacement
  const emptyFeedContent = posts.length === 0 && (
    <div className="px-4 pt-6 pb-6 h-full min-h-full flex items-center justify-center snap-start">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 max-w-sm w-full">
        <div className="text-4xl mb-3">🦫</div>
        <p className="text-lg font-semibold text-white">
          Aucune publication pour l'instant
        </p>
        <p className="mt-1 text-sm text-white/70">
          Sois le premier à publier du contenu québécois!
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            to="/create"
            className="flex-1 bg-gold-500 text-black px-4 py-2 rounded-xl font-bold text-center text-sm"
          >
            Créer un post
          </Link>
          <Link
            to="/explore"
            className="flex-1 border border-white/20 text-white px-4 py-2 rounded-xl font-medium text-center text-sm hover:bg-white/5"
          >
            Explorer
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <FeedErrorBoundary fallbackTitle="Le fil n’a pas pu s’afficher">
      <div className="fixed inset-0 leather-dark overflow-hidden">
        {/* Dynamic Edge Lighting (React-optimized) */}
        <div
          className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-1000"
          style={{
            boxShadow: isPlaying
              ? `inset 0 0 100px ${edgeLighting}40, inset 0 0 20px ${edgeLighting}60`
              : "none",
            opacity: isPlaying ? 0.6 : 0,
          }}
        />

        {/* Header */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 flex items-end justify-center transition-opacity duration-300 ${
            uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            background: "transparent",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
            paddingBottom: "10px",
          }}
        >
          <div className="flex items-center gap-4 select-none">
            {/* Pour toi / Abonnements toggle */}
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-1 py-1 border border-white/10">
              <button
                onClick={() => setFeedSource("explore")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                  feedSource === "explore"
                    ? "bg-gold-500 text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Pour toi
              </button>
              <button
                onClick={() => setFeedSource("following")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                  feedSource === "following"
                    ? "bg-gold-500 text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Abonnements
              </button>
            </div>
          </div>
        </div>

        {/* Vertical Snap Scroll Container - flex-1 takes remaining space */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-0"
          style={{
            scrollSnapType: "y mandatory",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Force video to start at absolute pixel 0 — under status bar
            // viewport-fit=cover + this overrides any env(safe-area-inset-top)
            marginTop: 0,
            paddingTop: 0,
          }}
        >
          {emptyFeedContent}
          {posts.map((post, index) => {
            /** Only mount real players for current ±1 — avoids N× HLS/Mux competing and hitting VideoPlayer timeouts. */
            const nearActive = Math.abs(index - currentIndex) <= 1;
            const muxId = (post as Post).mux_playback_id;
            const slidePoster =
              getProxiedMediaUrl(post.thumbnail_url || post.media_url) ||
              post.thumbnail_url ||
              post.media_url ||
              (muxId ? `https://image.mux.com/${muxId}/thumbnail.jpg` : "");

            return (
              <div
                key={post.id}
                className="h-[100dvh] w-full snap-start snap-always relative flex items-center justify-center"
                data-testid={`post-slide-${post.id}`}
              >
                {/* Video Playback Diagnostic (?debug=1) */}
                {post.type === "video" && nearActive && (
                  <VideoPlaybackDiagnostic
                    postId={post.id}
                    postType={post.type}
                    muxPlaybackId={(post as Post).mux_playback_id}
                    mediaUrl={post.media_url}
                    videoSrc={
                      (post as Post).mux_playback_id
                        ? null
                        : getProxiedMediaUrl(post.media_url) || post.media_url
                    }
                    playerPath={
                      (post as Post).mux_playback_id
                        ? "mux"
                        : post.media_url
                          ? "native"
                          : "none"
                    }
                    isActive={index === currentIndex}
                  />
                )}
                {/* Media */}
                <div className="absolute inset-0 bg-black gold-rim overflow-hidden">
                  {post.type === "video" ? (
                    nearActive ? (
                      muxId ? (
                        <MuxVideoPlayer
                          playbackId={muxId || ""}
                          thumbnailUrl={slidePoster}
                          className="w-full h-full object-cover animate-video-reveal"
                          autoPlay={index === currentIndex && isPlaying}
                          muted={isMuted}
                          loop
                        />
                      ) : (
                        <VideoPlayer
                          src={
                            getProxiedMediaUrl(post.media_url) || post.media_url
                          }
                          poster={slidePoster}
                          className="w-full h-full object-cover animate-video-reveal"
                          autoPlay={index === currentIndex && isPlaying}
                          muted={isMuted}
                          loop
                          preload={index === currentIndex ? "auto" : "metadata"}
                        />
                      )
                    ) : (
                      <img
                        src={slidePoster || undefined}
                        alt=""
                        className="w-full h-full object-cover animate-video-reveal bg-black"
                      />
                    )
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={
                          getProxiedMediaUrl(post.media_url) || post.media_url
                        }
                        alt={post.caption || "Post image"}
                        className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${
                          index === currentIndex ? "scale-110" : "scale-100"
                        }`}
                      />
                    </div>
                  )}

                  {/* Gold Edition Cinematic Particles & High-Fidelity Tech Overlay */}
                  <div className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-screen overflow-hidden">
                    {/* Ambient Gold Aura */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15)_0%,transparent_70%)]" />

                    {/* Sub-pixel Tech Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]" />

                    {/* Localized 'Gold Edition' Lens Flare Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full animate-pulse" />
                    <div className="absolute inset-0 gold-glow-soft opacity-50" />
                  </div>
                </div>

                {/* Tap overlay: single tap = play/pause, double-tap = fire */}
                <div
                  className="absolute inset-0 z-20"
                  style={{ background: "transparent" }}
                  onClick={() => handleVideoTap(post.id)}
                />

                {/* Heart burst animation on double-tap fire */}
                {heartBurst?.postId === post.id && (
                  <div
                    key={heartBurst.key}
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                    style={{ animation: "heartPop 0.9s ease-out forwards" }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-32 h-32 drop-shadow-[0_0_30px_rgba(255,100,50,0.9)]"
                      style={{ animation: "heartPop 0.9s ease-out forwards" }}
                    >
                      <path
                        d="M12 2C10.5 4.5 8 7 8 10c0 2 1 3 2 4-1-1-3-3-3-6 0-4 3-6 5-6zm0 4c-1 1.5-2 3-2 5 0 3 2 5 4 5s4-2 4-5c0-2-1-3.5-2-5 0 0 1 2 1 3 0 2-1 3-2 3s-2-1-2-3c0-1 1-3 1-3z"
                        fill="#FF3D3D"
                        stroke="#FFD700"
                        strokeWidth={0.5}
                      />
                    </svg>
                  </div>
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

                {/* Bottom Info */}
                <div className="absolute bottom-6 left-4 right-20 z-20">
                  {/* Username */}
                  <Link
                    to={`/profile/${post.user?.username || post.user?.id}`}
                    className="flex items-center gap-2 mb-2"
                    data-testid={`link-user-${post.id}`}
                  >
                    <span className="text-white font-bold text-base">
                      @{post.user?.username}
                    </span>
                    {post.user?.isVerified && (
                      <span
                        className="drop-shadow-lg"
                        style={{ color: edgeLighting }}
                      >
                        ✓
                      </span>
                    )}
                    <SubscriberBadge
                      tier={(post.user as any)?.subscription_tier}
                      size="xs"
                    />
                  </Link>

                  {/* Caption + signalement */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    {post.caption ? (
                      <CaptionWithHashtags
                        text={post.caption}
                        className="text-white text-sm mb-2 line-clamp-3 flex-1"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setReportCtx({
                          postId: post.id,
                          authorUserId: post.user?.id,
                        });
                        setReportOpen(true);
                      }}
                      className="text-white/50 text-lg px-1 shrink-0"
                      aria-label="Signaler"
                    >
                      ⋯
                    </button>
                  </div>
                  {post.user?.id && post.user.id !== authUser?.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        newFollower();
                        handleFollowToggle(post.user as User);
                      }}
                      className="mb-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/40"
                    >
                      {followedMap[post.user.id] ||
                      (post.user as { is_following?: boolean }).is_following
                        ? "Abonné"
                        : "Suivre"}
                    </button>
                  ) : null}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs"
                          style={{ color: edgeLighting }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Region Badge */}
                  {post.region && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                      <span className="text-xs">📍</span>
                      <span className="text-white text-xs capitalize">
                        {post.region}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
                  {posts
                    .slice(
                      Math.max(0, index - 2),
                      Math.min(posts.length, index + 3),
                    )
                    .map((_, i) => {
                      const realIndex = Math.max(0, index - 2) + i;
                      return (
                        <div
                          key={realIndex}
                          className="w-1 rounded-full transition-all"
                          style={{
                            height: realIndex === currentIndex ? "16px" : "8px",
                            backgroundColor:
                              realIndex === currentIndex
                                ? edgeLighting
                                : "rgba(255,255,255,0.3)",
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })}

          {/* Infinite Scroll Trigger & Loading Indicator */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="h-[100dvh] snap-start snap-always flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4" />
                <p className="text-white text-lg">Chargement...</p>
                <p className="text-white/60 text-sm">
                  Encore plus de contenu d'icitte! ⚜️
                </p>
              </div>
            </div>
          )}

          {/* End of Feed Message */}
          {!hasNextPage && posts.length > 0 && (
            <div className="h-[100dvh] snap-start snap-always flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">⚜️</div>
                <h2 className="text-gold-400 text-xl font-bold mb-2">
                  C'est tout pour le moment!
                </h2>
                <p className="text-white/60 mb-6">
                  Revenez plus tard pour plus de contenu
                </p>
                <button
                  onClick={() => {
                    tap();
                    window.location.reload();
                  }}
                  className="bg-gold-500 text-black px-6 py-3 rounded-xl font-bold press-scale"
                >
                  Recharger le fil
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Actions - Leather style matching bottom nav */}
        {posts.length > 0 && currentPost && (
          <div
            className={`fixed right-3 bottom-24 flex flex-col items-center gap-3 z-30 transition-opacity duration-300 ${uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {/* Profile -- TI-GUY button moved to floating bottom right (TIGuyButton component) */}
            <Link
              to={`/profile/${currentPost.user?.username || currentPost.user?.id}`}
              className="flex flex-col items-center gap-1 press-scale"
              data-testid={`link-profile-${currentPost.id}`}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden transition-all duration-300 gold-glow gold-glow-soft"
                style={{
                  background:
                    "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
                  border: `2px solid ${edgeLighting}`,
                }}
              >
                <img
                  src={currentPost.user?.avatar_url || "/default-avatar.png"}
                  alt={currentPost.user?.displayName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-bold text-white/80">
                Profil
              </span>
            </Link>

            {/* Fire - optimistic state via firedMap */}
            {(() => {
              const isFired =
                firedMap[currentPost.id] ??
                (currentPost as PostWithEngagement).is_fired ??
                false;
              const fireCount =
                fireCountMap[currentPost.id] ??
                (currentPost as PostWithEngagement).fireCount ??
                (currentPost as PostWithEngagement).fire_count ??
                0;
              return (
                <button
                  onClick={() => {
                    fire();
                    handleFireToggle(currentPost.id);
                  }}
                  className="flex flex-col items-center gap-1 press-scale"
                  data-testid={`button-fire-${currentPost.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stitched-double gold-glow gold-edition-halo"
                    style={{
                      background: isFired
                        ? "linear-gradient(145deg, #FFD700 0%, #FF6B35 50%, #FF3D3D 100%)"
                        : "linear-gradient(145deg, #2A1F18 0%, #1A0F0A 100%)",
                      border: `2px solid ${isFired ? "#FF3D3D" : edgeLighting + "40"}`,
                      boxShadow: isFired
                        ? "0 0 15px #FF6B35, inset 0 0 10px rgba(0,0,0,0.5)"
                        : "0 4px 10px rgba(0,0,0,0.6), inset 0 0 5px rgba(255,255,255,0.05)",
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill={isFired ? "#FF3D3D" : "#FFD700"}
                      stroke={isFired ? "#FFD700" : "#8B4513"}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2C10.5 4.5 8 7 8 10c0 2 1 3 2 4-1-1-3-3-3-6 0-4 3-6 5-6zm0 4c-1 1.5-2 3-2 5 0 3 2 5 4 5s4-2 4-5c0-2-1-3.5-2-5 0 0 1 2 1 3 0 2-1 3-2 3s-2-1-2-3c0-1 1-3 1-3z" />
                    </svg>
                  </div>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isFired ? "#FFD700" : "#D4AF37" }}
                  >
                    {fireCount}
                  </span>
                </button>
              );
            })()}

            {/* Comments */}
            <button
              type="button"
              onClick={() => {
                comment();
                openComments(currentPost.id);
              }}
              className="flex flex-col items-center gap-1 press-scale"
              data-testid={`link-comments-${currentPost.id}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stitched-double gold-glow gold-glow-soft"
                style={{
                  background:
                    "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
                  border: `2px solid ${edgeLighting}`,
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke={edgeLighting}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white/80">
                {(currentPost as PostWithEngagement).commentCount ??
                  (currentPost as PostWithEngagement).comment_count ??
                  0}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={() => {
                share();
                openShare(currentPost.id);
              }}
              className="flex flex-col items-center gap-1 press-scale"
              data-testid={`button-share-${currentPost.id}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stitched-double gold-glow gold-glow-soft"
                style={{
                  background:
                    "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
                  border: `2px solid ${edgeLighting}`,
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke={edgeLighting}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-white/80">
                Partager
              </span>
            </button>

            {/* Bookmark / Save */}
            {(() => {
              const isSaved = savedMap[currentPost.id] ?? false;
              return (
                <button
                  onClick={() => {
                    save();
                    handleSaveToggle(currentPost.id);
                  }}
                  className="flex flex-col items-center gap-1 press-scale"
                  data-testid={`button-save-${currentPost.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stitched-double gold-glow gold-glow-soft"
                    style={{
                      background: isSaved
                        ? "linear-gradient(145deg, #FFD700 0%, #D4AF37 100%)"
                        : "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
                      border: `2px solid ${isSaved ? "#FFD700" : edgeLighting}`,
                      boxShadow: isSaved
                        ? "0 0 12px rgba(212,175,55,0.7)"
                        : undefined,
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill={isSaved ? "#1A0F0A" : "none"}
                      stroke={isSaved ? "#1A0F0A" : edgeLighting}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: isSaved ? "#FFD700" : "#D4AF37" }}
                  >
                    {isSaved ? "Sauvé" : "Sauver"}
                  </span>
                </button>
              );
            })()}

            {/* Gift */}
            <button
              type="button"
              onClick={() => {
                tap();
                setGiftOpen(true);
              }}
              className="flex flex-col items-center gap-1 press-scale"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stitched-double gold-glow gold-glow-soft"
                style={{
                  background:
                    "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
                  border: `2px solid ${edgeLighting}`,
                }}
              >
                <span className="text-lg">🎁</span>
              </div>
              <span className="text-[10px] font-bold text-white/80">
                Cadeau
              </span>
            </button>

            {/* TI-GUY Chat — Bronze+ only */}
            <button
              type="button"
              onClick={() => {
                tap();
                setShowTiGuyChat(true);
              }}
              className="flex flex-col items-center gap-1 press-scale relative"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 stitched-double gold-glow gold-glow-soft"
                style={{
                  background:
                    "linear-gradient(145deg, #6B4423 0%, #4A3018 50%, #3D2314 100%)",
                  border: "2px solid #D4AF37",
                  opacity: 1,
                }}
              >
                <span className="text-[11px] font-black text-gold-400 leading-none">
                  TG
                </span>

                {isPremium && tiGuyUnread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                    style={{
                      background: "#D4AF37",
                      color: "#1A0F0A",
                      boxShadow: "0 0 6px rgba(212,175,55,0.8)",
                    }}
                  >
                    {tiGuyUnread > 9 ? "9+" : tiGuyUnread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gold-400/80">
                Ti-Guy
              </span>
            </button>
          </div>
        )}

        {/* Swipe Hint (shows briefly on first load) - Hidden when feed is empty */}
        {posts.length > 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce opacity-70">
            <div className="flex flex-col items-center text-white/60">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span className="text-xs">Glisse vers le haut</span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col transition-opacity duration-300 ${uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(212,175,55,0.25)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
            transform: "translateY(0)",
            willChange: "opacity",
          }}
        >
          {/* Gold shimmer accent line */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.4) 30%, rgba(255,215,0,0.6) 50%, rgba(212,175,55,0.4) 70%, transparent 100%)",
            }}
          />
          <div className="flex items-center justify-around py-1">
            {/* Home */}
            <button
              onClick={() => {
                tap();
                navigate("/feed");
              }}
              className="flex flex-col items-center gap-1 press-scale relative"
            >
              {location.pathname === "/feed" && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #FFD700, transparent)",
                    boxShadow: "0 0 6px rgba(255,215,0,0.8)",
                  }}
                />
              )}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={location.pathname === "/feed" ? "#FFD700" : "none"}
                stroke={
                  location.pathname === "/feed"
                    ? "#FFD700"
                    : "rgba(255,255,255,0.5)"
                }
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  location.pathname === "/feed"
                    ? { filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }
                    : {}
                }
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span
                className="text-[10px] font-medium"
                style={{
                  color:
                    location.pathname === "/feed"
                      ? "#FFD700"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                Accueil
              </span>
            </button>

            {/* Search */}
            <button
              onClick={() => {
                tap();
                navigate("/search");
              }}
              className="flex flex-col items-center gap-1 press-scale relative"
            >
              {location.pathname === "/search" && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #FFD700, transparent)",
                    boxShadow: "0 0 6px rgba(255,215,0,0.8)",
                  }}
                />
              )}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  location.pathname === "/search"
                    ? "#FFD700"
                    : "rgba(255,255,255,0.5)"
                }
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  location.pathname === "/search"
                    ? { filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }
                    : {}
                }
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span
                className="text-[10px] font-medium"
                style={{
                  color:
                    location.pathname === "/search"
                      ? "#FFD700"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                Découvrir
              </span>
            </button>

            {/* Center create (+) */}
            <button
              onClick={() => {
                tap();
                navigate("/create");
              }}
              className="relative -top-3 press-scale"
              aria-label="Create"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center stitched-double gold-glow gold-edition-halo"
                style={{
                  background:
                    "linear-gradient(145deg, #F4E2A6 0%, #D4AF37 45%, #C9A227 70%, #8B6914 100%)",
                  border: "2px solid #8B6914",
                  boxShadow: "0 4px 15px rgba(201, 162, 39, 0.6)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#1A0F0A"
                  stroke="#1A0F0A"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                tap();
                navigate("/notifications");
              }}
              className="flex flex-col items-center gap-1 press-scale relative"
            >
              {location.pathname === "/notifications" && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #FFD700, transparent)",
                    boxShadow: "0 0 6px rgba(255,215,0,0.8)",
                  }}
                />
              )}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={
                  location.pathname === "/notifications" ? "#FFD700" : "none"
                }
                stroke={
                  location.pathname === "/notifications"
                    ? "#FFD700"
                    : "rgba(255,255,255,0.5)"
                }
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  location.pathname === "/notifications"
                    ? { filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }
                    : {}
                }
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span
                className="text-[10px] font-medium"
                style={{
                  color:
                    location.pathname === "/notifications"
                      ? "#FFD700"
                      : "rgba(255,255,255,0.5)",
                }}
              >
                Activité
              </span>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                tap();
                navigate("/profile");
              }}
              className="flex flex-col items-center gap-1 press-scale relative"
            >
              {location.pathname.startsWith("/profile") && (
                <span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #FFD700, transparent)",
                    boxShadow: "0 0 6px rgba(255,215,0,0.8)",
                  }}
                />
              )}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={
                  location.pathname.startsWith("/profile") ? "#FFD700" : "none"
                }
                stroke={
                  location.pathname.startsWith("/profile")
                    ? "#FFD700"
                    : "rgba(255,255,255,0.5)"
                }
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  location.pathname.startsWith("/profile")
                    ? { filter: "drop-shadow(0 0 4px rgba(255,215,0,0.6))" }
                    : {}
                }
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: location.pathname.startsWith("/profile")
                    ? "#FFD700"
                    : "rgba(255,255,255,0.5)",
                }}
              >
                Profil
              </span>
            </button>
          </div>
        </div>

        {/* TI-GUY Messaging – Voyageur Luxury (dropdown: DMs, Last Chats, File upload, etc.) */}
        <TiGuyMessaging
          key={showTiGuyChat ? "open" : "closed"}
          open={showTiGuyChat}
          onClose={() => setShowTiGuyChat(false)}
        />

        <ShareSheet
          open={shareOpen && !!sharePostId}
          postId={sharePostId || ""}
          onClose={() => {
            setShareOpen(false);
            setSharePostId(null);
          }}
        />
        <FeedCommentsSheet
          open={commentsOpen && !!commentsPostId}
          postId={commentsPostId || ""}
          onClose={() => {
            setCommentsOpen(false);
            setCommentsPostId(null);
          }}
          canComment={!!authUser?.id && !isGuest}
        />
        <ReportPostSheet
          open={reportOpen && !!reportCtx}
          postId={reportCtx?.postId || ""}
          authorUserId={reportCtx?.authorUserId}
          onClose={() => {
            setReportOpen(false);
            setReportCtx(null);
          }}
        />

        {/* Gift Picker */}
        {giftOpen && currentPost && (
          <GiftPicker
            recipientId={currentPost.user?.id || currentPost.user_id || ""}
            recipientName={
              currentPost.user?.displayName ||
              currentPost.user?.username ||
              "ce créateur"
            }
            postId={currentPost.id}
            onClose={() => setGiftOpen(false)}
          />
        )}
      </div>
    </FeedErrorBoundary>
  );
};

// Keep backward-compat alias for any lazy import that uses the old name
export { Zyeute as LaZyeute };
export default Zyeute;
