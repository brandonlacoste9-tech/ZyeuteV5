/**
 * 📊 Activity / Recent Activity Page
 * View recent interactions, notifications, and activity feed
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { cn } from "../lib/utils";

type ActivityType =
  | "like"
  | "comment"
  | "follow"
  | "mention"
  | "share"
  | "save"
  | "tip"
  | "collab";

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  content?: string;
  targetPost?: {
    id: string;
    title: string;
    thumbnailUrl?: string;
  };
  timestamp: Date;
  isRead: boolean;
  amount?: number; // For tips
}

// Mock data
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "like",
    user: {
      username: "marie_mtl",
      displayName: "Marie Lavoie",
      isVerified: true,
    },
    targetPost: { id: "p1", title: "Ma poutine du vendredi soir 🍟" },
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isRead: false,
  },
  {
    id: "2",
    type: "comment",
    user: { username: "alex_514", displayName: "Alexandre" },
    content: "Trop drôle! 😂 T'es le meilleur!",
    targetPost: { id: "p2", title: "Les expressions québécoises" },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
  },
  {
    id: "3",
    type: "follow",
    user: {
      username: "photo_qc",
      displayName: "Photos Québec",
      isVerified: true,
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: false,
  },
  {
    id: "4",
    type: "tip",
    user: { username: "fan_loyal", displayName: "Super Fan" },
    amount: 5,
    targetPost: { id: "p3", title: "Vlog: Journée au Vieux-Port" },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isRead: true,
  },
  {
    id: "5",
    type: "mention",
    user: { username: "culture_qc", displayName: "Culture Québec" },
    content: "Venez voir ce que @toi a partagé sur le Festival de Jazz!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    isRead: true,
  },
  {
    id: "6",
    type: "share",
    user: { username: "food_lover", displayName: "Gourmand MTL" },
    targetPost: { id: "p4", title: "Best bagels in Montreal" },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    isRead: true,
  },
  {
    id: "7",
    type: "collab",
    user: {
      username: "creator_pro",
      displayName: "Pro Creator",
      isVerified: true,
    },
    content: "veut collaborer avec toi sur un projet!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
  },
  {
    id: "8",
    type: "save",
    user: { username: "new_follower", displayName: "Nouveau Fan" },
    targetPost: { id: "p5", title: "Tutorial: Créer du contenu viral" },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    isRead: true,
  },
];

export const Activity: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "unread" | ActivityType>("all");

  const filteredActivities = mockActivities.filter((activity) => {
    if (filter === "all") return true;
    if (filter === "unread") return !activity.isRead;
    return activity.type === filter;
  });

  const unreadCount = mockActivities.filter((a) => !a.isRead).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString("fr-CA");
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "like":
        return (
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case "comment":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        );
      case "follow":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        );
      case "mention":
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">@</span>
          </div>
        );
      case "share":
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </div>
        );
      case "save":
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        );
      case "tip":
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 flex items-center justify-center">
            <span className="text-black font-bold text-sm">$</span>
          </div>
        );
      case "collab":
        return (
          <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        );
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "like":
        return `a aimé ton post`;
      case "comment":
        return `a commenté`;
      case "follow":
        return `a commencé à te suivre`;
      case "mention":
        return `t'a mentionné`;
      case "share":
        return `a partagé ton post`;
      case "save":
        return `a sauvegardé ton post`;
      case "tip":
        return `t'a envoyé ${activity.amount}$`;
      case "collab":
        return activity.content || `veut collaborer`;
    }
  };

  const filterOptions: { value: typeof filter; label: string }[] = [
    { value: "all", label: "Tout" },
    { value: "unread", label: `Non lus (${unreadCount})` },
    { value: "like", label: "J'aime" },
    { value: "comment", label: "Commentaires" },
    { value: "follow", label: "Abonnés" },
    { value: "mention", label: "Mentions" },
    { value: "tip", label: "Tips" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      <Header title="Activité" showBack />

      <main className="max-w-2xl mx-auto p-4">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === option.value
                  ? "bg-gradient-to-r from-gold-400 to-gold-600 text-black"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <button className="w-full py-2 mb-4 text-sm text-gold-600 hover:text-gold-700 font-medium">
            Marquer tout comme lu
          </button>
        )}

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune activité
            </h3>
            <p className="text-gray-500">Tes interactions apparaîtront ici!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer",
                  activity.isRead
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gold-50 dark:bg-gold-900/20 border-l-4 border-gold-400",
                )}
              >
                {/* Activity Icon */}
                {getActivityIcon(activity.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">
                      {activity.user.displayName}
                    </span>
                    {activity.user.isVerified && (
                      <svg
                        className="w-3.5 h-3.5 inline ml-1 text-gold-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="text-gray-600 dark:text-gray-400">
                      {" "}
                      {getActivityText(activity)}
                    </span>
                  </p>

                  {/* Comment content */}
                  {activity.type === "comment" && activity.content && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      "{activity.content}"
                    </p>
                  )}

                  {/* Target post */}
                  {activity.targetPost && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      📄 {activity.targetPost.title}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>

                {/* Thumbnail or Action */}
                {activity.targetPost?.thumbnailUrl ? (
                  <img
                    src={activity.targetPost.thumbnailUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : activity.type === "follow" ? (
                  <button className="px-3 py-1.5 bg-gradient-to-r from-gold-400 to-gold-600 text-black text-sm font-semibold rounded-full hover:shadow-lg transition-all">
                    Suivre
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredActivities.length > 0 && (
          <button className="w-full py-3 mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Voir plus d'activité
          </button>
        )}
      </main>
    </div>
  );
};

export default Activity;
