/**
 * Notifications Page - Premium Activity Feed
 */

import React from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Avatar } from "../components/Avatar";
import { useNotifications } from "../contexts/NotificationContext";
import { getTimeAgo } from "../lib/utils";
import {
  IoFlame,
  IoChatbubble,
  IoPersonAdd,
  IoGift,
  IoAt,
  IoEye,
} from "react-icons/io5";

export const Notifications: React.FC = () => {
  const { notifications, loading: isLoading, markAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "fire":
        return <IoFlame className="text-orange-500" />;
      case "comment":
        return <IoChatbubble className="text-blue-500" />;
      case "follow":
        return <IoPersonAdd className="text-gold-500" />;
      case "gift":
        return <IoGift className="text-purple-500" />;
      case "mention":
        return <IoAt className="text-green-500" />;
      case "story_view":
        return <IoEye className="text-zinc-400" />;
      default:
        return null;
    }
  };

  const getMessage = (type: string) => {
    switch (type) {
      case "fire":
        return "a enflammé ton post";
      case "comment":
        return "a commenté ton post";
      case "follow":
        return "a commencé à te suivre";
      case "gift":
        return "t'a envoyé un cadeau";
      case "mention":
        return "t'a mentionné";
      case "story_view":
        return "a vu votre story";
      default:
        return "a interagi avec vous";
    }
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Notifications" showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-gold-500 font-bold tracking-widest animate-pulse">
              CHARGEMENT...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-leather-800 flex items-center justify-center mb-6 shadow-2xl border border-leather-700">
              <span className="text-5xl">🔔</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              AUCUNE NOTIFICATION
            </h3>
            <p className="text-leather-400 max-w-xs mx-auto text-sm">
              Restez à l&apos;affût! On vous alertera dès qu&apos;il y a du
              nouveau.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <Link
                key={notification.id}
                to={
                  notification.post_id
                    ? `/p/${notification.post_id}`
                    : `/profile/${notification.actor?.username}`
                }
                onClick={() =>
                  !notification.is_read && markAsRead(notification.id)
                }
                className={`block leather-card p-4 rounded-2xl border border-leather-700 hover:border-gold-500 transition-all group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[${index * 50}ms] ${
                  !notification.is_read
                    ? "bg-gold-500/5 shadow-[0_0_15px_rgba(255,191,0,0.05)]"
                    : ""
                }`}
              >
                {!notification.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-gold-500 rounded-full shadow-[0_0_8px_rgba(255,191,0,1)] blink" />
                )}

                <div className="flex items-center gap-4">
                  {/* User Avatar with Icon Badge */}
                  <div className="relative">
                    {notification.actor && (
                      <Avatar
                        src={notification.actor.avatar_url}
                        size="md"
                        isVerified={notification.actor.is_verified}
                        userId={notification.actor.id}
                      />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-leather-700 shadow-lg text-[10px]">
                      {getIcon(notification.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-relaxed">
                      <span className="font-bold text-gold-400 group-hover:text-gold-300 transition-colors">
                        {notification.actor?.display_name ||
                          notification.actor?.username}
                      </span>{" "}
                      <span className="text-leather-100">
                        {getMessage(notification.type)}
                      </span>
                    </p>

                    <p className="text-leather-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                      {getTimeAgo(new Date(notification.created_at))}
                    </p>
                  </div>

                  {/* Media Preview Thumbnail */}
                  {notification.post && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-leather-900 border border-leather-700 group-hover:border-gold-500 transition-colors">
                      <img
                        src={notification.post.media_url}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-leather-600 text-[10px] mt-8 uppercase tracking-[0.3em] font-medium">
        Zyeuté v3.1 — Quebec Premium Social
      </p>
    </div>
  );
};

export default Notifications;
