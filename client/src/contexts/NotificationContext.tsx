/**
 * Notification Context - Real-time notifications using Supabase Realtime
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/Toast';
import type { Notification} from '../types';
import { logger } from '../lib/logger';

const notificationContextLogger = logger.withContext('NotificationContext');


interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };

    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:user_profiles!actor_id(*),
          post:posts!post_id(*)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setNotifications(data);
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      notificationContextLogger.error('Error fetching notifications:', error);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    if (currentUserId) {
      refreshNotifications();
    }
  }, [currentUserId, refreshNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`notifications_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newNotification = payload.new as Notification;

          // Fetch actor details
          const { data: actor } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', newNotification.actor_id)
            .single();

          if (actor) {
            newNotification.actor = actor;
          }

          // Add to notifications
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          showNotificationToast(newNotification);

          // Play sound (optional)
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', currentUserId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      notificationContextLogger.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      toast.success('Toutes les notifications marquées comme lues!');
    } catch (error) {
      notificationContextLogger.error('Error marking all as read:', error);
      toast.error('Erreur lors du marquage');
    }
  };

  // Show toast for new notification
  const showNotificationToast = (notification: Notification) => {
    const actor = notification.actor;
    if (!actor) return;

    const messages = {
      fire: `${actor.display_name || actor.username} a trouvé ta publi malade! 🔥`,
      comment: `${actor.display_name || actor.username} a jasé sur ta publication 💬`,
      follow: `${actor.display_name || actor.username} commence à te suivre! 👤`,
      gift: `${actor.display_name || actor.username} t'a envoyé un cadeau! 🎁`,
      mention: `${actor.display_name || actor.username} t'a mentionné! @`,
    };

    toast.info(messages[notification.type] || 'Nouvelle notification!');
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      gainNode.gain.value = 0.1; // Volume

      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
    } catch (error) {
      notificationContextLogger.warn('Could not play notification sound:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

