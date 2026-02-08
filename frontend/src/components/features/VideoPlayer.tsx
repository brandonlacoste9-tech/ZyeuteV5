/* eslint-disable react-hooks/refs */
/**
 * VideoPlayer - Advanced video player with TikTok-style controls
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import { cn } from "../../lib/utils";
import { logger } from "../../lib/logger";
import { VideoSource } from "@/hooks/usePrefetchVideo";
import { videoCache } from "@/lib/videoWarmCache";
import { useHaptics } from "@/hooks/useHaptics";

const MuxPlayer = React.lazy(() => import("@mux/mux-player-react"));
const StreamingDebugOverlay = React.lazy(
  () => import("./StreamingDebugOverlay"),
);

const videoPlayerLogger = logger.withContext("VideoPlayer");

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
  style?: React.CSSProperties;
  videoStyle?: React.CSSProperties;
  priority?: boolean;
  preload?: "auto" | "metadata" | "none";
  videoSource?: VideoSource;
  muxPlaybackId?: string | null;
  debug?: {
    activeRequests: number;
    concurrency: number;
    tier: number;
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
  style,
  videoStyle,
  priority = false,
  preload = "metadata",
  videoSource,
  muxPlaybackId,
  debug,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { tap, impact } = useHaptics();

  // TikTok-style speed controls
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Check for debug mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get("debug") === "1";
    const storageParam = localStorage.getItem("debug") === "true";
    setIsDebugEnabled(debugParam || storageParam);
  }, []);

  // MSE State
  const mseRef = useRef<MediaSource | null>(null);
  const [mseUrl, setMseUrl] = useState<string | null>(null);

  // Determine effective source
  const effectiveSrc =
    mseUrl ||
    (videoSource?.type === "blob" || videoSource?.type === "url"
      ? videoSource.src
      : src);

  // Metrics
  const metricsRef = useRef({
    startTime: 0,
    timeToFirstFrame: 0,
    stalledCount: 0,
    totalStalledTime: 0,
    lastStallStart: 0,
  });

  // MSE Pipeline & Multi-Chunk Append
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const pendingChunksRef = useRef<ArrayBuffer[]>([]);
  const [mseRetryCount, setMseRetryCount] = useState(0);

  // Report playhead to cache for eviction
  useEffect(() => {
    if (
      videoSource?.type !== "partial-chunks" ||
      !videoSource.totalSize ||
      !duration
    )
      return;

    const interval = setInterval(() => {
      if (
        !videoRef.current ||
        videoRef.current.paused ||
        !videoSource.totalSize
      )
        return;
      const playheadByte =
        (videoRef.current.currentTime / duration) * videoSource.totalSize;
      videoCache.clearConsumedChunks(src, playheadByte);
    }, 2000);

    return () => clearInterval(interval);
  }, [src, videoSource, duration]);

  useEffect(() => {
    if (videoSource?.type !== "partial-chunks") {
      if (mseUrl) {
        URL.revokeObjectURL(mseUrl);
        setMseUrl(null);
        mseRef.current = null;
        sourceBufferRef.current = null;
        pendingChunksRef.current = [];
      }
      return;
    }

    if (!videoRef.current) return;

    if (mseRef.current && sourceBufferRef.current) {
      const sb = sourceBufferRef.current;
      const currentChunks = videoSource.chunks;
      const lastAppendedByte = (sb as any)._lastByte || -1;

      const newChunks = currentChunks.filter((c) => c.start > lastAppendedByte);
      if (newChunks.length > 0) {
        newChunks.forEach((c) => {
          pendingChunksRef.current.push(c.data);
          (sb as any)._lastByte = Math.max((sb as any)._lastByte || 0, c.end);
        });

        if (!sb.updating && pendingChunksRef.current.length > 0) {
          const data = pendingChunksRef.current.shift();
          if (data) sb.appendBuffer(data);
        }
      }
      return;
    }

    const mediaSource = new MediaSource();
    const url = URL.createObjectURL(mediaSource);
    setMseUrl(url);
    mseRef.current = mediaSource;

    const processQueue = () => {
      const sb = sourceBufferRef.current;
      if (!sb || sb.updating || pendingChunksRef.current.length === 0) return;

      const data = pendingChunksRef.current.shift();
      if (data) {
        try {
          sb.appendBuffer(data);
        } catch (e: any) {
          if (e.name === "QuotaExceededError") {
            videoPlayerLogger.warn(
              "MSE Quota Exceeded. Clearing cache buffer...",
            );
            // Attempt to clear some buffer if possible, or just ignore this chunk for now
            // SourceBuffer.remove() could be used here but it's complex.
            // For now, we signal a retry or fallback.
          }
          videoPlayerLogger.error("MSE Append Error:", e);
        }
      }
    };

    const handleSourceOpen = () => {
      try {
        if (mediaSource.readyState !== "open") return;

        const mimeType =
          videoSource.mimeType || 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        if (!MediaSource.isTypeSupported(mimeType)) {
          videoPlayerLogger.warn(
            `MSE Type not supported: ${mimeType}. Falling back to URL.`,
          );
          setMseUrl(null); // Force fallback to URL
          return;
        }

        const sb = mediaSource.addSourceBuffer(mimeType);
        sourceBufferRef.current = sb;

        sb.addEventListener("updateend", () => {
          processQueue();
          if (
            videoSource.totalSize &&
            (sb as any)._lastByte >= videoSource.totalSize - 1
          ) {
            if (mediaSource.readyState === "open" && !sb.updating) {
              mediaSource.endOfStream();
            }
          }
        });

        videoSource.chunks.forEach((c) => {
          pendingChunksRef.current.push(c.data);
          (sb as any)._lastByte = Math.max((sb as any)._lastByte || 0, c.end);
        });
        processQueue();
      } catch (e) {
        videoPlayerLogger.error("MSE Init Error:", e);
        if (mseRetryCount < 1) {
          setMseRetryCount((c) => c + 1);
        } else {
          setHasError(true);
        }
      }
    };

    mediaSource.addEventListener("sourceopen", handleSourceOpen);

    return () => {
      mediaSource.removeEventListener("sourceopen", handleSourceOpen);
      pendingChunksRef.current = [];
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };
  }, [videoSource, mseRetryCount]);

  // Handle video source errors gracefully
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const video = e.currentTarget;
      const error = video.error;

      // Enhanced error logging for diagnostics
      console.error("[VideoPlayer] ❌ VIDEO ERROR:", {
        code: error?.code,
        message: error?.message,
        networkState: video.networkState,
        readyState: video.readyState,
        src: src?.substring(0, 100),
        currentSrc: video.currentSrc?.substring(0, 100),
        mseActive: !!mseUrl,
      });

      // Soft Fallback: If MSE fails, try raw URL once before giving up
      if (mseUrl) {
        videoPlayerLogger.warn("MSE playback failed, falling back to raw URL");
        setMseUrl(null);
        return;
      }

      videoPlayerLogger.error("Video playback error:", {
        code: error?.code,
        message: error?.message,
        src: src?.substring(0, 100),
        videoSource: videoSource?.type,
        timestamp: new Date().toISOString(),
      });

      setHasError(true);
      setIsLoading(false);
    },
    [mseUrl, src, videoSource],
  );

  // Metrics collection
  const handlePlaying = useCallback(() => {
    if (metricsRef.current.startTime && !metricsRef.current.timeToFirstFrame) {
      metricsRef.current.timeToFirstFrame =
        Date.now() - metricsRef.current.startTime;
      videoPlayerLogger.debug(
        `TTFF for ${src.slice(-10)}: ${metricsRef.current.timeToFirstFrame}ms`,
      );
    }
    if (metricsRef.current.lastStallStart) {
      metricsRef.current.totalStalledTime +=
        Date.now() - metricsRef.current.lastStallStart;
      metricsRef.current.lastStallStart = 0;
    }
  }, [src]);

  const handleWaiting = useCallback(() => {
    metricsRef.current.stalledCount++;
    metricsRef.current.lastStallStart = Date.now();
  }, []);

  const handleCanPlay = useCallback(() => {
    // Clear the loading timeout since video loaded successfully
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    console.log("[VideoPlayer] ✅ VIDEO CAN PLAY - Ready for playback", {
      src: src?.substring(0, 60),
    });
    setIsLoading(false);
    setHasError(false);
  }, [src]);

  // Handle loading started
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    metricsRef.current.startTime = Date.now();
  }, []);

  // Reset states when source changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setDuration(0);
    setCurrentTime(0);

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Set a timeout to prevent infinite loading
    // Increased from 15s to 30s for better Pexels video loading
    loadingTimeoutRef.current = setTimeout(() => {
      videoPlayerLogger.warn(
        `Video loading timeout for ${src.substring(0, 50)}...`,
      );

      // Try to auto-retry once before showing error
      if (videoRef.current && src) {
        videoPlayerLogger.info("Attempting auto-retry for failed video");
        videoRef.current.load();

        // Give it one more chance with extended timeout
        loadingTimeoutRef.current = setTimeout(() => {
          videoPlayerLogger.error("Video failed to load after retry");
          setHasError(true);
          setIsLoading(false);
        }, 10000); // 10s retry timeout
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    }, 30000); // Increased from 15s to 30s

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [src]);

  // Sync autoPlay prop updates (critical for feed scrolling)
  useEffect(() => {
    if (!videoRef.current) return;

    if (autoPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented
          // videoPlayerLogger.debug('Autoplay prevented:', error);
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [autoPlay]);

  // Sync muted prop updates
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = muted;
    setIsMuted(muted);
  }, [muted]);

  // Apply playback speed (TikTok-style)
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Handle speed change
  const handleSpeedChange = useCallback(
    (speed: number) => {
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
      tap();
    },
    [tap],
  );

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
      tap();
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      onPlay?.();
      tap();
    }
  }, [isPlaying, onPause, onPlay, tap]);

  // Mute/Unmute toggle
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    tap();
  }, [isMuted, tap]);

  // Seek to position
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Volume control
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;
      const vol = parseFloat(e.target.value);
      videoRef.current.volume = vol;
      setVolume(vol);
      if (vol === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    },
    [],
  );

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        } else if ((videoRef.current as any).webkitRequestFullscreen) {
          await (videoRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
        impact();
      }
    } catch (error) {
      videoPlayerLogger.error("Fullscreen error:", error);
    }
  }, [isFullscreen, impact]);

  // Update time as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);

      // Log Metrics on unmount
      if (metricsRef.current.startTime) {
        videoPlayerLogger.info(`Playback Metrics for ${src.slice(-15)}:`, {
          ttff: metricsRef.current.timeToFirstFrame,
          stalls: metricsRef.current.stalledCount,
          totalStallTime: metricsRef.current.totalStalledTime,
          mse: !!mseUrl,
          fallback: !mseUrl && videoSource?.type === "partial-chunks",
        });
      }

      // Hard cleanup to stop buffering/decoding immediately on unmount
      // Moved outside conditional to ensure it always runs regardless of playback state
      video.removeAttribute("src");
      video.load();
    };
  }, [onEnded, src, mseUrl, videoSource]);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Validate video source URL (must be a playable video, not an image)
  const isValidVideoUrl = (url: string | undefined): boolean => {
    if (!url || typeof url !== "string") return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i;
    if (imageExtensions.test(url)) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.startsWith("/") || url.startsWith("blob:");
    }
  };

  // Mux Player Integration - Return early if Mux ID is present
  if (muxPlaybackId) {
    videoPlayerLogger.info("[VideoPlayer] Using MUX path:", {
      playbackId: muxPlaybackId,
      autoPlay,
      muted,
    });
    return (
      <div
        className={cn(
          "relative group video-hover-glow rounded-xl overflow-hidden",
          className,
        )}
        style={style}
      >
        <Suspense fallback={<div className="w-full h-full bg-black" />}>
          <MuxPlayer
            playbackId={muxPlaybackId}
            metadata={{
              videoTitle: "Zyeuté Exclusive",
            }}
            streamType="on-demand"
            accentColor="#FFB800"
            envKey="m5a8o9td2kq7765je565khl96"
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            className="w-full h-full object-cover"
            style={
              {
                height: "100%",
                width: "100%",
                "--media-object-fit": "cover",
                "--media-control-background": "transparent",
                ...videoStyle,
              } as any
            }
            onEnded={onEnded}
            onPlay={onPlay}
            onPause={onPause}
          />
        </Suspense>
      </div>
    );
  }

  // Native HTML5 path logging
  videoPlayerLogger.info("[VideoPlayer] Using NATIVE HTML5 path:", {
    src: src?.substring(0, 80),
    effectiveSrc: effectiveSrc?.substring(0, 80),
    autoPlay,
    muted,
    hasMseUrl: !!mseUrl,
    hasVideoSource: !!videoSource,
  });

  // If no valid source URL, show placeholder
  if (!isValidVideoUrl(src)) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-zinc-900",
          className,
        )}
        style={style}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-white/60 text-sm">Aucune vidéo</p>
        </div>
      </div>
    );
  }

  // If there's a loading error, show error state with retry option
  if (hasError) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-zinc-900",
          className,
        )}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-white/60 text-sm mb-3">Vidéo non disponible</p>
          <p className="text-white/40 text-xs mb-4">
            Le contenu met un peu plus de temps à charger
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-colors text-sm"
            >
              Réessayer
            </button>
            <button
              onClick={() => {
                // Try to refresh the entire feed by reloading
                window.location.reload();
              }}
              className="px-4 py-2 bg-stone-600/20 text-stone-300 rounded-lg hover:bg-stone-600/30 transition-colors text-sm"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group video-hover-glow rounded-xl overflow-hidden",
        className,
      )}
      style={style}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }}
      onClick={togglePlay}
    >
      {/* Streaming Debug Overlay */}
      // eslint-disable-next-line react-hooks/refs
      {isDebugEnabled && debug && (
        <Suspense fallback={null}>
          <StreamingDebugOverlay
            url={src}
            activeRequests={debug.activeRequests}
            concurrency={debug.concurrency}
            tier={debug.tier as any}
            playheadByte={
              videoSource?.type === "partial-chunks" &&
              videoSource.totalSize &&
              duration
                ? (currentTime / duration) * videoSource.totalSize
                : 0
            }
            totalSize={
              videoSource?.type === "partial-chunks"
                ? videoSource.totalSize
                : undefined
            }
            ttff={metricsRef.current.timeToFirstFrame}
            stalls={metricsRef.current.stalledCount}
            stallDuration={metricsRef.current.totalStalledTime}
            isMse={!!mseUrl}
            isFallback={!mseUrl && videoSource?.type === "partial-chunks"}
          />
        </Suspense>
      )}
      {/* Video Element */}
      {/* Preload prioritized poster */}
      {priority && poster && (
        <img
          src={poster}
          alt=""
          className="hidden"
          fetchPriority="high"
          onError={() => {}} // Ignore errors on preload
        />
      )}
      <video
        ref={videoRef}
        src={effectiveSrc}
        poster={poster}
        playsInline // CRITICAL for iOS production
        muted={muted} // CRITICAL for production - required as HTML attribute for autoplay
        autoPlay={autoPlay} // Explicit attribute + useEffect sync for better compatibility
        loop={loop} // Explicit attribute for continuous playback
        crossOrigin="anonymous"
        preload={preload}
        className="w-full h-full object-cover"
        style={videoStyle}
        onError={handleError}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
      />
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-gold-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-white/60 text-sm">Chargement...</p>
          </div>
        </div>
      )}
      {/* Play/Pause Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold-lg hover:scale-110 active:scale-95 transition-transform press-scale"
          >
            <svg
              className="w-10 h-10 text-black ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}
      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--edge-color) 0%, var(--edge-color) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
            }}
          />
          <div className="flex justify-between text-white text-xs mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-gold-400 transition-colors active:scale-90 press-scale"
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-gold-400 transition-colors active:scale-90 press-scale"
            >
              {isMuted ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            {/* Volume Slider */}
            <div className="hidden md:flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-gold-400 transition-colors active:scale-90 press-scale"
          >
            {isFullscreen ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
