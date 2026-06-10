/**
 * Explore Page - Premium Quebec Heritage Design
 * Discover trending content with leather grid and gold filters
 */

import "@/components/arcade/arcade-retro.css";
import React, { useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { getExplorePosts, apiCall } from "@/services/api";
import { useHive } from "@/contexts/HiveContext";
import { Avatar } from "@/components/Avatar";
import { QUEBEC_HASHTAGS, QUEBEC_REGIONS } from "@/lib/quebecFeatures";
import { formatNumber } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "@/components/Toast";
import { useNavigationState } from "@/contexts/NavigationStateContext";
import type { Post, User } from "@/types";
import { logger } from "@/lib/logger";
import { BottomNav } from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";
import { QuebecHashtags } from "@/components/trending/QuebecHashtags";
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary";
import { ExploreGridSkeleton } from "@/components/ui/Skeleton";
import { Gamepad2 } from "lucide-react";

const exploreLogger = logger.withContext("Explore");

export const Explore: React.FC = () => {
  useSEO({
    title: "Découvrir — Vidéos et créateurs du Québec",
    description:
      "Explore les vidéos tendances, trouve des créateurs québécois et découvre les hashtags populaires. Filtre par région — Montréal, Québec, Gatineau et plus.",
    url: "/explore",
  });

  const [searchParams] = useSearchParams();
  const { getFeedState, saveFeedState } = useNavigationState();
  const savedState = getFeedState("explore");
  const { currentHive } = useHive();

  // Initialize from saved state
  const [posts, setPosts] = React.useState<Post[]>(savedState?.posts || []);
  const [isLoading, setIsLoading] = React.useState(!savedState?.posts?.length);
  const [searchQuery, setSearchQuery] = React.useState(
    savedState?.filters?.searchQuery || "",
  );
  const [userResults, setUserResults] = React.useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = React.useState(false);
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = React.useState(
    savedState?.filters?.selectedRegion || "",
  );
  const [selectedHashtag, setSelectedHashtag] = React.useState(
    savedState?.filters?.selectedHashtag || "",
  );
  const [selectedCategory, setSelectedCategory] = React.useState(
    (savedState?.filters as any)?.selectedCategory || "Tout",
  );
  const { tap } = useHaptics();

  const CATEGORIES = [
    "Tout",
    "Humour",
    "Musique",
    "Jeux vidéo",
    "Sports",
    "Actualités",
    "Nourriture",
    "Mode",
    "Animaux",
    "Éducation",
  ];

  // Dynamic trending hashtags from API
  const [trendingFromApi, setTrendingFromApi] = React.useState<
    Array<{ tag: string; count: number }>
  >([]);
  const [isTrendingLoading, setIsTrendingLoading] = React.useState(false);

  const fetchTrending = useCallback(async (region: string) => {
    setIsTrendingLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("hive", currentHive.id);
      if (region) params.set("region", region);
      const res = await fetch(
        `/api/trending/hashtags${params.toString() ? `?${params.toString()}` : ""}`,
      );
      if (res.ok) {
        const data = await res.json();
        setTrendingFromApi(data.trending || []);
      }
    } catch {
      // fail silently
    } finally {
      setIsTrendingLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTrending(selectedRegion);
  }, [selectedRegion, fetchTrending]);

  // Debounced user search
  React.useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setUserResults([]);
      return;
    }
    setIsSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiCall(
          `/api/search?q=${encodeURIComponent(searchQuery)}&hive=${currentHive.id}`,
        );
        setUserResults((data as any)?.users || []);
      } catch {
        setUserResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refs for persistence
  const stateRef = React.useRef({
    posts,
    searchQuery,
    selectedRegion,
    selectedHashtag,
    selectedCategory,
  });

  React.useEffect(() => {
    stateRef.current = {
      posts,
      searchQuery,
      selectedRegion,
      selectedHashtag,
      selectedCategory,
    };
  }, [posts, searchQuery, selectedRegion, selectedHashtag, selectedCategory]);

  /** Deep link from captions: /explore?tag=Montreal */
  React.useEffect(() => {
    const raw = searchParams.get("tag");
    if (!raw?.trim()) return;
    const normalized = raw.trim().replace(/^#/, "");
    if (normalized) setSelectedHashtag(normalized);
  }, [searchParams]);

  // Save state on unmount
  React.useEffect(() => {
    // Restore scroll position if saved
    if (savedState) {
      window.scrollTo(0, savedState.scrollOffset);
    }

    return () => {
      saveFeedState("explore", {
        posts: stateRef.current.posts as Array<Post & { user: User }>,
        scrollOffset: window.scrollY,
        filters: {
          searchQuery: stateRef.current.searchQuery,
          selectedRegion: stateRef.current.selectedRegion,
          selectedHashtag: stateRef.current.selectedHashtag,
          selectedCategory: stateRef.current.selectedCategory,
        } as any,
      });
    };
  }, []); // Only run on mount/unmount

  // Memoize trending hashtags slice (constant array operation)
  // Performance optimization: Only compute once since QUEBEC_HASHTAGS doesn't change
  const trendingHashtags = useMemo(() => {
    return QUEBEC_HASHTAGS.slice(0, 10);
  }, []);

  // Fetch posts
  const fetchPosts = React.useCallback(async () => {
    // Skip fetch if we have saved posts and haven't changed filters
    if (
      savedState?.posts?.length &&
      searchQuery === savedState.filters?.searchQuery &&
      selectedRegion === savedState.filters?.selectedRegion &&
      selectedHashtag === savedState.filters?.selectedHashtag &&
      selectedCategory === (savedState.filters as any)?.selectedCategory
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Use the dedicated explore endpoint for better performance/discovery
      const { posts: explorePosts } = await getExplorePosts(
        0,
        50,
        selectedRegion,
        currentHive.id,
      );

      // Apply client-side filters for hashtag and search (since backend might not support them yet)
      let filtered = explorePosts;

      if (selectedHashtag) {
        const tagToSearch = selectedHashtag.startsWith("#")
          ? selectedHashtag.slice(1)
          : selectedHashtag;
        filtered = filtered.filter(
          (p) =>
            p.caption
              ?.toLowerCase()
              .includes(`#${tagToSearch.toLowerCase()}`) ||
            p.hashtags?.includes(tagToSearch),
        );
      }

      if (searchQuery) {
        filtered = filtered.filter(
          (p) =>
            p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      if (selectedCategory && selectedCategory !== "Tout") {
        // Map categories to simple keyword checks since we don't have hardcoded post categories yet
        const categoryMap: Record<string, string[]> = {
          Humour: ["drôle", "humour", "blague", "joke", "lol"],
          Musique: ["musique", "chanson", "music", "cover", "chanteur"],
          "Jeux vidéo": ["gaming", "jeu", "twitch", "gamer", "playstation"],
          Sports: ["sport", "hockey", "soccer", "gym", "workout", "fitness"],
          Actualités: ["nouvelles", "news", "politique", "actu"],
          Nourriture: ["recette", "food", "cuisine", "manger", "restaurant"],
          Mode: ["mode", "fashion", "ootd", "style", "vêtement"],
          Animaux: ["chien", "chat", "dog", "cat", "animal"],
          Éducation: ["apprendre", "tuto", "comment", "savoir", "education"],
        };

        const keywords = categoryMap[selectedCategory] || [];
        filtered = filtered.filter((p) => {
          const cap = (p.caption || "").toLowerCase();
          const tags = (p.hashtags || []).join(" ").toLowerCase();
          const text = `${cap} ${tags}`;
          return keywords.some((kw) => text.includes(kw));
        });
      }

      // Sort by fire_count for "Trending" feel
      filtered.sort((a, b) => (b.fire_count || 0) - (a.fire_count || 0));

      setPosts(filtered);
    } catch (error) {
      exploreLogger.error("Error fetching posts:", error);
      // Don't crash the whole page, just show empty state or toast
      toast.error("Impossible de charger les posts. Vérifie ta connexion.");
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedRegion,
    selectedHashtag,
    searchQuery,
    selectedCategory,
    savedState,
    currentHive.id,
  ]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 nav-leather border-b-2 border-leather-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-black text-gold-500 embossed tracking-tight">
            Découvrir
          </h1>
          <Link
            to="/map"
            onClick={tap}
            className="flex items-center gap-2 px-4 py-1.5 bg-black/40 border border-gold-500/40 rounded-full hover:bg-gold-500/10 transition-all group"
          >
            <span className="text-lg">📡</span>
            <span className="text-xs font-bold text-gold-400 group-hover:text-gold-200 uppercase tracking-widest">
              Vision Ruche
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
            </span>
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>

      {/* TikTok-style Category Chips (Sticky) */}
      <div className="sticky top-[60px] z-20 bg-black/90 backdrop-blur-md border-b border-white/5 py-3 px-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x max-w-7xl mx-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                tap();
                setSelectedCategory(category);
              }}
              className={`flex-shrink-0 snap-start px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              defaultValue={searchQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value) {
                  navigate(
                    `/search?q=${encodeURIComponent(e.currentTarget.value)}`,
                  );
                }
              }}
              placeholder="Recherche des posts, users, hashtags..."
              className="input-premium pl-14 pr-4"
              style={{ paddingLeft: "3.5rem" }}
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400 pointer-events-none z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Arcade entry card */}
        <button
          type="button"
          onClick={() => {
            tap();
            navigate("/arcade");
          }}
          className="w-full mb-6 rounded-md p-4 flex items-center gap-4 text-left transition-colors duration-200 cursor-pointer group arcade-explore-teaser"
          aria-label="Ouvrir l'Arcade Zyeuté"
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-sm border-2 border-[#00f3ff]/50 bg-black/50 flex items-center justify-center group-hover:border-[#ff2bd6]/60 transition-colors shadow-[0_0_16px_rgba(0,243,255,0.2)]">
            <Gamepad2 className="w-7 h-7 text-[#00f3ff]" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="arcade-font-pixel text-[#ffe600] uppercase tracking-wider text-[0.65rem] leading-relaxed">
                Arcade Zyeuté
              </h2>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#39ff14]/10 text-[#39ff14] px-2 py-0.5 rounded-sm border border-[#39ff14]/40">
                LIVE
              </span>
            </div>
            <p className="text-[#9eb4d8] text-sm mt-1">
              INSERT COIN — Grid Rush, Poutine, Carte Sucrée & Hive Tap
            </p>
          </div>
          <svg
            className="w-5 h-5 text-[#ff2bd6] flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Enhanced Trending Hashtags Component */}
        <QuebecHashtags />

        {/* Dynamic Tendances — live hashtags from API based on selected region */}
        {(trendingFromApi.length > 0 || isTrendingLoading) && (
          <div className="mb-6">
            <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
              <span>📈</span>
              <span>
                Tendances
                {selectedRegion
                  ? ` — ${QUEBEC_REGIONS.find((r) => r.id === selectedRegion)?.name || selectedRegion}`
                  : ""}
              </span>
            </h2>
            <div className="flex gap-2 overflow-x-auto gold-scrollbar pb-2">
              {isTrendingLoading
                ? [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 h-9 w-20 rounded-full bg-white/10 animate-pulse"
                    />
                  ))
                : trendingFromApi.map(({ tag, count }) => {
                    const tagWithoutHash = tag.startsWith("#")
                      ? tag.slice(1)
                      : tag;
                    const isSelected =
                      selectedHashtag === tag ||
                      selectedHashtag === tagWithoutHash;
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          tap();
                          const newTag = isSelected ? "" : tagWithoutHash;
                          setSelectedHashtag(newTag);
                          if (newTag) toast.info(`Filtre: #${newTag}`);
                        }}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected ? "btn-gold" : "btn-leather"
                        }`}
                      >
                        <span>{tag}</span>
                        {count > 1 && (
                          <span className="text-[10px] opacity-60">
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>
        )}

        {/* Original Trending Hashtags - Keep for filter functionality */}
        <div className="mb-6">
          <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
            <span>🔥</span>
            <span>Hashtags populaires</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto gold-scrollbar pb-2">
            {trendingHashtags.map((tag) => {
              const tagWithoutHash = tag.startsWith("#") ? tag.slice(1) : tag;
              const isSelected =
                selectedHashtag === tag || selectedHashtag === tagWithoutHash;

              return (
                <button
                  key={tag}
                  onClick={() => {
                    tap();
                    const newTag = isSelected ? "" : tagWithoutHash;
                    setSelectedHashtag(newTag);
                    if (newTag) {
                      toast.info(`Filtre: #${newTag}`);
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isSelected ? "btn-gold" : "btn-leather"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Filter */}
        <div className="mb-6">
          <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
            <span>📍</span>
            <span>Par région</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto gold-scrollbar pb-2">
            <button
              onClick={() => {
                tap();
                setSelectedRegion("");
                if (selectedRegion) {
                  toast.info("Filtre régional retiré");
                }
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedRegion === "" ? "btn-gold" : "btn-leather"
              }`}
            >
              Toutes
            </button>
            {QUEBEC_REGIONS.map((region) => {
              const isSelected = selectedRegion === region.id;

              return (
                <button
                  key={region.id}
                  onClick={() => {
                    tap();
                    const newRegion = isSelected ? "" : region.id;
                    setSelectedRegion(newRegion);
                    if (newRegion) {
                      toast.info(`Filtre: ${region.name}`);
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isSelected ? "btn-gold" : "btn-leather"
                  }`}
                >
                  {region.emoji} {region.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters */}
        {(selectedHashtag || selectedRegion || searchQuery) && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-leather-300 text-sm">Filtres actifs:</span>
            {searchQuery && (
              <span className="badge-premium text-xs">
                🔍 &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedHashtag && (
              <span className="badge-premium text-xs">
                🏷️ {selectedHashtag}
              </span>
            )}
            {selectedRegion && (
              <span className="badge-premium text-xs">
                📍 {QUEBEC_REGIONS.find((r) => r.id === selectedRegion)?.name}
              </span>
            )}
            <button
              onClick={() => {
                tap();
                setSearchQuery("");
                setSelectedHashtag("");
                setSelectedRegion("");
                toast.success("Filtres réinitialisés");
              }}
              className="text-gold-400 hover:text-gold-300 text-sm font-semibold transition-colors"
            >
              Effacer tout
            </button>
          </div>
        )}

        {/* User Search Results */}
        {searchQuery.length >= 2 && (
          <div className="mb-6">
            <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
              <span>👥</span>
              <span>Utilisateurs</span>
            </h2>
            {isSearchingUsers ? (
              <div className="overflow-x-auto flex gap-3 pb-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 min-w-[80px] animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/10" />
                    <div className="w-14 h-3 rounded bg-white/10" />
                    <div className="w-10 h-2 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : userResults.length === 0 ? (
              <p className="text-leather-300 text-sm py-2">
                Aucun utilisateur trouvé
              </p>
            ) : (
              <div className="overflow-x-auto flex gap-3 pb-2 gold-scrollbar">
                {userResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      tap();
                      navigate(`/profile/${user.username}`);
                    }}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 min-w-[80px] cursor-pointer hover:border-gold-400/50 transition-all"
                  >
                    <Avatar src={user.avatarUrl} size="md" userId={user.id} />
                    <span className="text-white text-xs font-semibold text-center truncate max-w-[72px]">
                      {user.displayName || user.username}
                    </span>
                    <span className="text-leather-300 text-xs truncate max-w-[72px]">
                      @{user.username}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posts Grid */}
        {posts.length === 0 && isLoading ? (
          <ExploreGridSkeleton />
        ) : posts.length === 0 ? (
          <div className="leather-card rounded-2xl p-12 text-center stitched">
            <div className="text-6xl mb-4">🦫</div>
            <h3 className="text-xl font-bold text-gold-500 mb-2">
              Aucun post trouvé
            </h3>
            <p className="text-leather-300 mb-6">
              Essaye de changer tes filtres ou explore d&apos;autres régions!
            </p>
            <button
              onClick={() => {
                tap();
                setSearchQuery("");
                setSelectedHashtag("");
                setSelectedRegion("");
                toast.success("Filtres réinitialisés");
              }}
              className="btn-gold px-8 py-3 rounded-xl"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <ErrorBoundary
            fallback={<ErrorFallback onRetry={() => fetchPosts()} />}
          >
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
              {posts.map((post) => (
                <div key={post.id} className="flex flex-col gap-2">
                  <Link
                    to={`/p/${post.id}`}
                    className="relative aspect-[9/16] leather-card rounded-xl overflow-hidden stitched-subtle hover:scale-105 transition-transform group"
                  >
                    <img
                      src={post.thumbnail_url || post.media_url}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%231a1a1a' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='60' fill='%23D4AF37'%3E⚜️%3C/text%3E%3C/svg%3E";
                      }}
                    />

                    {/* TikTok-style persistent play count overlay */}
                    {post.type === "video" && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white z-10 font-semibold text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        <svg
                          className="w-3 h-3 md:w-4 md:h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>
                          {formatNumber(post.view_count || post.fire_count * 5)}
                        </span>
                      </div>
                    )}

                    {/* Gradient at bottom for text readability */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    {/* Gold corner accent */}
                    <div
                      className="absolute top-0 right-0 w-6 h-6 bg-gold-gradient opacity-30"
                      style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                    />
                  </Link>

                  {/* Creator Context (TikTok style, below thumbnail) */}
                  {post.user && (
                    <div className="flex items-center gap-2 px-1 pb-1">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-leather-600 bg-leather-800">
                        {post.user?.avatar_url ? (
                          <img
                            src={post.user.avatar_url}
                            alt={post.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gold-500">
                            {post.user?.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span
                          className="text-white text-xs font-bold truncate hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/profile/${post.user?.username}`);
                          }}
                        >
                          {post.user?.display_name || post.user?.username}
                        </span>
                        <span className="text-leather-300 text-[10px] truncate">
                          @{post.user?.username}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ErrorBoundary>
        )}
      </div>

      {/* Quebec Pride Footer */}
      <div className="text-center py-8 text-leather-400 text-sm">
        <p className="flex items-center justify-center gap-2">
          <span className="text-gold-500">⚜️</span>
          <span>Découvre le meilleur du Québec</span>
          <span className="text-gold-500">🇨🇦</span>
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Explore;
