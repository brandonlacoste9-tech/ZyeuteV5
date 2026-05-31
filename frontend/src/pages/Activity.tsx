/**
 * 📊 Activité — Notifications en temps réel
 * Vue des interactions, notifications et activité récente
 */

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { PushNotificationBell } from "../components/PushNotificationBell";
import { cn } from "../lib/utils";
import { BottomNav } from "../components/BottomNav";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";
import type { Notification } from "../types";

type NotifType = Notification["type"];
type FilterType = "all" | "unread" | NotifType;

export const Activity: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [markingAll, setMarkingAll] = useState(false);

  // Track whether component is still mounted to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    getNotifications().then((data) => {
      if (!mountedRef.current) return;
      setNotifications(data);
      setIsLoading(false);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead();
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
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

  const getIcon = (type: NotifType) => {
    const base = "w-8 h-8 rounded-full flex items-center justify-center";
    switch (type) {
      case "fire":
        return (
          <div
            className={`${base} bg-gradient-to-br from-orange-500 to-red-500`}
          >
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C10.5 4.5 8 7 8 10c0 2 1 3 2 4-1-1-3-3-3-6 0-4 3-6 5-6zm0 4c-1 1.5-2 3-2 5 0 3 2 5 4 5s4-2 4-5c0-2-1-3.5-2-5 0 0 1 2 1 3 0 2-1 3-2 3s-2-1-2-3c0-1 1-3 1-3z" />
            </svg>
          </div>
        );
      case "comment":
        return (
          <div className={`${base} bg-blue-500`}>
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
          <div className={`${base} bg-purple-500`}>
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
          <div className={`${base} bg-cyan-500`}>
            <span className="text-white font-bold text-sm">@</span>
          </div>
        );
      case "gift":
        return (
          <div
            className={`${base} bg-gradient-to-r from-yellow-400 to-yellow-600`}
          >
            <span className="text-black font-bold text-sm">$</span>
          </div>
        );
      case "story_view":
        return (
          <div className={`${base} bg-pink-500`}>
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${base} bg-gray-500`}>
            <span className="text-white text-xs">!</span>
          </div>
        );
    }
  };

  const getText = (n: Notification) => {
    const actor = n.actor?.display_name || n.actor?.username || "Quelqu'un";
    switch (n.type) {
      case "fire":
        return `${actor} a mis du feu à ton post 🔥`;
      case "comment":
        return `${actor} a commenté ton post`;
      case "follow":
        return `${actor} a commencé à te suivre`;
      case "mention":
        return `${actor} t'a mentionné`;
      case "gift":
        return `${actor} t'a envoyé un cadeau 🎁`;
      case "story_view":
        return `${actor} a vu ta story`;
      default:
        return `Nouvelle notification de ${actor}`;
    }
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "Tout" },
    {
      value: "unread",
      label: `Non lus${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
    },
    { value: "fire", label: "Feux 🔥" },
    { value: "comment", label: "Commentaires" },
    { value: "follow", label: "Abonnés" },
    { value: "mention", label: "Mentions" },
    { value: "gift", label: "Cadeaux" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      <Header
        title="Activité"
        showBack
        rightElement={<PushNotificationBell className="mr-2" />}
      />

      <main className="max-w-2xl mx-auto p-4">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
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

        {/* Mark All Read */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="w-full py-2 mb-4 text-sm text-gold-600 hover:text-gold-700 font-medium disabled:opacity-50"
          >
            {markingAll ? "En cours…" : "Marquer tout comme lu"}
          </button>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
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
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer",
                  n.is_read
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gold-50 dark:bg-gold-900/20 border-l-4 border-gold-400",
                )}
              >
                {/* Avatar or Type Icon */}
                {n.actor?.avatar_url ? (
                  <img
                    src={n.actor.avatar_url}
                    alt={n.actor.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  getIcon(n.type)
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {n.actor?.username && (
                      <Link
                        to={`/profile/${n.actor.username}`}
                        className="font-semibold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {n.actor.display_name || n.actor.username}
                      </Link>
                    )}
                    <span className="text-gray-600 dark:text-gray-400">
                      {" "}
                      {getText(n)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(n.created_at)}
                  </p>
                </div>

                {/* Post thumbnail link */}
                {n.post_id && n.post?.media_url && (
                  <Link
                    to={`/p/${n.post_id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={n.post.media_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </Link>
                )}

                {/* Follow-back button */}
                {n.type === "follow" && n.actor && (
                  <Link
                    to={`/profile/${n.actor.username}`}
                    className="px-3 py-1.5 bg-gradient-to-r from-gold-400 to-gold-600 text-black text-sm font-semibold rounded-full hover:shadow-lg transition-all flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir
                  </Link>
                )}

                {/* Unread dot */}
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Activity;
