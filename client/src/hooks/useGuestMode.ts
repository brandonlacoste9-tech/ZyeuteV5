/**
 * useGuestMode Hook
 * Manages 24-hour guest session & view counting
 */
import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';

const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface GuestModeState {
  isGuest: boolean;
  isExpired: boolean;
  remainingTime: number;
  viewsCount: number;
}

export function useGuestMode() {
  const [state, setState] = useState<GuestModeState>({
    isGuest: false,
    isExpired: false,
    remainingTime: 0,
    viewsCount: 0,
  });

  useEffect(() => {
    const checkSession = () => {
      const guestMode = localStorage.getItem('zyeute_guest_mode');
      const timestamp = localStorage.getItem('zyeute_guest_timestamp');
      
      if (guestMode === 'true' && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age >= GUEST_SESSION_DURATION) {
          // Session expired - clear localStorage
          localStorage.removeItem('zyeute_guest_mode');
          localStorage.removeItem('zyeute_guest_timestamp');
          localStorage.removeItem('zyeute_guest_views_count');
          setState({ isGuest: false, isExpired: true, remainingTime: 0, viewsCount: 0 });
          logger.info('🎭 Guest session expired');
        } else {
          const remaining = GUEST_SESSION_DURATION - age;
          const views = parseInt(localStorage.getItem('zyeute_guest_views_count') || '0', 10);
          setState({ isGuest: true, isExpired: false, remainingTime: remaining, viewsCount: views });
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const incrementViews = () => {
    const views = parseInt(localStorage.getItem('zyeute_guest_views_count') || '0', 10);
    const newViews = views + 1;
    localStorage.setItem('zyeute_guest_views_count', newViews.toString());
    setState(prev => ({ ...prev, viewsCount: newViews }));
    logger.info(`🎭 Guest views: ${newViews}`);
  };

  return { ...state, incrementViews };
}
