import { useState, useEffect, useRef, useCallback } from "react";
import { videoCache } from "@/lib/videoWarmCache";
import { logger } from "@/lib/logger";
import { mediaTelemetry } from "@/lib/mediaTelemetry";

const prefetchLogger = logger.withContext("usePrefetchVideo");

export type PreloadTier = 0 | 1 | 2 | 3; // 0: Poster, 1: Partial, 2: Full, 3: Predictive

const PARTIAL_CHUNK_SIZE = 1024 * 1024; // 1MB

export type VideoSource =
  | { type: "url"; src: string }
  | { type: "blob"; src: string }
  | {
      type: "partial-chunks";
      chunks: { start: number; end: number; data: ArrayBuffer }[];
      mimeType?: string;
      totalSize?: number;
    };

interface UsePrefetchVideoResult {
  source: VideoSource;
  isCached: boolean;
  debug?: {
    activeRequests: number;
    concurrency: number;
    tier: PreloadTier;
  };
}

// Global network speed estimate (bytes per ms)
let networkSpeedEstimate = 1000; // Default 1MB/s
const networkSamples: number[] = [];

const updateNetworkSpeed = (bytes: number, ms: number) => {
  if (ms <= 0) return;
  const speed = bytes / ms;
  networkSamples.push(speed);
  if (networkSamples.length > 5) networkSamples.shift();
  networkSpeedEstimate =
    networkSamples.reduce((a, b) => a + b, 0) / networkSamples.length;
};

const getAdaptiveChunkSize = () => {
  if (networkSpeedEstimate > 2000) return 2 * 1024 * 1024; // 2MB
  if (networkSpeedEstimate < 500) return 512 * 1024; // 512KB
  return 1024 * 1024; // 1MB
};

const getAdaptiveConcurrency = () => {
  if (networkSpeedEstimate > 2000) return 3;
  if (networkSpeedEstimate > 500) return 2;
  return 1;
};

/**
 * Hook to manage video prefetching based on tiers.
 */
export function usePrefetchVideo(
  url: string,
  tier: PreloadTier,
): UsePrefetchVideoResult {
  const getCacheState = useCallback((): VideoSource => {
    const entry = videoCache.getEntry(url);
    if (entry?.type === "full" && entry.blobUrl) {
      return { type: "blob", src: entry.blobUrl };
    }
    if (entry?.type === "partial" && entry.chunks.length > 0) {
      return {
        type: "partial-chunks",
        chunks: entry.chunks,
        mimeType: entry.mimeType,
        totalSize: entry.totalSize,
      };
    }
    return { type: "url", src: url };
  }, [url]);

  const [source, setSource] = useState<VideoSource>(getCacheState());
  const [debugInfo, setDebugInfo] = useState({ requests: 0, concurrency: 1 });
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestsRef = useRef(0);

  const isCached = source.type !== "url";

  const updateDebug = useCallback(() => {
    setDebugInfo({
      requests: activeRequestsRef.current,
      concurrency: getAdaptiveConcurrency(),
    });
  }, []);

  useEffect(() => {
    const cached = getCacheState();
    if (cached.type === "blob") {
      mediaTelemetry.recordCacheHit(url);
      setSource(cached);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (tier === 0 || !url) {
      setDebugInfo({ requests: 0, concurrency: 1 });
      return;
    }

    if (cached.type === "url") mediaTelemetry.recordCacheMiss(url);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeRequestsRef.current = 0;
    updateDebug();

    const fetchNextChunk = async () => {
      if (controller.signal.aborted) return;

      const currentEntry = videoCache.getEntry(url);
      if (currentEntry?.type === "full") return;

      const startByte = videoCache.getNextByteToFetch(url);
      if (currentEntry?.totalSize && startByte >= currentEntry.totalSize) {
        return;
      }

      // Backpressure check
      const memoryUsage = videoCache.getMemoryUsage(url);
      if (memoryUsage > 5 * 1024 * 1024 && tier < 2) {
        return;
      }

      activeRequestsRef.current++;
      updateDebug();

      try {
        const chunkSize = getAdaptiveChunkSize();
        const endByte = startByte + chunkSize - 1;

        const startTime = Date.now();
        const response = await fetch(url, {
          headers: { Range: `bytes=${startByte}-${endByte}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 416) return;
          throw new Error(`Chunk fetch failed: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const timeTaken = Date.now() - startTime;
        updateNetworkSpeed(buffer.byteLength, timeTaken);

        const type =
          response.headers.get("Content-Type")?.split(";")[0] || "video/mp4";
        const totalSizeStr = response.headers
          .get("Content-Range")
          ?.split("/")[1];
        const totalSize = totalSizeStr ? parseInt(totalSizeStr) : undefined;

        videoCache.addChunk(
          url,
          buffer,
          startByte,
          startByte + buffer.byteLength - 1,
          type,
          totalSize,
        );

        const updated = videoCache.getEntry(url);
        if (!controller.signal.aborted && updated) {
          setSource({
            type: "partial-chunks",
            chunks: updated.chunks,
            mimeType: type,
            totalSize: updated.totalSize,
          });
        }

        const targetChunks = tier === 1 ? 4 : tier === 3 ? 3 : 200;
        const currentChunksCount = updated?.chunks.length || 0;

        if (currentChunksCount < targetChunks) {
          fillWorkerPool(targetChunks);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          prefetchLogger.warn("Chunk fetch error:", err);
        }
      } finally {
        activeRequestsRef.current--;
        updateDebug();
      }
    };

    const fillWorkerPool = (targetTotal: number) => {
      const concurrency = getAdaptiveConcurrency();
      const currentEntry = videoCache.getEntry(url);
      const currentCount = currentEntry?.chunks.length || 0;

      while (
        activeRequestsRef.current < concurrency &&
        currentCount + activeRequestsRef.current < targetTotal
      ) {
        fetchNextChunk();
        if (activeRequestsRef.current >= concurrency) break;
      }
    };

    const fetchRemainingFull = async () => {
      if (tier === 2 && !controller.signal.aborted) {
        const updated = videoCache.getEntry(url);
        if (updated?.type !== "full") {
          const response = await fetch(url, { signal: controller.signal });
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = videoCache.setFullBlob(url, blob);
            setSource({ type: "blob", src: blobUrl });
          }
        }
      }
    };

    const limit = tier === 1 ? 4 : tier === 3 ? 3 : 200;
    fillWorkerPool(limit);
    if (tier === 2) fetchRemainingFull();

    return () => {
      controller.abort();
      setDebugInfo({ requests: 0, concurrency: 1 });
    };
  }, [url, tier, getCacheState, updateDebug]);

  return {
    source,
    isCached,
    debug: {
      activeRequests: debugInfo.requests,
      concurrency: debugInfo.concurrency,
      tier,
    },
  };
}
