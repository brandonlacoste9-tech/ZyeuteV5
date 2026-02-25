/**
 * UI Diagnostics - Check if components are rendering correctly
 * Add ?ui-debug=1 to URL to enable
 */

import { useEffect, useState } from "react";

export function UIDiagnostics() {
  const [isVisible, setIsVisible] = useState(false);
  const [checks, setChecks] = useState<{ name: string; status: "ok" | "error" | "warning"; message: string }[]>([]);

  // Define runDiagnostics first
  const runDiagnostics = () => {
    const results: { name: string; status: "ok" | "error" | "warning"; message: string }[] = [];

    // Check 1: TI-GUY Button
    const tiguyButton = document.querySelector('[class*="group"][class*="fixed"]');
    results.push({
      name: "TI-GUY Button",
      status: tiguyButton ? "ok" : "error",
      message: tiguyButton ? "Found in DOM" : "Not found - check if user is logged in",
    });

    // Check 2: Video Elements
    const videos = document.querySelectorAll("video");
    results.push({
      name: "Video Elements",
      status: videos.length > 0 ? "ok" : "warning",
      message: `${videos.length} video elements found`,
    });

    // Check 3: Video Progress Bars
    const progressBars = document.querySelectorAll('[class*="bg-gold"][class*="h-full"]');
    results.push({
      name: "Video Progress Bars",
      status: progressBars.length > 0 ? "ok" : "warning",
      message: `${progressBars.length} progress bars found`,
    });

    // Check 4: Emojis Rendering
    const hasEmojis = document.body.innerHTML.includes("🦫") || document.body.innerHTML.includes("⚜️");
    results.push({
      name: "Emoji Rendering",
      status: hasEmojis ? "ok" : "warning",
      message: hasEmojis ? "Emojis detected in DOM" : "No emojis found - may be rendering as �",
    });

    // Check 5: CSS Variables
    const computedStyle = getComputedStyle(document.documentElement);
    const hasGoldColor = computedStyle.getPropertyValue("--gold") || document.body.innerHTML.includes("#D4AF37");
    results.push({
      name: "Gold Color Theme",
      status: hasGoldColor ? "ok" : "warning",
      message: hasGoldColor ? "Gold theme colors detected" : "Theme colors may be missing",
    });

    // Check 6: Fullscreen API Support
    results.push({
      name: "Fullscreen API",
      status: document.fullscreenEnabled ? "ok" : "warning",
      message: document.fullscreenEnabled ? "Supported" : "Not supported in this browser",
    });

    setChecks(results);
  };

  // Run diagnostics when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ui-debug") === "1") {
      setIsVisible(true);
      runDiagnostics();
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 w-80 bg-black/90 border border-gold-500 rounded-xl p-4 z-50 text-xs font-mono shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gold-500 font-bold text-sm">🔍 UI Diagnostics</h3>
        <div className="flex gap-2">
          <button onClick={runDiagnostics} className="text-amber-400 hover:text-amber-300 text-xs">
            🔄 Refresh
          </button>
          <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white">
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`p-2 rounded border ${
              check.status === "ok"
                ? "border-green-500/30 bg-green-500/10"
                : check.status === "error"
                ? "border-red-500/30 bg-red-500/10"
                : "border-yellow-500/30 bg-yellow-500/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  check.status === "ok" ? "bg-green-500" : check.status === "error" ? "bg-red-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-white font-medium">{check.name}</span>
            </div>
            <p className="text-white/60 mt-1 ml-4">{check.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/20">
        <p className="text-white/40 text-xs">Run tests:</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              const btn = document.querySelector("button[class*='fixed']") as HTMLButtonElement;
              btn?.click();
            }}
            className="px-2 py-1 bg-gold-500/20 hover:bg-gold-500/30 text-gold-500 rounded text-xs"
          >
            Open TI-GUY
          </button>
          <button
            onClick={() => {
              const videos = document.querySelectorAll("video");
              videos.forEach((v) => {
                v.muted = true;
                v.play().catch(() => {});
              });
            }}
            className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs"
          >
            Play All Videos
          </button>
        </div>
      </div>
    </div>
  );
}

export default UIDiagnostics;
