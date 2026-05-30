/**
 * LiveDiscover Page - Discover and browse live streams
 * Features: Grid/list view, search, filters, trending highlights
 */

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";

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
  const [isLoading, setIsLoading] = useState(true);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);

  // Fetch real active streams from Supabase
  useEffect(() => {
    const fetchStreams = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("live_streams")
          .select(
            `
            id,
            user_id,
            title,
            category,
            playback_id,
            viewer_count,
            started_at,
            user_profiles!user_id (
              username,
              display_name,
              avatar_url
            )
          `,
          )
          .eq("status", "active")
          .order("started_at", { ascending: false });

        if (error) throw error;

        const mapped: LiveStream[] = (data || []).map((row: any) => ({
          id: row.id,
          creator_id: row.user_id,
          creator_name:
            row.user_profiles?.display_name ||
            row.user_profiles?.username ||
            "Créateur",
          creator_username: row.user_profiles?.username || "unknown",
          creator_avatar:
            row.user_profiles?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
          title: row.title,
          thumbnail_url: row.playback_id
            ? `https://image.mux.com/${row.playback_id}/thumbnail.jpg`
            : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop",
          viewer_count: row.viewer_count || 0,
          category: row.category,
          tags: [],
          is_trending: row.viewer_count > 100,
          is_featured: false,
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
   * Filter streams based on search query and selected category
   */
  const filteredStreams = useMemo(() => {
    let streams = [...liveStreams];

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
  }, [searchQuery, selectedCategory, liveStreams]);

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
              Aucun stream trouvé
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery || selectedCategory !== "all"
                ? "Essaye une autre recherche ou catégorie"
                : "Sois le premier à aller live!"}
            </p>
            <Button
              onClick={handleGoLive}
              className="bg-red-600 hover:bg-red-700"
            >
              🎥 Go Live
            </Button>
          </div>
        ) : (
          <>
            {/* Trending/Featured Section */}
            {selectedCategory === "all" && !searchQuery && (
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
                          {/* Viewer Count */}
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
                {selectedCategory !== "all" || searchQuery
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
                      {/* Viewer Count */}
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
                          <span className="inline-block text-xs bg-white/10 text-white/70 px-1.5 py-0.5 rounded mt-1">
                            {stream.category}
                          </span>
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
