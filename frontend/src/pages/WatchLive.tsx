/**
 * WatchLive — TikTok-style fullscreen live viewer
 * Fullscreen Mux player + real-time chat overlay + gift button
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import { LiveChat } from "@/components/live/LiveChat";
import { GiftPicker } from "@/components/features/GiftPicker";
import { useHaptics } from "@/hooks/useHaptics";
import { logger } from "@/lib/logger";

const watchLogger = logger.withContext("WatchLive");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeutev5-1.onrender.com";

interface StreamData {
  streamId: string;
  status: "idle" | "active" | "disabled" | "reconnecting" | "not_found";
  playbackId: string | null;
  title?: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  viewerCount?: number;
}

interface ChatMessage {
  id: string;
  username: string;
  avatar_url?: string;
  message: string;
  message_type: "chat" | "gift" | "join" | "system";
  gift_name?: string;
  gift_amount?: number;
  created_at: string;
}

export default function WatchLive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stream, setStream] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [streamEnded] = useState(false);

  // Chat state for DB-backed polling
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState<number>(0);

  const fetchStream = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/mux/livestream-status/${id}`, {
        credentials: "include",
      });

      if (res.status === 404) {
        setStream({ streamId: id, status: "not_found", playbackId: null });
        return;
      }

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const { data } = await res.json();

      // Also pull meta from live_streams table via API
      setStream({ streamId: data.streamId, ...data });
    } catch (err: any) {
      watchLogger.error("Failed to fetch stream:", err);
      setError(err.message || "Impossible de charger le live.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch live stream meta (viewer count, etc.) from our live API
  const fetchLiveMeta = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/live/${id}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const { stream: liveData } = await res.json();
      if (liveData) {
        setViewerCount(liveData.viewer_count || 0);
        setStream((prev) =>
          prev
            ? {
                ...prev,
                title: liveData.title || prev.title,
                userId: liveData.user_id || prev.userId,
                username: liveData.user?.username || prev.username,
                avatarUrl: liveData.user?.avatar_url || prev.avatarUrl,
                viewerCount: liveData.viewer_count || prev.viewerCount,
              }
            : prev,
        );
      }
    } catch {
      // silently ignore — Mux status is primary
    }
  }, [id]);

  // Poll chat messages from DB every 3 seconds
  const fetchChatMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/live/${id}/messages`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const { messages } = await res.json();
      if (messages) setChatMessages(messages);
    } catch {
      // silently ignore
    }
  }, [id]);

  // Signal viewer join
  const signalViewerJoin = useCallback(async () => {
    if (!id) return;
    try {
      await fetch(`${API_BASE}/api/live/${id}/viewer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "join" }),
      });
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    fetchStream();
    fetchLiveMeta();
    signalViewerJoin();

    pollRef.current = setInterval(fetchStream, 10_000);
    chatPollRef.current = setInterval(fetchChatMessages, 3_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [fetchStream, fetchLiveMeta, fetchChatMessages, signalViewerJoin]);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Connexion au live...</p>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error || stream?.status === "not_found") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl mb-2">📡</div>
        <h2 className="text-xl font-bold text-white">Live introuvable</h2>
        <p className="text-white/50 text-sm">
          {error || "Ce live n'existe pas ou est déjà terminé."}
        </p>
        <button
          onClick={() => navigate("/live")}
          className="mt-4 px-6 py-3 rounded-2xl bg-white/10 text-white font-semibold"
        >
          Voir les lives
        </button>
      </div>
    );
  }

  // ─── Stream ended (received via socket) ─────────────────────────────────
  if (streamEnded) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl mb-2">🏁</div>
        <h2 className="text-2xl font-black text-white">Live terminé</h2>
        <p className="text-white/50">Le créateur a terminé son live.</p>
        <button
          onClick={() => navigate("/live")}
          className="mt-4 px-6 py-3 rounded-2xl bg-gold-gradient text-black font-black"
        >
          Voir d'autres lives
        </button>
      </div>
    );
  }

  // ─── Waiting for stream to start ─────────────────────────────────────────
  if (
    stream?.status === "idle" ||
    stream?.status === "disabled" ||
    !stream?.playbackId
  ) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-6xl mb-2">⏳</div>
        <h2 className="text-xl font-bold text-white">
          {stream?.title || "Le live commence bientôt..."}
        </h2>
        <p className="text-white/40 text-sm">
          Cette page se rafraîchit automatiquement.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={fetchStream}
            className="px-5 py-2.5 rounded-2xl bg-white/10 text-white text-sm font-semibold"
          >
            Actualiser
          </button>
          <button
            onClick={() => navigate("/live")}
            className="px-5 py-2.5 rounded-2xl bg-gold-gradient text-black text-sm font-bold"
          >
            Autres lives
          </button>
        </div>
      </div>
    );
  }

  // ─── Active stream — TikTok fullscreen layout ─────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Mux player — fullscreen */}
      {stream?.playbackId && (
        <MuxPlayer
          playbackId={stream.playbackId}
          streamType="live"
          autoPlay
          muted={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Top bar — gradient overlay */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-12 pb-6 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Back */}
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

          {/* Creator info */}
          <div className="flex items-center gap-2">
            {stream?.avatarUrl && (
              <img
                src={stream.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover border-2 border-red-500"
              />
            )}
            <div>
              <p className="text-white font-bold text-sm leading-none">
                {stream?.username || stream?.title || "Live"}
              </p>
              <p className="text-white/60 text-xs">{stream?.title}</p>
            </div>
          </div>
        </div>

        {/* Live badge + viewer count */}
        <div className="flex items-center gap-2 pointer-events-none">
          {stream?.status === "reconnecting" && (
            <span className="text-yellow-400 text-xs font-bold">
              ⚠️ Reconnexion...
            </span>
          )}
          {/* Viewer count display */}
          {viewerCount > 0 && (
            <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
              <span className="text-white/80 text-xs">👁️</span>
              <span className="text-white text-xs font-bold">
                {viewerCount >= 1000
                  ? `${(viewerCount / 1000).toFixed(1)}k`
                  : viewerCount}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-black">LIVE</span>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="absolute right-4 bottom-48 z-20 flex flex-col gap-4">
        {/* Toggle chat */}
        <button
          onClick={() => {
            tap();
            setShowChat((v) => !v);
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        {/* Gift */}
        <button
          onClick={() => {
            tap();
            setShowGiftPicker(true);
          }}
          className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"
        >
          <span className="text-xl">🎁</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            tap();
            navigator
              .share?.({
                title: stream?.title || "Live Zyeuté",
                url: window.location.href,
              })
              .catch(() => navigator.clipboard.writeText(window.location.href));
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* Bottom: chat — uses Socket.io LiveChat + DB messages fallback */}
      {showChat && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-3 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16">
          {/* DB-polled messages (gifts + join events shown above socket chat) */}
          {chatMessages.filter((m) => m.message_type === "gift").length > 0 && (
            <div className="mb-2 space-y-1 max-h-20 overflow-hidden">
              {chatMessages
                .filter((m) => m.message_type === "gift")
                .slice(-3)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 bg-gold-500/20 border border-gold-500/30 rounded-xl px-3 py-1.5"
                  >
                    <span className="text-lg">🎁</span>
                    <span className="text-gold-400 text-xs font-bold">
                      {m.username} {m.message}
                    </span>
                  </div>
                ))}
            </div>
          )}
          <LiveChat
            streamId={stream?.streamId || id || ""}
            viewerCount={viewerCount || stream?.viewerCount}
          />
        </div>
      )}

      {/* Gift picker — calls API on gift send */}
      {showGiftPicker && stream?.userId && (
        <GiftPicker
          recipientId={stream.userId}
          recipientName={stream.username || "ce créateur"}
          onClose={() => {
            setShowGiftPicker(false);
            // Refresh chat after gift picker closes to pick up any new gift messages
            fetchChatMessages();
          }}
        />
      )}
    </div>
  );
}
