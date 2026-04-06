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
import Hls from "hls.js";
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
const lastByteMap = new WeakMap<SourceBuffer, number>();

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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { tap, impact } = useHaptics();

  // Retry & stall recovery state
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progress70FiredRef = useRef(false);
  const [bufferProgress, setBufferProgress] = useState(0);

  // TikTok-style speed controls

  // Frame-accurate playback tracking (uses requestVideoFrameCallback when available)
  useVideoFrameCallback(videoRef, (time, _frames) => {
    if (onProgress && duration > 0 && !progress70FiredRef.current) {
      const progress = time / duration;
      if (progress >= 0.7) {
        progress70FiredRef.current = true;
        onProgress(progress);
      }
    }
  });

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

  // HLS.js for .m3u8 sources (adaptive bitrate)
  const hlsRef = useRef<Hls | null>(null);
  const isHlsSrc =
    src &&
    typeof src === "string" &&
    (src.endsWith(".m3u8") || src.includes(".m3u8"));

  // Social media embed detection
  const getSocialEmbedDetails = (url: string) => {
    const lowerUrl = url.toLowerCase();

    // TikTok
    if (lowerUrl.includes("tiktok.com")) {
      // Extract ID: tiktok.com/@user/video/123456789
      const match = url.match(/\/video\/(\d+)/);
      if (match) {
        return {
          type: "tiktok",
          id: match[1],
          embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
        };
      }
      return { type: "tiktok", embedUrl: url }; // Fallback
    }

    // YouTube
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:.*v=|\/embed\/|\/v\/))([^?&"'>]+)/,
      );
      if (match) {
        return {
          type: "youtube",
          id: match[1],
          embedUrl: `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${match[1]}`,
        };
      }
    }

    // Vimeo
    if (lowerUrl.includes("vimeo.com")) {
      const match = url.match(
        /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/,
      );
      if (match) {
        return {
          type: "vimeo",
          id: match[1],
          embedUrl: `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=${muted ? 1 : 0}&loop=1`,
        };
      }
    }

    return null;
  };

  const socialEmbed = src ? getSocialEmbedDetails(src) : null;
  const isSocial = !!socialEmbed;

  // Determine effective source
  const effectiveSrc = isSocial
    ? ""
    : isHlsSrc
      ? ""
      : mseUrl ||
        (videoSource?.type === "blob" || videoSource?.type === "url"
          ? videoSource.src
          : src);

  // HLS.js setup for .m3u8 sources
  useEffect(() => {
    if (!isHlsSrc || !src || !videoRef.current) return;
    const el = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        backBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.3,
        // Main-thread demux avoids CSP / cross-origin worker issues on some hosts
        enableWorker: false,
        capLevelToPlayerSize: true,
        startLevel: -1,
        abrEwmaDefaultEstimate: 1_000_000,
        abrEwmaFastLive: 3.0,
        abrEwmaSlowLive: 9.0,
        abrEwmaFastVoD: 3.0,
        abrEwmaSlowVoD: 9.0,
        progressive: true,
        lowLatencyMode: false,
        testBandwidth: true,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
        maxBufferLength: 30, // 3x bigger: 10s → 30s
        maxMaxBufferLength: 60, // 3x bigger: 30s → 60s
        startFragPrefetch: true, // Prefetch before media attach
        abrBandWidthFactor: 0.9, // Conservative: fewer quality drops
        abrBandWidthUpFactor: 0.7, // Stable quality selection
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(el);
      let hlsRecoverAttempts = 0;
      const maxHlsRecover = 5;
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        videoPlayerLogger.warn("[VideoPlayer] HLS fatal error:", data);
        if (hlsRecoverAttempts >= maxHlsRecover) {
          hls.destroy();
          hlsRef.current = null;
          setReadiness("error");
          return;
        }
        hlsRecoverAttempts++;
        try {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
            hlsRef.current = null;
            setReadiness("error");
          }
        } catch {
          setReadiness("error");
        }
      });
      if (autoPlay) {
        el.muted = true;
        el.play().catch(() => {});
      }
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
      if (autoPlay) el.play().catch(() => {});
      return () => {
        el.pause();
        el.src = "";
      };
    }
  }, [src, isHlsSrc, autoPlay]);

  // Pause HLS when not autoPlay
  useEffect(() => {
    if (!isHlsSrc || !videoRef.current) return;
    if (!autoPlay) {
      videoRef.current.pause();
    }
  }, [isHlsSrc, autoPlay]);

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

    if (!videoRef.current || videoSource?.type !== "partial-chunks") return;

    if (mseRef.current && sourceBufferRef.current) {
      const sb = sourceBufferRef.current;
      const currentChunks = videoSource.chunks;
      const lastAppendedByte = lastByteMap.get(sb) ?? -1;

      const newChunks = currentChunks.filter((c) => c.start > lastAppendedByte);
      if (newChunks.length > 0) {
        newChunks.forEach((c) => {
          pendingChunksRef.current.push(c.data);
          lastByteMap.set(sb, Math.max(lastByteMap.get(sb) || 0, c.end));
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
      const ms = mseRef.current;
      const sb = sourceBufferRef.current;
      if (!ms || ms.readyState !== "open") return;
      if (!sb || sb.updating || pendingChunksRef.current.length === 0) return;

      const data = pendingChunksRef.current.shift();
      if (data) {
        try {
          sb.appendBuffer(data);
        } catch (e: unknown) {
          if (e instanceof Error && e.name === "QuotaExceededError") {
            videoPlayerLogger.warn(
              "MSE Quota Exceeded. Clearing played buffer to reduce memory...",
            );
            const video = videoRef.current;
            if (video && sb.buffered.length > 0 && !sb.updating) {
              const start = 0;
              const end = Math.max(0, video.currentTime - 30);
              if (end > start) {
                try {
                  sb.remove(start, end);
                } catch (removeErr: unknown) {
                  videoPlayerLogger.warn(
                    "MSE remove failed:",
                    removeErr instanceof Error
                      ? removeErr.message
                      : String(removeErr),
                  );
                }
              }
            }
            pendingChunksRef.current.unshift(data);
          }
          videoPlayerLogger.error("MSE Append Error:", e);
        }
      }
    };

    const handleSourceOpen = () => {
      try {
        if (mediaSource.readyState !== "open") return;

        // Type guard for partial-chunks properties
        if (videoSource.type !== "partial-chunks") return;

        const mimeType =
          videoSource.mimeType || 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        if (!MediaSource.isTypeSupported(mimeType)) {
          videoPlayerLogger.warn(
            `MSE Type not supported: ${mimeType}. Falling back to URL.`,
          );
          setMseUrl(null);
          return;
        }

        const sb = mediaSource.addSourceBuffer(mimeType);
        sourceBufferRef.current = sb;
        try {
          sb.mode = "sequence";
        } catch {
          // ignore
        }

        sb.addEventListener("updateend", () => {
          if (mediaSource.readyState !== "open") return;
          processQueue();
          if (
            videoSource.type === "partial-chunks" &&
            videoSource.totalSize &&
            (lastByteMap.get(sb) ?? 0) >= videoSource.totalSize - 1
          ) {
            if (!sb.updating) {
              mediaSource.endOfStream();
            }
          }
        });

        videoSource.chunks.forEach((c) => {
          pendingChunksRef.current.push(c.data);
          lastByteMap.set(sb, Math.max(lastByteMap.get(sb) || 0, c.end));
        });

        processQueue();
      } catch (e) {
        videoPlayerLogger.error("MSE Init Error:", e);
        if (mseRetryCount < 1) {
          setMseRetryCount((c) => c + 1);
        } else {
          setReadiness("error");
        }
      }
    };

    mediaSource.addEventListener("sourceopen", handleSourceOpen);

    return () => {
      mediaSource.removeEventListener("sourceopen", handleSourceOpen);
      pendingChunksRef.current = [];
      sourceBufferRef.current = null;
      mseRef.current = null;
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };
  }, [videoSource, mseRetryCount, mseUrl, src, duration]);

  // Handle video source errors with exponential backoff retry
  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      const video = e.currentTarget;
      const error = video.error;

      // Log detailed error info
      const errorCode = error?.code;
      let errorName = "UNKNOWN";
      if (errorCode === 1) errorName = "ABORTED";
      if (errorCode === 2) errorName = "NETWORK";
      if (errorCode === 3) errorName = "DECODE";
      if (errorCode === 4) errorName = "SRC_NOT_SUPPORTED";

      console.error(`[VideoPlayer] ❌ VIDEO ERROR (${errorName}):`, {
        code: errorCode,
        message: error?.message,
        src: src?.substring(0, 100),
        networkState: video.networkState,
        readyState: video.readyState,
      });

      // Only log as error when retries are exhausted; use debug during retries
      if (retryCountRef.current >= MAX_RETRIES) {
        console.error("[VideoPlayer] ❌ Max retries reached, showing error UI");
      }

      // Soft Fallback: If MSE fails, try raw URL once before giving up
      if (mseUrl) {
        videoPlayerLogger.warn("MSE playback failed, falling back to raw URL");
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setMseUrl(null);
        return;
      }

      // Exponential backoff retry (1s, 2s, 4s)
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        retryCountRef.current++;
        videoPlayerLogger.info(
          `Retry ${retryCountRef.current}/${MAX_RETRIES} in ${delay}ms for ${src?.substring(0, 50)}`,
        );
        setReadiness("loading");
        loadingTimeoutRef.current = setTimeout(() => {
          if (videoRef.current) {
            // Force reload with cache-bust on final retry
            if (retryCountRef.current === MAX_RETRIES && src) {
              const bustUrl = src.includes("?")
                ? `${src}&_retry=${Date.now()}`
                : `${src}?_retry=${Date.now()}`;
              videoRef.current.src = bustUrl;
            }
            videoRef.current.load();
          }
        }, delay);
        return;
      }

      videoPlayerLogger.error("Video playback error (retries exhausted):", {
        code: error?.code,
        message: error?.message,
        src: src?.substring(0, 100),
        videoSource: videoSource?.type,
        timestamp: new Date().toISOString(),
      });

      setReadiness("error");
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
  }, [src]);

  const handleWaiting = useCallback(() => {
    metricsRef.current.stalledCount++;
    metricsRef.current.lastStallStart = Date.now();

    // Stall recovery: if stalled for >8s, try to nudge playback
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      // If still waiting (readyState < HAVE_FUTURE_DATA), attempt recovery
      if (video.readyState < 3 && !video.paused) {
        videoPlayerLogger.warn("Stall recovery: nudging playback position");
        // Seek forward slightly to trigger new buffer request
        const nudge = Math.min(0.5, video.duration - video.currentTime - 0.1);
        if (nudge > 0) {
          video.currentTime += nudge;
        } else {
          // Near end, try reload
          video.load();
          video.play().catch(() => {});
        }
      }
      stallTimerRef.current = null;
    }, 8000);
  }, []);

  const handleCanPlay = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    retryCountRef.current = 0; // Reset retry count on successful load
    const ms = metricsRef.current.startTime
      ? Date.now() - metricsRef.current.startTime
      : 0;
    if (ms > 0) mediaTelemetry.recordBufferReady(src, ms);
    console.log("[VideoPlayer] ✅ VIDEO CAN PLAY - Ready for playback", {
      src: src?.substring(0, 60),
    });
    setReadiness("ready");
  }, [src]);

  // Track buffer progress for loading UI
  const handleProgress = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.buffered.length > 0 && video.duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBufferProgress(Math.min(100, (bufferedEnd / video.duration) * 100));
    }
  }, []);

  // Handle loading started
  const handleLoadStart = useCallback(() => {
    setReadiness("loading");
    metricsRef.current.startTime = Date.now();
  }, []);

  // Reset states when source changes (state machine: -> loading)
  useEffect(() => {
    setReadiness("loading");
    setDuration(0);
    setCurrentTime(0);
    setBufferProgress(0);
    retryCountRef.current = 0; // Reset retries for new source

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }

    const m3u8 =
      src &&
      typeof src === "string" &&
      (src.endsWith(".m3u8") || src.includes(".m3u8"));
    const hlsJsPipeline = !!(m3u8 && Hls.isSupported());

    if (hlsJsPipeline) {
      // hls.js drives MSE on the element — calling video.load() from a timer
      // tears down the pipeline and produces false "Vidéo non disponible".
      loadingTimeoutRef.current = setTimeout(() => {
        videoPlayerLogger.error(
          `HLS (hls.js) still not playable after 90s: ${src.substring(0, 60)}`,
        );
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        setReadiness("error");
        loadingTimeoutRef.current = null;
      }, 90_000);
    } else if (m3u8) {
      // Safari / native HLS: src is set on <video>; load() is safe.
      const t1 = 32_000;
      const t2 = 22_000;
      loadingTimeoutRef.current = setTimeout(() => {
        videoPlayerLogger.warn(
          `Native HLS slow load (${t1}ms), retrying: ${src.substring(0, 50)}`,
        );
        if (videoRef.current && src) {
          retryCountRef.current = 0;
          videoRef.current.load();
          loadingTimeoutRef.current = setTimeout(() => {
            videoPlayerLogger.error("Native HLS failed after retry");
            setReadiness("error");
            loadingTimeoutRef.current = null;
          }, t2);
        } else {
          setReadiness("error");
          loadingTimeoutRef.current = null;
        }
      }, t1);
    } else {
      // Progressive MP4 / blob / other
      const t1 = 24_000;
      const t2 = 20_000;
      loadingTimeoutRef.current = setTimeout(() => {
        videoPlayerLogger.warn(
          `Video loading timeout (${t1}ms) for ${src.substring(0, 50)}...`,
        );
        if (videoRef.current && src) {
          videoPlayerLogger.info("Attempting auto-retry for failed video");
          retryCountRef.current = 0;
          videoRef.current.load();
          loadingTimeoutRef.current = setTimeout(() => {
            videoPlayerLogger.error("Video failed to load after retry");
            setReadiness("error");
            loadingTimeoutRef.current = null;
          }, t2);
        } else {
          setReadiness("error");
          loadingTimeoutRef.current = null;
        }
      }, t1);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    };
  }, [src]);

  // Sync autoPlay prop updates (critical for feed scrolling)
  useEffect(() => {
    if (!videoRef.current) return;

    if (autoPlay) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((_error) => {
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

  // Handle speed change

  // Play/Pause toggle (handle play() promise to avoid unhandled rejection)
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
      tap();
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          videoPlayerLogger.warn(
            "Play failed (e.g. policy or interrupted):",
            err,
          );
          setIsPlaying(false);
        });
      }
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
        } else if ("webkitRequestFullscreen" in videoRef.current) {
          await (
            videoRef.current as HTMLVideoElement & {
              webkitRequestFullscreen(): Promise<void>;
            }
          ).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ("webkitExitFullscreen" in document) {
          await (
            document as Document & { webkitExitFullscreen(): Promise<void> }
          ).webkitExitFullscreen();
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

    const metrics = metricsRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress && video.duration > 0 && !progress70FiredRef.current) {
        const progress = video.currentTime / video.duration;
        if (progress >= 0.7) {
          progress70FiredRef.current = true;
          onProgress(progress);
        }
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const m3u8 =
        src &&
        typeof src === "string" &&
        (src.endsWith(".m3u8") || src.includes(".m3u8"));
      // HLS (native or hls.js): keep the long/slow-network timers until canplay.
      if (!m3u8 && loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
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
      progress70FiredRef.current = false;

      // Log Metrics on unmount
      if (metrics.startTime) {
        videoPlayerLogger.info(`Playback Metrics for ${src.slice(-15)}:`, {
          ttff: metrics.timeToFirstFrame,
          stalls: metrics.stalledCount,
          totalStallTime: metrics.totalStalledTime,
          mse: !!mseUrl,
          fallback: !mseUrl && videoSource?.type === "partial-chunks",
        });
      }

      // Clear stall recovery timer
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }

      // Hard cleanup to stop buffering/decoding immediately on unmount
      // Moved outside conditional to ensure it always runs regardless of playback state
      video.removeAttribute("src");
      video.load();
    };
  }, [onEnded, onProgress, src, mseUrl, videoSource]);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Validate video source URL (must be a playable video, a stream, or a social link)
  const isValidVideoUrl = (url: string | undefined): boolean => {
    if (!url || typeof url !== "string") return false;

    // If it's a social link, it's valid for our iframe path
    if (
      url.includes("tiktok.com") ||
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com")
    ) {
      return true;
    }

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i;
    // Don't reject if it's a stream (m3u8) or has mux in it even if it has an extension later
    if (
      imageExtensions.test(url) &&
      !url.includes(".m3u8") &&
      !url.includes("mux.com")
    ) {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      return url.startsWith("/") || url.startsWith("blob:");
    }
  };

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

  if (readiness === "error") {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-zinc-900",
          className,
        )}
        style={style}
      >
        <div className="text-center p-4 max-w-xs">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-white/60 text-sm mb-1">Vidéo non disponible</p>
          <p className="text-white/40 text-xs mb-4">
            Vérifie ta connexion ou réessaie
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                retryCountRef.current = 0;
                setReadiness("loading");
                setBufferProgress(0);
                if (videoRef.current) {
                  // Fresh reload with cache-bust
                  if (src) {
                    const freshUrl = src.includes("?")
                      ? `${src}&_fresh=${Date.now()}`
                      : `${src}?_fresh=${Date.now()}`;
                    videoRef.current.src = freshUrl;
                  }
                  videoRef.current.load();
                }
              }}
              className="px-5 py-2.5 bg-linear-to-r from-[#D4AF37] to-[#FFD700] text-black font-bold rounded-full hover:shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all active:scale-95 text-sm"
            >
              Réessayer
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 text-white/70 rounded-full hover:bg-white/15 transition-colors text-sm"
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
        "relative group video-hover-glow video-motion-smooth rounded-xl overflow-hidden",
        className,
      )}
      style={{
        ...style,
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent (e.g. VideoCard) from catching and navigating away
        togglePlay();
      }}
    >
      {/* Streaming Debug Overlay */}
      {isDebugEnabled && debug && (
        <Suspense fallback={null}>
          <StreamingDebugOverlay
            url={src}
            activeRequests={debug.activeRequests}
            concurrency={debug.concurrency}
            tier={debug.tier}
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
      {/* Video Element with poster crossfade */}
      {poster && (
        <img
          src={poster}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-[1] pointer-events-none"
          style={{
            opacity: readiness === "ready" && isPlaying ? 0 : 1,
            transition: "opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1)",
            transform: "translate3d(0, 0, 0)",
          }}
          fetchPriority={priority ? "high" : "low"}
          onError={() => {}}
        />
      )}
      {/* Video Element */}
      {priority && poster && (
        <img
          src={poster}
          alt=""
          className="hidden"
          fetchPriority="high"
          onError={() => {}}
        />
      )}

      {isSocial && socialEmbed ? (
        <iframe
          src={socialEmbed.embedUrl}
          className="w-full h-full border-0 absolute inset-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={() => setReadiness("ready")}
          title="Social Content"
        />
      ) : (
        <video
          ref={videoRef}
          src={effectiveSrc}
          playsInline
          muted={muted}
          autoPlay={autoPlay}
          loop={loop}
          preload={preload}
          fetchPriority={priority ? "high" : "low"}
          className="w-full h-full object-cover video-container-crisp"
          style={{
            ...videoStyle,
            transform: "translate3d(0, 0, 0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          onError={handleError}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          onPlaying={handlePlaying}
          onWaiting={handleWaiting}
          onProgress={handleProgress}
        />
      )}
      {/* Loading / Buffering State — smooth fade overlay */}
      {readiness === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 video-transitioning">
          <div className="text-center">
            {/* Circular progress indicator */}
            <div className="relative w-14 h-14 mx-auto mb-3">
              <svg className="w-14 h-14 animate-spin" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="url(#goldGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${bufferProgress * 1.5} 150`}
                />
                <defs>
                  <linearGradient
                    id="goldGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#FFD700" />
                  </linearGradient>
                </defs>
              </svg>
              {bufferProgress > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-white/80 text-xs font-mono">
                  {Math.round(bufferProgress)}%
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm">
              {retryCountRef.current > 0
                ? `Reconnexion... (${retryCountRef.current}/${MAX_RETRIES})`
                : "Chargement..."}
            </p>
          </div>
        </div>
      )}
      {/* Play/Pause Overlay */}
      {!isPlaying && readiness !== "loading" && (
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
          "absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300",
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
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer video-progress-smooth"
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
