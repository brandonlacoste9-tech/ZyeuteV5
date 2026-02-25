/**
 * VideoDebugger - Diagnostic tool for video playback issues
 * Add ?debug=1 to URL to enable
 */

import { useEffect, useState } from "react";

interface VideoInfo {
  id: string;
  url: string;
  status: string;
  thumbnail: string | null;
}

export function VideoDebugger() {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1") {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Fetch recent videos
    fetch("/api/video-doctor/stats")
      .then((r) => r.json())
      .then((data) => {
        addLog(`Videos stats: ${JSON.stringify(data.stats)}`);
      })
      .catch((err) => addLog(`Error fetching stats: ${err.message}`));

    // Monitor video elements on page
    const checkVideos = () => {
      const videoElements = document.querySelectorAll("video");
      addLog(`Found ${videoElements.length} video elements on page`);

      videoElements.forEach((video, i) => {
        const info = {
          index: i,
          src: video.src?.substring(0, 50) + "...",
          paused: video.paused,
          muted: video.muted,
          readyState: video.readyState,
          networkState: video.networkState,
          error: video.error?.code,
          currentTime: video.currentTime,
          duration: video.duration,
        };
        addLog(`Video ${i}: ${JSON.stringify(info)}`);
      });
    };

    // Check immediately and every 5 seconds
    checkVideos();
    const interval = setInterval(checkVideos, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const testVideoPlayback = async () => {
    const videos = document.querySelectorAll("video");
    if (videos.length === 0) {
      addLog("No videos found to test");
      return;
    }

    const video = videos[0];
    addLog(`Testing video: ${video.src?.substring(0, 50)}...`);

    try {
      video.muted = true; // Required for autoplay
      await video.play();
      addLog("✅ Video playback started!");
    } catch (err: any) {
      addLog(`❌ Playback failed: ${err.name} - ${err.message}`);
    }
  };

  const checkCors = async () => {
    const videos = document.querySelectorAll("video");
    if (videos.length === 0) return;

    const videoUrl = videos[0].src;
    addLog(`Checking CORS for: ${videoUrl?.substring(0, 50)}...`);

    try {
      const response = await fetch(videoUrl, { method: "HEAD", mode: "no-cors" });
      addLog(`CORS check completed (opaque response)`);
    } catch (err: any) {
      addLog(`CORS error: ${err.message}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 w-96 max-h-[80vh] bg-black/90 border border-gold-500 rounded-xl p-4 z-50 overflow-auto text-xs font-mono">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gold-500 font-bold">🎬 Video Debugger</h3>
        <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white">
          ✕
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testVideoPlayback}
          className="w-full py-2 bg-gold-500/20 hover:bg-gold-500/30 text-gold-500 rounded text-xs"
        >
          ▶️ Test Video Playback
        </button>
        <button
          onClick={checkCors}
          className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs"
        >
          🔒 Check CORS
        </button>
        <button
          onClick={() => setLogs([])}
          className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
        >
          🗑️ Clear Logs
        </button>
      </div>

      <div className="space-y-1">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`py-1 border-b border-white/10 ${
              log.includes("✅")
                ? "text-green-400"
                : log.includes("❌")
                ? "text-red-400"
                : "text-white/70"
            }`}
          >
            {log}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/20 text-white/50">
        <p>💡 Try clicking the video to start playback</p>
        <p>💡 Check browser console for errors</p>
      </div>
    </div>
  );
}

export default VideoDebugger;
