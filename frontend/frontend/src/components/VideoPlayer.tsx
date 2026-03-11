/**
 * VideoPlayer.tsx
 * TikTok-style video player for Zyeuté
 * Supports MP4 and HLS streaming with French UI
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { IoPlay, IoPause, IoVolumeHigh, IoVolumeMute, IoFullscreen, IoClose, IoHeart, IoHeartOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  onLike?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onLike,
  autoPlay = true,
  muted = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get video URL (with proxy if needed)
  const getVideoUrl = (url: string) => {
    // Check if it's a Pexels URL (needs proxy due to CORS)
    if (url.includes('pexels.com')) {
      // Use proxy for Pexels URLs
      return `/api/video/proxy?url=${encodeURIComponent(url)}`;
    }
    // Check if it's a TikTok URL (embed instead)
    if (url.includes('tiktok.com')) {
      // For TikTok, we'll use a fallback video
      return 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }
    // For Google storage and other CORS-friendly URLs, use directly
    return url;
  };

  // Initialize HLS.js for .m3u8 files
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const finalVideoUrl = getVideoUrl(videoUrl);

    // Check if HLS stream
    if (Hls.isSupported() && finalVideoUrl.endsWith(".m3u8")) {
      const hls = new Hls();
      hls.loadSource(finalVideoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(() => setIsPlaying(false));
        }
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setHasError(true);
          hls.destroy();
        }
      });
      return () => hls.destroy();
    }

    // For MP4 files
    setIsLoading(false);
    video.src = finalVideoUrl;
    if (autoPlay) {
      video.play().catch(() => setIsPlaying(false));
    }
  }, [videoUrl, autoPlay]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Event handlers
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setVolume(1);
      setIsMuted(false);
    } else {
      video.muted = true;
      setVolume(0);
      setIsMuted(true);
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
    setVolume(newVolume);
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = parseFloat(e.target.value);
      setCurrentTime(video.currentTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
    resetControlsTimeout();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
    resetControlsTimeout();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Mouse move to show controls
  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        const video = videoRef.current;
        if (video) video.currentTime += 5;
      } else if (e.code === "ArrowLeft") {
        const video = videoRef.current;
        if (video) video.currentTime -= 5;
      } else if (e.code === "KeyM") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isMuted]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full aspect-[9/16] max-h-[85vh] bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onError={() => setHasError(true)}
        playsInline
        muted={isMuted}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white p-6 text-center">
          <IoClose className="w-16 h-16 mb-4 text-red-500" />
          <p className="text-lg font-semibold mb-2">Erreur de lecture</p>
          <p className="text-sm text-gray-400">Veuillez réessayer plus tard</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Top: Like Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 p-3 rounded-full bg-black/30 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
          >
            {isLiked ? (
              <IoHeart className="w-8 h-8 text-red-500 fill-current" />
            ) : (
              <IoHeartOutline className="w-8 h-8 text-white" />
            )}
            <span className="text-xs font-semibold text-white">J'aime</span>
          </button>
        </div>

        {/* Center: Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          {!isPlaying && !isLoading && !hasError && (
            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
            >
              <IoPlay className="w-10 h-10 ml-1" />
            </button>
          )}
        </div>

        {/* Bottom: Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer group/progress">
            <div
              className="h-full bg-[#d4af37] rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#d4af37] rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-[#d4af37] transition-colors"
              >
                {isPlaying ? (
                  <IoPause className="w-8 h-8" />
                ) : (
                  <IoPlay className="w-8 h-8" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-[#d4af37] transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <IoVolumeMute className="w-6 h-6" />
                  ) : (
                    <IoVolumeHigh className="w-6 h-6" />
                  )}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#d4af37] [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-400">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-[#d4af37] transition-colors"
            >
              <IoFullscreen className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Title Overlay (TikTok style) */}
      <div className="absolute bottom-24 left-4 right-20 z-10">
        <h3 className="text-white font-bold text-lg drop-shadow-md truncate">
          Vidéo
        </h3>
        <p className="text-white/80 text-sm mt-1 drop-shadow-md">
          @utilisateur
        </p>
      </div>
    </div>
  );
};
