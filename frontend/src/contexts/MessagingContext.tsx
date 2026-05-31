/**
 * MessagingContext — global unread DM count for all authenticated users.
 * Polls every 30s and exposes `dmUnread` for the BottomNav badge.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/lib/supabase";
import { apiCall } from "@/services/api";

interface MessagingContextValue {
  dmUnread: number;
  refreshUnread: () => void;
}

const MessagingContext = createContext<MessagingContextValue>({
  dmUnread: 0,
  refreshUnread: () => {},
});

export const useMessaging = () => useContext(MessagingContext);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dmUnread, setDmUnread] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      if (!session?.user) setDmUnread(0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const { data } = await apiCall<{
        conversations: { unreadCount: number }[];
      }>("/messaging/conversations");
      const total = (data?.conversations ?? []).reduce(
        (s, c) => s + (c.unreadCount || 0),
        0,
      );
      setDmUnread(total);
    } catch {
      // ignore — badge stays at last value
    }
  }, [isLoggedIn]);

  // Poll every 30s when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    // Use a short delay to avoid calling setState synchronously inside the effect body
    const initial = setTimeout(() => {
      fetchUnread();
    }, 0);
    const interval = setInterval(fetchUnread, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [isLoggedIn, fetchUnread]);

  const value = useMemo(
    () => ({ dmUnread, refreshUnread: fetchUnread }),
    [dmUnread, fetchUnread],
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};
