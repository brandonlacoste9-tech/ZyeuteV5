import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, AlertTriangle } from 'lucide-react';

interface ZyeutePlayerProps {
  src: string; // The .m3u8 URL from Colony OS
  poster?: string;
  autoPlay?: boolean;
}

const ZyeuteVideoPlayer: React.FC<ZyeutePlayerProps> = ({ src, poster, autoPlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => setHasError(true));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari native HLS support
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current?.pause();
      setIsPaused(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden group border-b border-gold/20">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        playsInline
        muted={autoPlay}
      />

      {/* Luxury Glass Overlay (Pause State) */}
      {isPaused && !hasError && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-all">
          <div className="text-gold/80 opacity-40 select-none text-2xl font-bold tracking-widest uppercase">
            ZYEUTÉ
          </div>
          <Play className="absolute w-12 h-12 text-gold fill-gold animate-pulse" />
        </div>
      )}

      {/* Error State: Broken Signal */}
      {hasError && (
        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-gold">
          <AlertTriangle className="w-10 h-10 mb-2" />
          <span className="text-xs uppercase tracking-tighter">Signal Interrompu</span>
        </div>
      )}

      {/* Custom Gold Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-[2px] bg-white/20 mb-4 cursor-pointer relative">
          <div 
            className="h-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex items-center justify-between text-gold">
          <button onClick={togglePlay}>
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <Volume2 className="w-5 h-5 opacity-70 hover:opacity-100 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default ZyeuteVideoPlayer;
