/**
 * Home Page - Smart Router Component
 * Shows Landing page to non-authenticated users
 * Shows Feed to authenticated users
 */

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  GUEST_MODE_KEY,
  GUEST_TIMESTAMP_KEY,
  GUEST_SESSION_DURATION,
} from "@/lib/constants";
import { supabase } from "../lib/supabase";

const Home: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    // EMERGENCY FAILSAFE: Force decision after 5 seconds
    const emergencyTimeout = setTimeout(() => {
      console.warn("⚠️ Home auth check timeout - forcing guest mode");
      if (mounted) {
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        setIsAuthenticated(guestMode === "true");
      }
    }, 5000);

    const checkAuth = async () => {
      try {
        // Check for Supabase authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (mounted) {
            setIsAuthenticated(true);
            clearTimeout(emergencyTimeout);
          }
          return;
        }

        // Check for guest mode
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);

        if (guestMode === "true" && guestTimestamp) {
          const age = Date.now() - parseInt(guestTimestamp, 10);

          if (age < GUEST_SESSION_DURATION) {
            // Valid guest session - treat as authenticated
            if (mounted) {
              setIsAuthenticated(true);
              clearTimeout(emergencyTimeout);
            }
            return;
          } else {
            // Guest session expired
            localStorage.removeItem(GUEST_MODE_KEY);
            localStorage.removeItem(GUEST_TIMESTAMP_KEY);
          }
        }

        // No valid auth or guest session
        if (mounted) {
          setIsAuthenticated(false);
          clearTimeout(emergencyTimeout);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        // Fallback to guest mode verification even on error
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);

        if (guestMode === "true" && guestTimestamp) {
          const age = Date.now() - parseInt(guestTimestamp, 10);
          if (age < GUEST_SESSION_DURATION) {
            if (mounted) {
              setIsAuthenticated(true);
              clearTimeout(emergencyTimeout);
            }
            return;
          }
        }

        if (mounted) {
          setIsAuthenticated(false);
          clearTimeout(emergencyTimeout);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout);
    };
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
