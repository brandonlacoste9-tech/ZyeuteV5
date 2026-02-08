/**
 * Media telemetry - optional hooks for cache hit rate, buffer starvation, TTFF, eviction.
 * Wire to your analytics (e.g. analytics.increment, backend) when ready.
 */

import { logger } from "./logger";

const telemetryLogger = logger.withContext("MediaTelemetry");

/** Replace with your analytics client when available */
export const mediaTelemetry = {
  /** Call when thumbnail generation times out (e.g. upload flow) */
  recordThumbnailTimeout(context?: string) {
    telemetryLogger.warn("Video thumbnail timed out", { context });
    if (typeof window !== "undefined" && (window as any).__zyeute_analytics?.increment) {
      (window as any).__zyeute_analytics.increment("video_thumbnail_timeout", { context });
    }
  },

  /** Call when video is served from cache (blob or partial chunks) */
  recordCacheHit(url: string) {
    telemetryLogger.debug("Cache hit", { url: url?.slice(0, 40) });
    if (typeof window !== "undefined" && (window as any).__zyeute_analytics?.increment) {
      (window as any).__zyeute_analytics.increment("video_cache_hit");
    }
  },

  /** Call when video is fetched from network (not from cache) */
  recordCacheMiss(url: string) {
    telemetryLogger.debug("Cache miss", { url: url?.slice(0, 40) });
    if (typeof window !== "undefined" && (window as any).__zyeute_analytics?.increment) {
      (window as any).__zyeute_analytics.increment("video_cache_miss");
    }
  },

  /** Call when play() is attempted but video not ready (readyState < 3) */
  recordBufferStarvation() {
    telemetryLogger.warn("Buffer starvation: play attempted before ready");
    if (typeof window !== "undefined" && (window as any).__zyeute_analytics?.increment) {
      (window as any).__zyeute_analytics.increment("video_buffer_starvation");
    }
  },

  /** Call when time-to-first-frame is known (ms) */
  recordTimeToFirstFrame(url: string, ms: number) {
    telemetryLogger.debug("TTFF", { url: url?.slice(0, 40), ms });
    if (typeof window !== "undefined" && (window as any).__zyeute_analytics?.timing) {
      (window as any).__zyeute_analytics.timing("video_ttff", ms, url?.slice(0, 60));
    }
  },

  /** Call when video has enough buffer to play (canplay); ms = time from loadStart. Tracks "time to buffer ready" for 5–10 s target. */
  recordBufferReady(url: string, ms: number) {
    telemetryLogger.debug("Buffer ready", { url: url?.slice(0, 40), ms });
    if (typeof window !== "undefined" && (window as any).__zyeute_analytics?.timing) {
      (window as any).__zyeute_analytics.timing("video_buffer_ready", ms, url?.slice(0, 60));
    }
  },

  /** Optional: call when cache evicts a URL (bytes evicted) */
  recordEviction(url: string, bytesEvicted?: number) {
    telemetryLogger.debug("Cache eviction", { url: url?.slice(0, 40), bytesEvicted });
  },
};

/**
 * Analytics wiring: set window.__zyeute_analytics with { increment(name, opts?), timing(name, ms, label?) }
 * when you have a backend. All metrics are logged via telemetryLogger regardless.
 */
