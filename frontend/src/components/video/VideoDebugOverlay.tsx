import React from "react";

interface VideoDebugProps {
  isVisible: boolean;
  videoId: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  error?: any;
}

const VideoDebugOverlay: React.FC<VideoDebugProps> = ({
  isVisible,
  videoId,
  mediaUrl,
  thumbnailUrl,
  error,
}) => {
  if (!isVisible) return null;

  const hasSource = !!mediaUrl;
  const statusColor = error
    ? "bg-red-900/90 border-red-500"
    : !hasSource
      ? "bg-orange-900/90 border-orange-500"
      : "bg-black/80 border-green-500";

  return (
    <div
      className={`absolute top-2 left-2 z-50 p-2 max-w-[80%] rounded-md border text-xs font-mono text-white backdrop-blur-md shadow-2xl pointer-events-none ${statusColor}`}
    >
      <div className="font-bold border-b border-white/20 mb-1 pb-1 flex justify-between">
        <span>DEBUG</span>
        <span>{error ? "ERR" : !hasSource ? "NULL" : "OK"}</span>
      </div>
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] text-gray-400">
          ID: {videoId.slice(0, 8)}...
        </span>
        <span className="text-[10px] text-gray-400">URL:</span>
        <span className="break-all leading-tight">{mediaUrl || "MISSING"}</span>
        <span className="text-[10px] text-gray-400">Poster:</span>
        <span className="break-all leading-tight">
          {thumbnailUrl || "NONE"}
        </span>
        {error && (
          <span className="text-red-300 border-t border-white/20 pt-1 mt-1">
            {error.message || "Playback Error"}
          </span>
        )}
      </div>
    </div>
  );
};

export default VideoDebugOverlay;
