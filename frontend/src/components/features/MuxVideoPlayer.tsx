import React, { Suspense, useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { logger } from "../../lib/logger";

const MuxPlayer = React.lazy(() => import("@mux/mux-player-react"));
const muxLogger = logger.withContext("MuxVideoPlayer");

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
 * MuxVideoPlayer - Premium video playback using Mux.
 * Lifecycle: error state with retry, cleanup on playbackId change.
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
    const [hasError, setHasError] = useState(false);

    // Reset error when playback ID changes (e.g. new video in feed)
    useEffect(() => {
        setHasError(false);
    }, [playbackId]);

    if (hasError) {
        return (
            <div
                className={cn(
                    "relative w-full h-full bg-zinc-900 flex items-center justify-center",
                    className,
                )}
            >
                <div className="text-center p-4">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-white/60 text-sm mb-3">Vidéo non disponible</p>
                    <button
                        type="button"
                        onClick={() => setHasError(false)}
                        className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 text-sm"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("relative w-full h-full bg-black overflow-hidden", className)}>
            <Suspense fallback={null}>
                <MuxPlayer
                    playbackId={playbackId}
                    poster={poster}
                    autoPlay={autoPlay}
                    muted={muted}
                    loop={loop}
                    onEnded={onEnded}
                    onError={(e: unknown) => {
                        muxLogger.error("Mux playback error", { playbackId, error: e });
                        setHasError(true);
                    }}
                    metadata={{
                        video_id: playbackId,
                        video_title: "Zyeute Content",
                        viewer_user_id: "anonymous",
                    }}
                    streamType="on-demand"
                    className="w-full h-full object-cover"
                    style={{
                        "--controls": "none",
                        "--media-object-fit": "cover",
                        "--media-object-position": "center",
                    }}
                />
            </Suspense>

            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 rounded-inherit" />
        </div>
    );
};

export default MuxVideoPlayer;
