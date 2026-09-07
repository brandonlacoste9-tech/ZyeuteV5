/**
 * useHaptics Hook - Web-Compatible Haptic Feedback
 * Uses the Vibration API for mobile browsers and PWA
 * Provides premium tactile feedback for user interactions
 */

import { useCallback } from "react";
import { logger } from "../lib/logger";

const useHapticsLogger = logger.withContext("UseHaptics");

const HAPTIC_PATTERNS = {
  tap: [10],
  impact: [15],
  fire: [25, 40, 20, 30, 35],
  fireBurst: [30, 30, 25, 25, 20, 20, 30],
  newFollower: [15, 80, 10, 40, 20],
  save: [20, 60, 30],
  comment: [10, 30, 8],
  share: [12, 40, 12],
  success: [10, 50, 20],
  error: [20, 50, 20, 50, 20],
  selection: [5],
  heavy: [30],
  notification: [15, 100, 15],
} as const;

type HapticType = keyof typeof HAPTIC_PATTERNS;

const isVibrationSupported = (): boolean => {
  return typeof window !== "undefined" && "vibrate" in navigator;
};

const triggerVibration = (pattern: readonly number[]): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(Array.from(pattern));
    } catch (error) {
      useHapticsLogger.warn("Vibration API error:", error);
    }
  }
};

export const useHaptics = () => {
  const trigger = useCallback((type: HapticType) => {
    const pattern = HAPTIC_PATTERNS[type];
    if (pattern) {
      triggerVibration(pattern);
    }
  }, []);

  const tap = useCallback(() => {
    trigger("tap");
  }, [trigger]);

  const impact = useCallback(() => {
    trigger("impact");
  }, [trigger]);

  const success = useCallback(() => {
    trigger("success");
  }, [trigger]);

  const error = useCallback(() => {
    trigger("error");
  }, [trigger]);

  const selection = useCallback(() => {
    trigger("selection");
  }, [trigger]);

  const heavy = useCallback(() => {
    trigger("heavy");
  }, [trigger]);

  const notification = useCallback(() => {
    trigger("notification");
  }, [trigger]);

  const fire = useCallback(() => trigger("fire"), [trigger]);
  const fireBurst = useCallback(() => trigger("fireBurst"), [trigger]);
  const newFollower = useCallback(() => trigger("newFollower"), [trigger]);
  const save = useCallback(() => trigger("save"), [trigger]);
  const comment = useCallback(() => trigger("comment"), [trigger]);
  const share = useCallback(() => trigger("share"), [trigger]);

  return {
    tap,
    impact,
    success,
    error,
    selection,
    heavy,
    notification,
    fire,
    fireBurst,
    newFollower,
    save,
    comment,
    share,
    trigger,
    isSupported: isVibrationSupported(),
  };
};

export default useHaptics;

declare global {
  interface Window {
    useHaptics?: typeof useHaptics;
  }
}
if (typeof window !== "undefined") {
  window.useHaptics = useHaptics;
}
