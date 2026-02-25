/**
 * PexelsVideoPlayer - Simple player for Pexels stock videos
 * Zyeuté V5 - Quebec social media
 */

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PexelsVideoPlayerProps {
  videoUrl: string;
  thumbnail: string;
  className?: string;
  autoPlay?: boolean;
}

export function PexelsVideoPlayer({
  videoUrl,
  thumbnail,
  className = "",
  autoPlay = false,
}: PexelsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100,
      );
    }
  };

  const handleLoadedData = () => setIsLoading(false);

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-xl z-10">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnail}
        className="w-full h-full object-cover rounded-xl"
        loop
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl"
        >
          <div className="w-16 h-16 bg-gold-gradient rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-gold-lg">
            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl transition-opacity duration-200",
          showControls || !isPlaying ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="w-full h-1 bg-leather-800 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gold-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

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

      <a
        href="https://www.pexels.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-leather-400 hover:bg-black/70 transition-colors"
      >
        Pexels
      </a>
    </div>
  );
}
