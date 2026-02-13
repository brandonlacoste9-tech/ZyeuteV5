/**
 * useVideoTransition - Smooth cross-fade transitions between feed videos
 *
 * Manages opacity transitions when the active video changes,
 * preventing jarring cuts in the TikTok-style feed scroll.
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface TransitionState {
  /** Whether this video is transitioning in (becoming active) */
  isEntering: boolean;
  /** Whether this video is transitioning out (becoming inactive) */
  isExiting: boolean;
  /** Opacity value (0-1) for the video overlay */
  opacity: number;
  /** CSS transition class to apply */
  transitionClass: string;
}

const TRANSITION_DURATION_MS = 200; // Quick fade for snappy TikTok feel

/**
 * Hook for individual video items in the feed.
 * Returns transition state based on active index changes.
 */
export function useVideoTransition(
  index: number,
  currentIndex: number,
  isActive: boolean,
): TransitionState {
  const prevActiveRef = useRef(isActive);
  const [transitionPhase, setTransitionPhase] = useState<"idle" | "entering" | "exiting">("idle");

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;

    if (!wasActive && isActive) {
      // Becoming active -> fade in
      setTransitionPhase("entering");
      const timer = setTimeout(() => setTransitionPhase("idle"), TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }

    if (wasActive && !isActive) {
      // Becoming inactive -> fade out
      setTransitionPhase("exiting");
      const timer = setTimeout(() => setTransitionPhase("idle"), TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const isEntering = transitionPhase === "entering";
  const isExiting = transitionPhase === "exiting";

  return {
    isEntering,
    isExiting,
    opacity: isActive ? 1 : isExiting ? 0.6 : 0.3,
    transitionClass: isEntering || isExiting
      ? `transition-opacity duration-[${TRANSITION_DURATION_MS}ms] ease-out`
      : "",
  };
}

/**
 * Hook for feed-level preloading hints.
 * Inserts <link rel="preload"> for the next video URL.
 */
export function usePreloadHint(nextVideoUrl: string | null) {
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    // Remove previous preload link
    if (linkRef.current) {
      linkRef.current.remove();
      linkRef.current = null;
    }

    if (!nextVideoUrl) return;

    // Don't preload blob URLs or data URLs
    if (nextVideoUrl.startsWith("blob:") || nextVideoUrl.startsWith("data:")) return;

    // Create preload link for next video
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = nextVideoUrl;
    link.crossOrigin = "anonymous";
    // Low priority - don't compete with current video
    (link as any).fetchPriority = "low";

    document.head.appendChild(link);
    linkRef.current = link;

    return () => {
      if (linkRef.current) {
        linkRef.current.remove();
        linkRef.current = null;
      }
    };
  }, [nextVideoUrl]);
}
