/**
 * useMotionSmooth - Ultra-smooth motion system for TikTok-style video feeds
 *
 * Provides:
 * - GPU-accelerated motion blur during scroll transitions
 * - Velocity-adaptive rendering quality
 * - Smooth will-change lifecycle management (avoids memory bloat)
 * - Frame-pacing hints for consistent 60fps feel
 */

import { useEffect, useRef, useState, useMemo } from "react";

interface MotionSmoothState {
  /** CSS filter string for motion blur (e.g. "blur(1.5px)") */
  motionBlurFilter: string;
  /** 0-1 intensity of current motion */
  motionIntensity: number;
  /** CSS transform for micro-stabilization */
  stabilizeTransform: string;
  /** Whether hardware acceleration should be active */
  isAccelerated: boolean;
  /** CSS class string combining all motion optimizations */
  motionClass: string;
  /** Inline styles for the video container */
  motionStyle: React.CSSProperties;
}

interface MotionSmoothOptions {
  maxBlurPx?: number;
  stabilizationStrength?: number;
  enableMotionBlur?: boolean;
  enableStabilization?: boolean;
}

const DEFAULT_OPTIONS: Required<MotionSmoothOptions> = {
  maxBlurPx: 2.0,
  stabilizationStrength: 0.4,
  enableMotionBlur: true,
  enableStabilization: true,
};

export function useMotionSmooth(
  scrollVelocity: number,
  isTransitioning: boolean,
  options: MotionSmoothOptions = {},
): MotionSmoothState {
  const config = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options],
  );

  const rafRef = useRef<number>(0);
  const currentBlurRef = useRef(0);
  const targetBlurRef = useRef(0);
  const intensityRef = useRef(0);

  const [motionBlurFilter, setMotionBlurFilter] = useState("none");
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [stabilizeTransform, setStabilizeTransform] = useState("none");
  const [isAccelerated, setIsAccelerated] = useState(false);

  // Store latest props in refs so the RAF loop always reads fresh values
  const scrollVelocityRef = useRef(scrollVelocity);
  const isTransitioningRef = useRef(isTransitioning);
  const configRef = useRef(config);

  useEffect(() => {
    scrollVelocityRef.current = scrollVelocity;
  }, [scrollVelocity]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Stable RAF loop function stored in a ref to avoid self-reference issues
  const loopRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    loopRef.current = () => {
      const absVelocity = Math.abs(scrollVelocityRef.current);
      const cfg = configRef.current;
      const transitioning = isTransitioningRef.current;

      const rawIntensity = Math.min(1, absVelocity / 3.0);
      const smoothedIntensity =
        intensityRef.current + (rawIntensity - intensityRef.current) * 0.15;
      intensityRef.current = smoothedIntensity;

      if (cfg.enableMotionBlur) {
        const blurTarget = transitioning
          ? cfg.maxBlurPx * 0.6
          : smoothedIntensity * cfg.maxBlurPx;
        targetBlurRef.current = blurTarget;

        const lerpFactor = blurTarget > currentBlurRef.current ? 0.12 : 0.25;
        currentBlurRef.current +=
          (targetBlurRef.current - currentBlurRef.current) * lerpFactor;

        if (currentBlurRef.current < 0.05) {
          currentBlurRef.current = 0;
          setMotionBlurFilter("none");
        } else {
          setMotionBlurFilter(
            `blur(${currentBlurRef.current.toFixed(2)}px)`,
          );
        }
      }

      if (cfg.enableStabilization) {
        const jitterCompensation =
          smoothedIntensity * cfg.stabilizationStrength;
        if (jitterCompensation > 0.01) {
          setStabilizeTransform(
            `translate3d(0, 0, 0) scale(${1 + jitterCompensation * 0.002})`,
          );
        } else {
          setStabilizeTransform("translate3d(0, 0, 0)");
        }
      }

      setMotionIntensity(smoothedIntensity);
      setIsAccelerated(smoothedIntensity > 0.02 || transitioning);

      if (smoothedIntensity > 0.01 || currentBlurRef.current > 0.01) {
        rafRef.current = requestAnimationFrame(() => loopRef.current?.());
      }
    };
  });

  // Kick off RAF loop when velocity or transition state changes
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => loopRef.current?.());

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollVelocity, isTransitioning, config]);

  const motionClass = useMemo(() => {
    const classes = ["video-motion-smooth"];
    if (isAccelerated) classes.push("video-gpu-accelerated");
    if (motionIntensity > 0.5) classes.push("video-fast-scroll");
    if (isTransitioning) classes.push("video-transitioning");
    return classes.join(" ");
  }, [isAccelerated, motionIntensity, isTransitioning]);

  const motionStyle: React.CSSProperties = useMemo(
    () => ({
      filter: motionBlurFilter !== "none" ? motionBlurFilter : undefined,
      transform: stabilizeTransform !== "none" ? stabilizeTransform : undefined,
      willChange: isAccelerated ? "transform, filter" : "auto",
    }),
    [motionBlurFilter, stabilizeTransform, isAccelerated],
  );

  return {
    motionBlurFilter,
    motionIntensity,
    stabilizeTransform,
    isAccelerated,
    motionClass,
    motionStyle,
  };
}

/**
 * useFramePacing - Ensures consistent frame delivery for video elements.
 * Detects dropped frames and adjusts rendering hints.
 */
export function useFramePacing(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const lastFrameTimeRef = useRef(0);
  const droppedFramesRef = useRef(0);
  const [isSmooth, setIsSmooth] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;

    const checkFramePacing = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;

      if (lastFrameTimeRef.current > 0 && delta > 20) {
        // Frame took >20ms (below 50fps) — potential jank
        droppedFramesRef.current++;
      }

      // If >5 dropped frames in recent history, signal degraded playback
      if (droppedFramesRef.current > 5) {
        setIsSmooth(false);
        droppedFramesRef.current = 0;
      } else {
        setIsSmooth(true);
      }

      lastFrameTimeRef.current = now;

      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(checkFramePacing);
      }
    };

    const handlePlay = () => {
      droppedFramesRef.current = 0;
      lastFrameTimeRef.current = 0;
      rafId = requestAnimationFrame(checkFramePacing);
    };

    const handlePause = () => {
      if (rafId) cancelAnimationFrame(rafId);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause);

    if (!video.paused) handlePlay();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
    };
  }, [videoRef]);

  return { isSmooth };
}
