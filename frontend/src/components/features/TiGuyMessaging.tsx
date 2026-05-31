/**
 * Ti-Guy Messaging — Voyageur Luxury
 * Ti-Guy IS the inbox. DMs live here, not on a separate page.
 *
 * Modes:
 *   "chat"   — Ti-Guy greets you, shows unread count, quick actions
 *   "inbox"  — full DM conversation list
 *   "thread" — open message thread
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { apiCall } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4E2A6";
const LEATHER_DARK = "#1A0F0A";
const LEATHER_MID = "#2C1810";
const LEATHER_STRAP = "#3D2418";
const LEATHER_LIGHT = "#4A2E20";
const BUBBLE_USER = "#5C4033";
const BUBBLE_TIGUY =
  "linear-gradient(135deg, #6B4C9E 0%, #8B5A9E 50%, #A64D7A 100%)";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender?: { username: string; avatarUrl?: string };
}

type Mode = "chat" | "inbox" | "thread";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diffH = (Date.now() - d.getTime()) / 3_600_000;
    if (diffH < 24)
      return d.toLocaleTimeString("fr-CA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return d.toLocaleDateString("fr-CA", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function tiGuyGreeting(totalUnread: number, firstName?: string): string {
  const name = firstName ? `, ${firstName}` : "";
  if (totalUnread === 0)
    return `Salut${name}! Aucun nouveau message pour l'instant. 👋`;
  if (totalUnread === 1)
    return `Allo${name}! T'as **1 nouveau message direct** qui t'attend! 📬`;
  return `Allo${name}! T'as **${totalUnread} nouveaux messages directs** qui t'attendent! 📬`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FleurDeLysIcon({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 22V11l-3 2 1-4 2-4 2 4 1 4-3-2v11z" />
      <path d="M12 7c-1.5 0-2.5-1.5-2-3 .5-1.5 2-2 2-2s1.5.5 2 2c.5 1.5-.5 3-2 3z" />
    </svg>
  );
}

function GoldDivider({ gold }: { gold: string }) {
  return (
    <div
      className="w-full h-px my-2"
      style={{
        background: `linear-gradient(90deg, transparent, ${gold}60, transparent)`,
      }}
    />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TiGuyMessagingProps {
  open: boolean;
  onClose: () => void;
  isPremium?: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export const TiGuyMessaging: React.FC<TiGuyMessagingProps> = ({
  open,
  onClose,
  isPremium = false,
}) => {
  const { edgeLighting } = useTheme();
  const gold = edgeLighting || GOLD;
  const navigate = useNavigate();

  // Panel mode
  const [mode, setMode] = useState<Mode>("chat");

  // Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const totalUnread = conversations.reduce(
    (s, c) => s + (c.unreadCount || 0),
    0,
  );

  const fetchConversations = useCallback(async () => {
    setConvsLoading(true);
    const { data } = await apiCall<{ conversations: Conversation[] }>(
      "/messaging/conversations",
    );
    setConversations(data?.conversations ?? []);
    setConvsLoading(false);
  }, []);

  // Active thread
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Search (new DM)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Conversation["otherUser"][]
  >([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    // Defer all state updates so the effect doesn't cascade synchronously
    const timer = setTimeout(() => {
      setMode(isPremium ? "chat" : "inbox");
      setActiveConv(null);
      setMessages([]);
      setShowSearch(false);
      fetchConversations();
    }, 0);
    return () => clearTimeout(timer);
  }, [open, fetchConversations]);

  // ── Fetch messages for thread ─────────────────────────────────────────────
  const openThread = useCallback(
    async (conv: Conversation) => {
      setActiveConv(conv);
      setMode("thread");
      setMsgLoading(true);
      setMessages([]);

      // Clear previous realtime/polling
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }

      const { data } = await apiCall<{ messages: Message[] }>(
        `/messaging/conversations/${conv.id}/messages`,
      );
      setMessages(data?.messages ?? []);
      setMsgLoading(false);

      // Realtime
      try {
        const channel = supabase
          .channel(`tiguy:conv:${conv.id}`)
          .on(
            "postgres_changes" as any,
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conv.id}`,
            },
            (payload: any) => {
              const incoming = payload.new as Message;
              setMessages((prev) =>
                prev.some((m) => m.id === incoming.id)
                  ? prev
                  : [...prev, incoming],
              );
            },
          )
          .subscribe();
        realtimeRef.current = channel;
      } catch {
        /* fallback to poll */
      }

      // 5s poll fallback
      pollRef.current = setInterval(async () => {
        const { data: d } = await apiCall<{ messages: Message[] }>(
          `/messaging/conversations/${conv.id}/messages`,
        );
        if (d?.messages) setMessages(d.messages);
      }, 5000);

      // Mark read — refresh conv list badge
      setTimeout(() => fetchConversations(), 500);
    },
    [fetchConversations],
  );

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!inputValue.trim() || !activeConv || sending) return;
    const content = inputValue.trim();
    setInputValue("");
    setSending(true);

    const optId = `opt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optId,
        content,
        senderId: currentUserId ?? "me",
        createdAt: new Date().toISOString(),
      },
    ]);

    const { data, error } = await apiCall<{ message: Message }>(
      `/messaging/conversations/${activeConv.id}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    );
    setSending(false);

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optId));
      setInputValue(content);
      return;
    }
    if (data?.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optId ? data.message : m)),
      );
      fetchConversations();
    }
  };

  // ── User search ───────────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const { data } = await apiCall<{ users: Conversation["otherUser"][] }>(
        `/messaging/users/search?q=${encodeURIComponent(q.trim())}`,
      );
      setSearching(false);
      setSearchResults(data?.users ?? []);
    }, 400);
  };

  const startDM = async (userId: string) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    const { data } = await apiCall<{
      conversation: { id: string };
      conversationId: string;
    }>("/messaging/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    const convId = data?.conversation?.id ?? data?.conversationId;
    if (!convId) return;
    await fetchConversations();
    // Find the conv and open it
    setConversations((prev) => {
      const found = prev.find((c) => c.id === convId);
      if (found) openThread(found);
      return prev;
    });
    setMode("inbox"); // will be overridden by openThread
  };

  if (!open) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderGreeting = () => {
    const greeting = tiGuyGreeting(totalUnread);
    // Bold **text** support
    const parts = greeting.split(/\*\*(.*?)\*\*/g);
    return (
      <span>
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <strong key={i} style={{ color: GOLD_LIGHT }}>
              {p}
            </strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PANEL CONTENT by mode
  // ─────────────────────────────────────────────────────────────────────────

  const renderChatMode = () => (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ background: LEATHER_DARK }}
    >
      {/* Ti-Guy bubble */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{ borderColor: gold, background: LEATHER_MID }}
        >
          <span className="text-xs font-black" style={{ color: gold }}>
            TG
          </span>
        </div>
        <div
          className="max-w-[82%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
          style={{
            background: BUBBLE_TIGUY,
            border: `1px solid ${gold}50`,
            color: GOLD_LIGHT,
            boxShadow: `0 0 12px ${gold}20`,
          }}
        >
          {convsLoading
            ? "Une seconde, je check tes messages..."
            : isPremium
              ? renderGreeting()
              : "Aye mon ami(e)! 🦫 Pour jaser avec moi, tu dois être abonné(e). Upgrade pis on se parle! 💬"}
        </div>
      </div>

      <GoldDivider gold={gold} />

      {/* Upgrade CTA — shown only for free users */}
      {!isPremium && (
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/premium");
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${gold}22 0%, ${gold}44 100%)`,
            border: `2px solid ${gold}`,
            boxShadow: `0 0 16px ${gold}40`,
          }}
        >
          <span className="text-lg">⚜️</span>
          <span className="text-sm font-black" style={{ color: gold }}>
            Deviens abonné Bronze+ — Débloque Ti-Guy
          </span>
          <span className="text-lg">💎</span>
        </button>
      )}

      {/* Quick action buttons */}
      <div className="space-y-2">
        {/* Inbox button — shows unread badge */}
        <button
          type="button"
          onClick={() => setMode("inbox")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95"
          style={{
            background: `linear-gradient(90deg, ${LEATHER_STRAP}, ${LEATHER_MID})`,
            border: `1.5px solid ${gold}50`,
          }}
        >
          <span className="text-xl">✉️</span>
          <span
            className="flex-1 text-left text-sm font-semibold"
            style={{ color: GOLD_LIGHT }}
          >
            Messages directs
          </span>
          {totalUnread > 0 && (
            <span
              className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: gold, color: LEATHER_DARK }}
            >
              {totalUnread}
            </span>
          )}
          <svg
            className="w-4 h-4 opacity-50"
            style={{ color: gold }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Last convs shortcut — show top 2 unread */}
        {conversations
          .filter((c) => c.unreadCount > 0)
          .slice(0, 2)
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openThread(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all active:scale-95"
              style={{
                background: `linear-gradient(90deg, ${LEATHER_DARK}, ${LEATHER_MID}88)`,
                border: `1px solid ${gold}30`,
              }}
            >
              <Avatar
                src={c.otherUser.avatar_url}
                alt={c.otherUser.display_name || c.otherUser.username}
                size="xs"
                userId={c.otherUser.id}
              />
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: gold }}
                >
                  {c.otherUser.display_name || c.otherUser.username}
                </p>
                {c.lastMessage && (
                  <p
                    className="text-xs truncate opacity-60"
                    style={{ color: GOLD_LIGHT }}
                  >
                    {c.lastMessage.content}
                  </p>
                )}
              </div>
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: gold, color: LEATHER_DARK }}
              >
                {c.unreadCount}
              </span>
            </button>
          ))}

        {/* New DM button */}
        <button
          type="button"
          onClick={() => {
            setMode("inbox");
            setShowSearch(true);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-95"
          style={{
            background: `linear-gradient(90deg, ${LEATHER_STRAP}, ${LEATHER_MID})`,
            border: `1.5px solid ${gold}50`,
          }}
        >
          <span className="text-xl">💬</span>
          <span
            className="flex-1 text-left text-sm font-semibold"
            style={{ color: GOLD_LIGHT }}
          >
            Nouveau message
          </span>
          <svg
            className="w-4 h-4 opacity-50"
            style={{ color: gold }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderInboxMode = () => (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: LEATHER_DARK }}
    >
      {/* Search toggle */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowSearch((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: showSearch ? `${gold}22` : LEATHER_MID,
            border: `1.5px solid ${showSearch ? gold : gold + "40"}`,
            color: showSearch ? GOLD_LIGHT : gold,
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Nouveau message</span>
        </button>

        {showSearch && (
          <div className="mt-2">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Chercher un utilisateur..."
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{
                background: LEATHER_MID,
                border: `1.5px solid ${gold}50`,
                color: GOLD_LIGHT,
              }}
            />
            {searching && (
              <p
                className="text-xs px-1 pt-1 opacity-50"
                style={{ color: GOLD_LIGHT }}
              >
                Recherche...
              </p>
            )}
            {searchResults.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => startDM(u.id)}
                className="w-full flex items-center gap-3 px-2 py-2 mt-1 rounded-lg transition-all hover:bg-white/5"
              >
                <Avatar
                  src={u.avatar_url}
                  alt={u.display_name || u.username}
                  size="xs"
                  userId={u.id}
                />
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: gold }}>
                    {u.display_name || u.username}
                  </p>
                  <p
                    className="text-xs opacity-60"
                    style={{ color: GOLD_LIGHT }}
                  >
                    @{u.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <GoldDivider gold={gold} />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {convsLoading ? (
          <div className="flex items-center justify-center h-20">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${gold} transparent transparent transparent`,
              }}
            />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center px-4">
            <span className="text-2xl">💬</span>
            <p
              className="text-xs mt-2 opacity-60"
              style={{ color: GOLD_LIGHT }}
            >
              Aucune conversation. Démarre un nouveau DM!
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openThread(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all active:scale-95"
              style={{
                background: c.unreadCount > 0 ? `${gold}12` : "transparent",
                border: `1px solid ${c.unreadCount > 0 ? gold + "40" : "transparent"}`,
              }}
            >
              <Avatar
                src={c.otherUser.avatar_url}
                alt={c.otherUser.display_name || c.otherUser.username}
                size="sm"
                userId={c.otherUser.id}
              />
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: c.unreadCount > 0 ? GOLD_LIGHT : gold }}
                >
                  {c.otherUser.display_name || c.otherUser.username}
                </p>
                {c.lastMessage && (
                  <p
                    className="text-xs truncate opacity-60"
                    style={{ color: GOLD_LIGHT }}
                  >
                    {c.lastMessage.content}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                {c.lastMessage && (
                  <span
                    className="text-[10px] opacity-50"
                    style={{ color: GOLD_LIGHT }}
                  >
                    {formatTime(c.lastMessage.createdAt)}
                  </span>
                )}
                {c.unreadCount > 0 && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: gold, color: LEATHER_DARK }}
                  >
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderThreadMode = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Thread header */}
      {activeConv && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
          style={{
            background: LEATHER_MID,
            borderBottom: `1px solid ${gold}30`,
          }}
        >
          <Avatar
            src={activeConv.otherUser.avatar_url}
            alt={
              activeConv.otherUser.display_name || activeConv.otherUser.username
            }
            size="xs"
            userId={activeConv.otherUser.id}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: GOLD_LIGHT }}
            >
              {activeConv.otherUser.display_name ||
                activeConv.otherUser.username}
            </p>
            <p className="text-[10px] opacity-60" style={{ color: gold }}>
              @{activeConv.otherUser.username}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ background: LEATHER_DARK }}
      >
        {msgLoading ? (
          <div className="flex items-center justify-center h-20">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${gold} transparent transparent transparent`,
              }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <span className="text-2xl">💬</span>
            <p
              className="text-xs mt-2 opacity-60"
              style={{ color: GOLD_LIGHT }}
            >
              Aucun message encore. Dis bonjour!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                  style={{
                    background: isMe ? BUBBLE_USER : BUBBLE_TIGUY,
                    border: `1px solid ${isMe ? gold + "40" : gold + "50"}`,
                    color: GOLD_LIGHT,
                    boxShadow: isMe ? "none" : `0 0 8px ${gold}20`,
                  }}
                >
                  <p>{msg.content}</p>
                  <p
                    className="text-[10px] mt-0.5 opacity-50 text-right"
                    style={{ color: gold }}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 p-2 flex-shrink-0"
        style={{
          background: LEATHER_STRAP,
          borderTop: `1.5px solid ${gold}40`,
        }}
      >
        <div
          className="w-9 h-9 rounded flex-shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <FleurDeLysIcon size={16} className="text-[#1A0F0A]" />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Écris un message..."
          className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{
            background: LEATHER_DARK,
            border: `1.5px solid ${gold}40`,
            color: GOLD_LIGHT,
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!inputValue.trim() || sending}
          className="w-9 h-9 rounded flex-shrink-0 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
          aria-label="Envoyer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="#1A0F0A"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SHELL
  // ─────────────────────────────────────────────────────────────────────────

  const panelTitle =
    mode === "thread" && activeConv
      ? activeConv.otherUser.display_name || activeConv.otherUser.username
      : mode === "inbox"
        ? "Messages directs"
        : "Ti-Guy";

  const panelSubtitle =
    mode === "thread" && activeConv
      ? `@${activeConv.otherUser.username}`
      : mode === "inbox"
        ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
        : "ton concierge personnel ⚜️";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(180deg, ${LEATHER_STRAP} 0%, ${LEATHER_MID} 30%, ${LEATHER_DARK} 100%)`,
          border: `2px solid ${gold}40`,
          boxShadow: `0 0 30px ${gold}20, inset 0 0 60px rgba(0,0,0,0.4)`,
          maxHeight: "88vh",
          height: "560px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: `linear-gradient(180deg, ${LEATHER_LIGHT} 0%, ${LEATHER_STRAP} 100%)`,
            borderBottom: `2px solid ${gold}50`,
          }}
        >
          {/* Back / fleur button */}
          {mode !== "chat" ? (
            <button
              type="button"
              onClick={() => {
                if (mode === "thread") setMode("inbox");
                else setMode("chat");
              }}
              className="p-2 rounded-lg"
              style={{ color: gold }}
              aria-label="Retour"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : (
            <div className="p-2" style={{ color: gold }}>
              <FleurDeLysIcon size={26} />
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col items-center">
            <h2
              className="text-base font-black tracking-tight"
              style={{
                color: gold,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                textShadow: `0 0 10px ${gold}60`,
              }}
            >
              {panelTitle}
            </h2>
            <span
              className="text-[0.55rem] uppercase tracking-[0.2em] opacity-60"
              style={{ color: GOLD_LIGHT }}
            >
              {panelSubtitle}
            </span>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: gold }}
            aria-label="Fermer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        {mode === "chat" && renderChatMode()}
        {mode === "inbox" && renderInboxMode()}
        {mode === "thread" && renderThreadMode()}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf"
          onChange={() => {}}
        />
      </div>
    </div>
  );
};

export default TiGuyMessaging;
