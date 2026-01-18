/**
 * Video Warm Cache (Mini)
 * Keeps the last 1-2 videos in memory as Blob URLs for instant playback.
 *
 * Strategy:
 * - Store full video Blobs in memory.
 * - Max capacity: 3 videos (approx 10-50MB total depending on compression).
 * - Evict oldest (LRU) when capacity is exceeded.
 * - Handles creation and revocation of ObjectURLs to prevent memory leaks.
 */

import { logger } from "./logger";

const cacheLogger = logger.withContext("VideoWarmCache");

interface ChunkEntry {
  start: number;
  end: number;
  data: ArrayBuffer;
}

interface CacheEntry {
  url: string;
  type: "full" | "partial";
  chunks: ChunkEntry[];
  blobUrl?: string;
  mimeType?: string;
  totalSize?: number; // From Content-Length header
  timestamp: number;
}

const MAX_VIDEO_MEMORY = 50 * 1024 * 1024; // Increased to 50MB per video for HD
// Global Total Memory Limit (Soft Cap)
const GLOBAL_MEMORY_CAP = 250 * 1024 * 1024; // 250MB Total

class VideoWarmCache {
  private cache: Map<string, CacheEntry> = new Map();
  // Capacity increased to 5 to support Adaptive Buffer (Current + 3 Future + 1 Past)
  private maxCapacity = 5;

  // Instrumentation
  public stats = {
    compactionCount: 0,
    evictionCount: 0,
    chunkRemovals: 0,
  };

  /**
   * Add a chunk
   */
  addChunk(
    url: string,
    data: ArrayBuffer,
    start: number,
    end: number,
    mimeType?: string,
    totalSize?: number,
  ) {
    let entry = this.cache.get(url);
    if (!entry) {
      if (this.cache.size >= this.maxCapacity) this.evictOldest();
      entry = {
        url,
        type: "partial",
        chunks: [],
        timestamp: Date.now(),
        mimeType,
        totalSize,
      };
      this.cache.set(url, entry);
    }

    if (entry.type === "full") return;

    // Memory Guard
    const currentMemory = this.getMemoryUsage(url);
    if (currentMemory + data.byteLength > MAX_VIDEO_MEMORY) {
      cacheLogger.warn(
        `Memory cap reached for ${url.slice(0, 20)}. Evicting chunks...`,
      );
      // If we hit cap, we should probably clear chunks behind playhead elsewhere,
      // but here we just stop adding to prevent runaway memory.
      return;
    }

    const exists = entry.chunks.some((c) => c.start === start);
    if (!exists) {
      entry.chunks.push({ start, end, data });
      entry.chunks.sort((a, b) => a.start - b.start);
      this.compactChunks(url); // Merge contiguous chunks immediately
    }

    if (mimeType) entry.mimeType = mimeType;
    if (totalSize) entry.totalSize = totalSize;
    entry.timestamp = Date.now();
  }

  /**
   * Merges contiguous chunk ranges into a single chunk
   */
  private compactChunks(url: string) {
    const entry = this.cache.get(url);
    if (!entry || entry.chunks.length <= 1) return;

    const compacted: ChunkEntry[] = [];
    let current = entry.chunks[0];

    for (let i = 1; i < entry.chunks.length; i++) {
      const next = entry.chunks[i];
      if (next.start <= current.end + 1) {
        // Contiguous or overlapping
        const newData = new Uint8Array(
          current.data.byteLength + next.data.byteLength,
        );
        newData.set(new Uint8Array(current.data), 0);
        newData.set(new Uint8Array(next.data), current.data.byteLength);

        current = {
          start: current.start,
          end: Math.max(current.end, next.end),
          data: newData.buffer,
        };
      } else {
        compacted.push(current);
        current = next;
      }
    }
    compacted.push(current);
    if (entry.chunks.length > compacted.length) {
      this.stats.compactionCount++;
    }
    entry.chunks = compacted;
  }

  /**
   * Remove chunks that have already been played to free memory
   */
  clearConsumedChunks(url: string, playheadByte: number) {
    const entry = this.cache.get(url);
    if (!entry || entry.type === "full") return;

    // We keep at least 512KB before playhead for seeking stability
    const keepThreshold = Math.max(0, playheadByte - 512 * 1024);

    const initialCount = entry.chunks.length;
    entry.chunks = entry.chunks.filter((chunk) => {
      // If the entire chunk is before the threshold, discard it
      return chunk.end >= keepThreshold;
    });

    if (entry.chunks.length < initialCount) {
      this.stats.chunkRemovals += initialCount - entry.chunks.length;
      cacheLogger.debug(
        `Evicted consumed chunks for ${url.slice(0, 20)}. Memory: ${(this.getMemoryUsage(url) / 1024 / 1024).toFixed(2)}MB`,
      );
    }
  }

  getMemoryUsage(url: string): number {
    const entry = this.cache.get(url);
    if (!entry) return 0;
    return entry.chunks.reduce((acc, c) => acc + c.data.byteLength, 0);
  }

  /**
   * Get the next byte we need to fetch for a sequential stream
   */
  getNextByteToFetch(url: string): number {
    const entry = this.cache.get(url);
    if (!entry || entry.chunks.length === 0) return 0;

    // Find the end of the last continuous chunk starting from 0
    let lastByte = -1;
    for (const chunk of entry.chunks) {
      if (chunk.start <= lastByte + 1) {
        lastByte = Math.max(lastByte, chunk.end);
      } else {
        break;
      }
    }
    return lastByte + 1;
  }

  /**
   * Promote to full
   */
  setFullBlob(url: string, blob: Blob) {
    let entry = this.cache.get(url);
    if (!entry) {
      if (this.cache.size >= this.maxCapacity) this.evictOldest();
      entry = { url, type: "full", chunks: [], timestamp: Date.now() };
      this.cache.set(url, entry);
    }

    if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);

    entry.type = "full";
    entry.blobUrl = URL.createObjectURL(blob);
    entry.timestamp = Date.now();
    // Clear chunks to save memory since we have the full blob
    entry.chunks = [];

    cacheLogger.debug(
      `Promoted to full blob: ${url.slice(0, 30)}... | Size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`,
    );
    return entry.blobUrl;
  }

  getEntry(url: string): CacheEntry | undefined {
    const entry = this.cache.get(url);
    if (entry) entry.timestamp = Date.now();
    return entry;
  }

  /**
   * Check if url is cached
   */
  has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Evict least recently used items
   */
  private evictOldest() {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;

    for (const [url, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      this.stats.evictionCount++;
      this.remove(oldestUrl);
    }
  }

  /**
   * Remove specific item and revoke URL
   */
  private remove(url: string) {
    const entry = this.cache.get(url);
    if (entry) {
      if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
      this.cache.delete(url);
      cacheLogger.debug(`Evicted video: ${url.slice(0, 30)}...`);
    }
  }

  /**
   * Clear all (e.g. on unmount or memory warning)
   */
  clear() {
    for (const url of this.cache.keys()) {
      this.remove(url);
    }
  }
}

export const videoCache = new VideoWarmCache();
