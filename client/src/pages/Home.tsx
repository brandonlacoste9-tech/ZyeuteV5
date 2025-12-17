/**
 * Home Page - Smart Router Component
 * Shows Landing page to non-authenticated users
 * Shows Feed to authenticated users
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { GUEST_MODE_KEY, GUEST_TIMESTAMP_KEY, GUEST_SESSION_DURATION } from '@/lib/constants';


const Home: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for Supabase authenticated user
        const { supabase } = await import('../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setIsAuthenticated(true);
          return;
        }

        // Check for guest mode
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);

        if (guestMode === 'true' && guestTimestamp) {
          const age = Date.now() - parseInt(guestTimestamp, 10);

          if (age < GUEST_SESSION_DURATION) {
            // Valid guest session - treat as authenticated
            setIsAuthenticated(true);
            return;
          } else {
            // Guest session expired
            localStorage.removeItem(GUEST_MODE_KEY);
            localStorage.removeItem(GUEST_TIMESTAMP_KEY);
          }
        }

        // No valid auth or guest session
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Authentication check failed:', error);

        // Fallback to guest mode verification even on error
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);

        if (guestMode === 'true' && guestTimestamp) {
          const age = Date.now() - parseInt(guestTimestamp, 10);
          if (age < GUEST_SESSION_DURATION) {
            setIsAuthenticated(true);
            return;
          }
        }

        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <LoadingScreen message="Chargement de Zyeuté..." />;
  }

  // If authenticated (including guest mode), redirect to feed
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  // Not authenticated - redirect to login (Splash screen removed)
  return <Navigate to="/login" replace />;
};

export default Home;
