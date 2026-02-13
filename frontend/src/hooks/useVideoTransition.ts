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
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "entering" | "exiting"
  >("idle");

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;

    if (!wasActive && isActive) {
      // Becoming active -> fade in (defer setState to avoid sync-in-effect)
      const t1 = setTimeout(() => setTransitionPhase("entering"), 0);
      const t2 = setTimeout(
        () => setTransitionPhase("idle"),
        TRANSITION_DURATION_MS,
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (wasActive && !isActive) {
      // Becoming inactive -> fade out
      const t1 = setTimeout(() => setTransitionPhase("exiting"), 0);
      const t2 = setTimeout(
        () => setTransitionPhase("idle"),
        TRANSITION_DURATION_MS,
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isActive]);

  const isEntering = transitionPhase === "entering";
  const isExiting = transitionPhase === "exiting";

  return {
    isEntering,
    isExiting,
    opacity: isActive ? 1 : isExiting ? 0.6 : 0.3,
    transitionClass:
      isEntering || isExiting
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
    if (nextVideoUrl.startsWith("blob:") || nextVideoUrl.startsWith("data:"))
      return;

    // Create prefetch link for next video (rel="prefetch" is better than
    // rel="preload" here because we want low-priority background fetch for
    // a resource that will be used on the *next* navigation/scroll, not the
    // current one. Browsers don't support as="video" for preload anyway.)
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = nextVideoUrl;
    link.crossOrigin = "anonymous";

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
