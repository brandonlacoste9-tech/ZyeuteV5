/**
 * useHaptics.ts
 * Haptics hook for mobile feedback
 */

export function useHaptics() {
  const tap = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const impact = () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return { tap, impact };
}
