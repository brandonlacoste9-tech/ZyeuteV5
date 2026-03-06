/**
 * useVideoTransition - Ultra-smooth cross-fade transitions between feed videos
 *
 * Uses multi-phase transitions with motion-aware easing to prevent
 * jarring cuts in the TikTok-style feed scroll. Includes soft motion
 * blur during transitions for perceived smoothness.
 */

import { useEffect, useRef, useState, useMemo } from "react";

interface TransitionState {
  isEntering: boolean;
  isExiting: boolean;
  opacity: number;
  transitionClass: string;
  /** CSS class for motion-blur during transition */
  motionClass: string;
  /** Inline style for smooth transition with motion blur */
  transitionStyle: React.CSSProperties;
}

const ENTER_DURATION_MS = 280;
const EXIT_DURATION_MS = 220;

// Custom easing: fast start, smooth deceleration (feels natural)
const ENTER_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const EXIT_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Hook for individual video items in the feed.
 * Returns transition state with motion-blur-aware styling.
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
      const t1 = requestAnimationFrame(() => setTransitionPhase("entering"));
      const t2 = setTimeout(
        () => setTransitionPhase("idle"),
        ENTER_DURATION_MS,
      );
      return () => {
        cancelAnimationFrame(t1);
        clearTimeout(t2);
      };
    }

    if (wasActive && !isActive) {
      const t1 = requestAnimationFrame(() => setTransitionPhase("exiting"));
      const t2 = setTimeout(
        () => setTransitionPhase("idle"),
        EXIT_DURATION_MS,
      );
      return () => {
        cancelAnimationFrame(t1);
        clearTimeout(t2);
      };
    }
  }, [isActive]);

  const isEntering = transitionPhase === "entering";
  const isExiting = transitionPhase === "exiting";

  const opacity = isActive ? 1 : isExiting ? 0.5 : 0.2;

  const motionClass = useMemo(() => {
    if (isEntering) return "video-enter-active";
    if (isExiting) return "video-exit-active";
    return "";
  }, [isEntering, isExiting]);

  const transitionStyle: React.CSSProperties = useMemo(() => {
    if (isEntering) {
      return {
        opacity: 1,
        transform: "scale(1) translate3d(0, 0, 0)",
        transition: `opacity ${ENTER_DURATION_MS}ms ${ENTER_EASING}, transform ${ENTER_DURATION_MS}ms ${ENTER_EASING}, filter ${ENTER_DURATION_MS}ms ${ENTER_EASING}`,
        filter: "blur(0px)",
        willChange: "opacity, transform, filter",
      };
    }
    if (isExiting) {
      return {
        opacity: 0.5,
        transform: "scale(0.985) translate3d(0, 0, 0)",
        transition: `opacity ${EXIT_DURATION_MS}ms ${EXIT_EASING}, transform ${EXIT_DURATION_MS}ms ${EXIT_EASING}, filter ${EXIT_DURATION_MS}ms ${EXIT_EASING}`,
        filter: "blur(0.8px)",
        willChange: "opacity, transform, filter",
      };
    }
    return {
      transform: "translate3d(0, 0, 0)",
      willChange: "auto",
    };
  }, [isEntering, isExiting]);

  const transitionClass = useMemo(() => {
    if (isEntering)
      return `transition-all duration-[${ENTER_DURATION_MS}ms] ease-out`;
    if (isExiting)
      return `transition-all duration-[${EXIT_DURATION_MS}ms] ease-in`;
    return "";
  }, [isEntering, isExiting]);

  return {
    isEntering,
    isExiting,
    opacity,
    transitionClass,
    motionClass,
    transitionStyle,
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
