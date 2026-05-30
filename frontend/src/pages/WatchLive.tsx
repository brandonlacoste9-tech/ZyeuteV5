/**
 * WatchLive Page - Watch a Mux live stream
 * Uses MuxVideoPlayer with the live stream's playback ID
 */

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { MuxVideoPlayer } from "../components/video/MuxVideoPlayer";
import { logger } from "../lib/logger";

const watchLogger = logger.withContext("WatchLive");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

interface StreamStatus {
  status: "idle" | "active" | "disabled" | "reconnecting" | "not_found";
  playbackId: string | null;
  title?: string;
  viewerCount?: number;
}

const WatchLive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stream, setStream] = useState<StreamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStreamStatus = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/mux/livestream-status/${id}`, {
        credentials: "include",
      });

      if (res.status === 404) {
        setStream({
          status: "not_found",
          playbackId: null,
        });
        return;
      }

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const { data } = await res.json();
      setStream(data);
      if (data.viewerCount !== undefined) setViewerCount(data.viewerCount);
    } catch (err: any) {
      watchLogger.error("Failed to fetch stream status:", err);
      setError(err.message || "Impossible de charger le live.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamStatus();

    // Poll every 10s to update status / viewer count
    pollRef.current = setInterval(fetchStreamStatus, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <svg
          className="w-10 h-10 text-gold-400 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <p className="text-white/60">Connexion au live...</p>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <Header title="Live" showBack={true} />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Oups, quelque chose a mal tourné
          </h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => navigate("/live")}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Retour aux lives
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Not found ───────────────────────────────────────────────────────────
  if (stream?.status === "not_found") {
    return (
      <div className="min-h-screen bg-black pb-20">
        <Header title="Live" showBack={true} />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">📡</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Ce live n&apos;existe pas
          </h2>
          <p className="text-white/60 mb-6">
            Le stream que tu cherches n&apos;a pas été trouvé.
          </p>
          <button
            onClick={() => navigate("/live")}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            Voir les lives actifs
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Stream idle / not yet started ──────────────────────────────────────
  if (
    stream?.status === "idle" ||
    stream?.status === "disabled" ||
    !stream?.playbackId
  ) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <Header title="Live" showBack={true} />
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-white mb-3">
            {stream?.title || "Le live n'a pas encore commencé"}
          </h2>
          <p className="text-white/60 mb-2">
            Le créateur n&apos;a pas encore démarré la diffusion.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Cette page se rafraîchit automatiquement toutes les 10 secondes.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchStreamStatus}
              className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-semibold"
            >
              Actualiser maintenant
            </button>
            <button
              onClick={() => navigate("/live")}
              className="px-6 py-3 rounded-xl bg-gold-gradient text-black font-bold transition-all"
            >
              Autres lives
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── Active stream ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title={stream.title || "Live"} showBack={true} />

      <div className="max-w-3xl mx-auto px-0 md:px-4 py-0 md:py-4">
        {/* Video player */}
        <div className="relative bg-black aspect-video w-full overflow-hidden md:rounded-2xl">
          {stream.playbackId && (
            <MuxVideoPlayer
              playbackId={stream.playbackId}
              autoPlay={true}
              loop={false}
              muted={false}
              className="w-full h-full"
              onError={(err) => watchLogger.error("Player error:", err)}
            />
          )}

          {/* Live badge overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full text-white text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
            {viewerCount > 0 && (
              <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                👁️ {viewerCount.toLocaleString("fr-CA")} spectateurs
              </div>
            )}
          </div>
        </div>

        {/* Stream info */}
        <div className="px-4 py-4">
          <h1 className="text-white text-xl font-bold mb-1">
            {stream.title || "Live en direct"}
          </h1>

          {/* Reconnecting notice */}
          {stream.status === "reconnecting" && (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <p className="text-yellow-400 text-sm font-semibold">
                ⚠️ Le créateur se reconnecte...
              </p>
              <p className="text-white/50 text-xs mt-1">
                Le stream reprendra dans quelques instants.
              </p>
            </div>
          )}

          {/* Share link */}
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
            <p className="text-white/60 text-sm truncate">
              Partage ce live avec tes amis
            </p>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
              }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-all font-medium"
            >
              Copier le lien
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default WatchLive;
