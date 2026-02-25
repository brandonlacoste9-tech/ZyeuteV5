/**
 * TikTokVideoPlayer - Ultra-smooth video playback optimized for short-form content
 * Hardware accelerated, preloaded, optimized for 60fps playback
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TikTokVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  onLoaded?: () => void;
}

export const TikTokVideoPlayer: React.FC<TikTokVideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  muted = true,
  loop = true,
  className = "",
  style,
  priority = false,
  onError,
  onProgress,
  onLoaded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when source changes
  useEffect(() => {
    // Use a microtask to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsLoading(true);
      setHasError(false);
      setBufferProgress(0);
      
      // Preload optimization
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [src]);

  // Handle autoplay with retry logic
  useEffect(() => {
    const attemptPlay = async () => {
      if (autoPlay && videoRef.current && !hasError) {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          // Autoplay blocked - wait for user interaction
          setIsPlaying(false);
        }
      }
    };

    // Small delay to ensure video is ready
    const timer = setTimeout(attemptPlay, 100);
    return () => clearTimeout(timer);
  }, [autoPlay, hasError]);

  // Monitor buffer progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(0);
        const duration = video.duration;
        if (duration > 0) {
          const progress = (buffered / duration) * 100;
          setBufferProgress(progress);
        }
      }
    };

    video.addEventListener("progress", handleProgress);
    return () => video.removeEventListener("progress", handleProgress);
  }, []);

  // Visibility check - pause when not visible (saves resources)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlaying) {
            video.pause();
            setIsPlaying(false);
          } else if (entry.isIntersecting && autoPlay && !hasError) {
            video.play().catch(() => {});
            setIsPlaying(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoPlay, hasError, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current || hasError) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("[TikTokVideoPlayer] Play failed:", err);
        onError?.(err);
      });
    }
  }, [isPlaying, hasError, onError]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    onLoaded?.();
  }, [onLoaded]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.(new Error("Video failed to load"));
  }, [onError]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    onProgress?.(progress);
  }, [onProgress]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-black",
        "gpu-accelerated", // Hardware acceleration
        className
      )}
      style={{
        ...style,
        transform: "translateZ(0)", // Force GPU layer
        willChange: "transform", // Optimize for animations
      }}
      onClick={togglePlay}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      {/* Video Element - Optimized for smooth playback */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        loop={loop}
        playsInline // Critical for mobile smooth playback
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        preload={priority ? "auto" : "metadata"}
        crossOrigin="anonymous"
        disablePictureInPicture
        disableRemotePlayback
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectFit: "cover",
          objectPosition: "center",
          // Hardware acceleration hints
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: 1000,
        }}
        onLoadedData={handleLoadedData}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Buffer Progress Bar */}
      {isLoading && bufferProgress > 0 && bufferProgress < 100 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${bufferProgress}%` }}
          />
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play/Pause Button (Center) */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4",
          "bg-gradient-to-t from-black/60 to-transparent",
          "transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center justify-between">
          {/* Play/Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white" fill="white" />
            )}
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-4">
            <p className="text-sm opacity-80">Failed to load video</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="mt-2 px-4 py-2 bg-blue-500 rounded-full text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TikTokVideoPlayer;
