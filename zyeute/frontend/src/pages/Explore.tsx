/**
 * Explore Page - Premium Quebec Heritage Design
 * Discover trending content with leather grid and gold filters
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { getExplorePosts, getDiscoverPosts } from "@/services/api";
import { QUEBEC_HASHTAGS, QUEBEC_REGIONS } from "@/lib/quebecFeatures";
import { formatNumber } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "@/components/Toast";
import { useNavigationState } from "@/contexts/NavigationStateContext";
import type { Post, User } from "@/types";
import { logger } from "@/lib/logger";
import { QuebecHashtags } from "@/components/trending/QuebecHashtags";
import { ArcadeBanner } from "@/components/marketing/ArcadeBanner";
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary";
import { ExploreGridSkeleton } from "@/components/ui/Skeleton";

const exploreLogger = logger.withContext("Explore");

export const Explore: React.FC = () => {
  const { getFeedState, saveFeedState } = useNavigationState();
  const savedState = getFeedState("explore");

  // Initialize from saved state
  const [posts, setPosts] = React.useState<Post[]>(savedState?.posts || []);
  const [isLoading, setIsLoading] = React.useState(!savedState?.posts?.length);
  const [searchQuery, setSearchQuery] = React.useState(
    savedState?.filters?.searchQuery || "",
  );
  const [selectedRegion, setSelectedRegion] = React.useState(
    savedState?.filters?.selectedRegion || "",
  );
  const [selectedHashtag, setSelectedHashtag] = React.useState(
    savedState?.filters?.selectedHashtag || "",
  );
  const [activeTab, setActiveTab] = React.useState<"trending" | "regional" | "discover">(
    (savedState?.filters?.activeTab as any) || "trending",
  );
  const [selectedVibe, setSelectedVibe] = React.useState<string>("");
  const [selectedAITags, setSelectedAITags] = React.useState<string[]>([]);
  const { tap } = useHaptics();

  // Refs for persistence
  const stateRef = React.useRef({
    posts,
    searchQuery,
    selectedRegion,
    selectedHashtag,
  });

  React.useEffect(() => {
    stateRef.current = { posts, searchQuery, selectedRegion, selectedHashtag };
  }, [posts, searchQuery, selectedRegion, selectedHashtag]);

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
          activeTab,
          selectedVibe,
          selectedAITags,
        },
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
      activeTab === savedState.filters?.activeTab
    ) {
      return;
    }

    setIsLoading(true);
    try {
      let explorePosts: Post[] = [];

      if (activeTab === "discover") {
        // Use discovery feed
        if (selectedVibe) {
          explorePosts = await getDiscoverPosts({
            type: "vibe",
            vibe: selectedVibe,
            limit: 50,
          });
        } else if (selectedAITags.length > 0) {
          explorePosts = await getDiscoverPosts({
            type: "tags",
            query: selectedAITags.join(","),
            limit: 50,
          });
        } else {
          // Default: get recommended posts (if user is logged in) or trending
          try {
            explorePosts = await getDiscoverPosts({
              type: "recommended",
              limit: 50,
            });
          } catch (error: any) {
            // If not authenticated, fallback to trending
            if (
              error?.message?.includes("401") ||
              error?.message?.includes("Authentication") ||
              error?.message?.includes("Unauthorized")
            ) {
              exploreLogger.info(
                "User not authenticated, falling back to trending",
              );
              explorePosts = await getExplorePosts(0, 50);
            } else {
              throw error;
            }
          }
        }
      } else {
        // Use the dedicated explore endpoint for better performance/discovery
        explorePosts = await getExplorePosts(0, 50, selectedRegion);
      }

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
  }, [selectedRegion, selectedHashtag, searchQuery, activeTab, selectedVibe, selectedAITags]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 nav-leather border-b-2 border-leather-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-2xl font-black text-gold-500 embossed tracking-tight">
            Découvrir
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b-2 border-leather-700/50">
          <button
            onClick={() => {
              tap();
              setActiveTab("trending");
            }}
            className={`px-4 py-2 font-bold transition-all ${
              activeTab === "trending"
                ? "text-gold-400 border-b-2 border-gold-500"
                : "text-leather-400 hover:text-leather-300"
            }`}
          >
            🔥 Trending
          </button>
          <button
            onClick={() => {
              tap();
              setActiveTab("regional");
            }}
            className={`px-4 py-2 font-bold transition-all ${
              activeTab === "regional"
                ? "text-gold-400 border-b-2 border-gold-500"
                : "text-leather-400 hover:text-leather-300"
            }`}
          >
            📍 Régional
          </button>
          <button
            onClick={() => {
              tap();
              setActiveTab("discover");
            }}
            className={`px-4 py-2 font-bold transition-all ${
              activeTab === "discover"
                ? "text-gold-400 border-b-2 border-gold-500"
                : "text-leather-400 hover:text-leather-300"
            }`}
          >
            ✨ Découvrir
          </button>
        </div>

        {/* Discover Tab Content */}
        {activeTab === "discover" && (
          <div className="mb-6 space-y-6">
            {/* Vibe Selector */}
            <div>
              <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
                <span>🎭</span>
                <span>Vibe</span>
              </h2>
              <div className="flex gap-2 overflow-x-auto gold-scrollbar pb-2">
                {[
                  { id: "party", emoji: "🎉", label: "Party" },
                  { id: "chill", emoji: "😌", label: "Chill" },
                  { id: "nature", emoji: "🌲", label: "Nature" },
                  { id: "food", emoji: "🍕", label: "Food" },
                  { id: "urban", emoji: "🏙️", label: "Urban" },
                  { id: "art", emoji: "🎨", label: "Art" },
                ].map((vibe) => (
                  <button
                    key={vibe.id}
                    onClick={() => {
                      tap();
                      const newVibe = selectedVibe === vibe.id ? "" : vibe.id;
                      setSelectedVibe(newVibe);
                      setSelectedAITags([]); // Clear tags when selecting vibe
                      if (newVibe) {
                        toast.info(`Vibe: ${vibe.label}`);
                      }
                    }}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                      selectedVibe === vibe.id ? "btn-gold" : "btn-leather"
                    }`}
                  >
                    <span>{vibe.emoji}</span>
                    <span>{vibe.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Tags Cloud */}
            <div>
              <h2 className="text-gold-400 font-bold mb-3 embossed flex items-center gap-2">
                <span>🤖</span>
                <span>Tags AI</span>
              </h2>
              <div className="flex gap-2 flex-wrap">
                {/* Extract unique AI tags from current posts */}
                {Array.from(
                  new Set(
                    posts
                      .flatMap((p) => p.ai_labels || [])
                      .filter((tag): tag is string => typeof tag === "string")
                  )
                )
                  .slice(0, 20)
                  .map((tag) => {
                    const isSelected = selectedAITags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          tap();
                          const newTags = isSelected
                            ? selectedAITags.filter((t) => t !== tag)
                            : [...selectedAITags, tag];
                          setSelectedAITags(newTags);
                          setSelectedVibe(""); // Clear vibe when selecting tags
                          if (newTags.length > 0) {
                            toast.info(`Tags: ${newTags.join(", ")}`);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          isSelected ? "btn-gold" : "btn-leather"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                {posts.length === 0 && (
                  <p className="text-leather-400 text-sm">
                    Upload des vidéos pour voir les tags AI générés
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Enhanced Trending Hashtags Component */}
        <ArcadeBanner />

        <QuebecHashtags />

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
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isSelected ? "btn-gold" : "btn-leather"
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Filter (only show for trending/regional tabs) */}
        {(activeTab === "trending" || activeTab === "regional") && (
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${selectedRegion === "" ? "btn-gold" : "btn-leather"
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
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isSelected ? "btn-gold" : "btn-leather"
                    }`}
                >
                  {region.emoji} {region.name}
                </button>
              );
            })}
          </div>
          </div>
        )}

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
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/p/${post.id}`}
                  className="relative aspect-square leather-card rounded-xl overflow-hidden stitched-subtle hover:scale-105 transition-transform group"
                >
                  <img
                    src={post.thumbnail_url || post.media_url}
                    alt={post.caption || "Post"}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                      {/* Stats */}
                      <div className="flex items-center gap-3 text-white text-sm">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-orange-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          </svg>
                          <span className="font-bold">
                            {formatNumber(post.fire_count)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="font-bold">
                            {formatNumber(post.comment_count)}
                          </span>
                        </div>
                      </div>

                      {/* User */}
                      {post.user && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-xs font-bold">
                            {post.user.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-white text-xs font-semibold truncate">
                            @{post.user.username}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gold corner accent */}
                  <div
                    className="absolute top-0 right-0 w-6 h-6 bg-gold-gradient opacity-30"
                    style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                  />
                </Link>
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
    </div>
  );
};

export default Explore;
