/**
 * 🔖 Saved / Bookmarks Page
 * View and manage saved posts, videos, and content
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { cn } from "../lib/utils";

interface SavedItem {
  id: string;
  type: "video" | "image" | "post" | "audio";
  title: string;
  thumbnailUrl?: string;
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

interface Collection {
  id: string;
  name: string;
  count: number;
  coverUrl?: string;
}

// Mock data
const mockCollections: Collection[] = [
  { id: "all", name: "Tous les éléments", count: 24 },
  { id: "watch-later", name: "À regarder plus tard", count: 8 },
  { id: "favorites", name: "Favoris", count: 12 },
  { id: "inspiration", name: "Inspiration", count: 4 },
];

const mockSavedItems: SavedItem[] = [
  {
    id: "1",
    type: "video",
    title: "Poutine challenge au Québec",
    creator: { username: "marie_mtl", displayName: "Marie Lavoie" },
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    duration: "2:34",
    likes: 1234,
    collection: "watch-later",
  },
  {
    id: "2",
    type: "image",
    title: "Sunset sur le Mont-Royal",
    creator: { username: "photo_qc", displayName: "Photos Québec" },
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    likes: 5678,
    collection: "favorites",
  },
  {
    id: "3",
    type: "video",
    title: "Vlog: Une journée à Québec City",
    creator: { username: "alex_514", displayName: "Alexandre" },
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    duration: "12:45",
    likes: 890,
    collection: "watch-later",
  },
  {
    id: "4",
    type: "post",
    title: "Les meilleures expressions québécoises",
    creator: { username: "culture_qc", displayName: "Culture Québec" },
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    likes: 2345,
    collection: "favorites",
  },
  {
    id: "5",
    type: "audio",
    title: "Podcast: L'histoire de la poutine",
    creator: { username: "food_talk", displayName: "Food Talk MTL" },
    savedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    duration: "45:00",
    likes: 567,
  },
];

export const Saved: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredItems =
    selectedCollection === "all"
      ? mockSavedItems
      : mockSavedItems.filter((item) => item.collection === selectedCollection);

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
        {/* Collections */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Collections
            </h2>
            <button className="text-sm text-gold-600 hover:underline">
              + Nouvelle collection
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {mockCollections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-3 rounded-xl transition-all",
                  selectedCollection === collection.id
                    ? "bg-gradient-to-r from-gold-400 to-gold-600 text-black"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
                )}
              >
                <p
                  className={cn(
                    "font-medium",
                    selectedCollection === collection.id
                      ? "text-black"
                      : "text-gray-900 dark:text-white",
                  )}
                >
                  {collection.name}
                </p>
                <p
                  className={cn(
                    "text-sm",
                    selectedCollection === collection.id
                      ? "text-black/70"
                      : "text-gray-500",
                  )}
                >
                  {collection.count} éléments
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredItems.length} élément{filteredItems.length > 1 ? "s" : ""}
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

        {/* Saved Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
              Aucun élément sauvegardé
            </h3>
            <p className="text-gray-500 mb-4">
              Sauvegarde du contenu pour le retrouver facilement!
            </p>
            <Link
              to="/explore"
              className="inline-block px-6 py-2 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-semibold rounded-full"
            >
              Explorer
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
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
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
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
                    {item.likes && (
                      <span className="text-xs text-gray-400">
                        • {item.likes.toLocaleString()} 🔥
                      </span>
                    )}
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Saved;
