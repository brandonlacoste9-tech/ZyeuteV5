import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { PreloadTier } from "./usePrefetchVideo";

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
  isNext: boolean = false, // Item strictly AFTER focus
): VideoActivationResult {
  // Intersection Observer to track visibility
  const { ref, entry } = useInView({
    threshold: [0, 0.25, 0.5, 0.75, 1.0],
    rootMargin: "50px 0px 50px 0px", // Reduced buffer for strict current+next
  });

  const [isEngaged, setIsEngaged] = useState(false);
  const engagementTimerRef = useRef<NodeJS.Timeout | null>(null);

  const visibilityRatio = entry?.intersectionRatio || 0;
  // 70% viewability: trigger play when most of the video is visible (Strict)
  const VIEWABILITY_PLAY_THRESHOLD = 0.7;
  const isFocused = visibilityRatio >= VIEWABILITY_PLAY_THRESHOLD;

  // Derive playback logic (Don't use state if we can derive from props + visibility)
  // STRICT TIKTOK RULE: Only ONE video plays at a time to prevent hardware decoder contention.
  let shouldPlay = false;
  if (!isFastScrolling) {
    if (priority && visibilityRatio >= 0.3) {
      shouldPlay = true;
    } else if (!priority && visibilityRatio > 0.8) {
      shouldPlay = true;
    }
  }

  // Derive Preload Tiering Logic (strictly Current + Next)
  let preloadTier: PreloadTier;
  if (isFastScrolling) {
    preloadTier = 0;
  } else if (isEngaged && isFocused) {
    preloadTier = 2;
  } else if (isFocused || priority) {
    preloadTier = 1;
  } else if (isNext && isSlowScrolling) {
    // PREP Stage for next video
    preloadTier = 1;
  } else {
    preloadTier = 0;
  }

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
      // Defer state update to next tick to avoid React cascading render warning
      if (isEngaged) {
        const timer = setTimeout(() => setIsEngaged(false), 0);
        return () => clearTimeout(timer);
      }
    }
    return () => {
      if (engagementTimerRef.current) clearTimeout(engagementTimerRef.current);
    };
  }, [shouldPlay, isFocused, isEngaged]);

  return {
    ref,
    shouldPlay,
    preloadTier,
  };
}
