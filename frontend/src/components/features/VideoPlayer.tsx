/* eslint-disable react-hooks/refs */
/**
 * VideoPlayer - Unified advanced video player for Zyeuté V5
 * Supports HLS (.m3u8), native HTML5 (MP4/WebM), and Social Embeds
 * Integrated with prefetching, caching, and telemetry
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import Hls from "hls.js";
import {
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { logger } from "../../lib/logger";
import { VideoSource, PreloadTier } from "@/hooks/usePrefetchVideo";
import { videoCache } from "@/lib/videoWarmCache";
import { mediaTelemetry } from "@/lib/mediaTelemetry";
import { useHaptics } from "@/hooks/useHaptics";
import { useVideoFrameCallback } from "@/hooks/useVideoFrameCallback";

const StreamingDebugOverlay = React.lazy(
  () => import("./StreamingDebugOverlay"),
);

const videoPlayerLogger = logger.withContext("VideoPlayer");

// Extend HTML attributes to support fetchPriority (Chrome 102+)
declare module "react" {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchPriority?: "high" | "low" | "auto";
  }
  interface VideoHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchPriority?: "high" | "low" | "auto";
  }
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  /** Called when playback reaches 70% (for prefetching next videos) */
  onProgress?: (progress: number) => void;
  style?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  videoSource?: VideoSource;
  debug?: {
    activeRequests: number;
    concurrency: number;
    tier: PreloadTier;
  };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoPlay = false,
  muted = true,
  loop = true,
  className,
  onEnded,
  onPlay,
  onPause,
  onProgress,
  style,
  videoStyle,
  priority = false,
  preload = "metadata",
  videoSource,
  debug,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  type Readiness = "idle" | "loading" | "ready" | "error";
  const [readiness, setReadiness] = useState<Readiness>("loading");
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const progress70FiredRef = useRef(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { tap } = useHaptics();

  // Frame-accurate playback tracking
  useVideoFrameCallback(videoRef, (time) => {
    if (onProgress && duration > 0 && !progress70FiredRef.current) {
      const progress = time / duration;
      if (progress >= 0.7) {
        progress70FiredRef.current = true;
        onProgress(progress);
      }
    }
  });

  // Debug mode check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get("debug") === "1";
    const storageParam = localStorage.getItem("debug") === "true";
    setIsDebugEnabled(debugParam || storageParam);
  }, []);

  // HLS detection
  const isHlsSrc =
    src &&
    typeof src === "string" &&
    (src.endsWith(".m3u8") || src.includes(".m3u8"));

  // Social embed detection
  const getSocialEmbedDetails = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("tiktok.com")) {
      const match = url.match(/\/video\/(\d+)/);
      return {
        type: "tiktok",
        embedUrl: match ? `https://www.tiktok.com/embed/v2/${match[1]}` : url,
      };
    }
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:.*v=|\/embed\/|\/v\/))([^?&"'>]+)/,
      );
      if (match)
        return {
          type: "youtube",
          embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${match[1]}`,
        };
    }
    if (lowerUrl.includes("vimeo.com")) {
      const match = url.match(
        /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/,
      );
      if (match)
        return {
          type: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=${muted ? 1 : 0}&loop=1`,
        };
    }
    return null;
  };

  const socialEmbed = src ? getSocialEmbedDetails(src) : null;
  const isSocial = !!socialEmbed;

  // HLS.js setup
  const hlsRef = useRef<Hls | null>(null);
  useEffect(() => {
    if (!isHlsSrc || !src || !videoRef.current || isSocial) return;
    const el = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(el);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              el.src = src;
              setReadiness("error");
              break;
          }
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
    }
  }, [src, isHlsSrc, isSocial]);

  // Metrics & Telemetry
  const metricsRef = useRef({
    startTime: 0,
    timeToFirstFrame: 0,
    stalledCount: 0,
    totalStalledTime: 0,
    lastStallStart: 0,
  });

  const handlePlaying = useCallback(() => {
    if (metricsRef.current.startTime && !metricsRef.current.timeToFirstFrame) {
      metricsRef.current.timeToFirstFrame =
        Date.now() - metricsRef.current.startTime;
      mediaTelemetry.recordTimeToFirstFrame(
        src,
        metricsRef.current.timeToFirstFrame,
      );
    }
    if (metricsRef.current.lastStallStart) {
      metricsRef.current.totalStalledTime +=
        Date.now() - metricsRef.current.lastStallStart;
      metricsRef.current.lastStallStart = 0;
    }
    setIsPlaying(true);
    setReadiness("ready");
  }, [src]);

  const handleWaiting = useCallback(() => {
    setReadiness("loading");
    metricsRef.current.stalledCount++;
    metricsRef.current.lastStallStart = Date.now();
  }, []);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    const error = video?.error;

    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current++;
      const delay = Math.pow(2, retryCountRef.current) * 1000;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.load();
      }, delay);
      return;
    }

    setErrorMessage(error?.message || "Échec de la lecture");
    setReadiness("error");
    mediaTelemetry.recordBufferStarvation(src);
  }, [src]);

  const handleCanPlay = useCallback(() => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    setReadiness("ready");
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [autoPlay]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (!duration) setDuration(videoRef.current.duration);
  }, [duration]);

  // Source change reset
  useEffect(() => {
    setReadiness("loading");
    setBufferProgress(0);
    progress70FiredRef.current = false;
    retryCountRef.current = 0;
    metricsRef.current.startTime = Date.now();
  }, [src]);

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            onPlay?.();
          })
          .catch(() => setIsPlaying(false));
      }
      tap();
    },
    [isPlaying, onPause, onPlay, tap],
  );

  const toggleMute = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!videoRef.current) return;
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      tap();
    },
    [isMuted, tap],
  );

  const toggleFullscreen = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full bg-black overflow-hidden group",
        className,
      )}
      style={style}
      onClick={togglePlay}
      onMouseMove={showControlsTemporarily}
    >
      {/* Poster Image */}
      {poster && readiness !== "ready" && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority={priority ? "high" : "low"}
        />
      )}

      {/* Main Content */}
      {isSocial && socialEmbed ? (
        <iframe
          src={socialEmbed.embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen"
          onLoad={() => setReadiness("ready")}
        />
      ) : (
        <video
          ref={videoRef}
          src={isHlsSrc ? undefined : src}
          className="absolute inset-0 w-full h-full object-cover"
          style={videoStyle}
          muted={isMuted}
          loop={loop}
          playsInline
          preload={preload}
          onPlaying={handlePlaying}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
          onEnded={onEnded}
        />
      )}

      {/* Loading Overlay */}
      {readiness === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {readiness === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-20 p-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-white font-bold">Erreur de lecture</p>
          <p className="text-white/60 text-xs mt-1">{errorMessage}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              retryCountRef.current = 0;
              videoRef.current?.load();
            }}
            className="mt-4 px-6 py-2 bg-gold-500 text-black rounded-full font-bold text-sm"
          >
            RÉESSAYER
          </button>
        </div>
      )}

      {/* Play/Pause Large Icon */}
      {!isPlaying && readiness === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md">
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-30",
          showControls || !isPlaying ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Slider */}
        <div className="group/progress relative h-1 mb-4 bg-white/20 rounded-full cursor-pointer overflow-hidden">
          <div
            className="absolute h-full bg-gold-500 transition-all duration-100"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="hover:text-gold-500 transition-colors"
            >
              {isPlaying ? (
                <Pause size={24} fill="white" />
              ) : (
                <Play size={24} fill="white" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="hover:text-gold-500 transition-colors"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <span className="text-xs font-mono opacity-80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullscreen}
              className="hover:text-gold-500 transition-colors"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Overlay */}
      {isDebugEnabled && (
        <Suspense fallback={null}>
          <StreamingDebugOverlay
            postId={src}
            tier={debug?.tier || 0}
            activeRequests={debug?.activeRequests || 0}
            concurrency={debug?.concurrency || 0}
            ttff={metricsRef.current.timeToFirstFrame}
            stalls={metricsRef.current.stalledCount}
            stallDuration={metricsRef.current.totalStalledTime}
          />
        </Suspense>
      )}
    </div>
  );
};

export default VideoPlayer;
