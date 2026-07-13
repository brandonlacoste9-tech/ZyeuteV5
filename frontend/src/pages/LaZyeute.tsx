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
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { usePreloadHint } from "@/hooks/useVideoTransition";
const MuxVideoPlayer = React.lazy(() =>
  import("@/components/video/MuxVideoPlayer").then((m) => ({
    default: m.MuxVideoPlayer,
  })),
);
import { VideoPlayer } from "@/components/features/VideoPlayer";
import { VideoPlaybackDiagnostic } from "@/components/video/VideoPlaybackDiagnostic";

import { getProxiedMediaUrl, resolvePosterUrl } from "@/utils/mediaProxy";
import { FlameEyeIcon } from "@/components/ui/Logo";
import { CaptionWithHashtags } from "@/components/feed/CaptionWithHashtags";
import { ShareSheet } from "@/components/feed/ShareSheet";
import { FeedCommentsSheet } from "@/components/feed/FeedCommentsSheet";
import { FeedPostActionsSheet } from "@/components/feed/FeedPostActionsSheet";
import {
  FeedProgressBar,
  type FeedProgressBarHandle,
} from "@/components/feed/FeedProgressBar";
import { useQueryClient } from "@tanstack/react-query";
import { removePostFromFeedCache } from "@/hooks/useInfiniteFeed";
import { GiftPicker } from "@/components/features/GiftPicker";
import { FeedErrorBoundary } from "@/components/feed/FeedErrorBoundary";
import { SubscriberBadge } from "@/components/ui/SubscriberBadge";
import usePremium from "@/hooks/usePremium";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import type { Post, User } from "@/types";

// ── Watch history: fire-and-forget POST to backend ───────────────────────
async function markVideoWatched(
  postId: string,
  watchDurationMs?: number,
): Promise<void> {
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
      body: JSON.stringify({
        publicationId: postId,
        ...(watchDurationMs != null ? { watchDurationMs } : {}),
      }),
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
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050417_ae1b6da4-ae6a-4b16-ac2b-54709541bb30.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050417_ae1b6da4-ae6a-4b16-ac2b-54709541bb30.mp4",
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
    hive_id: (localStorage.getItem("zyeute_hive_id") || "quebec") as
      | "quebec"
      | "mexico",
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
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050501_05f7421d-94d8-4613-964b-e8c4746aaa54.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050501_05f7421d-94d8-4613-964b-e8c4746aaa54.mp4",
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
    hive_id: (localStorage.getItem("zyeute_hive_id") || "quebec") as
      | "quebec"
      | "mexico",
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
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050555_039e6bb5-9285-4356-80ef-d56b5f670848.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050555_039e6bb5-9285-4356-80ef-d56b5f670848.mp4",
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
    hive_id: (localStorage.getItem("zyeute_hive_id") || "quebec") as
      | "quebec"
      | "mexico",
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
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050645_3dcddf03-cff8-4a7d-819c-97cfdd27d675.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050645_3dcddf03-cff8-4a7d-819c-97cfdd27d675.mp4",
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
    hive_id: (localStorage.getItem("zyeute_hive_id") || "quebec") as
      | "quebec"
      | "mexico",
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
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050733_eb975d16-26d7-4fdb-bd6d-784e466e68ec.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_050733_eb975d16-26d7-4fdb-bd6d-784e466e68ec.mp4",
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
    hive_id: (localStorage.getItem("zyeute_hive_id") || "quebec") as
      | "quebec"
      | "mexico",
    is_moderated: false,
    moderation_approved: true,
    is_hidden: false,
    is_ephemeral: false,
    view_count: 0,
    max_views: 1,
  },
  {
    id: "demo-6",
    user_id: "demo-user-1",
    type: "video" as const,
    caption:
      "Le temps des sucres est arrivé! Petit déjeuner à la cabane! 🧇 #Quebec #Erable",
    media_url:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051415_3583fd2d-dafb-4a34-bce0-64577f419f4a.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051415_3583fd2d-dafb-4a34-bce0-64577f419f4a.mp4",
    thumbnail_url: "/demo/branding.png",
    thumbnailUrl: "/demo/branding.png",
    user: {
      id: "demo-user-1",
      username: "cabane_sucre",
      display_name: "Temps des Sucres",
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
    fire_count: 15400,
    comment_count: 850,
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
    id: "demo-7",
    user_id: "demo-user-2",
    type: "video" as const,
    caption:
      "La Chute-Montmorency est plus haute que le Niagara! 🌊 #VoyageQuebec",
    media_url:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051514_01824e32-ce71-4386-bf19-c4e5c769acf9.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051514_01824e32-ce71-4386-bf19-c4e5c769acf9.mp4",
    thumbnail_url: "/demo/nature.png",
    thumbnailUrl: "/demo/nature.png",
    user: {
      id: "demo-user-2",
      username: "nature_qc",
      display_name: "Nature QC",
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
    fire_count: 12500,
    comment_count: 420,
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
    id: "demo-8",
    user_id: "demo-user-3",
    type: "video" as const,
    caption: "Cirque du Soleil — quand Montréal illumine le monde entier! ✨",
    media_url:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051620_5174c6fe-ed9e-4f17-b2ac-bcc3ca314dac.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051620_5174c6fe-ed9e-4f17-b2ac-bcc3ca314dac.mp4",
    thumbnail_url: "/demo/montreal.png",
    thumbnailUrl: "/demo/montreal.png",
    user: {
      id: "demo-user-3",
      username: "arts_spectacles",
      display_name: "Arts & Spectacles",
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
    fire_count: 22100,
    comment_count: 1100,
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
    id: "demo-9",
    user_id: "demo-user-4",
    type: "video" as const,
    caption:
      "Les oies bernaches arrivent dans le fleuve! Signal du printemps 🌿",
    media_url:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051838_56d920dd-1070-4856-b8ab-56cb188ae428.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051838_56d920dd-1070-4856-b8ab-56cb188ae428.mp4",
    thumbnail_url: "/demo/nature.png",
    thumbnailUrl: "/demo/nature.png",
    user: {
      id: "demo-user-4",
      username: "faune_qc",
      display_name: "Faune Québec",
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
    fire_count: 8900,
    comment_count: 210,
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
    id: "demo-10",
    user_id: "demo-user-5",
    type: "video" as const,
    caption:
      "Roadtrip sur la route 132 en Gaspésie, paysages à couper le souffle! 🌊",
    media_url:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051940_f5b624ba-15fd-469f-8633-320650121d3e.mp4",
    mediaUrl:
      "https://d8j0ntlcm91z4.cloudfront.net/user_3FpjWWwSTgfvg6hEFzeRHYWHcBU/hf_20260630_051940_f5b624ba-15fd-469f-8633-320650121d3e.mp4",
    thumbnail_url: "/demo/nature.png",
    thumbnailUrl: "/demo/nature.png",
    user: {
      id: "demo-user-5",
      username: "voyage_qc",
      display_name: "Voyage QC",
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
    fire_count: 18500,
    comment_count: 670,
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
  const queryClient = useQueryClient();

  /** Pour toi = explore; Abonnements = people you follow (requires auth for filtering). */
  const [feedSource, setFeedSource] = useState<FeedType>("explore");

  // Infinite scroll hook
  const {
    posts: apiPosts,
    loadMoreRef,
    fetchNextPage,
    isPending,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error: feedError,
    refetch,
    reshuffle,
  } = useInfiniteFeed(feedSource);

  const forceFromUrl = useMemo(
    () => new URLSearchParams(location.search).get("force") === "1",
    [location.search],
  );

  // Demo clips only with ?demo=1 — never inject into production FYP by default
  const demoFeed = useMemo(
    () => new URLSearchParams(location.search).get("demo") === "1",
    [location.search],
  );
  const posts = useMemo(() => {
    if (demoFeed) {
      if (apiPosts.length > 0) return [...DEMO_VIDEOS, ...apiPosts];
      if (!isLoading) return DEMO_VIDEOS;
      return [];
    }
    return apiPosts;
  }, [apiPosts, isLoading, demoFeed]);

  // Recover from empty API after deploy/cache glitches
  useEffect(() => {
    if (isPending || apiPosts.length > 0 || feedSource !== "explore") return;
    const t = setTimeout(() => refetch(), 800);
    return () => clearTimeout(t);
  }, [isPending, apiPosts.length, feedSource, refetch]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return sessionStorage.getItem("zyeute_muted") !== "false";
    } catch {
      return true;
    }
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUnmuteHint, setShowUnmuteHint] = useState(true);
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    try {
      return sessionStorage.getItem("zyeute_swipe_hint") !== "dismissed";
    } catch {
      return true;
    }
  });
  const isPageVisible = usePageVisibility();
  const [forceEnter, setForceEnter] = useState(forceFromUrl);
  const [bootReady, setBootReady] = useState(forceFromUrl);
  const [muxFallbackIds, setMuxFallbackIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (forceFromUrl) {
      setForceEnter(true);
      setBootReady(true);
    }
  }, [forceFromUrl]);

  useEffect(() => {
    const id = window.setTimeout(() => setBootReady(true), 4000);
    return () => window.clearTimeout(id);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const userPausedRef = useRef(false);
  const feedRestoreOnce = useRef(false);
  const [measuredSlideH, setMeasuredSlideH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      if (h > 0) setMeasuredSlideH(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const getSlideHeight = useCallback(() => {
    if (measuredSlideH > 0) return measuredSlideH;
    return containerRef.current?.clientHeight || window.innerHeight;
  }, [measuredSlideH]);

  const handleFeedSourceChange = useCallback(
    (source: FeedType) => {
      if (source === "feed" && !authUser?.id) {
        toast.error("Connecte-toi pour voir tes abonnements.");
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      // Re-tapping the already-active tab reshuffles to a fresh set of videos.
      if (source === feedSource) {
        reshuffle();
        setCurrentIndex(0);
        containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
        return;
      }
      setFeedSource(source);
    },
    [authUser?.id, navigate, location.pathname, feedSource, reshuffle],
  );

  const nextVideoUrl = useMemo(() => {
    const next = posts[currentIndex + 1];
    if (!next || next.type !== "video") return null;
    if ((next as Post).mux_playback_id) {
      return `https://stream.mux.com/${(next as Post).mux_playback_id}.m3u8`;
    }
    return (
      getProxiedMediaUrl(next.hls_url || next.media_url) ||
      next.hls_url ||
      next.media_url ||
      null
    );
  }, [currentIndex, posts]);
  usePreloadHint(nextVideoUrl);

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
  const { tap, impact, success, fire, comment, share, save, newFollower } =
    useHaptics();
  const [uiVisible, setUiVisible] = useState(true);
  const [heartBursts, setHeartBursts] = useState<
    Array<{
      postId: string;
      id: number;
      x: number;
      y: number;
      rotation: number;
    }>
  >([]);

  // Progress bar tracking (TikTok-style).
  // Driven imperatively so the high-frequency `timeupdate` events never
  // re-render the feed tree — only the isolated <FeedProgressBar/> updates.
  const progressBarRef = useRef<FeedProgressBarHandle>(null);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (duration > 0) {
        progressBarRef.current?.setProgress(currentTime / duration);
      }
    },
    [],
  );

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

  // Mark watched when leaving a slide; also on unmount (last video in session)
  const prevIndexRef = useRef<number>(-1);
  useEffect(() => {
    const prev = prevIndexRef.current;
    if (prev >= 0 && prev !== currentIndex && posts[prev]?.id) {
      markVideoWatched(posts[prev].id);
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex, posts]);

  useEffect(() => {
    return () => {
      const idx = prevIndexRef.current;
      if (idx >= 0 && posts[idx]?.id) {
        markVideoWatched(posts[idx].id);
      }
    };
  }, [posts]);

  // Dismiss swipe hint after first scroll
  useEffect(() => {
    if (currentIndex > 0 && showSwipeHint) {
      setShowSwipeHint(false);
      try {
        sessionStorage.setItem("zyeute_swipe_hint", "dismissed");
      } catch {
        /* */
      }
    }
  }, [currentIndex, showSwipeHint]);

  // Pause when tab hidden; resume when visible (unless user paused manually)
  useEffect(() => {
    if (!isPageVisible) {
      setIsPlaying(false);
    } else if (!userPausedRef.current) {
      setIsPlaying(true);
    }
  }, [isPageVisible]);

  // Pour toi / Abonnements switch — reset scroll so we don't land on a black gap
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(true);
    userPausedRef.current = false;
    feedRestoreOnce.current = false;
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [feedSource]);

  // Keep index in range when feed pages change
  useEffect(() => {
    if (posts.length === 0) return;
    if (currentIndex >= posts.length) {
      setCurrentIndex(0);
      requestAnimationFrame(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, [posts.length, currentIndex]);

  // Pre-fetch earlier (avoids blocking swipe and fetch storms)
  const lastPrefetchRef = useRef(0);
  useEffect(() => {
    const atEnd =
      posts.length > 0 && currentIndex >= posts.length - 5 && hasNextPage;
    if (!atEnd || isFetchingNextPage) return;
    const now = Date.now();
    if (now - lastPrefetchRef.current < 2000) return;
    lastPrefetchRef.current = now;
    fetchNextPage();
  }, [
    currentIndex,
    posts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Active-index detection from scroll position, coalesced to one read per
  // animation frame. This keeps the scroll thread free of repeated layout
  // reads/setState during a fling — setCurrentIndex still only fires when the
  // slide boundary actually changes.
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = containerRef.current;
      if (!el) return;
      const scrollTop = el.scrollTop;
      const slideHeight = getSlideHeight();
      if (slideHeight <= 0) return;
      const newIndex = Math.round(scrollTop / slideHeight);
      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < posts.length
      ) {
        setCurrentIndex(newIndex);
      }
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
      scrollSaveTimer.current = setTimeout(() => {
        if (newIndex >= 0 && newIndex < posts.length) {
          try {
            sessionStorage.setItem(
              `zyeute_scroll_${feedSource}`,
              String(newIndex),
            );
          } catch {
            /* */
          }
        }
      }, 400);
    });
  }, [currentIndex, posts.length, feedSource, getSlideHeight]);

  // Cancel any pending scroll rAF on unmount
  useEffect(() => {
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  // Vertical paging is driven entirely by native CSS scroll-snap
  // (`snap-y snap-mandatory`). We intentionally do NOT run a JS swipe handler
  // that programmatically scrolls, because that fought the browser's native
  // snap/momentum and produced the stutter users felt. The active index is
  // derived from the scroll position in `handleScroll` (rAF-coalesced).

  const uid = authUser?.id ?? currentUser?.id;

  const addHeartBurst = useCallback((postId: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    const rotation = Math.random() * 40 - 20; // -20 to 20 deg
    setHeartBursts((prev) => [...prev, { postId, id, x, y, rotation }]);
    setTimeout(() => {
      setHeartBursts((prev) => prev.filter((b) => b.id !== id));
    }, 1000);
  }, []);

  const handleFireToggle = async (
    postId: string,
    fromDoubleTap = false,
    coords?: { x: number; y: number },
  ) => {
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

    if (fromDoubleTap) {
      if (coords) addHeartBurst(postId, coords.x, coords.y);
      if (currentFired) return; // Already fired, just show the particle animation and return
    }

    // Optimistic update
    const newFired = !currentFired;
    setFiredMap((m) => ({ ...m, [postId]: newFired }));
    setFireCountMap((m) => ({
      ...m,
      [postId]: currentCount + (newFired ? 1 : -1),
    }));

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
    (e: React.MouseEvent | React.TouchEvent, postId: string) => {
      const now = Date.now();
      if (
        lastTapRef.current &&
        lastTapRef.current.postId === postId &&
        now - lastTapRef.current.time < 300
      ) {
        lastTapRef.current = null;
        impact();

        let clientX = window.innerWidth / 2;
        let clientY = window.innerHeight / 2;
        if ("touches" in e) {
          if (e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
          } else if (e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
          }
        } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
        }

        handleFireToggle(postId, true, { x: clientX, y: clientY });
      } else {
        lastTapRef.current = { postId, time: now };
        // Single tap → unmute if still muted, otherwise toggle play/pause
        tap();
        if (isMuted) {
          setIsMuted(false);
          setShowUnmuteHint(false);
          try {
            sessionStorage.setItem("zyeute_muted", "false");
          } catch {
            /* */
          }
        } else {
          const nextPlaying = !isPlaying;
          userPausedRef.current = !nextPlaying;
          setIsPlaying(nextPlaying);
          setUiVisible(!nextPlaying);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, posts, firedMap, fireCountMap, isMuted, isPlaying, addHeartBurst],
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

  useEffect(() => {
    if (posts.length === 0 || feedRestoreOnce.current) return;
    const el = containerRef.current;
    if (!el) return;

    // Pour toi always opens at the first video (avoids mis-scroll black screen)
    if (feedSource === "explore") {
      requestAnimationFrame(() => {
        el.scrollTo({ top: 0, behavior: "auto" });
        setCurrentIndex(0);
        feedRestoreOnce.current = true;
      });
      return;
    }

    const raw =
      sessionStorage.getItem(`zyeute_scroll_${feedSource}`) ??
      sessionStorage.getItem(`zyeute_la_scroll_${feedSource}`);
    const idx = raw
      ? Math.min(
          Math.max(0, parseInt(raw, 10) || 0),
          Math.max(0, posts.length - 1),
        )
      : 0;
    requestAnimationFrame(() => {
      const h = getSlideHeight();
      el.scrollTo({ top: idx * h, behavior: "auto" });
      setCurrentIndex(idx);
      feedRestoreOnce.current = true;
    });
  }, [posts.length, feedSource, getSlideHeight]);

  const showBootSplash =
    isPending &&
    apiPosts.length === 0 &&
    !forceEnter &&
    !forceFromUrl &&
    !bootReady;

  if (showBootSplash) {
    return (
      <div className="fixed inset-0 leather-dark flex flex-col overflow-hidden items-center justify-center">
        {/* Gold star dust on leather */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden
        >
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gold-400 animate-pulse"
              style={{
                left: `${(i * 17 + 11) % 100}%`,
                top: `${(i * 23 + 5) % 100}%`,
                width: i % 4 === 0 ? 2.5 : 1.5,
                height: i % 4 === 0 ? 2.5 : 1.5,
                opacity: 0.12 + (i % 5) * 0.06,
                animationDelay: `${(i * 0.14) % 3}s`,
                animationDuration: `${2 + (i % 3)}s`,
                boxShadow: "0 0 4px rgba(212,175,55,0.55)",
              }}
            />
          ))}
        </div>

        {/* Soft gold ambient behind AG mark */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative z-10">
          <div className="absolute inset-0 -m-6 rounded-full bg-gold-500/10 blur-2xl animate-pulse" />

          <div className="relative text-center">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-gold-900/40 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-gold-500 rounded-full animate-spin shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
              <div
                className="absolute inset-4 border-2 border-transparent border-b-gold-200/50 rounded-full rotate-45"
                style={{ animation: "spin 2.8s linear infinite" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gold-400 font-black text-xl tracking-tighter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                  AG
                </span>
              </div>
            </div>

            <h2 className="text-gold-400 font-black text-2xl tracking-tight mb-2 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
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

            <button
              type="button"
              onClick={() => {
                tap();
                setForceEnter(true);
                setBootReady(true);
                refetch();
              }}
              className="mt-12 px-6 py-2 rounded-full border border-gold-500/30 text-gold-500/80 text-[10px] uppercase tracking-widest hover:bg-gold-500/10 transition-all"
            >
              Accès Manuel Direct
            </button>
            <p className="mt-3 text-white/40 text-[9px]">
              Débloque automatiquement après 4 s
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - lightweight inline message, NOT a full-screen replacement
  const emptyFeedContent = posts.length === 0 && !isLoading && !isPending && (
    <div className="px-4 pt-6 pb-6 h-full min-h-full flex items-center justify-center snap-start">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 max-w-sm w-full">
        <div className="text-4xl mb-3">🦫</div>
        <p className="text-lg font-semibold text-white">
          {feedError
            ? "Le fil a planté un peu"
            : "Aucune publication pour l'instant"}
        </p>
        <p className="mt-1 text-sm text-white/70">
          {feedError
            ? "Vérifie ta connexion, puis réessaie. Si ça continue, le serveur se réveille peut-être (Render free)."
            : "Sois le premier à publier du contenu québécois!"}
        </p>
        {feedError && (
          <p className="mt-2 text-xs text-red-300/80 break-words">
            {(feedError as Error).message || "Erreur réseau"}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="flex-1 min-w-[7rem] border border-gold-500/50 text-gold-400 px-4 py-2 rounded-xl font-bold text-sm"
          >
            Réessayer
          </button>
          <Link
            to="/create"
            className="flex-1 min-w-[7rem] bg-gold-500 text-black px-4 py-2 rounded-xl font-bold text-center text-sm"
          >
            Créer un post
          </Link>
          <Link
            to="/explore"
            className="flex-1 min-w-[7rem] border border-white/20 text-white px-4 py-2 rounded-xl font-medium text-center text-sm hover:bg-white/5"
          >
            Explorer
          </Link>
        </div>
      </div>
    </div>
  );

  // TikTok craft + Zyeuté soul: minimal chrome, gold only as accent
  const railIconClass =
    "w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-[2px] border border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.45)]";
  const railLabelClass =
    "text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]";

  return (
    <FeedErrorBoundary fallbackTitle="Le fil n’a pas pu s’afficher">
      <div className="fixed inset-0 lg:absolute lg:inset-0 leather-dark overflow-hidden flex justify-center h-full">
        {/* Phone-stage: pure black video canvas on leather app chrome (Zyeuté soul) */}
        <div className="w-full h-full lg:max-w-[420px] lg:mx-auto relative bg-black lg:shadow-[0_0_0_1px_rgba(212,175,55,0.12),0_25px_80px_rgba(0,0,0,0.65)]">
          {/* Soft top vignette */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/50 to-transparent"
            aria-hidden
          />

          {/* Header */}
          <div
            className={`absolute top-0 left-0 right-0 z-50 px-4 flex items-end justify-center transition-opacity duration-300 ${
              uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{
              background: "transparent",
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
              paddingBottom: "10px",
            }}
          >
            <div className="flex items-center gap-4 select-none">
              {/* Pour toi / Abonnements — gold only on active tab */}
              <div className="flex items-center gap-0.5 bg-black/35 backdrop-blur-md rounded-full px-1 py-1 border border-white/10">
                <button
                  onClick={() => handleFeedSourceChange("explore")}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${
                    feedSource === "explore"
                      ? "bg-gold-500 text-black shadow-[0_0_12px_rgba(var(--accent-rgb),0.35)]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Pour toi
                </button>
                <button
                  onClick={() => handleFeedSourceChange("feed")}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${
                    feedSource === "feed"
                      ? "bg-gold-500 text-black shadow-[0_0_12px_rgba(var(--accent-rgb),0.35)]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Abonnements
                </button>
              </div>
            </div>
          </div>

          {/* Vertical Snap Scroll Container */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-0 w-full h-full"
            style={{
              scrollSnapType: "y mandatory",
              // Keep paging contained to the feed and hint native momentum so
              // swipes don't rubber-band into the page or fight a JS scroller.
              overscrollBehavior: "contain",
              touchAction: "pan-y",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {emptyFeedContent}
            {posts.map((post, index) => {
              /** Mount players for current ±1 so swipe-back resumes where you left off. */
              const nearActive = Math.abs(index - currentIndex) <= 1;
              const isActiveSlide =
                index === currentIndex && isPageVisible && isPlaying;
              const muxId = (post as Post).mux_playback_id;
              const useMuxPlayer = !!muxId && !muxFallbackIds.has(post.id);
              // Prefer Mux poster; never load expired TikTok CDN thumbs (403 spam)
              const slidePoster = resolvePosterUrl({
                muxPlaybackId: muxId,
                thumbnailUrl: post.thumbnail_url || post.thumbnailUrl,
                mediaUrl: post.media_url || post.mediaUrl,
              });
              const slideH = getSlideHeight();
              const isVideoSlide =
                post.type === "video" ||
                !!muxId ||
                /\.(mp4|m3u8|webm|mov)(\?|$)/i.test(post.media_url || "");

              return (
                <div
                  key={`${post.id}-${index}`}
                  className="w-full snap-start snap-always relative flex items-center justify-center shrink-0"
                  style={{
                    height: slideH > 0 ? slideH : "100dvh",
                    minHeight: slideH > 0 ? slideH : "100dvh",
                    // Isolate each slide's paint/layout so painting one slide
                    // doesn't invalidate the others during scroll. Promote only
                    // the active±1 slides to their own GPU layer (avoids
                    // spawning a compositor layer per post in a long feed).
                    contain: "layout paint",
                    ...(nearActive
                      ? {
                          transform: "translateZ(0)",
                          backfaceVisibility: "hidden" as const,
                        }
                      : null),
                  }}
                  data-testid={`post-slide-${post.id}`}
                >
                  {/* Video Playback Diagnostic (?debug=1) */}
                  {isVideoSlide && nearActive && (
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
                        useMuxPlayer
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
                    {isVideoSlide ? (
                      nearActive ? (
                        useMuxPlayer ? (
                          <React.Suspense
                            fallback={
                              <div className="w-full h-full bg-black" />
                            }
                          >
                            <MuxVideoPlayer
                              playbackId={muxId || ""}
                              thumbnailUrl={slidePoster}
                              className="w-full h-full object-cover"
                              autoPlay={isActiveSlide}
                              muted={isMuted}
                              loop
                              resetOnDeactivate={false}
                              onTimeUpdate={(ct, dur) => {
                                if (index === currentIndex)
                                  handleTimeUpdate(ct, dur);
                              }}
                              onError={() => {
                                setMuxFallbackIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(post.id);
                                  return next;
                                });
                              }}
                            />
                          </React.Suspense>
                        ) : (
                          <VideoPlayer
                            src={
                              getProxiedMediaUrl(
                                post.hls_url || post.media_url,
                              ) ||
                              post.hls_url ||
                              post.media_url
                            }
                            poster={slidePoster}
                            className="w-full h-full object-cover"
                            autoPlay={isActiveSlide}
                            muted={isMuted}
                            loop
                            resetOnDeactivate={false}
                            preload={
                              index === currentIndex ||
                              index === currentIndex + 1
                                ? "auto"
                                : "metadata"
                            }
                            onTimeUpdate={(ct, dur) => {
                              if (index === currentIndex)
                                handleTimeUpdate(ct, dur);
                            }}
                            onWatchThreshold={(_pct, ms) => {
                              if (index === currentIndex) {
                                markVideoWatched(post.id, ms);
                              }
                            }}
                          />
                        )
                      ) : (
                        <img
                          src={slidePoster || undefined}
                          alt=""
                          className="w-full h-full object-cover bg-black"
                        />
                      )
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={
                            getProxiedMediaUrl(post.media_url) || post.media_url
                          }
                          alt={post.caption || "Post image"}
                          className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear motion-reduce:transition-none motion-reduce:scale-100 ${
                            index === currentIndex ? "scale-110" : "scale-100"
                          }`}
                        />
                      </div>
                    )}

                    {/* Subtle vignette only — video is the hero (TikTok craft) */}
                    {nearActive && index === currentIndex && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/25 via-transparent to-transparent"
                        aria-hidden
                      />
                    )}
                  </div>

                  {/* Tap overlay: single tap = play/pause, double-tap = fire */}
                  <div
                    className="absolute inset-0 z-20"
                    style={{ background: "transparent" }}
                    onClick={(e) => handleVideoTap(e, post.id)}
                  />

                  {/* TikTok-style progress bar at bottom of video.
                      Isolated component + key={post.id} → remounts (resets to
                      0) on slide change and updates without re-rendering the
                      feed. */}
                  {isVideoSlide && index === currentIndex && (
                    <FeedProgressBar key={post.id} ref={progressBarRef} />
                  )}

                  {/* Heart burst animation on double-tap fire */}
                  {heartBursts
                    .filter((b) => b.postId === post.id)
                    .map((burst) => (
                      <div
                        key={burst.id}
                        className="fixed z-30 pointer-events-none"
                        style={{
                          left: burst.x - 64, // Center the 128px (w-32) heart
                          top: burst.y - 64,
                          transform: `rotate(${burst.rotation}deg)`,
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-32 h-32 drop-shadow-[0_0_30px_rgba(255,100,50,0.9)]"
                          style={{
                            animation: "heartPop 0.9s ease-out forwards",
                          }}
                        >
                          <path
                            d="M12 2C10.5 4.5 8 7 8 10c0 2 1 3 2 4-1-1-3-3-3-6 0-4 3-6 5-6zm0 4c-1 1.5-2 3-2 5 0 3 2 5 4 5s4-2 4-5c0-2-1-3.5-2-5 0 0 1 2 1 3 0 2-1 3-2 3s-2-1-2-3c0-1 1-3 1-3z"
                            fill="#FF3D3D"
                            stroke={edgeLighting}
                            strokeWidth={0.5}
                          />
                        </svg>
                      </div>
                    ))}

                  {/* Bottom vignette for caption readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75 pointer-events-none" />

                  {/* Caption stack — TikTok density, Zyeuté gold only on Suivre */}
                  <div className="absolute bottom-6 left-3 right-[4.5rem] lg:right-4 z-20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Link
                        to={`/profile/${post.user?.username || post.user?.id}`}
                        className="flex items-center gap-1.5 min-w-0"
                        data-testid={`link-user-${post.id}`}
                      >
                        <span className="text-white font-bold text-[15px] truncate">
                          @{post.user?.username}
                        </span>
                        {post.user?.isVerified && (
                          <span className="text-gold-400 text-xs shrink-0">
                            ✓
                          </span>
                        )}
                        <SubscriberBadge
                          tier={(post.user as any)?.subscription_tier}
                          size="xs"
                        />
                      </Link>
                      {post.user?.id && post.user.id !== authUser?.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            newFollower();
                            handleFollowToggle(post.user as User);
                          }}
                          className="shrink-0 px-2.5 py-0.5 rounded text-[11px] font-bold border border-white/80 text-white hover:bg-white/10 active:bg-gold-500 active:text-black active:border-gold-500 transition-colors"
                        >
                          {followedMap[post.user.id] ||
                          (post.user as { is_following?: boolean }).is_following
                            ? "Abonné"
                            : "Suivre"}
                        </button>
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
                        className="ml-auto text-white/55 text-lg leading-none px-1 shrink-0"
                        aria-label="Plus d'options"
                      >
                        ⋯
                      </button>
                    </div>

                    {post.caption ? (
                      <CaptionWithHashtags
                        text={post.caption}
                        className="text-white text-[13px] leading-snug line-clamp-2 mb-1.5"
                      />
                    ) : null}

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
                        {post.hashtags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[12px] font-medium text-white/90"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.region && (
                      <div className="inline-flex items-center gap-1 text-white/75">
                        <span className="text-[11px]">📍</span>
                        <span className="text-[11px] capitalize font-medium">
                          {post.region}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Infinite scroll trigger — non-snapping so users don't land on a loader slide */}
            {hasNextPage && (
              <div
                ref={loadMoreRef}
                className="h-px w-full shrink-0"
                aria-hidden
              />
            )}
            {isFetchingNextPage && (
              <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                <div className="w-10 h-10 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Right rail — on mobile over video; on desktop beside the phone stage (not on video) */}
          {posts.length > 0 && currentPost && (
            <div
              className={`absolute z-40 flex flex-col items-center gap-4 transition-opacity duration-300 ${
                uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"
              } right-2.5 bottom-24 pb-safe lg:right-auto lg:left-full lg:ml-4 lg:top-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:pb-0`}
            >
              <Link
                to={`/profile/${currentPost.user?.username || currentPost.user?.id}`}
                className="flex flex-col items-center gap-0.5 press-scale relative"
                data-testid={`link-profile-${currentPost.id}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
                  <img
                    src={currentPost.user?.avatar_url || "/default-avatar.png"}
                    alt={currentPost.user?.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {currentPost.user?.id &&
                  currentPost.user.id !== authUser?.id &&
                  !(
                    followedMap[currentPost.user.id] ||
                    (currentPost.user as { is_following?: boolean })
                      .is_following
                  ) && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gold-500 text-black text-sm font-bold flex items-center justify-center shadow-md leading-none"
                      aria-hidden
                    >
                      +
                    </span>
                  )}
              </Link>

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
                    className="flex flex-col items-center gap-0.5 press-scale"
                    data-testid={`button-fire-${currentPost.id}`}
                  >
                    <div
                      className={`${railIconClass} ${isFired ? "border-red-400/50 bg-red-500/20" : ""}`}
                    >
                      <img
                        src="/assets/icons/icon-fire.png"
                        className="w-7 h-7 object-contain drop-shadow-md"
                        style={{
                          filter: isFired
                            ? "brightness(1.4) saturate(1.3) drop-shadow(0 0 6px #FF3D3D)"
                            : "brightness(1.15) contrast(1.05)",
                        }}
                        alt="Fire"
                      />
                    </div>
                    <span className={railLabelClass}>{fireCount}</span>
                  </button>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  comment();
                  openComments(currentPost.id);
                }}
                className="flex flex-col items-center gap-0.5 press-scale"
                data-testid={`link-comments-${currentPost.id}`}
              >
                <div className={railIconClass}>
                  <img
                    src="/assets/icons/icon-comment.png"
                    className="w-7 h-7 object-contain drop-shadow-md brightness-125"
                    alt="Comment"
                  />
                </div>
                <span className={railLabelClass}>
                  {(currentPost as PostWithEngagement).commentCount ??
                    (currentPost as PostWithEngagement).comment_count ??
                    0}
                </span>
              </button>

              <button
                onClick={() => {
                  share();
                  openShare(currentPost.id);
                }}
                className="flex flex-col items-center gap-0.5 press-scale"
                data-testid={`button-share-${currentPost.id}`}
              >
                <div className={railIconClass}>
                  <img
                    src="/assets/icons/icon-share.png"
                    className="w-7 h-7 object-contain drop-shadow-md brightness-125"
                    alt="Share"
                  />
                </div>
                <span className={railLabelClass}>Partager</span>
              </button>

              {(() => {
                const isSaved = savedMap[currentPost.id] ?? false;
                return (
                  <button
                    onClick={() => {
                      save();
                      handleSaveToggle(currentPost.id);
                    }}
                    className="flex flex-col items-center gap-0.5 press-scale"
                    data-testid={`button-save-${currentPost.id}`}
                  >
                    <div
                      className={`${railIconClass} ${isSaved ? "border-gold-400/60 bg-gold-500/15" : ""}`}
                    >
                      <img
                        src="/assets/icons/icon-save.png"
                        className="w-7 h-7 object-contain drop-shadow-md"
                        style={{
                          filter: isSaved
                            ? "brightness(1.4) drop-shadow(0 0 6px rgba(var(--accent-rgb),0.8))"
                            : "brightness(1.15)",
                        }}
                        alt="Save"
                      />
                    </div>
                    <span
                      className={railLabelClass}
                      style={isSaved ? { color: edgeLighting } : undefined}
                    >
                      {isSaved ? "Sauvé" : "Sauver"}
                    </span>
                  </button>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  tap();
                  setGiftOpen(true);
                }}
                className="flex flex-col items-center gap-0.5 press-scale"
              >
                <div className={railIconClass}>
                  <img
                    src="/assets/icons/icon-gift.png"
                    className="w-7 h-7 object-contain drop-shadow-md brightness-125"
                    alt="Gift"
                  />
                </div>
                <span className={railLabelClass}>Cadeau</span>
              </button>
            </div>
          )}

          {/* Tap-to-unmute hint */}
          {posts.length > 0 && isMuted && showUnmuteHint && (
            <button
              type="button"
              onClick={() => {
                tap();
                setIsMuted(false);
                setShowUnmuteHint(false);
                try {
                  sessionStorage.setItem("zyeute_muted", "false");
                } catch {
                  /* */
                }
              }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-black/65 backdrop-blur-md text-white text-sm font-semibold shadow-lg hover:bg-black/85 transition-all"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              Appuie pour le son 🔊
            </button>
          )}

          {/* Swipe Hint — dismisses after first scroll */}
          {posts.length > 0 && showSwipeHint && currentIndex === 0 && (
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

          {/* Bottom nav — mobile only (desktop uses sidebar); gold on active + FAB */}
          <div
            className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col transition-opacity duration-300 ${uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)",
            }}
          >
            <div className="flex items-center justify-around py-1.5 px-1">
              <button
                onClick={() => {
                  tap();
                  navigate("/feed");
                }}
                className="flex flex-col items-center gap-0.5 press-scale min-w-[3.25rem]"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={location.pathname === "/feed" ? edgeLighting : "none"}
                  stroke={
                    location.pathname === "/feed"
                      ? edgeLighting
                      : "rgba(255,255,255,0.55)"
                  }
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color:
                      location.pathname === "/feed"
                        ? edgeLighting
                        : "rgba(255,255,255,0.55)",
                  }}
                >
                  Accueil
                </span>
              </button>

              <button
                onClick={() => {
                  tap();
                  navigate("/search");
                }}
                className="flex flex-col items-center gap-0.5 press-scale min-w-[3.25rem]"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    location.pathname === "/search"
                      ? edgeLighting
                      : "rgba(255,255,255,0.55)"
                  }
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color:
                      location.pathname === "/search"
                        ? edgeLighting
                        : "rgba(255,255,255,0.55)",
                  }}
                >
                  Découvrir
                </span>
              </button>

              {/* Gold FAB — primary brand accent */}
              <button
                onClick={() => {
                  tap();
                  navigate("/create");
                }}
                className="relative -top-2.5 press-scale"
                aria-label="Créer"
              >
                <div
                  className="w-12 h-9 rounded-[10px] flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(145deg, var(--color-gold-300) 0%, var(--color-gold-500) 50%, var(--color-gold-700) 100%)",
                    boxShadow: "0 4px 16px rgba(var(--accent-rgb), 0.45)",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1A0F0A"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  tap();
                  navigate("/arcade");
                }}
                className="flex flex-col items-center gap-0.5 press-scale min-w-[3.25rem]"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={
                    location.pathname === "/arcade"
                      ? edgeLighting
                      : "rgba(255,255,255,0.55)"
                  }
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 12h4m-2-2v4M15 12h.01M18 10h.01" />
                </svg>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color:
                      location.pathname === "/arcade"
                        ? edgeLighting
                        : "rgba(255,255,255,0.55)",
                  }}
                >
                  Arcade
                </span>
              </button>

              <button
                onClick={() => {
                  tap();
                  navigate("/profile");
                }}
                className="flex flex-col items-center gap-0.5 press-scale min-w-[3.25rem]"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={
                    location.pathname.startsWith("/profile")
                      ? edgeLighting
                      : "none"
                  }
                  stroke={
                    location.pathname.startsWith("/profile")
                      ? edgeLighting
                      : "rgba(255,255,255,0.55)"
                  }
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: location.pathname.startsWith("/profile")
                      ? edgeLighting
                      : "rgba(255,255,255,0.55)",
                  }}
                >
                  Profil
                </span>
              </button>
            </div>
          </div>

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
          <FeedPostActionsSheet
            open={reportOpen && !!reportCtx}
            postId={reportCtx?.postId || ""}
            authorUserId={reportCtx?.authorUserId}
            source="feed"
            onPostRemoved={(postId) => {
              removePostFromFeedCache(queryClient, postId);
              setCurrentIndex((idx) => {
                const removedIdx = posts.findIndex((p) => p.id === postId);
                if (removedIdx < 0) return idx;
                if (idx > removedIdx) return idx - 1;
                if (idx >= posts.length - 1) return Math.max(0, idx - 1);
                return idx;
              });
            }}
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
        </div>{" "}
        {/* End Desktop Container Wrapper */}
      </div>
    </FeedErrorBoundary>
  );
};

// Keep backward-compat alias for any lazy import that uses the old name
export { Zyeute as LaZyeute };
export default Zyeute;
