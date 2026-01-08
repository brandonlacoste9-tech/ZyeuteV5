/**
 * useHaptics Hook - Web-Compatible Haptic Feedback
 * Uses the Vibration API for mobile browsers and PWA
 * Provides premium tactile feedback for user interactions
 */

import { useCallback } from "react";
import { logger } from "../lib/logger";

const useHapticsLogger = logger.withContext("UseHaptics");

// Haptic patterns (duration in milliseconds)
const HAPTIC_PATTERNS = {
  // Light tap - quick single vibration
  tap: [10],

  // Medium impact - slightly longer vibration
  impact: [15],

  // Success - double pulse pattern
  success: [10, 50, 20],

  // Error - triple pulse pattern
  error: [20, 50, 20, 50, 20],

  // Selection change - subtle pulse
  selection: [5],

  // Heavy impact - strong vibration
  heavy: [30],

  // Notification - distinct pattern
  notification: [15, 100, 15],
} as const;

type HapticType = keyof typeof HAPTIC_PATTERNS;

/**
 * Check if vibration API is available
 */
const isVibrationSupported = (): boolean => {
  return typeof window !== "undefined" && "vibrate" in navigator;
};

/**
 * Trigger haptic feedback with fallback
 */
const triggerVibration = (pattern: readonly number[]): void => {
  if (isVibrationSupported()) {
    try {
      navigator.vibrate(Array.from(pattern));
    } catch (error) {
      useHapticsLogger.warn("Vibration API error:", error);
    }
  }
};

/**
 * Custom hook for haptic feedback
 * Provides premium tactile feedback for user interactions
 */
export const useHaptics = () => {
  /**
   * Trigger a specific haptic pattern
   */
  const trigger = useCallback((type: HapticType) => {
    const pattern = HAPTIC_PATTERNS[type];
    if (pattern) {
      triggerVibration(pattern);
    }
  }, []);

  /**
   * Light tap feedback - for button presses, navigation taps
   */
  const tap = useCallback(() => {
    trigger("tap");
  }, [trigger]);

  /**
   * Medium impact - for interactions with more weight
   */
  const impact = useCallback(() => {
    trigger("impact");
  }, [trigger]);

  /**
   * Success feedback - for completed actions, confirmations
   */
  const success = useCallback(() => {
    trigger("success");
  }, [trigger]);

  /**
   * Error feedback - for errors, failed actions
   */
  const error = useCallback(() => {
    trigger("error");
  }, [trigger]);

  /**
   * Selection change - for toggles, switches, selections
   */
  const selection = useCallback(() => {
    trigger("selection");
  }, [trigger]);

  /**
   * Heavy impact - for important actions
   */
  const heavy = useCallback(() => {
    trigger("heavy");
  }, [trigger]);

  /**
   * Notification - for notifications, alerts
   */
  const notification = useCallback(() => {
    trigger("notification");
  }, [trigger]);

  return {
    tap,
    impact,
    success,
    error,
    selection,
    heavy,
    notification,
    trigger,
    isSupported: isVibrationSupported(),
  };
};
