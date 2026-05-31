/**
 * LiveChat — Real-time chat overlay for live streams (broadcaster + viewer)
 * Connects via Socket.io to the live:${streamId} room.
 * Shows floating gift animations when gifts are received.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";
import usePremium from "@/hooks/usePremium";

export interface LiveMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  text: string;
  tier: "free" | "bronze" | "silver" | "gold" | "argent" | "or";
  timestamp: number;
}

export interface LiveGiftEvent {
  id: string;
  senderId: string;
  senderName: string;
  giftEmoji: string;
  giftName: string;
  giftCost: number;
  timestamp: number;
}

interface FloatingGift extends LiveGiftEvent {
  x: number;
}

interface LiveChatProps {
  streamId: string;
  /** Compact mode — used on broadcaster view where chat is smaller */
  compact?: boolean;
  viewerCount?: number;
}

const TIER_COLOURS: Record<string, string> = {
  free: "text-white",
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  // Legacy French aliases
  argent: "text-gray-300",
  or: "text-yellow-400",
};

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_API_URL ||
  "https://zyeutev5-1.onrender.com";

export function LiveChat({ streamId, compact = false }: LiveChatProps) {
  const { user } = useAuth();
  const { tap } = useHaptics();
  const { tier } = usePremium();

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const floaterCounter = useRef(0);

  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const [inputText, setInputText] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to Socket.io and join the live room
  useEffect(() => {
    if (!streamId) return;

    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("live:join", {
        streamId,
        userId: user?.id,
        username:
          user?.username ||
          (user as any)?.user_metadata?.username ||
          (user as any)?.email?.split("@")[0],
        avatarUrl: (user as any)?.user_metadata?.avatar_url || user?.avatarUrl,
      });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("live:message", (msg: LiveMessage) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        // Keep last 100 messages
        return next.length > 100 ? next.slice(-100) : next;
      });
    });

    socket.on("live:viewer_count", ({ count }: { count: number }) => {
      setViewerCount(count);
    });

    socket.on("live:gift", (gift: LiveGiftEvent) => {
      // Spawn floating emoji
      const x = 10 + Math.random() * 70;
      const floater: FloatingGift = { ...gift, x };
      const id = String(++floaterCounter.current);
      setFloatingGifts((prev) => [...prev, { ...floater, id }]);
      setTimeout(() => {
        setFloatingGifts((prev) => prev.filter((f) => f.id !== id));
      }, 2500);

      // Also add as chat message
      setMessages((prev) => [
        ...prev,
        {
          id: gift.id,
          userId: gift.senderId,
          username: gift.senderName,
          text: `a envoyé ${gift.giftEmoji} ${gift.giftName}!`,
          tier: "free",
          timestamp: gift.timestamp,
        },
      ]);
    });

    socket.on("live:viewer_joined", ({ username }: any) => {
      if (username) {
        setMessages((prev) => [
          ...prev,
          {
            id: `join-${Date.now()}`,
            userId: "",
            username: "Zyeuté",
            text: `${username} a rejoint le live 👋`,
            tier: "free",
            timestamp: Date.now(),
          },
        ]);
      }
    });

    return () => {
      socket.emit("live:leave", { streamId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [streamId, user]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !socketRef.current?.connected) return;
    tap();

    socketRef.current.emit("live:message", {
      streamId,
      userId: user?.id,
      username:
        user?.username ||
        (user as any)?.user_metadata?.username ||
        (user as any)?.email?.split("@")[0] ||
        "Anonyme",
      avatarUrl: (user as any)?.user_metadata?.avatar_url || user?.avatarUrl,
      text,
      tier,
    });

    setInputText("");
  }, [inputText, streamId, user, tier, tap]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  const chatHeight = compact ? "h-40" : "h-64";

  return (
    <div className="relative flex flex-col w-full">
      {/* Floating gift animations */}
      {floatingGifts.map((gift) => (
        <div
          key={gift.id}
          className="fixed z-[200] pointer-events-none animate-gift-float"
          style={{ left: `${gift.x}%`, bottom: "160px" }}
        >
          <div className="flex flex-col items-center">
            <span className="text-5xl drop-shadow-lg">{gift.giftEmoji}</span>
            <span className="text-white text-xs font-bold bg-black/60 rounded-full px-2 py-0.5 mt-1">
              {gift.senderName}
            </span>
          </div>
        </div>
      ))}

      {/* Viewer count + connection badge */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold">LIVE</span>
        </div>
        <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          👁 {viewerCount}
        </div>
        {!isConnected && (
          <span className="text-yellow-400 text-xs">Reconnexion...</span>
        )}
      </div>

      {/* Messages */}
      <div
        className={`${chatHeight} overflow-y-auto space-y-1 px-1 flex flex-col`}
        style={{ scrollbarWidth: "none" }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-1.5">
            <span
              className={`text-xs font-bold flex-shrink-0 ${TIER_COLOURS[msg.tier] || "text-white"}`}
            >
              {msg.username}
            </span>
            <span className="text-white/90 text-xs leading-tight">
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {user && (
        <div className="flex gap-2 mt-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
            placeholder="Envoie un message..."
            className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-gold-500 min-w-0"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-gold-500 disabled:opacity-40 flex items-center justify-center"
          >
            <svg
              className="w-4 h-4 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
