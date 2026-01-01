import React from "react";
import MuxPlayer from "@mux/mux-player-react";
import { cn } from "../../lib/utils";

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
        <div className={cn("relative w-full h-full bg-black overflow-hidden", className)}>
            <MuxPlayer
                playbackId={playbackId}
                poster={poster}
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                onEnded={onEnded}
                metadata={{
                    video_id: playbackId,
                    video_title: "Zyeute Content",
                    viewer_user_id: "anonymous", // Should be passed if available
                }}
                streamType="on-demand"
                className="w-full h-full object-cover"
                style={{
                    "--controls": "none", // Hide default controls for TikTok-style UI
                    "--media-object-fit": "cover",
                    "--media-object-position": "center",
                }}
            />

            {/* Premium Leather Accent overlay if needed */}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-inherit" />
        </div>
    );
};

export default MuxVideoPlayer;
