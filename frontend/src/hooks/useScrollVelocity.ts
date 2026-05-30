import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollVelocityReturn {
  velocity: number;
  smoothVelocity: number;
  isFast: boolean;
  isMedium: boolean;
  isSlow: boolean;
  isDecelerating: boolean;
  handleScroll: (scrollTop: number) => void;
}

const FAST_THRESHOLD = 2.0;
const MEDIUM_THRESHOLD = 0.5;

// EMA (Exponential Moving Average) smoothing factor.
// Lower = smoother/slower response. Higher = snappier/noisier.
const EMA_ALPHA = 0.25;

// Deceleration detection: if velocity drops by >40% between samples
const DECEL_RATIO = 0.6;

/**
 * Hook to track scroll velocity with EMA smoothing.
 * Eliminates jittery velocity spikes for ultra-smooth motion decisions.
 * Returns both raw and smoothed velocity, plus deceleration state.
 */
export function useScrollVelocity(): ScrollVelocityReturn {
  const [velocity, setVelocity] = useState(0);
  const [smoothVelocity, setSmoothVelocity] = useState(0);
  const [isDecelerating, setIsDecelerating] = useState(false);

  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(0);
  const emaVelocity = useRef(0);
  const prevRawVelocity = useRef(0);
  const velocityTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const decayRaf = useRef<number>(0);

  const isFast = Math.abs(smoothVelocity) > FAST_THRESHOLD;
  const isMedium =
    Math.abs(smoothVelocity) > MEDIUM_THRESHOLD &&
    Math.abs(smoothVelocity) <= FAST_THRESHOLD;
  const isSlow = Math.abs(smoothVelocity) <= MEDIUM_THRESHOLD;

  // Smooth decay to zero using rAF for buttery deceleration curve
  const startDecay = useCallback(() => {
    if (decayRaf.current) cancelAnimationFrame(decayRaf.current);

    const decay = () => {
      emaVelocity.current *= 0.85; // Exponential decay

      if (Math.abs(emaVelocity.current) < 0.01) {
        emaVelocity.current = 0;
        setVelocity(0);
        setSmoothVelocity(0);
        setIsDecelerating(false);
        return;
      }

      setSmoothVelocity(emaVelocity.current);
      setIsDecelerating(true);
      decayRaf.current = requestAnimationFrame(decay);
    };

    decayRaf.current = requestAnimationFrame(decay);
  }, []);

  const handleScroll = useCallback(
    (scrollTop: number) => {
      const now = Date.now();
      const timeDelta = lastScrollTime.current === 0 ? 0 : now - lastScrollTime.current;

      if (timeDelta > 0) {
        const distance = scrollTop - lastScrollTop.current;
        const rawVel = distance / timeDelta;

        emaVelocity.current =
          EMA_ALPHA * rawVel + (1 - EMA_ALPHA) * emaVelocity.current;

        const isDecel =
          Math.abs(rawVel) < Math.abs(prevRawVelocity.current) * DECEL_RATIO &&
          Math.abs(prevRawVelocity.current) > MEDIUM_THRESHOLD;
        setIsDecelerating(isDecel);
        prevRawVelocity.current = rawVel;

        setVelocity(rawVel);
        setSmoothVelocity(emaVelocity.current);
      }

      // Always update position/time (handles first-call initialization)
      lastScrollTop.current = scrollTop;
      lastScrollTime.current = now;

      if (timeDelta > 0) {
        if (velocityTimeout.current) clearTimeout(velocityTimeout.current);
        if (decayRaf.current) cancelAnimationFrame(decayRaf.current);

        velocityTimeout.current = setTimeout(() => {
          startDecay();
        }, 80);
      }
    },
    [startDecay],
  );

  useEffect(() => {
    return () => {
      if (velocityTimeout.current) clearTimeout(velocityTimeout.current);
      if (decayRaf.current) cancelAnimationFrame(decayRaf.current);
    };
  }, []);

  return {
    velocity,
    smoothVelocity,
    isFast,
    isMedium,
    isSlow,
    isDecelerating,
    handleScroll,
  };
}
