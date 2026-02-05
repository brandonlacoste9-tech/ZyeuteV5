/**
 * usePageVisibility - Tab visibility for pausing video when user switches tab
 * Pauses active feed video when hidden to respect autoplay policy and save battery.
 */

import { useState, useEffect } from "react";

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(
    () => (typeof document !== "undefined" ? document.visibilityState === "visible" : true),
  );

  useEffect(() => {
    const handleChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleChange);
    return () => document.removeEventListener("visibilitychange", handleChange);
  }, []);

  return isVisible;
}
