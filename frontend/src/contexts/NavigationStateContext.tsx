import React, { createContext, useContext, useRef, useCallback } from "react";
import type { Post, User } from "@/types";

type FeedState = {
  posts: Array<Post & { user: User }>;
  page?: number; // Optional for Explore
  currentIndex?: number; // Optional for Explore
  scrollOffset: number;
  filters?: {
    searchQuery: string;
    selectedRegion: string;
    selectedHashtag: string;
  };
  timestamp: number;
};

interface NavigationStateContextType {
  saveFeedState: (key: string, state: Omit<FeedState, "timestamp">) => void;
  getFeedState: (key: string) => FeedState | undefined;
  clearFeedState: (key: string) => void;
}

const NavigationStateContext = createContext<
  NavigationStateContextType | undefined
>(undefined);

export const useNavigationState = () => {
  const context = useContext(NavigationStateContext);
  if (!context) {
    throw new Error(
      "useNavigationState must be used within a NavigationStateProvider",
    );
  }
  return context;
};

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

export const NavigationStateProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const feedsRef = useRef<Record<string, FeedState>>({});

  const saveFeedState = useCallback(
    (key: string, state: Omit<FeedState, "timestamp">) => {
      feedsRef.current[key] = {
        ...state,
        timestamp: Date.now(),
      };
    },
    [],
  );

  const getFeedState = useCallback((key: string) => {
    const state = feedsRef.current[key];
    if (!state) return undefined;

    // Optional: Expire cache if too old
    if (Date.now() - state.timestamp > CACHE_DURATION) {
      delete feedsRef.current[key];
      return undefined;
    }

    return state;
  }, []);

  const clearFeedState = useCallback((key: string) => {
    delete feedsRef.current[key];
  }, []);

  return (
    <NavigationStateContext.Provider
      value={{ saveFeedState, getFeedState, clearFeedState }}
    >
      {children}
    </NavigationStateContext.Provider>
  );
};
