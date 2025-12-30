/**
 * Image Component - Sharp image wrapper with responsive scaling
 * Enforces high-quality display and handles responsive images
 */

import React from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // Base image source (1x resolution)
  src: string;
  // Optional high-DPI sources for Retina displays
  src2x?: string;
  src3x?: string;
  // Object fit for image scaling
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  // Additional className
  className?: string;
}

// Image Component with Retry Logic
export const Image: React.FC<ImageProps> = ({
  src,
  src2x,
  src3x,
  objectFit = "cover",
  className = "",
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 3;
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Reset when prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setIsLoaded(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (retryCount < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const timeout = Math.pow(2, retryCount) * 1000;

      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        // Force reload by appending a query param (cache busting)
        // If it already has query params, append &retry=...
        const prefix = src.includes("?") ? "&" : "?";
        setCurrentSrc(`${src}${prefix}retry=${retryCount + 1}`);
      }, timeout);
    }

    // Bubble up error
    if (rest.onError) {
      rest.onError(e);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (rest.onLoad) rest.onLoad(e);
  };

  // Construct the srcset string for responsive images
  // Note: changing src for retry might break srcset logic if we don't update this too,
  // but for now we focus on the main src.
  const srcSet = [src2x ? `${src2x} 2x` : "", src3x ? `${src3x} 3x` : ""]
    .filter(Boolean)
    .join(", ");

  // Enforce sharp display CSS properties
  const cssClasses = cn(
    "w-full",
    "h-full",
    `object-${objectFit}`,
    "will-change-transform transition-opacity duration-500 ease-in-out", // Performance hint + Fade in
    !isLoaded ? "opacity-0" : "opacity-100",
    className,
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      <img
        src={currentSrc} // 1x source
        srcSet={srcSet || undefined} // Responsive sources
        className={cssClasses}
        loading="lazy" // Improves initial load performance
        onError={handleError}
        onLoad={handleLoad}
        {...rest}
      />
    </div>
  );
};
