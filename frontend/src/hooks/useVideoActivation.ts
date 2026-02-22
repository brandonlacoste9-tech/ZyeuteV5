import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { PreloadTier } from "./usePrefetchVideo";
import { useNetworkStatus } from "./useNetworkStatus";

interface VideoActivationResult {
  ref: (node?: Element | null) => void;
  shouldPlay: boolean;
  preloadTier: PreloadTier;
}

/**
 * Determines when a video should play or preload based on
 * visibility, scroll velocity, and network status.
 */
export function useVideoActivation(
  isFastScrolling: boolean,
  isMediumScrolling: boolean,
  isSlowScrolling: boolean, // For detecting idle/predictive moments
  priority: boolean = false, // Focused item
  predictive: boolean = false, // Item before/after focus
): VideoActivationResult {
  const isOnline = useNetworkStatus();

  // Intersection Observer to track visibility
  const { ref, inView, entry } = useInView({
    threshold: [0, 0.25, 0.5, 0.75, 1.0],
    rootMargin: "300px 0px 300px 0px", // Increased buffer for predictive
  });

  const [shouldPlay, setShouldPlay] = useState(false);
  const [preloadTier, setPreloadTier] = useState<PreloadTier>(0);
  const [isEngaged, setIsEngaged] = useState(false);
  const engagementTimerRef = useRef<NodeJS.Timeout | null>(null);

  const visibilityRatio = entry?.intersectionRatio || 0;
  const isActuallyVisible = visibilityRatio > 0;
  // 50% viewability: trigger play when half the video is visible (TikTok-style)
  const VIEWABILITY_PLAY_THRESHOLD = 0.5;
  const isFocused = visibilityRatio >= VIEWABILITY_PLAY_THRESHOLD;

  // Engagement Tracker
  useEffect(() => {
    if (shouldPlay && isFocused) {
      if (!engagementTimerRef.current) {
        engagementTimerRef.current = setTimeout(() => {
          setIsEngaged(true);
        }, 3000);
      }
    } else {
      if (engagementTimerRef.current) {
        clearTimeout(engagementTimerRef.current);
        engagementTimerRef.current = null;
      }
      setIsEngaged(false);
    }
    return () => {
      if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current);
    };
  }, [shouldPlay, isFocused]);

  useEffect(() => {
    // 1. Playback Logic
    let nextShouldPlay = false;
    if (
      !isFastScrolling &&
      (isFocused || (priority && visibilityRatio > 0.3))
    ) {
      nextShouldPlay = true;
    }
    setShouldPlay(nextShouldPlay);

    // 2. Preload Tiering Logic (reduced aggressiveness to prevent freeze)
    let nextTier: PreloadTier = 0;

    if (isFastScrolling) {
      nextTier = 0;
    } else if (isEngaged && isFocused) {
      // Full prefetch only after 3s engagement - prevents initial freeze
      nextTier = 2;
    } else if (isFocused || priority) {
      // Start with partial chunks (Tier 1) - avoid full blob on first paint
      nextTier = 1;
    } else if (isActuallyVisible || inView) {
      nextTier = 1;
    } else if (predictive && isSlowScrolling) {
      // Neighbors: light prefetch only
      nextTier = 1;
    } else {
      nextTier = 0;
    }

    setPreloadTier(nextTier);
  }, [
    isFastScrolling,
    isMediumScrolling,
    isSlowScrolling,
    isFocused,
    isActuallyVisible,
    inView,
    priority,
    predictive,
    isEngaged,
  ]);

  return {
    ref,
    shouldPlay,
    preloadTier,
  };
}
