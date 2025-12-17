/**
 * Notifications Page - Activity feed
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { useNotifications } from '../contexts/NotificationContext';
import { getTimeAgo } from '../lib/utils';

export const Notifications: React.FC = () => {
  const { notifications, loading: isLoading, markAsRead } = useNotifications();

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Notifications" showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-gold-400 animate-pulse">Chargement...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Aucune notification
            </h3>
            <p className="text-white/60">
              On va te notifier quand quelque chose se passe!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.post_id ? `/p/${notification.post_id}` : `/profile/${notification.actor?.username}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                className="block glass-card rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {notification.actor && (
                    <Avatar
                      src={notification.actor.avatar_url}
                      size="md"
                      isVerified={notification.actor.is_verified}
                    />
                  )}

                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-semibold">
                        {notification.actor?.display_name || notification.actor?.username}
                      </span>
                      {' '}
                      {notification.type === 'fire' && 'a enflammé ton post'}
                      {notification.type === 'comment' && 'a commenté ton post'}
                      {notification.type === 'follow' && 'a commencé à te suivre'}
                      {notification.type === 'gift' && 't\'a envoyé un cadeau'}
                      {notification.type === 'mention' && 't\'a mentionné'}
                    </p>

                    <p className="text-white/60 text-sm mt-1">
                      {getTimeAgo(new Date(notification.created_at))}
                    </p>
                  </div>

                  {/* Post thumbnail (if applicable) */}
                  {notification.post && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-900">
                      <img
                        src={notification.post.media_url}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-gold-400 rounded-full" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
