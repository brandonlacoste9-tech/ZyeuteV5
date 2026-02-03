/**
 * 📜 Chat History Page
 * View history of Ti-Guy conversations and AI interactions
 */

import React, { useState } from "react";
import { Header } from "../components/layout/Header";
import { cn } from "../lib/utils";

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
  type: "ti-guy" | "ai-studio" | "support";
}

// Mock data
const mockChatHistory: ChatSession[] = [
  {
    id: "1",
    title: "Recommandations poutine",
    preview:
      "J'ai demandé à Ti-Guy les meilleurs spots de poutine à Montréal...",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messageCount: 12,
    type: "ti-guy",
  },
  {
    id: "2",
    title: "Génération d'image",
    preview: "Image du Mont-Royal au coucher du soleil",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    messageCount: 5,
    type: "ai-studio",
  },
  {
    id: "3",
    title: "Stats des Canadiens",
    preview: "Discussion sur les stats des Habs cette saison",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messageCount: 8,
    type: "ti-guy",
  },
  {
    id: "4",
    title: "Question compte Premium",
    preview: "Comment activer les fonctionnalités VIP",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    messageCount: 4,
    type: "support",
  },
  {
    id: "5",
    title: "Création de vidéo",
    preview: "Vidéo des aurores boréales au Québec",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    messageCount: 7,
    type: "ai-studio",
  },
];

export const ChatHistory: React.FC = () => {
  const [filter, setFilter] = useState<
    "all" | "ti-guy" | "ai-studio" | "support"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = mockChatHistory.filter((session) => {
    if (filter !== "all" && session.type !== filter) return false;
    if (
      searchQuery &&
      !session.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
  };

  const getTypeIcon = (type: ChatSession["type"]) => {
    switch (type) {
      case "ti-guy":
        return "🦫";
      case "ai-studio":
        return "🎨";
      case "support":
        return "💬";
    }
  };

  const getTypeLabel = (type: ChatSession["type"]) => {
    switch (type) {
      case "ti-guy":
        return "Ti-Guy";
      case "ai-studio":
        return "AI Studio";
      case "support":
        return "Support";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Historique des chats" showBack />

      <main className="max-w-3xl mx-auto p-4">
        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher dans l'historique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-sm"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {(["all", "ti-guy", "ai-studio", "support"] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    filter === type
                      ? "bg-gradient-to-r from-gold-400 to-gold-600 text-black"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
                  )}
                >
                  {type === "all" ? "Tous" : getTypeIcon(type)}{" "}
                  {type !== "all" && getTypeLabel(type)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Chat Sessions */}
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>Aucune conversation trouvée</p>
            </div>
          ) : (
            filteredHistory.map((session) => (
              <button
                key={session.id}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-xl">
                    {getTypeIcon(session.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {session.title}
                      </h3>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatDate(session.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {session.preview}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {getTypeLabel(session.type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {session.messageCount} messages
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-gradient-to-r from-gold-400/10 to-gold-600/10 rounded-xl border border-gold-400/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>🦫</span> Parler à Ti-Guy
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Continue une conversation ou commence-en une nouvelle!
          </p>
          <button className="px-4 py-2 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-semibold rounded-full hover:opacity-90 transition-opacity">
            Nouvelle conversation
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChatHistory;
