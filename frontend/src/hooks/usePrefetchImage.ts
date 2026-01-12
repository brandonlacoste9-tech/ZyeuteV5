/**
 * usePrefetchImage - Lightweight image prefetch hook
 * Warms browser cache by creating an Image object when entering viewport
 */

import { useEffect, useRef } from "react";

interface UsePrefetchImageOptions {
  /** Enable/disable prefetching */
  enabled?: boolean;
  /** Priority level (affects loading behavior) */
  priority?: "high" | "low" | "auto";
}

/**
 * Prefetches an image by loading it into the browser cache.
 * Uses the browser's native Image object for cache warming.
 *
 * @param url - The image URL to prefetch
 * @param options - Configuration options
 */
export function usePrefetchImage(
  url: string | undefined,
  options: UsePrefetchImageOptions = {},
): { isLoaded: boolean; isError: boolean } {
  const { enabled = true, priority = "auto" } = options;

  const isLoadedRef = useRef(false);
  const isErrorRef = useRef(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!enabled || !url) {
      return;
    }

    // Avoid re-prefetching if already loaded
    if (isLoadedRef.current) {
      return;
    }

    const img = new Image();
    imageRef.current = img;

    // Set fetchPriority if supported (Chrome 101+)
    if ("fetchPriority" in img && priority !== "auto") {
      (img as any).fetchPriority = priority;
    }

    img.onload = () => {
      isLoadedRef.current = true;
      isErrorRef.current = false;
    };

    img.onerror = () => {
      isLoadedRef.current = false;
      isErrorRef.current = true;
    };

    // Start loading - this warms the browser cache
    img.src = url;

    return () => {
      // Cancel loading on cleanup
      if (imageRef.current) {
        imageRef.current.src = "";
        imageRef.current = null;
      }
    };
  }, [url, enabled, priority]);

  return {
    isLoaded: isLoadedRef.current,
    isError: isErrorRef.current,
  };
}

/**
 * Prefetch multiple images at once (e.g., for adjacent feed items)
 *
 * @param urls - Array of image URLs to prefetch
 * @param enabled - Enable/disable prefetching
 */
export function usePrefetchImages(
  urls: (string | undefined)[],
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const images: HTMLImageElement[] = [];

    urls.forEach((url) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
      images.push(img);
    });

    return () => {
      // Cleanup
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, [urls.join(","), enabled]);
}
