/**
 * Haptic feedback system for Zyeuté/TI-GUY
 * Cross-platform vibration patterns
 */

// Haptic pattern types
export type HapticPattern = 
  | "messageSent"
  | "messageReceived"
  | "aiThinking"
  | "error"
  | "longPress"
  | "toggleOn"
  | "joinGroup"
  | "leaveGroup"
  | "chargingStart"
  | "chargingMilestone"
  | "chargingComplete"
  | "fleurDeLysPulse";

// Vibration patterns (in milliseconds)
const PATTERNS: Record<HapticPattern, number | number[]> = {
  // Messaging
  messageSent: 10,           // Very short tap
  messageReceived: [10, 50, 10], // Soft double tap
  aiThinking: [5, 100, 5],   // Gentle tick at start/end
  error: [50, 100, 50],      // Sharp buzz
  longPress: 20,             // Soft press
  
  // Settings
  toggleOn: [10, 30, 50],    // Ramp up
  
  // Group
  joinGroup: [15, 50, 15],   // Subtle double
  leaveGroup: 15,            // Single soft
  
  // Charging fleur-de-lys
  chargingStart: [30, 50, 10],     // Click + lock
  chargingMilestone: 10,            // Light tap
  chargingComplete: [10, 30, 50, 10], // Success ramp
  fleurDeLysPulse: 5,               // Tiny pulse
};

/**
 * Trigger haptic feedback
 */
export function haptic(pattern: HapticPattern): void {
  if (!navigator.vibrate) {
    console.log("[Haptic] Not supported on this device");
    return;
  }

  const vibration = PATTERNS[pattern];
  navigator.vibrate(vibration);
  
  console.log(`[Haptic] ${pattern}:`, vibration);
}

/**
 * Haptic hook for React components
 */
export function useHaptics() {
  const trigger = useCallback((pattern: HapticPattern) => {
    haptic(pattern);
  }, []);

  // Pre-bound common patterns
  return {
    tap: () => haptic("messageSent"),
    receive: () => haptic("messageReceived"),
    error: () => haptic("error"),
    longPress: () => haptic("longPress"),
    aiThinking: () => haptic("aiThinking"),
    toggle: () => haptic("toggleOn"),
    join: () => haptic("joinGroup"),
    leave: () => haptic("leaveGroup"),
    chargingStart: () => haptic("chargingStart"),
    chargingComplete: () => haptic("chargingComplete"),
    fleurDeLysPulse: () => haptic("fleurDeLysPulse"),
    trigger,
  };
}

// React import for hook
import { useCallback } from "react";
