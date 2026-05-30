import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  GUEST_MODE_KEY,
  GUEST_TIMESTAMP_KEY,
  GUEST_VIEWS_KEY,
} from "../lib/constants";

interface GuestModeContextType {
  isGuest: boolean;
  isExpired: boolean;
  viewsCount: number;
  remainingTime: number;
  setIsGuest: (value: boolean) => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  startGuestSession: () => void;
  endGuestSession: () => void;
  incrementViews: () => void;
}

export const GuestModeContext = createContext<GuestModeContextType | undefined>(
  undefined,
);

export function GuestModeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(GUEST_MODE_KEY) === "true";
    }
    return false;
  });

  const [viewsCount, setViewsCount] = useState(() => {
    if (typeof window !== "undefined") {
      return parseInt(localStorage.getItem(GUEST_VIEWS_KEY) || "0", 10);
    }
    return 0;
  });

  const [remainingTime, setRemainingTime] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Sync localStorage changes to state
  useEffect(() => {
    const handleStorageChange = () => {
      setIsGuest(localStorage.getItem(GUEST_MODE_KEY) === "true");
      setViewsCount(parseInt(localStorage.getItem(GUEST_VIEWS_KEY) || "0", 10));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Session Timer & Expiry Check
  // ✅ Properly ends guest session
  // Handles private browsing mode gracefully
  const endGuestSession = useCallback(() => {
    console.log("🎭 [GuestModeContext] Ending guest session...");
    try {
      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_TIMESTAMP_KEY);
      localStorage.removeItem(GUEST_VIEWS_KEY);
    } catch (e) {
      console.warn("⚠️ [GuestModeContext] Storage cleanup failed:", e);
    }
    setIsGuest(false);
    setViewsCount(0);
    setRemainingTime(0);
    // Only set expired if it was actually a guest session
    if (isGuest) {
      setIsExpired(true);
    }
  }, [isGuest]);

  useEffect(() => {
    if (!isGuest) return;

    const updateTimer = () => {
      const timestamp = parseInt(
        localStorage.getItem(GUEST_TIMESTAMP_KEY) || "0",
        10,
      );
      if (!timestamp) return;

      const elapsed = Date.now() - timestamp;
      const remaining = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);

      setRemainingTime(remaining);

      if (remaining === 0) {
        console.log("🎭 [GuestMode] Session expired!");
        endGuestSession();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isGuest, endGuestSession]);

  const enterGuestMode = useCallback(() => setIsGuest(true), []);
  const exitGuestMode = useCallback(() => setIsGuest(false), []);

  // ✅ Properly starts guest session with localStorage persistence
  // Handles private browsing mode gracefully
  const startGuestSession = useCallback(() => {
    console.log("🎭 [GuestModeContext] Starting guest session...");
    try {
      localStorage.setItem(GUEST_MODE_KEY, "true");
      localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(GUEST_VIEWS_KEY, "0");
      console.log(
        "✅ [GuestModeContext] Guest session started, localStorage set",
      );
    } catch (e) {
      console.warn(
        "⚠️ [GuestModeContext] Storage failed (private browsing?):",
        e,
      );
    }
    setIsGuest(true);
    setIsExpired(false);
  }, []);

  const incrementViews = useCallback(() => {
    setViewsCount((prev) => {
      const newCount = prev + 1;
      try {
        localStorage.setItem(GUEST_VIEWS_KEY, newCount.toString());
      } catch (e) {
        console.warn("⚠️ [GuestModeContext] Failed to save view count:", e);
      }
      return newCount;
    });
  }, []);

  return (
    <GuestModeContext.Provider
      value={{
        isGuest,
        isExpired,
        viewsCount,
        remainingTime,
        setIsGuest,
        enterGuestMode,
        exitGuestMode,
        startGuestSession,
        endGuestSession,
        incrementViews,
      }}
    >
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    // Return a safe default instead of throwing
    return {
      isGuest: false,
      isExpired: false,
      setIsGuest: () => {},
      enterGuestMode: () => {},
      exitGuestMode: () => {},
      startGuestSession: () => {
        // Fallback: Still set localStorage even without context
        console.warn("🎭 [GuestMode] Using fallback - context not available");
        localStorage.setItem("zyeute_guest_mode", "true");
        localStorage.setItem("zyeute_guest_timestamp", Date.now().toString());
        localStorage.setItem("zyeute_guest_views", "0");
      },
      endGuestSession: () => {},
      incrementViews: () => {},
      viewsCount: 0,
      remainingTime: 0,
    };
  }
  return context;
}

export default GuestModeContext;
