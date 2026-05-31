/**
 * LiveDiscover Page - Discover and browse live streams
 * Features: Grid/list view, search, filters, region tabs, trending highlights
 */

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || "https://zyeutev5-1.onrender.com";

/**
 * Interface for a live stream
 */
interface LiveStream {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_username: string;
  creator_avatar: string;
  title: string;
  thumbnail_url: string;
  viewer_count: number;
  category: string;
  region: string;
  tags: string[];
  is_trending: boolean;
  is_featured: boolean;
  started_at: string;
}

/**
 * Available categories for filtering
 */
const CATEGORIES = [
  { id: "all", name: "Tout", icon: "📺" },
  { id: "Art", name: "Art", icon: "🎨" },
  { id: "Musique", name: "Musique", icon: "🎵" },
  { id: "Gaming", name: "Gaming", icon: "🎮" },
  { id: "Cuisine", name: "Cuisine", icon: "🍳" },
  { id: "Fitness", name: "Fitness", icon: "💪" },
  { id: "Tech", name: "Tech", icon: "💻" },
  { id: "Beauté", name: "Beauté", icon: "💄" },
  { id: "Sports", name: "Sports", icon: "⚽" },
];

/**
 * Regions matching the Explore page
 */
const REGIONS = [
  { id: "all", name: "Tout le Québec", icon: "🍁" },
  { id: "montreal", name: "Montréal", icon: "🏙️" },
  { id: "quebec", name: "Québec", icon: "🏰" },
  { id: "laval", name: "Laval", icon: "🌆" },
  { id: "longueuil", name: "Longueuil", icon: "🌉" },
  { id: "sherbrooke", name: "Sherbrooke", icon: "🌲" },
  { id: "saguenay", name: "Saguenay", icon: "🏔️" },
  { id: "gatineau", name: "Gatineau", icon: "🌳" },
];

/**
 * Format viewer count for display
 */
const formatViewerCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * LiveDiscover component - Main page for discovering live streams
 */
const LiveDiscover: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

  // Fetch real active streams from API
  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/live`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const { streams } = await res.json();

        const mapped: LiveStream[] = (streams || []).map((row: any) => ({
          id: row.id,
          creator_id: row.user_id,
          creator_name: row.user?.username || "Créateur",
          creator_username: row.user?.username || "unknown",
          creator_avatar:
            row.user?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
          title: row.title,
          thumbnail_url: row.mux_playback_id
            ? `https://image.mux.com/${row.mux_playback_id}/thumbnail.jpg`
            : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop",
          viewer_count: row.viewer_count || 0,
          category: row.category || "général",
          region: row.region || "montreal",
          tags: [],
          is_trending: (row.viewer_count || 0) > 100,
          is_featured: row.user?.subscription_tier === "or",
          started_at: row.started_at,
        }));

        setLiveStreams(mapped);
      } catch (err) {
        console.error("[LiveDiscover] Failed to fetch streams:", err);
        setLiveStreams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreams();

    // Poll every 30s to update viewer counts / new streams
    const interval = setInterval(fetchStreams, 30_000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Filter streams based on search query, category, and region
   */
  const filteredStreams = useMemo(() => {
    let streams = [...liveStreams];

    // Filter by region
    if (selectedRegion !== "all") {
      streams = streams.filter((stream) => stream.region === selectedRegion);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      streams = streams.filter(
        (stream) => stream.category === selectedCategory,
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      streams = streams.filter(
        (stream) =>
          stream.title.toLowerCase().includes(query) ||
          stream.creator_name.toLowerCase().includes(query) ||
          stream.creator_username.toLowerCase().includes(query) ||
          stream.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return streams;
  }, [searchQuery, selectedCategory, selectedRegion, liveStreams]);

  /**
   * Handle navigation to watch a live stream
   */
  const handleWatchStream = (streamId: string) => {
    navigate(`/live/watch/${streamId}`);
  };

  /**
   * Handle navigation to go live
   */
  const handleGoLive = () => {
    navigate("/live/go");
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              🔴 Live Discover
            </h1>
            <p className="text-white/60 mt-1">
              {liveStreams.length} stream{liveStreams.length !== 1 ? "s" : ""}{" "}
              en direct
            </p>
          </div>
          <Button
            onClick={handleGoLive}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            🎥 Go Live
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher streams, créateurs, tags..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        {/* Region Tabs */}
        <div className="mb-6">
          <h2 className="text-white font-bold mb-3">Région</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedRegion === region.id
                    ? "bg-gold-gradient text-black"
                    : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {region.icon} {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-white font-bold mb-3">Catégories</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === category.id
                    ? "bg-gold-gradient text-black"
                    : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-white/10" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStreams.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchQuery ||
              selectedCategory !== "all" ||
              selectedRegion !== "all"
                ? "Aucun stream trouvé"
                : "Personne n'est en direct pour l'instant. Sois le premier! 🎬"}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery ||
              selectedCategory !== "all" ||
              selectedRegion !== "all"
                ? "Essaye une autre recherche, catégorie ou région"
                : "Lance ton live et connecte avec ta communauté québécoise"}
            </p>
            <Button
              onClick={handleGoLive}
              className="bg-red-600 hover:bg-red-700"
            >
              🎥 Commencer un live
            </Button>
          </div>
        ) : (
          <>
            {/* Trending/Featured Section */}
            {selectedCategory === "all" &&
              selectedRegion === "all" &&
              !searchQuery && (
                <div className="mb-8">
                  <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                    🔥 Tendances & En vedette
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    {filteredStreams
                      .filter(
                        (stream) => stream.is_trending || stream.is_featured,
                      )
                      .slice(0, 2)
                      .map((stream) => (
                        <div
                          key={stream.id}
                          onClick={() => handleWatchStream(stream.id)}
                          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer group"
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={stream.thumbnail_url}
                              alt={stream.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Live Badge */}
                            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              LIVE
                            </div>
                            {/* Viewer Count Badge */}
                            <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
                              👁️ {formatViewerCount(stream.viewer_count)}
                            </div>
                            {/* Trending/Featured Badge */}
                            {stream.is_trending && (
                              <div className="absolute bottom-3 left-3 bg-gold-500 text-black px-2 py-1 rounded text-xs font-bold">
                                🔥 TRENDING
                              </div>
                            )}
                            {stream.is_featured && (
                              <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                                ⭐ FEATURED
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <img
                                src={stream.creator_avatar}
                                alt={stream.creator_name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white mb-1 line-clamp-2">
                                  {stream.title}
                                </h3>
                                <p className="text-white/60 text-sm">
                                  {stream.creator_name}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded">
                                    {stream.category}
                                  </span>
                                  {stream.region &&
                                    stream.region !== "montreal" && (
                                      <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-1 rounded">
                                        {REGIONS.find(
                                          (r) => r.id === stream.region,
                                        )?.name || stream.region}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* All Streams Grid */}
            <div className="mb-6">
              <h2 className="text-white font-bold mb-4">
                {selectedCategory !== "all" ||
                selectedRegion !== "all" ||
                searchQuery
                  ? "Résultats"
                  : "Tous les streams"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStreams.map((stream) => (
                  <div
                    key={stream.id}
                    onClick={() => handleWatchStream(stream.id)}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={stream.thumbnail_url}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Live Badge */}
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      {/* Viewer Count Badge */}
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-bold">
                        👁️ {formatViewerCount(stream.viewer_count)}
                      </div>
                      {/* Trending Badge */}
                      {stream.is_trending && (
                        <div className="absolute bottom-2 left-2 bg-gold-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                          🔥
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <img
                          src={stream.creator_avatar}
                          alt={stream.creator_name}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm mb-0.5 line-clamp-2">
                            {stream.title}
                          </h3>
                          <p className="text-white/60 text-xs truncate">
                            {stream.creator_name}
                          </p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="inline-block text-xs bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                              {stream.category}
                            </span>
                            {stream.region && (
                              <span className="inline-block text-xs bg-gold-500/15 text-gold-400 px-1.5 py-0.5 rounded">
                                {REGIONS.find((r) => r.id === stream.region)
                                  ?.icon || "🍁"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default LiveDiscover;
