import React, { useState, useEffect } from "react";
import { PreloadTier } from "@/hooks/usePrefetchVideo";
import { videoCache } from "@/lib/videoWarmCache";

interface StreamingDebugOverlayProps {
  url: string;
  activeRequests: number;
  concurrency: number;
  tier: PreloadTier;
  playheadByte: number;
  totalSize?: number;
  ttff: number;
  stalls: number;
  stallDuration: number;
  isMse: boolean;
  isFallback: boolean;
}

const StreamingDebugOverlay: React.FC<StreamingDebugOverlayProps> = ({
  url,
  activeRequests,
  concurrency,
  tier,
  playheadByte,
  totalSize,
  ttff,
  stalls,
  stallDuration,
  isMse,
  isFallback,
}) => {
  const [stats, setStats] = useState(() => videoCache.stats);
  const [memory, setMemory] = useState(0);
  const [chunksCount, setChunksCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ ...videoCache.stats });
      setMemory(videoCache.getMemoryUsage(url));
      const entry = videoCache.getEntry(url);
      setChunksCount(
        entry?.type === "partial"
          ? entry.chunks.length
          : entry?.type === "full"
            ? 1
            : 0,
      );
    }, 500);
    return () => clearInterval(interval);
  }, [url]);

  // Read current stats from the actual instance
  const currentStats = videoCache.stats;

  const mode = tier === 2 ? "AGGRESSIVE" : tier === 3 ? "PREDICTIVE" : "QUIET";
  const bufferPercent = totalSize ? (memory / totalSize) * 100 : 0;
  const playheadPercent = totalSize ? (playheadByte / totalSize) * 100 : 0;

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none flex flex-col gap-2 font-mono text-[10px] sm:text-xs">
      {/* Engine Status */}
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-white shadow-2xl flex flex-col gap-1 min-w-[180px]">
        <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
          <span className="text-gold-400 font-bold uppercase tracking-wider">
            Engine v3.1
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${tier >= 2 ? "bg-gold-500 text-black" : "bg-zinc-700 text-zinc-300"}`}
          >
            {mode}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Workers:</span>
          <span>
            {activeRequests} / {concurrency}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Cache:</span>
          <span>{(memory / 1024 / 1024).toFixed(2)} MB / 30MB</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Chunks:</span>
          <span>
            {chunksCount} (Merged: {currentStats.compactionCount})
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Pipeline:</span>
          <span
            className={
              isFallback
                ? "text-red-400"
                : isMse
                  ? "text-green-400"
                  : "text-zinc-300"
            }
          >
            {isFallback ? "RAW_FALLBACK" : isMse ? "MSE_ACTIVE" : "URL_STATIC"}
          </span>
        </div>
      </div>

      {/* Metrics Panel */}
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-white shadow-2xl flex flex-col gap-1">
        <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
          <span className="text-blue-400 font-bold uppercase tracking-wider">
            Metrics
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">TTFF:</span>
          <span>{ttff > 0 ? `${ttff}ms` : "WAITING..."}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Stalls:</span>
          <span className={stalls > 0 ? "text-amber-400" : "text-green-400"}>
            {stalls} ({stallDuration}ms)
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Evictions:</span>
          <span>{currentStats.evictionCount + currentStats.chunkRemovals}</span>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-white shadow-2xl overflow-hidden w-[180px]">
        <div className="text-[8px] text-zinc-500 mb-1 uppercase">
          Buffer Map
        </div>
        <div className="grid grid-cols-10 gap-0.5 mb-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const chunkExists = chunksCount > i;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-sm ${chunkExists ? "bg-gold-500" : "bg-zinc-800"}`}
                title={`Chunk ${i}`}
              />
            );
          })}
        </div>

        <div className="relative h-2 bg-zinc-800 rounded overflow-hidden">
          {/* Buffering Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-gold-500/30 transition-all duration-500"
            style={{ width: `${bufferPercent}%` }}
          />
          {/* Playhead Marker */}
          <div
            className="absolute top-0 left-0 h-full w-1 bg-white z-10 shadow-[0_0_8px_white]"
            style={{ left: `${playheadPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-zinc-500 uppercase">
          <span>0B</span>
          <span>
            {totalSize ? `${(totalSize / 1024 / 1024).toFixed(1)}MB` : "???"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StreamingDebugOverlay;
