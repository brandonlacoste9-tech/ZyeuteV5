/**
 * 🔖 Saved / Bookmarks Page
 * View and manage saved posts, videos, and content
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { cn } from "../lib/utils";
import { BottomNav } from "../components/BottomNav";
import { apiCall } from "@/services/api";

interface SavedItem {
  id: string;
  type: "video" | "image" | "post" | "audio";
  title: string;
  thumbnail?: string | null;
  creator: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  savedAt: Date;
  duration?: string;
  likes?: number;
  collection?: string;
}

export const Saved: React.FC = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [unsavingIds, setUnsavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSaved = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await apiCall<{ saved: any[] }>(
          "/users/me/saved",
        );
        if (error || !data) {
          setSavedItems([]);
          setSavedIds(new Set());
          return;
        }
        const mapped: SavedItem[] = (data.saved || []).map((s: any) => ({
          id: s.post?.id || s.id,
          type: (s.post?.type || "video") as SavedItem["type"],
          title: s.post?.caption || "Sans titre",
          creator: {
            username: s.post?.user?.username || "unknown",
            displayName:
              s.post?.user?.display_name ||
              s.post?.user?.username ||
              "Utilisateur",
          },
          thumbnail:
            s.post?.thumbnail_url ||
            (s.post?.mux_playback_id
              ? `https://image.mux.com/${s.post.mux_playback_id}/thumbnail.jpg?width=200&height=356&fit_mode=smartcrop`
              : null),
          savedAt: new Date(s.savedAt),
          likes: s.post?.reactions_count || 0,
          collection: "all",
        }));
        setSavedItems(mapped);
        setSavedIds(new Set(mapped.map((m) => m.id)));
      } catch (err) {
        console.error("[Saved] Failed to fetch saved posts:", err);
        setSavedItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaved();
  }, []);

  const handleUnsave = async (postId: string) => {
    // Optimistic update
    setSavedItems((prev) => prev.filter((item) => item.id !== postId));
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
    setUnsavingIds((prev) => new Set(prev).add(postId));

    try {
      await apiCall(`/users/me/saved/${postId}`, { method: "DELETE" });
    } catch (err) {
      console.error("[Saved] Failed to unsave post:", err);
      // Could restore item here, but optimistic removal is fine for UX
    } finally {
      setUnsavingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString("fr-CA");
  };

  const getTypeIcon = (type: SavedItem["type"]) => {
    switch (type) {
      case "video":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "image":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "post":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case "audio":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      <Header title="Sauvegardés" showBack />

      <main className="max-w-6xl mx-auto p-4">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement...
            </p>
          </div>
        ) : savedItems.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun post sauvegardé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Appuie sur 🔖 dans les vidéos pour les retrouver ici!
            </p>
            <Link
              to="/explore"
              className="inline-block px-6 py-2 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-semibold rounded-full"
            >
              Explorer
            </Link>
          </div>
        ) : (
          <>
            {/* View Toggle + Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {savedItems.length} élément{savedItems.length > 1 ? "s" : ""}
              </p>
              <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded",
                    viewMode === "grid"
                      ? "bg-gold-400 text-black"
                      : "text-gray-500",
                  )}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded",
                    viewMode === "list"
                      ? "bg-gold-400 text-black"
                      : "text-gray-500",
                  )}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Saved Items — Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                      {item.duration && (
                        <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {item.duration}
                        </span>
                      )}
                      <div className="absolute top-2 left-2 p-1.5 bg-black/50 rounded-full text-white">
                        {getTypeIcon(item.type)}
                      </div>
                      {/* Unsave button */}
                      <button
                        onClick={() => handleUnsave(item.id)}
                        disabled={unsavingIds.has(item.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-gold-400 transition-colors"
                        title="Retirer des sauvegardés"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        @{item.creator.username}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(item.savedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Saved Items — List */
              <div className="space-y-3">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          {getTypeIcon(item.type)}
                        </div>
                      )}
                      {item.duration && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                          {item.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{item.creator.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatDate(item.savedAt)}
                        </span>
                        {item.likes ? (
                          <span className="text-xs text-gray-400">
                            • {item.likes.toLocaleString()} 🔥
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {/* Unsave button */}
                    <button
                      onClick={() => handleUnsave(item.id)}
                      disabled={unsavingIds.has(item.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gold-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Retirer des sauvegardés"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Saved;
