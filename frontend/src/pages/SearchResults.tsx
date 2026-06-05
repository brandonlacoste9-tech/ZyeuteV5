import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Header } from "../components/Header";
import { apiCall } from "../services/api";
import type { Post, User } from "../types";
import { useHive } from "../contexts/HiveContext";

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { currentHive } = useHive();

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"videos" | "users">("videos");

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const data = await apiCall(
          `/api/search?q=${encodeURIComponent(query)}&hive=${currentHive.id}`
        );
        setUsers((data as any)?.users || []);
        setPosts((data as any)?.posts || []);
      } catch (err) {
        console.error("Error fetching search results:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentHive.id]);

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {/* Search header info */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white mb-1">Résultats pour "{query}"</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("videos")}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === "videos" ? "text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            Vidéos
            {activeTab === "videos" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              activeTab === "users" ? "text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            Utilisateurs
            {activeTab === "users" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />
            )}
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700]"></div>
          </div>
        ) : activeTab === "videos" ? (
          posts.length === 0 ? (
            <div className="text-center py-20 text-white/50">Aucune vidéo trouvée.</div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="cursor-pointer group relative aspect-[3/4] overflow-hidden rounded-md md:rounded-lg"
                  onClick={() => navigate(`/p/${post.id}`)}
                >
                  <img
                    src={post.thumbnail_url || post.thumbnailUrl || post.media_url || ""}
                    alt={post.caption || "Vidéo"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold">
                      <span>▶</span> {post.view_count || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          users.length === 0 ? (
            <div className="text-center py-20 text-white/50">Aucun utilisateur trouvé.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <img 
                    src={user.avatar_url || user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{user.display_name || user.displayName || user.username}</h3>
                    <p className="text-white/60 text-sm">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SearchResults;
