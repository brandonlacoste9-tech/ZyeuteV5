/**
 * SimpleVideoPlayer - Reliable HTML5 video player for MP4/WebM sources
 * No HLS.js, no MSE - just native browser playback
 * Perfect for Pexels, direct uploads, and simple video sources
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  muted = true,
  loop = true,
  className = "",
  style,
  priority = false,
  preload = "metadata",
  onError,
  onProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Reset state when source changes
  useEffect(() => {
    console.log("[SimpleVideoPlayer] Source changed:", src);
    setIsLoading(true);
    setHasError(false);
    setProgress(0);
    setRetryCount(0);
  }, [src]);
  
  // Log mount
  useEffect(() => {
    console.log("[SimpleVideoPlayer] Mounted with:", { src, poster, autoPlay });
  }, []);

  // Handle autoplay
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked - show play button
        setIsPlaying(false);
      });
    }
  }, [autoPlay, src]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.error("[SimpleVideoPlayer] Play failed:", err);
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !videoRef.current.duration) return;
    
    const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(currentProgress);
    
    if (onProgress && currentProgress >= 70) {
      onProgress(currentProgress);
    }
  }, [onProgress]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);



  // Extract direct URL from proxied URL for fallback
  const getDirectUrl = useCallback((proxiedUrl: string): string | null => {
    if (!proxiedUrl.includes('/api/media-proxy?url=')) return null;
    try {
      const url = new URL(proxiedUrl, window.location.origin);
      return url.searchParams.get('url');
    } catch {
      return null;
    }
  }, []);

  // Cascading error handler
  const handleErrorWithFallback = useCallback(() => {
    const video = videoRef.current;
    const error = video?.error;
    
    console.error(`[SimpleVideoPlayer] Error (${retryCount}/${MAX_RETRIES}):`, {
      code: error?.code,
      message: error?.message,
      src: src?.substring(0, 100),
      networkState: video?.networkState,
      readyState: video?.readyState,
      poster: poster?.substring(0, 50),
    });

    // Layer 1: Retry with cache-bust (up to MAX_RETRIES)
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          const bustUrl = src.includes("?")
            ? `${src}&_retry=${Date.now()}`
            : `${src}?_retry=${Date.now()}`;
          videoRef.current.src = bustUrl;
          videoRef.current.load();
        }
      }, 1000 * (retryCount + 1));
      return;
    }

    // Layer 2: If using proxy, try direct URL
    const directUrl = getDirectUrl(src);
    if (directUrl && directUrl !== src) {
      console.log('[SimpleVideoPlayer] Trying direct URL...');
      setRetryCount(0);
      if (videoRef.current) {
        videoRef.current.src = directUrl;
        videoRef.current.load();
      }
      return;
    }

    // Layer 3: Give up, show error UI
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error(`Video failed after all retries: ${error?.message}`));
  }, [retryCount, src, onError, getDirectUrl]);

  // Error state - show placeholder, not black hole
  if (hasError) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center bg-zinc-900 rounded-xl overflow-hidden",
          className
        )}
        style={style}
      >
        {/* Layer 3: Thumbnail placeholder */}
        {poster && (
          <img 
            src={poster} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        
        {/* Error message overlay */}
        <div className="relative z-10 text-center p-4">
          <AlertCircle className="w-10 h-10 text-white/60 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-medium">Vidéo indisponible</p>
          <p className="text-white/50 text-xs mt-1">Continue de défiler ↓</p>
          
          {/* Manual retry button */}
          <button
            onClick={() => {
              setHasError(false);
              setRetryCount(0);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.src = src;
                videoRef.current.load();
              }
            }}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative group rounded-xl overflow-hidden", className)}
      style={style}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        loop={loop}
        playsInline
        muted={isMuted}
        preload={preload}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onError={handleErrorWithFallback}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Play/Pause overlay (center) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-gold-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls overlay (bottom) */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-200",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gold-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <button
            onClick={handleFullscreen}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleVideoPlayer;
