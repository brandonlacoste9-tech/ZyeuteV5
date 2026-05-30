/**
 * GoLive Page - Start a live stream via Mux Live Streams API
 * Creates a new Mux live stream → shows RTMP URL + stream key to broadcaster
 */

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { logger } from "@/lib/logger";

const liveLogger = logger.withContext("GoLive");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

interface LiveStreamInfo {
  streamKey: string;
  rtmpUrl: string;
  playbackId: string;
  streamId: string;
}

type GoLiveStep = "setup" | "live" | "ended";

const GoLive: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<GoLiveStep>("setup");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("général");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<LiveStreamInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

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

  const handleCreateStream = useCallback(async () => {
    if (!title.trim()) {
      setError("Donne un titre à ton live.");
      return;
    }
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/mux/create-livestream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), category }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Erreur ${res.status}`);
      }

      const { data } = await res.json();
      setStreamInfo(data);
      setStep("live");
    } catch (err: any) {
      liveLogger.error("Failed to create livestream:", err);
      setError(err.message || "Impossible de créer le live. Réessaie.");
    } finally {
      setIsCreating(false);
    }
  }, [title, category]);

  const handleEndStream = useCallback(async () => {
    if (!streamInfo) return;
    setIsEnding(true);
    try {
      await fetch(`${API_BASE}/api/mux/end-livestream/${streamInfo.streamId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      liveLogger.error("Failed to end stream:", err);
    } finally {
      setIsEnding(false);
      setStep("ended");
    }
  }, [streamInfo]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  // ─── STEP: SETUP ────────────────────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="min-h-screen bg-black pb-20">
        <Header title="Démarrer un Live" showBack={true} />

        <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
          {/* Hero */}
          <div className="text-center py-4">
            <div className="text-6xl mb-3">🎥</div>
            <h1 className="text-2xl font-bold text-white mb-2">Go Live</h1>
            <p className="text-white/60 text-sm">
              Diffuse en direct à ta communauté québécoise avec OBS, Streamlabs
              ou n&apos;importe quel logiciel RTMP.
            </p>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Titre du live *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Ex: Session de musique live 🎸"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
            />
            <p className="text-white/30 text-xs mt-1 text-right">
              {title.length}/100
            </p>
          </div>

          {/* Category picker */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Catégorie
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                    category === cat.id
                      ? "bg-gold-gradient text-black"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-white/80 text-sm font-semibold">
              Comment ça marche?
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-white/60 text-sm">
              <li>Clique sur &quot;Créer mon live&quot;</li>
              <li>Copie l&apos;URL RTMP et la Clé de stream</li>
              <li>
                Colle-les dans OBS Studio → Paramètres → Diffusion →
                Personnalisé
              </li>
              <li>Démarre la diffusion dans OBS — tu es en direct!</li>
            </ol>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreateStream}
            disabled={isCreating || !title.trim()}
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
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
                Création du live...
              </>
            ) : (
              <>🔴 Créer mon live</>
            )}
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ─── STEP: LIVE (credentials shown) ─────────────────────────────────────────
  if (step === "live" && streamInfo) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <Header title="Live en cours" showBack={false} />

        <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
          {/* Live badge */}
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-white font-bold text-sm">LIVE</span>
            </div>
            <p className="text-white font-semibold">{title}</p>
          </div>

          {/* Instructions */}
          <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4">
            <p className="text-gold-400 text-sm font-semibold mb-1">
              Prochaine étape
            </p>
            <p className="text-white/70 text-sm">
              Copie l&apos;URL RTMP et la Clé de stream ci-dessous, puis
              colle-les dans OBS Studio (Paramètres → Diffusion → Personnalisé)
              et démarre la diffusion.
            </p>
          </div>

          {/* RTMP URL */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              URL RTMP
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white/80 overflow-x-auto whitespace-nowrap">
                {streamInfo.rtmpUrl}
              </div>
              <button
                onClick={() => copyToClipboard(streamInfo.rtmpUrl, "rtmpUrl")}
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  copiedField === "rtmpUrl"
                    ? "bg-green-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {copiedField === "rtmpUrl" ? "✓ Copié" : "Copier"}
              </button>
            </div>
          </div>

          {/* Stream Key */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Clé de stream{" "}
              <span className="text-white/40 font-normal">
                (garde-la secrète!)
              </span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white/80 overflow-x-auto whitespace-nowrap">
                {streamInfo.streamKey}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(streamInfo.streamKey, "streamKey")
                }
                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  copiedField === "streamKey"
                    ? "bg-green-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {copiedField === "streamKey" ? "✓ Copié" : "Copier"}
              </button>
            </div>
          </div>

          {/* Watch link */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/60 text-sm mb-2">
              Partage ce lien avec tes viewers:
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/30 rounded-lg px-3 py-2 font-mono text-xs text-white/70 overflow-x-auto whitespace-nowrap">
                {window.location.origin}/live/watch/{streamInfo.playbackId}
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/live/watch/${streamInfo.playbackId}`,
                    "watchUrl",
                  )
                }
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  copiedField === "watchUrl"
                    ? "bg-green-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {copiedField === "watchUrl" ? "✓" : "Copier"}
              </button>
            </div>
          </div>

          {/* End stream button */}
          <button
            onClick={handleEndStream}
            disabled={isEnding}
            className="w-full py-4 rounded-xl bg-white/5 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white font-bold text-lg transition-all disabled:opacity-50"
          >
            {isEnding ? "Fin du live..." : "⏹ Terminer le live"}
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ─── STEP: ENDED ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Live terminé" showBack={false} />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Merci pour le live!
        </h2>
        <p className="text-white/60 mb-8">
          Ton live est terminé. La rediffusion sera disponible prochainement.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setStep("setup");
              setStreamInfo(null);
              setTitle("");
              setCategory("général");
            }}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-semibold"
          >
            Nouveau live
          </button>
          <button
            onClick={() => navigate("/feed")}
            className="px-6 py-3 rounded-xl bg-gold-gradient text-black font-bold transition-all"
          >
            Retour au feed
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default GoLive;
