/**
 * GoLive — In-app live streaming from phone camera
 * Camera → canvas filter pipeline → WHIP → Mux → viewers
 *
 * Steps:
 *   1. Setup: choose title, category, preview camera, pick filter
 *   2. Live: full-screen camera with chat, controls, gift rain
 *   3. Ended: summary screen
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { LiveChat } from "@/components/live/LiveChat";
import { GiftPicker } from "@/components/features/GiftPicker";
import {
  useLiveCamera,
  FILTER_LABELS,
  type LiveFilter,
} from "@/hooks/useLiveCamera";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/contexts/AuthContext";
import { getSessionWithTimeout } from "@/lib/supabase";
import usePremium from "@/hooks/usePremium";
import { logger } from "@/lib/logger";

const liveLogger = logger.withContext("GoLive");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeutev5-1.onrender.com";

interface LiveStreamInfo {
  streamId: string;
  streamKey: string;
  whipUrl: string;
  playbackId: string;
  title: string;
}

const CATEGORIES = [
  { id: "général", label: "🎬 Général" },
  { id: "musique", label: "🎵 Musique" },
  { id: "gaming", label: "🎮 Gaming" },
  { id: "cuisine", label: "🍳 Cuisine" },
  { id: "sports", label: "⚽ Sports" },
  { id: "art", label: "🎨 Art" },
  { id: "tech", label: "💻 Tech" },
  { id: "discussion", label: "💬 Discussion" },
];

const FILTERS: LiveFilter[] = [
  "none",
  "beauty",
  "bright",
  "vintage",
  "bw",
  "blur",
  "quebec",
];

type GoLiveStep = "setup" | "live" | "ended";

export default function GoLive() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tap, fire } = useHaptics();
  const { isPremium } = usePremium();
  // Free users only get none + bright; all other filters need Bronze+
  const FREE_FILTERS: LiveFilter[] = ["none", "bright"];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<GoLiveStep>("setup");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("général");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<LiveStreamInfo | null>(null);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [duration, setDuration] = useState(0);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    cameraReady,
    isMuted,
    activeFilter,
    error: cameraError,
    startCamera,
    flipCamera,
    toggleMute,
    setActiveFilter,
    startWhipStream,
    stopStream,
  } = useLiveCamera({ canvasRef, previewRef });

  // Start camera on mount
  useEffect(() => {
    startCamera("user");
    return () => stopStream();
  }, []);

  // Duration timer
  useEffect(() => {
    if (step === "live") {
      durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (durationRef.current) clearInterval(durationRef.current);
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [step]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleGoLive = useCallback(async () => {
    if (!title.trim()) {
      setServerError("Donne un titre à ton live.");
      return;
    }
    setIsStarting(true);
    setServerError(null);

    try {
      const { session } = await getSessionWithTimeout(3000);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${API_BASE}/api/mux/create-whip-livestream`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), category }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }

      const { data } = await res.json();
      setStreamInfo(data);

      // Start WHIP WebRTC publish
      await startWhipStream(data.whipUrl);
      fire();
      setStep("live");
    } catch (err: any) {
      liveLogger.error("Failed to start live:", err);
      setServerError(
        err.message || "Impossible de démarrer le live. Réessaie.",
      );
    } finally {
      setIsStarting(false);
    }
  }, [title, category, startWhipStream, fire]);

  const handleEndStream = useCallback(async () => {
    if (!streamInfo) return;
    setIsEnding(true);
    tap();

    try {
      const { session } = await getSessionWithTimeout(3000);
      await fetch(`${API_BASE}/api/mux/end-livestream/${streamInfo.streamId}`, {
        method: "DELETE",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
        credentials: "include",
      });
    } catch (err) {
      liveLogger.error("Failed to end stream:", err);
    } finally {
      stopStream();
      setIsEnding(false);
      setStep("ended");
    }
  }, [streamInfo, stopStream, tap]);

  // ─── STEP: SETUP ────────────────────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
        {/* Camera preview - fills top half */}
        <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
          {/* Hidden video for camera source */}
          <video
            ref={previewRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Canvas renders the filtered output — shown as preview */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Camera error */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
              <div>
                <div className="text-4xl mb-3">📷</div>
                <p className="text-white font-semibold mb-2">Caméra requise</p>
                <p className="text-white/60 text-sm">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="text-white font-bold text-lg">Go Live</span>

            {/* Flip camera */}
            <button
              onClick={() => {
                tap();
                flipCamera();
              }}
              className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Filter strip */}
          <div className="absolute bottom-0 inset-x-0 pb-3 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex gap-3 overflow-x-auto px-4 scrollbar-none py-2">
              {FILTERS.map((f) => {
                const locked = !isPremium && !FREE_FILTERS.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => {
                      tap();
                      if (locked) {
                        navigate("/premium");
                        return;
                      }
                      setActiveFilter(f);
                    }}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all relative ${
                      activeFilter === f ? "scale-110" : "opacity-70"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
                        activeFilter === f
                          ? "border-gold-400"
                          : "border-white/30"
                      }`}
                      style={{
                        filter:
                          f !== "none"
                            ? `${f === "beauty" ? "contrast(1.1) brightness(1.1)" : f === "bw" ? "grayscale(1)" : f === "vintage" ? "sepia(0.5)" : f === "blur" ? "blur(1px)" : f === "bright" ? "brightness(1.3)" : "saturate(1.5)"}`
                            : undefined,
                        opacity: locked ? 0.4 : 1,
                      }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-gold-500/30 to-purple-500/30 flex items-center justify-center">
                        <span className="text-lg">
                          {f === "none"
                            ? "🎥"
                            : f === "beauty"
                              ? "✨"
                              : f === "bright"
                                ? "☀️"
                                : f === "vintage"
                                  ? "🎞️"
                                  : f === "bw"
                                    ? "⚫"
                                    : f === "blur"
                                      ? "🌫️"
                                      : "⚜️"}
                        </span>
                      </div>
                    </div>
                    {locked && (
                      <span className="absolute top-0 right-0 text-[9px] bg-gold-500 text-black font-black rounded-full w-4 h-4 flex items-center justify-center">
                        🔒
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold ${
                        activeFilter === f
                          ? "text-gold-400"
                          : locked
                            ? "text-white/30"
                            : "text-white/70"
                      }`}
                    >
                      {FILTER_LABELS[f]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Setup panel */}
        <div className="bg-black border-t border-white/10 px-4 py-5 space-y-4 pb-24">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Titre de ton live... *"
              className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/35 focus:outline-none focus:border-gold-500 transition-colors text-base"
            />
          </div>

          {/* Category */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  tap();
                  setCategory(cat.id);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === cat.id
                    ? "bg-gold-500 text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {serverError && (
            <p className="text-red-400 text-sm text-center">{serverError}</p>
          )}

          {/* Go live button */}
          <button
            onClick={handleGoLive}
            disabled={isStarting || !title.trim() || !cameraReady}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                Aller en direct
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP: LIVE ─────────────────────────────────────────────────────────────
  if (step === "live" && streamInfo) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Canvas — full screen camera feed with filters */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Hidden video (source) */}
        <video ref={previewRef} className="hidden" playsInline muted autoPlay />

        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-black">LIVE</span>
            </div>
            <span className="text-white text-xs font-semibold bg-black/40 px-2 py-1 rounded-full">
              {formatDuration(duration)}
            </span>
          </div>

          <p className="text-white font-semibold text-sm truncate max-w-[40%]">
            {streamInfo.title}
          </p>

          {/* End live button */}
          <button
            onClick={handleEndStream}
            disabled={isEnding}
            className="bg-red-600/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-red-500"
          >
            {isEnding ? "..." : "Terminer"}
          </button>
        </div>

        {/* Right controls */}
        <div className="absolute right-4 top-1/3 z-20 flex flex-col gap-4">
          {/* Flip camera */}
          <button
            onClick={() => {
              tap();
              flipCamera();
            }}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Mute mic */}
          <button
            onClick={() => {
              tap();
              toggleMute();
            }}
            className={`w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center border ${
              isMuted
                ? "bg-red-600/80 border-red-500"
                : "bg-black/50 border-white/20"
            }`}
          >
            {isMuted ? (
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>

          {/* Filter picker (cycling) */}
          <button
            onClick={() => {
              tap();
              const idx = FILTERS.indexOf(activeFilter);
              setActiveFilter(FILTERS[(idx + 1) % FILTERS.length]);
            }}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
          >
            <span className="text-xl">
              {activeFilter === "none"
                ? "🎥"
                : activeFilter === "beauty"
                  ? "✨"
                  : activeFilter === "bright"
                    ? "☀️"
                    : activeFilter === "vintage"
                      ? "🎞️"
                      : activeFilter === "bw"
                        ? "⚫"
                        : activeFilter === "blur"
                          ? "🌫️"
                          : "⚜️"}
            </span>
          </button>

          {/* Gift button */}
          <button
            onClick={() => {
              tap();
              setShowGiftPicker(true);
            }}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
          >
            <span className="text-xl">🎁</span>
          </button>
        </div>

        {/* Bottom: chat overlay */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-3 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16">
          <LiveChat streamId={streamInfo.streamId} compact />
        </div>

        {/* Gift picker */}
        {showGiftPicker && user && (
          <GiftPicker
            recipientId={user.id}
            recipientName="moi"
            onClose={() => setShowGiftPicker(false)}
          />
        )}
      </div>
    );
  }

  // ─── STEP: ENDED ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-7xl mb-5">🎉</div>
        <h2 className="text-3xl font-black text-white mb-2">
          Merci pour le live!
        </h2>
        <p className="text-white/50 mb-3">Durée: {formatDuration(duration)}</p>
        <p className="text-white/40 mb-10 text-sm">
          La rediffusion sera disponible dans quelques minutes.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setStep("setup");
              setStreamInfo(null);
              setTitle("");
              setDuration(0);
              startCamera("user");
            }}
            className="px-6 py-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 font-semibold"
          >
            Nouveau live
          </button>
          <button
            onClick={() => navigate("/feed")}
            className="px-6 py-3 rounded-2xl bg-gold-gradient text-black font-black"
          >
            Retour au feed
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
