/**
 * MessagesReal.tsx — Real DM Messaging for Zyeuté
 * ⚜️ Leather Wallet aesthetic — wired to live backend
 *
 * Architecture:
 *  - Left panel: conversation list + user search
 *  - Right panel (or full screen on mobile): message thread
 *  - Supabase Realtime on `messages` table, falls back to 5s polling
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiCall } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { toast } from "@/components/Toast";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

// ─── Design Tokens (mirrors ChatWalletUI) ───────────────────────────────────
const T = {
  leather: {
    dark: "#1A1510",
    medium: "#2A2018",
    light: "#3D3020",
    tan: "#8B6914",
  },
  gold: {
    dim: "#8B7355",
    DEFAULT: "#D4AF37",
    bright: "#F4D03F",
    shimmer: "#FFF8DC",
  },
  shadow: {
    inner: "inset 0 2px 4px rgba(0,0,0,0.5)",
    outer: "0 4px 8px rgba(0,0,0,0.4)",
    gold: "0 0 20px rgba(212,175,55,0.3)",
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface OtherUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface LastMessage {
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  lastMessage?: LastMessage;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender?: {
    username: string;
    avatarUrl?: string;
  };
}

interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      return d.toLocaleTimeString("fr-CA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("fr-CA", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Stitched leather panel wrapper */
const LeatherPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <div
    className={cn("relative rounded-2xl border-2 border-[#3D3020]", className)}
    style={{
      background: `linear-gradient(145deg, ${T.leather.dark} 0%, #111008 100%)`,
      boxShadow: `${T.shadow.outer}, ${T.shadow.inner}`,
      ...style,
    }}
  >
    {/* Stitched dashed inner border */}
    <div
      className="absolute inset-2 rounded-xl pointer-events-none"
      style={{ border: `2px dashed ${T.gold.DEFAULT}`, opacity: 0.25 }}
    />
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

/** Gold buckle input — matches ChatWalletUI GoldBuckle */
const GoldBuckle: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({
  value,
  onChange,
  onSend,
  placeholder = "Écris ton message...",
  disabled,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative w-full">
      {/* Belt strap bg */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(180deg, ${T.leather.medium} 0%, ${T.leather.dark} 50%, ${T.leather.medium} 100%)`,
          boxShadow: T.shadow.inner,
        }}
      />
      {/* Stitching */}
      <div
        className="absolute inset-1 rounded-full pointer-events-none"
        style={{ border: `1px dashed ${T.gold.dim}`, opacity: 0.4 }}
      />

      <div className="relative flex items-center gap-2 p-2">
        {/* Left buckle */}
        <div
          className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${T.gold.DEFAULT} 0%, ${T.gold.dim} 50%, ${T.gold.DEFAULT} 100%)`,
            boxShadow: `inset 0 1px 2px ${T.gold.shimmer}, 0 2px 4px rgba(0,0,0,0.4)`,
            border: `2px solid ${T.gold.bright}`,
          }}
        >
          <span className="text-xl">⚜️</span>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3 rounded-full",
              "bg-[#1A1510] text-[#F4D03F] placeholder-[#8B7355]",
              "border-2 transition-all duration-300 focus:outline-none",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            style={{
              borderColor: focused ? T.gold.bright : T.leather.tan,
              boxShadow: focused
                ? `0 0 15px ${T.gold.DEFAULT}40, inset 0 2px 4px rgba(0,0,0,0.5)`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200",
            !value.trim() && "opacity-40 cursor-not-allowed",
          )}
          style={{
            background: value.trim()
              ? `linear-gradient(145deg, ${T.gold.bright} 0%, ${T.gold.DEFAULT} 50%, ${T.gold.dim} 100%)`
              : `linear-gradient(145deg, ${T.leather.light} 0%, ${T.leather.medium} 100%)`,
            boxShadow: value.trim()
              ? `0 0 12px ${T.gold.DEFAULT}, inset 0 1px 2px ${T.gold.shimmer}`
              : T.shadow.inner,
            border: `2px solid ${value.trim() ? T.gold.bright : T.leather.tan}`,
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: value.trim() ? "#1A1510" : "#8B7355" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

/** Single message bubble — matches ChatWalletUI MessageBubble */
const MessageBubble: React.FC<{
  message: Message;
  isMe: boolean;
}> = ({ message, isMe }) => (
  <div
    className={cn(
      "relative max-w-[78%] rounded-2xl p-3 mb-3",
      isMe ? "ml-auto" : "mr-auto",
    )}
    style={{
      background: isMe
        ? `linear-gradient(145deg, ${T.gold.DEFAULT}22, ${T.gold.dim}12)`
        : `linear-gradient(145deg, ${T.leather.medium}, ${T.leather.dark})`,
      border: `2px solid ${isMe ? T.gold.DEFAULT : T.leather.tan}`,
      boxShadow: `${T.shadow.outer}${isMe ? `, ${T.shadow.gold}` : ""}`,
    }}
  >
    {/* Inner stitching */}
    <div
      className="absolute inset-2 rounded-xl pointer-events-none"
      style={{
        border: `1px dashed ${isMe ? T.gold.dim : T.leather.tan}`,
        opacity: 0.45,
      }}
    />
    <div className="relative z-10">
      <p
        className="text-[14px] leading-relaxed"
        style={{ color: isMe ? T.gold.bright : "#D4C4A8" }}
      >
        {message.content}
      </p>
      <p
        className="text-[11px] mt-1 text-right opacity-50"
        style={{ color: isMe ? T.gold.dim : T.leather.tan }}
      >
        {formatTime(message.createdAt)}
      </p>
    </div>
  </div>
);

/** Conversation row in the list */
const ConversationRow: React.FC<{
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}> = ({ conv, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-xl"
    style={{
      background: isActive
        ? `linear-gradient(90deg, ${T.gold.DEFAULT}18, transparent)`
        : "transparent",
      borderLeft: isActive
        ? `3px solid ${T.gold.bright}`
        : "3px solid transparent",
    }}
  >
    <div className="flex-shrink-0">
      <Avatar
        src={conv.otherUser.avatarUrl}
        alt={conv.otherUser.displayName || conv.otherUser.username}
        size="sm"
        userId={conv.otherUser.id}
      />
    </div>
    <div className="flex-1 min-w-0 text-left">
      <p
        className="font-semibold text-sm truncate"
        style={{ color: isActive ? T.gold.bright : T.gold.DEFAULT }}
      >
        {conv.otherUser.displayName || conv.otherUser.username}
      </p>
      {conv.lastMessage && (
        <p
          className="text-xs truncate opacity-70"
          style={{ color: T.gold.dim }}
        >
          {conv.lastMessage.content}
        </p>
      )}
    </div>
    <div className="flex-shrink-0 flex flex-col items-end gap-1">
      {conv.lastMessage && (
        <span className="text-[10px]" style={{ color: T.gold.dim }}>
          {formatTime(conv.lastMessage.createdAt)}
        </span>
      )}
      {conv.unreadCount > 0 && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: T.gold.DEFAULT,
            color: T.leather.dark,
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {conv.unreadCount}
        </span>
      )}
    </div>
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const MessagesReal: React.FC = () => {
  // Auth — get current user id from Supabase session
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Conversation list state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);

  // Active conversation / thread state
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // New message input
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Mobile: show thread vs list
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  // Scroll ref
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<any>(null);

  // ── Fetch conversations ────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const { data, error } = await apiCall<{ conversations: Conversation[] }>(
      "/messaging/conversations",
    );
    if (error) {
      toast.error("Impossible de charger les conversations");
      setConvsLoading(false);
      return;
    }
    setConversations(data?.conversations ?? []);
    setConvsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ conversations: Conversation[] }>("/messaging/conversations").then(
      ({ data, error }) => {
        if (cancelled) return;
        if (!error) setConversations(data?.conversations ?? []);
        setConvsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fetch messages for active conversation ─────────────────────────────────
  const fetchMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    const { data, error } = await apiCall<{ messages: Message[] }>(
      `/messaging/conversations/${convId}/messages`,
    );
    if (error) {
      toast.error("Impossible de charger les messages");
      setMessagesLoading(false);
      return;
    }
    setMessages(data?.messages ?? []);
    setMessagesLoading(false);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Realtime subscription (Supabase) with polling fallback ─────────────────
  useEffect(() => {
    if (!activeConvId) return;

    // Clear any previous polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // Remove previous realtime channel
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }

    // Load initial messages
    apiCall<{ messages: Message[] }>(
      `/messaging/conversations/${activeConvId}/messages`,
    ).then(({ data, error }) => {
      if (error) {
        toast.error("Impossible de charger les messages");
      } else {
        setMessages(data?.messages ?? []);
      }
      setMessagesLoading(false);
    });

    // Try Supabase realtime first
    let realtimeWorking = false;
    try {
      const channel = supabase
        .channel(`messages:conv:${activeConvId}`)
        .on(
          "postgres_changes" as any,
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${activeConvId}`,
          },
          (payload: any) => {
            realtimeWorking = true;
            // Append incoming message directly if it's not already in list
            const incoming = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          },
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            realtimeWorking = true;
          }
        });

      realtimeRef.current = channel;
    } catch {
      // Realtime not available — fall through to polling
    }

    // Fallback: poll every 5s (also handles cases where realtime filter doesn't match)
    pollRef.current = setInterval(() => {
      fetchMessages(activeConvId);
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  }, [activeConvId, fetchMessages]);

  // ── Select conversation ────────────────────────────────────────────────────
  const selectConversation = (convId: string) => {
    setActiveConvId(convId);
    setInputValue("");
    setMobileView("thread");
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!inputValue.trim() || !activeConvId || sending) return;
    const content = inputValue.trim();
    setInputValue("");
    setSending(true);

    // Optimistic insert
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      content,
      senderId: currentUserId ?? "me",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await apiCall<{ message: Message }>(
      `/messaging/conversations/${activeConvId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );

    setSending(false);

    if (error) {
      toast.error("Message non envoyé. Réessaie.");
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputValue(content); // restore input
      return;
    }

    // Replace optimistic with real message
    if (data?.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? data.message : m)),
      );
      // Refresh conversations to update last message preview
      fetchConversations();
    }
  };

  // ── User search ────────────────────────────────────────────────────────────
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const { data, error } = await apiCall<{ users: SearchUser[] }>(
        `/messaging/users/search?q=${encodeURIComponent(q.trim())}`,
      );
      setSearching(false);
      if (error) {
        toast.error("Recherche impossible");
        return;
      }
      setSearchResults(data?.users ?? []);
    }, 400);
  };

  // ── Start DM with a user from search ──────────────────────────────────────
  const startDM = async (userId: string) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    const { data, error } = await apiCall<{ conversation: { id: string } }>(
      "/messaging/conversations/direct",
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );

    if (error) {
      toast.error("Impossible de démarrer la conversation");
      return;
    }

    const convId = data?.conversation?.id;
    if (!convId) return;

    // Refresh conversations then open
    await fetchConversations();
    selectConversation(convId);
  };

  // ── Active conversation metadata ───────────────────────────────────────────
  const activeConv = conversations.find((c) => c.id === activeConvId);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen pb-20 flex flex-col"
      style={{ background: "#0D0A06" }}
    >
      {/* Header bar */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: `linear-gradient(180deg, ${T.leather.light} 0%, ${T.leather.dark} 100%)`,
          borderBottom: `2px solid ${T.leather.tan}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Back button on mobile when in thread view */}
        {mobileView === "thread" && (
          <button
            onClick={() => setMobileView("list")}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all"
            style={{
              background: T.leather.medium,
              border: `1px solid ${T.leather.tan}`,
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: T.gold.DEFAULT }}
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
        )}

        <span style={{ fontSize: 22 }}>⚜️</span>

        <div className="flex-1">
          <h1
            className="font-bold text-base leading-tight"
            style={{
              color: T.gold.bright,
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            }}
          >
            {mobileView === "thread" && activeConv
              ? activeConv.otherUser.displayName ||
                activeConv.otherUser.username
              : "Messages Directs"}
          </h1>
          <p className="text-xs" style={{ color: T.gold.dim }}>
            {mobileView === "thread" && activeConv
              ? `@${activeConv.otherUser.username}`
              : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Nouveau message button */}
        {(mobileView === "list" || window.innerWidth >= 768) && (
          <button
            onClick={() => {
              setShowSearch((v) => !v);
              if (!showSearch) setSearchQuery("");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: showSearch
                ? `linear-gradient(145deg, ${T.gold.DEFAULT}, ${T.gold.dim})`
                : T.leather.medium,
              border: `2px solid ${showSearch ? T.gold.bright : T.leather.tan}`,
              color: showSearch ? T.leather.dark : T.gold.DEFAULT,
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
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        )}
      </div>

      {/* New DM search panel */}
      {showSearch && (
        <div
          className="mx-4 mt-3 rounded-2xl overflow-hidden"
          style={{
            background: T.leather.dark,
            border: `2px solid ${T.gold.DEFAULT}`,
            boxShadow: T.shadow.gold,
          }}
        >
          <div className="p-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: T.gold.dim }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{
                  background: T.leather.medium,
                  border: `1px solid ${T.leather.tan}`,
                  color: T.gold.bright,
                }}
              />
            </div>
          </div>

          {searching && (
            <p className="px-4 pb-3 text-xs" style={{ color: T.gold.dim }}>
              Recherche...
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="pb-2">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startDM(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-all hover:bg-white/5"
                >
                  <Avatar
                    src={u.avatarUrl}
                    alt={u.displayName || u.username}
                    size="xs"
                    userId={u.id}
                  />
                  <div className="text-left">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: T.gold.DEFAULT }}
                    >
                      {u.displayName || u.username}
                    </p>
                    <p className="text-xs" style={{ color: T.gold.dim }}>
                      @{u.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.trim() && searchResults.length === 0 && (
            <p className="px-4 pb-3 text-xs" style={{ color: T.gold.dim }}>
              Aucun utilisateur trouvé pour «{searchQuery}»
            </p>
          )}
        </div>
      )}

      {/* Main content: split panel on md+, stacked on mobile */}
      <div className="flex flex-1 gap-3 p-3 md:p-4" style={{ minHeight: 0 }}>
        {/* ── Left: Conversation list ── */}
        <div
          className={cn(
            "flex-shrink-0 flex flex-col",
            // Mobile: full width when showing list, hidden when showing thread
            mobileView === "list" ? "flex w-full" : "hidden",
            // Desktop: always show, fixed width
            "md:flex md:w-72 lg:w-80",
          )}
        >
          <LeatherPanel
            className="flex-1 flex flex-col overflow-hidden"
            style={{ minHeight: 0 }}
          >
            <div
              className="px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${T.leather.tan}` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: T.gold.dim }}
              >
                Conversations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {convsLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: `${T.gold.DEFAULT} transparent transparent transparent`,
                    }}
                  />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
                  <span style={{ fontSize: 32 }}>💬</span>
                  <p className="text-sm mt-2" style={{ color: T.gold.dim }}>
                    Aucune conversation encore.
                  </p>
                  <p
                    className="text-xs mt-1 opacity-60"
                    style={{ color: T.gold.dim }}
                  >
                    Clique sur «Nouveau» pour démarrer un DM.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConvId}
                    onClick={() => selectConversation(conv.id)}
                  />
                ))
              )}
            </div>
          </LeatherPanel>
        </div>

        {/* ── Right: Message thread ── */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            // Mobile: full width when showing thread, hidden otherwise
            mobileView === "thread" ? "flex w-full" : "hidden",
            // Desktop: always show
            "md:flex",
          )}
          style={{ minHeight: 0 }}
        >
          <LeatherPanel
            className="flex-1 flex flex-col overflow-hidden"
            style={{ minHeight: 0 }}
          >
            {!activeConvId ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <span style={{ fontSize: 48 }}>⚜️</span>
                <p
                  className="text-lg font-bold"
                  style={{
                    color: T.gold.DEFAULT,
                    textShadow: "0 0 20px rgba(212,175,55,0.4)",
                  }}
                >
                  Messages Directs
                </p>
                <p className="text-sm" style={{ color: T.gold.dim }}>
                  Sélectionne une conversation ou démarre un nouveau DM.
                </p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                {activeConv && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                    style={{ borderBottom: `1px solid ${T.leather.tan}` }}
                  >
                    <Avatar
                      src={activeConv.otherUser.avatarUrl}
                      alt={
                        activeConv.otherUser.displayName ||
                        activeConv.otherUser.username
                      }
                      size="xs"
                      userId={activeConv.otherUser.id}
                    />
                    <div>
                      <p
                        className="font-bold text-sm"
                        style={{ color: T.gold.bright }}
                      >
                        {activeConv.otherUser.displayName ||
                          activeConv.otherUser.username}
                      </p>
                      <p
                        className="text-xs opacity-60"
                        style={{ color: T.gold.dim }}
                      >
                        @{activeConv.otherUser.username}
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages area */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-4"
                  style={{
                    background: `linear-gradient(180deg, ${T.leather.dark} 0%, ${T.leather.medium}88 100%)`,
                  }}
                >
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <div
                        className="w-6 h-6 rounded-full border-2 animate-spin"
                        style={{
                          borderColor: `${T.gold.DEFAULT} transparent transparent transparent`,
                        }}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
                      <span style={{ fontSize: 32 }}>💬</span>
                      <p className="text-sm" style={{ color: T.gold.dim }}>
                        Aucun message encore. Dis bonjour!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={msg.senderId === currentUserId}
                      />
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div
                  className="flex-shrink-0 p-3"
                  style={{
                    borderTop: `2px solid ${T.leather.tan}`,
                    background: T.leather.dark,
                  }}
                >
                  <GoldBuckle
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={sendMessage}
                    disabled={sending}
                    placeholder="Écris ton message..."
                  />
                </div>
              </>
            )}
          </LeatherPanel>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MessagesReal;
