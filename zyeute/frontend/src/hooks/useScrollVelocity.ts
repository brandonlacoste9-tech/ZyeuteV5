import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollVelocityReturn {
  velocity: number; // Pixels per millisecond
  isFast: boolean; // > 1.5 px/ms
  isMedium: boolean; // 0.5 - 1.5 px/ms
  isSlow: boolean; // < 0.5 px/ms
  handleScroll: (scrollTop: number) => void;
}

const FAST_THRESHOLD = 2.0;
const MEDIUM_THRESHOLD = 0.5;

/**
 * Hook to track scroll velocity manually (e.g., for react-window)
 * or generically.
 */
export function useScrollVelocity(): ScrollVelocityReturn {
  const [velocity, setVelocity] = useState(0);
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const velocityTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const isFast = Math.abs(velocity) > FAST_THRESHOLD;
  const isMedium =
    Math.abs(velocity) > MEDIUM_THRESHOLD &&
    Math.abs(velocity) <= FAST_THRESHOLD;
  const isSlow = Math.abs(velocity) <= MEDIUM_THRESHOLD;

  const handleScroll = useCallback((scrollTop: number) => {
    const now = Date.now();
    const timeDelta = now - lastScrollTime.current;

    if (timeDelta > 0) {
      // Avoid divide by zero
      const distance = scrollTop - lastScrollTop.current;
      const vel = distance / timeDelta;

      // Smoothing could be applied here if needed
      setVelocity(vel);

      lastScrollTop.current = scrollTop;
      lastScrollTime.current = now;

      // Reset velocity to 0 if scrolling stops
      if (velocityTimeout.current) {
        clearTimeout(velocityTimeout.current);
      }

      velocityTimeout.current = setTimeout(() => {
        setVelocity(0);
      }, 100); // 100ms idle means stopped
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (velocityTimeout.current) clearTimeout(velocityTimeout.current);
    };
  }, []);

  return {
    velocity,
    isFast,
    isMedium,
    isSlow,
    handleScroll,
  };
}
