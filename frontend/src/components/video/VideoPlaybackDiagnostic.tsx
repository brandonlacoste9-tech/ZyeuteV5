/**
 * VideoPlaybackDiagnostic - Surface why videos won't play
 * Enable with ?debug=1 or localStorage.setItem('debug', 'true')
 * Shows: post data, player path, errors, copy-to-clipboard
 */

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface VideoPlaybackDiagnosticProps {
  postId: string;
  postType?: string;
  muxPlaybackId?: string | null;
  mediaUrl?: string | null;
  videoSrc?: string | null;
  playerPath: "mux" | "native" | "processing" | "none";
  processingStatus?: string;
  error?: Error | string | null;
  isActive?: boolean;
  className?: string;
}

function useDebugMode(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const check = () => {
      const params = new URLSearchParams(window.location.search);
      setEnabled(
        params.get("debug") === "1" || localStorage.getItem("debug") === "true",
      );
    };
    check();
    window.addEventListener("popstate", check);
    return () => window.removeEventListener("popstate", check);
  }, []);
  return enabled;
}

export function VideoPlaybackDiagnostic({
  postId,
  postType,
  muxPlaybackId,
  mediaUrl,
  videoSrc,
  playerPath,
  processingStatus,
  error,
  isActive,
  className,
}: VideoPlaybackDiagnosticProps) {
  const enabled = useDebugMode();
  const [copied, setCopied] = useState(false);

  // Log to console when there's a problem (helps even without overlay visible)
  useEffect(() => {
    if (!enabled) return;
    const info = {
      postId,
      postType,
      muxPlaybackId: muxPlaybackId || null,
      hasMediaUrl: !!mediaUrl,
      mediaUrlPreview: mediaUrl ? mediaUrl.slice(0, 60) + "..." : null,
      hasVideoSrc: !!videoSrc,
      videoSrcPreview: videoSrc ? videoSrc.slice(0, 60) + "..." : null,
      playerPath,
      processingStatus,
      error: error ? (typeof error === "string" ? error : error.message) : null,
      isActive,
    };
    if (playerPath === "none" || error || !videoSrc) {
      console.log("[VideoPlaybackDiagnostic]", info);
    }
  }, [
    enabled,
    postId,
    postType,
    muxPlaybackId,
    mediaUrl,
    videoSrc,
    playerPath,
    processingStatus,
    error,
    isActive,
  ]);

  if (!enabled) return null;

  const statusColor =
    error || playerPath === "none"
      ? "bg-red-900/95 border-red-500"
      : !videoSrc && !muxPlaybackId
        ? "bg-amber-900/95 border-amber-500"
        : "bg-black/95 border-green-500";

  const copyToClipboard = () => {
    const info = {
      postId,
      postType,
      muxPlaybackId: muxPlaybackId || null,
      mediaUrl: mediaUrl || null,
      videoSrc: videoSrc || null,
      playerPath,
      processingStatus,
      error: error ? (typeof error === "string" ? error : (error as Error).message) : null,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-[100] p-2 max-w-[min(90vw,320px)] rounded-lg border text-[10px] font-mono text-white backdrop-blur-md shadow-2xl select-text",
        statusColor,
        className,
      )}
    >
      <div className="font-bold border-b border-white/20 mb-1.5 pb-1 flex justify-between items-center">
        <span className="text-gold-400">VIDEO DEBUG</span>
        <span
          className={
            error || playerPath === "none"
              ? "text-red-400"
              : !videoSrc && !muxPlaybackId
                ? "text-amber-400"
                : "text-green-400"
          }
        >
          {error ? "ERR" : playerPath === "none" ? "NO_SRC" : !videoSrc && !muxPlaybackId ? "EMPTY" : "OK"}
        </span>
      </div>
      <div className="flex flex-col gap-1 space-y-0.5">
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Post:</span>
          <span className="truncate">{postId.slice(0, 12)}...</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Type:</span>
          <span>{postType || "—"}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Player:</span>
          <span className="font-semibold">{playerPath.toUpperCase()}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Mux ID:</span>
          <span className={muxPlaybackId ? "text-green-400 truncate" : "text-zinc-600"}>
            {muxPlaybackId ? muxPlaybackId.slice(0, 12) + "..." : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">media_url:</span>
          <span className={mediaUrl ? "text-green-400" : "text-zinc-600"}>
            {mediaUrl ? "✓" : "✗"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">videoSrc:</span>
          <span className={videoSrc ? "text-green-400" : "text-zinc-600"}>
            {videoSrc ? "✓" : "✗"}
          </span>
        </div>
        {processingStatus && (
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">Status:</span>
            <span>{processingStatus}</span>
          </div>
        )}
        {videoSrc && (
          <div className="mt-1 pt-1 border-t border-white/10">
            <span className="text-zinc-500 block mb-0.5">URL:</span>
            <span className="break-all leading-tight text-[9px] opacity-90">
              {videoSrc.length > 80 ? videoSrc.slice(0, 80) + "…" : videoSrc}
            </span>
          </div>
        )}
        {error && (
          <div className="mt-1 pt-1 border-t border-red-500/50">
            <span className="text-red-300 font-semibold">Error:</span>
            <span className="block text-red-200 break-words">
              {typeof error === "string" ? error : (error as Error).message}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={copyToClipboard}
        className="mt-2 w-full py-1 px-2 rounded bg-white/10 hover:bg-white/20 text-[9px] font-medium transition-colors"
      >
        {copied ? "Copied!" : "Copy debug info"}
      </button>
    </div>
  );
}
