import React, { Suspense } from "react";
import { cn } from "../../lib/utils";

const MuxPlayer = React.lazy(() => import("@mux/mux-player-react"));

interface MuxVideoPlayerProps {
  playbackId: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onEnded?: () => void;
}

/**
 * MuxVideoPlayer - Premium video playback using Mux
 */
export const MuxVideoPlayer: React.FC<MuxVideoPlayerProps> = ({
  playbackId,
  poster,
  autoPlay = false,
  muted = true,
  loop = true,
  className,
  onEnded,
}) => {
  return (
    <div
      className={cn(
        "relative w-full h-full bg-black overflow-hidden",
        className,
      )}
    >
      <Suspense fallback={null}>
        <MuxPlayer
          playbackId={playbackId}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          onEnded={onEnded}
          metadata={{
            videoId: playbackId,
            videoTitle: "Zyeute Content",
            viewerUserId: "anonymous",
          }}
          streamType="on-demand"
          accentColor="#FFB800"
          envKey="m5a8o9td2kq7765je565khl96"
          className="w-full h-full object-cover"
          style={{
            "--controls": "none",
            "--media-object-fit": "cover",
            "--media-object-position": "center",
          }}
        />
      </Suspense>

      {/* Premium Leather Accent overlay if needed */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-inherit" />
    </div>
  );
};

export default MuxVideoPlayer;
