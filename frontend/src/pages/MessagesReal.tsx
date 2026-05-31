/**
 * MessagesReal.tsx — Full Notification Hub for Zyeuté
 * ⚜️ Leather Wallet aesthetic — wired to live backend
 *
 * 4 tabs:
 *  - Messages   — DM conversations (real backend)
 *  - Activité   — Likes, comments, reactions on your posts
 *  - Abonnés    — New followers
 *  - Système    — App / admin notifications
 *
 * Tab labels auto-adapt per hive locale.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { apiCall } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { toast } from "@/components/Toast";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { useHive } from "../contexts/HiveContext";

// ─── Design Tokens ────────────────────────────────────────────────────────────
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

// ─── i18n tab labels ──────────────────────────────────────────────────────────
const TAB_LABELS: Record<
  string,
  { messages: string; activity: string; followers: string; system: string }
> = {
  quebec: {
    messages: "Messages",
    activity: "Activité",
    followers: "Abonnés",
    system: "Système",
  },
  mexico: {
    messages: "Mensajes",
    activity: "Actividad",
    followers: "Seguidores",
    system: "Sistema",
  },
  brazil: {
    messages: "Mensagens",
    activity: "Atividade",
    followers: "Seguidores",
    system: "Sistema",
  },
  argentina: {
    messages: "Mensajes",
    activity: "Actividad",
    followers: "Seguidores",
    system: "Sistema",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
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
  sender?: { username: string; avatarUrl?: string };
}
interface SearchUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}
interface ActivityNotif {
  id: string;
  type: string; // 'fire' | 'comment' | 'mention' | 'gift'
  fromUser?: { id: string; username: string; avatarUrl?: string };
  message?: string;
  postId?: string;
  isRead: boolean;
  createdAt: string;
}
interface FollowerNotif {
  id: string;
  type: string; // 'follow'
  fromUser?: { id: string; username: string; avatarUrl?: string };
  isRead: boolean;
  createdAt: string;
}
interface SystemNotif {
  id: string;
  title: string;
  body: string;
  icon: string;
  createdAt: string;
}

type TabId = "messages" | "activity" | "followers" | "system";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diffHours = (Date.now() - d.getTime()) / 3_600_000;
    if (diffHours < 24)
      return d.toLocaleTimeString("fr-CA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return d.toLocaleDateString("fr-CA", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function activityIcon(type: string): string {
  switch (type) {
    case "fire":
      return "🔥";
    case "comment":
      return "💬";
    case "mention":
      return "@";
    case "gift":
      return "🎁";
    default:
      return "⚡";
  }
}

function activityLabel(type: string, hiveId: string): string {
  const isFr = hiveId === "quebec";
  const isPt = hiveId === "brazil";
  switch (type) {
    case "fire":
      return isFr
        ? "a aimé ta publication"
        : isPt
          ? "curtiu sua publicação"
          : "le gustó tu publicación";
    case "comment":
      return isFr
        ? "a commenté ta publication"
        : isPt
          ? "comentou sua publicação"
          : "comentó tu publicación";
    case "mention":
      return isFr ? "t'a mentionné" : isPt ? "te mencionou" : "te mencionó";
    case "gift":
      return isFr
        ? "t'a envoyé un cadeau"
        : isPt
          ? "te enviou um presente"
          : "te envió un regalo";
    default:
      return isFr
        ? "interagi avec toi"
        : isPt
          ? "interagiu com você"
          : "interactuó contigo";
  }
}

// ─── System notifications (static for now) ───────────────────────────────────
function getSystemNotifs(hiveId: string): SystemNotif[] {
  const isFr = hiveId === "quebec";
  const isPt = hiveId === "brazil";
  return [
    {
      id: "sys-1",
      icon: currentHiveIcon(hiveId),
      title: isFr
        ? "Bienvenue sur Zyeuté !"
        : isPt
          ? "Bem-vindo ao Zyeuté!"
          : "¡Bienvenido a Zyeuté!",
      body: isFr
        ? "Ton compte est actif. Partage ta première vidéo dès maintenant."
        : isPt
          ? "Sua conta está ativa. Compartilhe seu primeiro vídeo agora."
          : "Tu cuenta está activa. Comparte tu primer video ahora.",
      createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    },
    {
      id: "sys-2",
      icon: "✨",
      title: isFr
        ? "Nouvelles fonctionnalités disponibles"
        : isPt
          ? "Novos recursos disponíveis"
          : "Nuevas funciones disponibles",
      body: isFr
        ? "Découvrez les nouvelles régions et le système de hive multi-pays."
        : isPt
          ? "Descubra as novas regiões e o sistema de hive multi-país."
          : "Descubre las nuevas regiones y el sistema hive multi-país.",
      createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
    {
      id: "sys-3",
      icon: "🔒",
      title: isFr
        ? "Ton compte est sécurisé"
        : isPt
          ? "Sua conta está segura"
          : "Tu cuenta está segura",
      body: isFr
        ? "Authentification active. Tes données sont protégées."
        : isPt
          ? "Autenticação ativa. Seus dados estão protegidos."
          : "Autenticación activa. Tus datos están protegidos.",
      createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    },
  ];
}

function currentHiveIcon(hiveId: string): string {
  switch (hiveId) {
    case "mexico":
      return "🦅";
    case "brazil":
      return "🐆";
    case "argentina":
      return "🐆";
    default:
      return "⚜️";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div
      className="absolute inset-2 rounded-xl pointer-events-none"
      style={{ border: `2px dashed ${T.gold.DEFAULT}`, opacity: 0.25 }}
    />
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

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
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(180deg, ${T.leather.medium} 0%, ${T.leather.dark} 50%, ${T.leather.medium} 100%)`,
          boxShadow: T.shadow.inner,
        }}
      />
      <div
        className="absolute inset-1 rounded-full pointer-events-none"
        style={{ border: `1px dashed ${T.gold.dim}`, opacity: 0.4 }}
      />
      <div className="relative flex items-center gap-2 p-2">
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
              "w-full px-4 py-3 rounded-full bg-[#1A1510] text-[#F4D03F] placeholder-[#8B7355] border-2 transition-all duration-300 focus:outline-none",
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

const MessageBubble: React.FC<{ message: Message; isMe: boolean }> = ({
  message,
  isMe,
}) => (
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

// ─── Main Component ───────────────────────────────────────────────────────────
export const MessagesReal: React.FC = () => {
  const { currentHive } = useHive();
  const hiveId = currentHive.id;
  const labels = TAB_LABELS[hiveId] ?? TAB_LABELS.quebec;
  const hiveIcon = currentHiveIcon(hiveId);

  const [activeTab, setActiveTab] = useState<TabId>("messages");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // ── Messages tab state ────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Activity tab state ────────────────────────────────────────────────────
  const [activityNotifs, setActivityNotifs] = useState<ActivityNotif[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityUnread, setActivityUnread] = useState(0);

  // ── Followers tab state ───────────────────────────────────────────────────
  const [followerNotifs, setFollowerNotifs] = useState<FollowerNotif[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersUnread, setFollowersUnread] = useState(0);

  // ── Messages unread count ─────────────────────────────────────────────────
  const [messagesUnread, setMessagesUnread] = useState(0);

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const { data, error } = await apiCall<{ conversations: Conversation[] }>(
      "/messaging/conversations",
    );
    if (!error) {
      const convs = data?.conversations ?? [];
      setConversations(convs);
      setMessagesUnread(convs.reduce((s, c) => s + (c.unreadCount || 0), 0));
    }
    setConvsLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Fetch notifications (activity + followers) ────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const { data, error } = await apiCall<{ notifications: ActivityNotif[] }>(
      "/notifications",
    );
    if (!error && data?.notifications) {
      const all = data.notifications;
      const activity = all.filter((n) =>
        ["fire", "comment", "mention", "gift"].includes(n.type),
      );
      const followers = all.filter((n) => n.type === "follow");
      setActivityNotifs(activity);
      setFollowerNotifs(followers as FollowerNotif[]);
      setActivityUnread(activity.filter((n) => !n.isRead).length);
      setFollowersUnread(followers.filter((n) => !n.isRead).length);
      setActivityLoading(false);
      setFollowersLoading(false);
    } else {
      setActivityLoading(false);
      setFollowersLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) fetchNotifications();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mark notifications as read when tab opens ─────────────────────────────
  const prevTabRef = useRef<TabId | null>(null);
  useEffect(() => {
    if (prevTabRef.current === activeTab) return;
    prevTabRef.current = activeTab;
    if (activeTab === "activity" || activeTab === "followers") {
      apiCall("/notifications/read-all", { method: "POST" }).then(() => {
        if (activeTab === "activity") setActivityUnread(0);
        else setFollowersUnread(0);
      });
    }
  }, [activeTab]);

  // ── Fetch messages for active convo ──────────────────────────────────────
  // silent=true → background poll, never shows spinner or wipes optimistic messages
  const fetchMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setMessagesLoading(true);
    const { data, error } = await apiCall<{ messages: Message[] }>(
      `/messaging/conversations/${convId}/messages`,
    );
    if (!error) {
      const serverMsgs = data?.messages ?? [];
      if (silent) {
        // Merge: keep any optimistic messages not yet confirmed, append new server msgs
        setMessages((prev) => {
          const serverIds = new Set(serverMsgs.map((m) => m.id));
          const optimistic = prev.filter(
            (m) => m.id.startsWith("opt-") && !serverIds.has(m.id),
          );
          return [...serverMsgs, ...optimistic];
        });
      } else {
        setMessages(serverMsgs);
      }
    }
    if (!silent) setMessagesLoading(false);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Realtime + polling for active convo ───────────────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }

    // Initial load — show spinner only if conversation has no messages yet
    setMessagesLoading(true);
    apiCall<{ messages: Message[] }>(
      `/messaging/conversations/${activeConvId}/messages`,
    ).then(({ data, error }) => {
      if (!error) setMessages(data?.messages ?? []);
      setMessagesLoading(false);
    });

    try {
      const channel = supabase
        .channel(`messages:conv:${activeConvId}`)
        .on(
          "postgres_changes" as Parameters<
            ReturnType<typeof supabase.channel>["on"]
          >[0],
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${activeConvId}`,
          },
          (payload: { new: Message }) => {
            const incoming = payload.new;
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
      /* fall through to polling */
    }

    // silent=true: background poll never blanks the conversation with a spinner
    pollRef.current = setInterval(
      () => fetchMessages(activeConvId, true),
      5000,
    );
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

  // ── Actions ───────────────────────────────────────────────────────────────
  const selectConversation = (convId: string) => {
    setActiveConvId(convId);
    setInputValue("");
    setMobileView("thread");
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeConvId || sending) return;
    const content = inputValue.trim();
    setInputValue("");
    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        content,
        senderId: currentUserId ?? "me",
        createdAt: new Date().toISOString(),
      },
    ]);
    const { data, error } = await apiCall<{ message: Message }>(
      `/messaging/conversations/${activeConvId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    );
    setSending(false);
    if (error) {
      toast.error("Message non envoyé. Réessaie.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputValue(content);
      return;
    }
    if (data?.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? data.message : m)),
      );
      fetchConversations();
    }
  };

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
      if (!error) setSearchResults(data?.users ?? []);
    }, 400);
  };

  const startDM = async (userId: string) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    const { data, error } = await apiCall<{ conversation: { id: string } }>(
      "/messaging/conversations/direct",
      { method: "POST", body: JSON.stringify({ userId }) },
    );
    if (error) {
      toast.error("Impossible de démarrer la conversation");
      return;
    }
    const convId = data?.conversation?.id;
    if (!convId) return;
    await fetchConversations();
    selectConversation(convId);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const systemNotifs = getSystemNotifs(hiveId);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-20 flex flex-col"
      style={{ background: "#0D0A06" }}
    >
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: `linear-gradient(180deg, ${T.leather.light} 0%, ${T.leather.dark} 100%)`,
          borderBottom: `2px solid ${T.leather.tan}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {mobileView === "thread" && activeTab === "messages" && (
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
        <span style={{ fontSize: 22 }}>{hiveIcon}</span>
        <div className="flex-1">
          <h1
            className="font-bold text-base leading-tight"
            style={{
              color: T.gold.bright,
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            }}
          >
            {activeTab === "messages" && mobileView === "thread" && activeConv
              ? activeConv.otherUser.displayName ||
                activeConv.otherUser.username
              : activeTab === "messages"
                ? labels.messages
                : activeTab === "activity"
                  ? labels.activity
                  : activeTab === "followers"
                    ? labels.followers
                    : labels.system}
          </h1>
          <p className="text-xs" style={{ color: T.gold.dim }}>
            {activeTab === "messages" && mobileView === "thread" && activeConv
              ? `@${activeConv.otherUser.username}`
              : activeTab === "messages"
                ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
                : "Zyeuté"}
          </p>
        </div>
        {activeTab === "messages" && mobileView === "list" && (
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

      {/* ── Tab Bar ── */}
      <div
        className="flex border-b"
        style={{ borderColor: T.leather.tan, background: T.leather.dark }}
      >
        {(["messages", "activity", "followers", "system"] as TabId[]).map(
          (tab) => {
            const badge =
              tab === "messages"
                ? messagesUnread
                : tab === "activity"
                  ? activityUnread
                  : tab === "followers"
                    ? followersUnread
                    : 0;
            const label =
              tab === "messages"
                ? labels.messages
                : tab === "activity"
                  ? labels.activity
                  : tab === "followers"
                    ? labels.followers
                    : labels.system;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-bold relative transition-all"
                style={{
                  color: isActive ? T.gold.bright : T.gold.dim,
                  borderBottom: isActive
                    ? `2px solid ${T.gold.bright}`
                    : "2px solid transparent",
                }}
              >
                {label}
                {badge > 0 && (
                  <span
                    className="absolute top-1.5 right-1/4 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                    style={{
                      background: T.gold.DEFAULT,
                      color: T.leather.dark,
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </button>
            );
          },
        )}
      </div>

      {/* ── Tab: MESSAGES ── */}
      {activeTab === "messages" && (
        <>
          {/* Search panel */}
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
              {!searching &&
                searchQuery.trim() &&
                searchResults.length === 0 && (
                  <p
                    className="px-4 pb-3 text-xs"
                    style={{ color: T.gold.dim }}
                  >
                    Aucun utilisateur trouvé pour «{searchQuery}»
                  </p>
                )}
            </div>
          )}

          <div
            className="flex flex-1 gap-3 p-3 md:p-4"
            style={{ minHeight: 0 }}
          >
            {/* Conversation list */}
            <div
              className={cn(
                "flex-shrink-0 flex flex-col",
                mobileView === "list" ? "flex w-full" : "hidden",
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

            {/* Message thread */}
            <div
              className={cn(
                "flex-1 flex flex-col",
                mobileView === "thread" ? "flex w-full" : "hidden",
                "md:flex",
              )}
              style={{ minHeight: 0 }}
            >
              <LeatherPanel
                className="flex-1 flex flex-col overflow-hidden"
                style={{ minHeight: 0 }}
              >
                {!activeConvId ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <span style={{ fontSize: 48 }}>{hiveIcon}</span>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: T.gold.DEFAULT,
                        textShadow: "0 0 20px rgba(212,175,55,0.4)",
                      }}
                    >
                      {labels.messages}
                    </p>
                    <p className="text-sm" style={{ color: T.gold.dim }}>
                      Sélectionne une conversation ou démarre un nouveau DM.
                    </p>
                  </div>
                ) : (
                  <>
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
                    <div
                      className="flex-1 overflow-y-auto px-4 py-4"
                      style={{
                        background: `linear-gradient(180deg, ${T.leather.dark} 0%, ${T.leather.medium}88 100%)`,
                      }}
                    >
                      {messagesLoading && messages.length === 0 ? (
                        // Only show spinner on first open when there are no messages yet
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
        </>
      )}

      {/* ── Tab: ACTIVITY ── */}
      {activeTab === "activity" && (
        <div className="flex-1 p-3">
          <LeatherPanel className="flex flex-col" style={{ minHeight: "60vh" }}>
            <div
              className="px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${T.leather.tan}` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: T.gold.dim }}
              >
                {labels.activity}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {activityLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: `${T.gold.DEFAULT} transparent transparent transparent`,
                    }}
                  />
                </div>
              ) : activityNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                  <span style={{ fontSize: 40 }}>🔥</span>
                  <p className="text-sm mt-3" style={{ color: T.gold.dim }}>
                    {hiveId === "brazil"
                      ? "Nenhuma atividade ainda."
                      : hiveId === "quebec"
                        ? "Aucune activité encore."
                        : "Sin actividad aún."}
                  </p>
                </div>
              ) : (
                activityNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/5 rounded-xl"
                    style={{ opacity: n.isRead ? 0.7 : 1 }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{
                        background: `linear-gradient(145deg, ${T.leather.medium}, ${T.leather.dark})`,
                        border: `2px solid ${T.leather.tan}`,
                      }}
                    >
                      {activityIcon(n.type)}
                    </div>
                    {n.fromUser && (
                      <Avatar
                        src={n.fromUser.avatarUrl}
                        alt={n.fromUser.username}
                        size="xs"
                        userId={n.fromUser.id}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: T.gold.bright }}>
                        <span className="font-bold">
                          {n.fromUser?.username ?? "Quelqu'un"}
                        </span>{" "}
                        <span style={{ color: T.gold.dim }}>
                          {activityLabel(n.type, hiveId)}
                        </span>
                      </p>
                      {n.message && (
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{ color: T.gold.dim }}
                        >
                          {n.message}
                        </p>
                      )}
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: T.leather.tan }}
                      >
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: T.gold.DEFAULT }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </LeatherPanel>
        </div>
      )}

      {/* ── Tab: FOLLOWERS ── */}
      {activeTab === "followers" && (
        <div className="flex-1 p-3">
          <LeatherPanel className="flex flex-col" style={{ minHeight: "60vh" }}>
            <div
              className="px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${T.leather.tan}` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: T.gold.dim }}
              >
                {labels.followers}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {followersLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: `${T.gold.DEFAULT} transparent transparent transparent`,
                    }}
                  />
                </div>
              ) : followerNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                  <span style={{ fontSize: 40 }}>👥</span>
                  <p className="text-sm mt-3" style={{ color: T.gold.dim }}>
                    {hiveId === "brazil"
                      ? "Nenhum novo seguidor ainda."
                      : hiveId === "quebec"
                        ? "Aucun nouvel abonné encore."
                        : "Sin nuevos seguidores aún."}
                  </p>
                </div>
              ) : (
                followerNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/5 rounded-xl"
                    style={{ opacity: n.isRead ? 0.7 : 1 }}
                  >
                    {n.fromUser && (
                      <Avatar
                        src={n.fromUser.avatarUrl}
                        alt={n.fromUser.username}
                        size="sm"
                        userId={n.fromUser.id}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: T.gold.bright }}>
                        <span className="font-bold">
                          {n.fromUser?.username ?? "Quelqu'un"}
                        </span>{" "}
                        <span style={{ color: T.gold.dim }}>
                          {hiveId === "brazil"
                            ? "começou a te seguir"
                            : hiveId === "quebec"
                              ? "a commencé à te suivre"
                              : "comenzó a seguirte"}
                        </span>
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: T.leather.tan }}
                      >
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: T.gold.DEFAULT }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </LeatherPanel>
        </div>
      )}

      {/* ── Tab: SYSTEM ── */}
      {activeTab === "system" && (
        <div className="flex-1 p-3">
          <LeatherPanel className="flex flex-col" style={{ minHeight: "60vh" }}>
            <div
              className="px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${T.leather.tan}` }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: T.gold.dim }}
              >
                {labels.system}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {systemNotifs.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-4 border-b transition-all hover:bg-white/5"
                  style={{ borderColor: `${T.leather.tan}33` }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{
                      background: `linear-gradient(145deg, ${T.leather.medium}, ${T.leather.dark})`,
                      border: `2px solid ${T.gold.DEFAULT}44`,
                    }}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold"
                      style={{ color: T.gold.bright }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: T.gold.dim }}
                    >
                      {n.body}
                    </p>
                    <p
                      className="text-[10px] mt-1.5"
                      style={{ color: T.leather.tan }}
                    >
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </LeatherPanel>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default MessagesReal;
