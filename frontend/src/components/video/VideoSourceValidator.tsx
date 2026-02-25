/**
 * VideoSourceValidator - Detects and filters out bad video sources
 * Only allows good videos to play
 */

import { useState, useEffect, useRef } from "react";

export type VideoQuality = "good" | "bad" | "checking" | "unknown";

export interface VideoValidationResult {
  url: string;
  quality: VideoQuality;
  error?: string;
  duration?: number;
  canPlay: boolean;
}

// Test if browser can play this video format
export function canPlayVideo(url: string): boolean {
  const video = document.createElement("video");
  
  // Check HLS
  if (url.includes(".m3u8")) {
    return video.canPlayType("application/vnd.apple.mpegurl") !== "" || 
           (window as any).Hls?.isSupported();
  }
  
  // Check MP4
  if (url.includes(".mp4") || url.match(/^https?:\/\//)) {
    return video.canPlayType("video/mp4") !== "";
  }
  
  // Check WebM
  if (url.includes(".webm")) {
    return video.canPlayType("video/webm") !== "";
  }
  
  return true; // Unknown, let it try
}

// Validate a video URL by trying to load metadata
export async function validateVideoSource(url: string): Promise<VideoValidationResult> {
  return new Promise((resolve) => {
    // Check if URL is valid
    if (!url || typeof url !== "string") {
      resolve({ url, quality: "bad", error: "Invalid URL", canPlay: false });
      return;
    }
    
    // Quick checks without loading
    if (url.includes("undefined") || url.includes("null")) {
      resolve({ url, quality: "bad", error: "Malformed URL", canPlay: false });
      return;
    }
    
    // Check if browser can play this format
    if (!canPlayVideo(url)) {
      resolve({ url, quality: "bad", error: "Format not supported", canPlay: false });
      return;
    }
    
    // Create test video element
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";
    
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    
    const cleanup = () => {
      clearTimeout(timeoutId);
      video.src = "";
      video.load();
    };
    
    const resolveOnce = (result: VideoValidationResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };
    
    // Success - video loaded
    video.onloadedmetadata = () => {
      const duration = video.duration;
      
      // Check if duration is valid (not NaN, not 0, not Infinity)
      if (!duration || isNaN(duration) || duration === 0) {
        resolveOnce({ 
          url, 
          quality: "bad", 
          error: "Invalid duration (corrupted?)", 
          canPlay: false 
        });
        return;
      }
      
      if (duration === Infinity) {
        resolveOnce({ 
          url, 
          quality: "good", 
          duration,
          canPlay: true 
        }); // Live stream
        return;
      }
      
      resolveOnce({ 
        url, 
        quality: "good", 
        duration,
        canPlay: true 
      });
    };
    
    // Error loading video
    video.onerror = () => {
      const error = video.error;
      let errorMessage = "Unknown error";
      
      if (error) {
        switch (error.code) {
          case 1: errorMessage = "Aborted"; break;
          case 2: errorMessage = "Network error (404/CORS)"; break;
          case 3: errorMessage = "Decode error (corrupted)"; break;
          case 4: errorMessage = "Format not supported"; break;
        }
      }
      
      resolveOnce({ 
        url, 
        quality: "bad", 
        error: errorMessage, 
        canPlay: false 
      });
    };
    
    // Timeout after 5 seconds
    timeoutId = setTimeout(() => {
      resolveOnce({ 
        url, 
        quality: "bad", 
        error: "Load timeout (>5s)", 
        canPlay: false 
      });
    }, 5000);
    
    // Start loading
    video.src = url;
    video.load();
  });
}

// Hook to validate video source
export function useVideoValidation(url: string | undefined) {
  const [result, setResult] = useState<VideoValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    if (!url) {
      setResult(null);
      return;
    }
    
    setIsValidating(true);
    setResult({ url, quality: "checking", canPlay: false });
    
    validateVideoSource(url).then((validation) => {
      setResult(validation);
      setIsValidating(false);
    });
  }, [url]);
  
  return { result, isValidating };
}

// Component that only renders children if video is good
interface ValidatedVideoProps {
  src: string;
  children: (props: { 
    isValid: boolean; 
    isChecking: boolean; 
    error?: string;
    duration?: number;
  }) => React.ReactNode;
}

export function ValidatedVideo({ src, children }: ValidatedVideoProps) {
  const { result, isValidating } = useVideoValidation(src);
  
  return <>{children({
    isValid: result?.quality === "good" || false,
    isChecking: isValidating,
    error: result?.error,
    duration: result?.duration
  })}</>;
}

// Batch validate multiple videos
export async function validateVideoBatch(urls: string[]): Promise<VideoValidationResult[]> {
  const validations = await Promise.all(
    urls.map(url => validateVideoSource(url))
  );
  return validations;
}

// Filter only good videos
export function filterGoodVideos(results: VideoValidationResult[]): VideoValidationResult[] {
  return results.filter(r => r.quality === "good");
}

export default {
  validateVideoSource,
  useVideoValidation,
  ValidatedVideo,
  validateVideoBatch,
  filterGoodVideos,
  canPlayVideo
};
