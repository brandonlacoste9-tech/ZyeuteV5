/**
 * useVideoFrameCallback - Frame-precise video synchronization
 *
 * Uses requestVideoFrameCallback (Chrome 83+, Safari 15.4+) for
 * frame-accurate timing. Falls back to requestAnimationFrame.
 *
 * Benefits over rAF:
 * - Fires exactly when a new video frame is presented (no guessing)
 * - Provides actual presentation timestamp and media time
 * - Enables smooth progress tracking without timeupdate jank
 */

import { useEffect, useRef, useCallback, useState } from "react";

interface VideoFrameMetadata {
  presentationTime: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
  mediaTime: number;
  presentedFrames: number;
  processingDuration?: number;
}

interface FrameCallbackState {
  /** Whether the browser supports requestVideoFrameCallback */
  isNativeSupported: boolean;
  /** Current media time in seconds (frame-accurate) */
  mediaTime: number;
  /** Frames presented since playback started */
  presentedFrames: number;
  /** Whether playback appears smooth (no frame drops) */
  isSmooth: boolean;
  /** Average inter-frame interval in ms */
  avgFrameInterval: number;
}

type VideoFrameRequestCallback = (
  now: DOMHighResTimeStamp,
  metadata: VideoFrameMetadata,
) => void;

interface HTMLVideoElementWithCallback extends HTMLVideoElement {
  requestVideoFrameCallback?: (
    callback: VideoFrameRequestCallback,
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
}

const FRAME_HISTORY_SIZE = 30;
const JANK_THRESHOLD_MS = 25;

export function useVideoFrameCallback(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onFrame?: (time: number, frames: number) => void,
): FrameCallbackState {
  const [mediaTime, setMediaTime] = useState(0);
  const [presentedFrames, setPresentedFrames] = useState(0);
  const [isSmooth, setIsSmooth] = useState(true);
  const [avgFrameInterval, setAvgFrameInterval] = useState(16.67);

  const frameTimestamps = useRef<number[]>([]);
  const callbackHandle = useRef<number>(0);
  const rafHandle = useRef<number>(0);
  const frameCountRef = useRef(0);

  const isNativeSupported =
    typeof HTMLVideoElement !== "undefined" &&
    "requestVideoFrameCallback" in HTMLVideoElement.prototype;

  const processFrame = useCallback(
    (now: number, time: number, frames: number) => {
      setMediaTime(time);
      setPresentedFrames(frames);
      onFrame?.(time, frames);

      frameTimestamps.current.push(now);
      if (frameTimestamps.current.length > FRAME_HISTORY_SIZE) {
        frameTimestamps.current.shift();
      }

      // Calculate smoothness from frame intervals
      const timestamps = frameTimestamps.current;
      if (timestamps.length >= 3) {
        let totalInterval = 0;
        let jankFrames = 0;
        for (let i = 1; i < timestamps.length; i++) {
          const interval = timestamps[i] - timestamps[i - 1];
          totalInterval += interval;
          if (interval > JANK_THRESHOLD_MS) jankFrames++;
        }
        const avg = totalInterval / (timestamps.length - 1);
        setAvgFrameInterval(avg);

        // Smooth if <15% frames are janky
        const jankRatio = jankFrames / (timestamps.length - 1);
        setIsSmooth(jankRatio < 0.15);
      }
    },
    [onFrame],
  );

  useEffect(() => {
    const video = videoRef.current as HTMLVideoElementWithCallback | null;
    if (!video) return;

    frameTimestamps.current = [];
    frameCountRef.current = 0;
    jankCountRef.current = 0;

    if (isNativeSupported && video.requestVideoFrameCallback) {
      const onVideoFrame: VideoFrameRequestCallback = (now, metadata) => {
        processFrame(now, metadata.mediaTime, metadata.presentedFrames);

        if (!video.paused && !video.ended && video.requestVideoFrameCallback) {
          callbackHandle.current = video.requestVideoFrameCallback(onVideoFrame);
        }
      };

      const startCallback = () => {
        if (video.requestVideoFrameCallback) {
          callbackHandle.current = video.requestVideoFrameCallback(onVideoFrame);
        }
      };

      const stopCallback = () => {
        if (video.cancelVideoFrameCallback && callbackHandle.current) {
          video.cancelVideoFrameCallback(callbackHandle.current);
          callbackHandle.current = 0;
        }
      };

      video.addEventListener("play", startCallback);
      video.addEventListener("pause", stopCallback);
      video.addEventListener("ended", stopCallback);

      if (!video.paused) startCallback();

      return () => {
        stopCallback();
        video.removeEventListener("play", startCallback);
        video.removeEventListener("pause", stopCallback);
        video.removeEventListener("ended", stopCallback);
      };
    }

    // Fallback: rAF-based frame tracking
    const onAnimationFrame = () => {
      if (!video || video.paused || video.ended) return;

      const now = performance.now();
      frameCountRef.current++;
      processFrame(now, video.currentTime, frameCountRef.current);
      rafHandle.current = requestAnimationFrame(onAnimationFrame);
    };

    const startRaf = () => {
      frameCountRef.current = 0;
      rafHandle.current = requestAnimationFrame(onAnimationFrame);
    };

    const stopRaf = () => {
      if (rafHandle.current) {
        cancelAnimationFrame(rafHandle.current);
        rafHandle.current = 0;
      }
    };

    video.addEventListener("play", startRaf);
    video.addEventListener("pause", stopRaf);
    video.addEventListener("ended", stopRaf);

    if (!video.paused) startRaf();

    return () => {
      stopRaf();
      video.removeEventListener("play", startRaf);
      video.removeEventListener("pause", stopRaf);
      video.removeEventListener("ended", stopRaf);
    };
  }, [videoRef, isNativeSupported, processFrame]);

  return {
    isNativeSupported,
    mediaTime,
    presentedFrames,
    isSmooth,
    avgFrameInterval,
  };
}
