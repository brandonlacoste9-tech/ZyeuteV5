/**
 * Ti-Guy Messaging — Full Screen Voyageur Edition
 * Stitched leather brown, gold accents, beaver mascot, mail envelope tab
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { apiCall } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4E2A6";
const GOLD_DIM = "#A07820";
const LEATHER_DARKEST = "#0F0804";
const LEATHER_DARK = "#1A0F0A";
const LEATHER_MID = "#2C1810";
const LEATHER_WARM = "#3D2418";
const LEATHER_LIGHT = "#5C3520";
const LEATHER_TAN = "#7A4A2A";
const BUBBLE_USER = "#4A2C1A";
const BUBBLE_TG =
  "linear-gradient(135deg, #5B3A8A 0%, #7B4E9A 50%, #943D6A 100%)";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = "tiguy" | "inbox" | "thread";

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
}

interface ChatMsg {
  id: string;
  from: "user" | "tiguy";
  text: string;
}

export interface TiGuyMessagingProps {
  open: boolean;
  onClose: () => void;
}

// ─── Stitch border CSS injected once ─────────────────────────────────────────
const STITCH_STYLE = `
.tg-panel-header {
  position: relative;
}
/* Outer gold frame */
.tg-panel-header::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 12px;
  border: 2px solid rgba(212,175,55,0.55);
  pointer-events: none;
  z-index: 1;
}
/* Inner dashed stitch */
.tg-panel-header::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 9px;
  border: 1.5px dashed rgba(212,175,55,0.30);
  pointer-events: none;
  z-index: 1;
}
`;

// ─── SVG icons ───────────────────────────────────────────────────────────────
function BeaverIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Body */}
      <ellipse cx="32" cy="38" rx="18" ry="14" fill="#7A4A2A" />
      {/* Head */}
      <ellipse cx="32" cy="22" rx="14" ry="12" fill="#8B5530" />
      {/* Ears */}
      <ellipse cx="20" cy="13" rx="5" ry="6" fill="#7A4A2A" />
      <ellipse cx="44" cy="13" rx="5" ry="6" fill="#7A4A2A" />
      <ellipse cx="20" cy="13" rx="3" ry="4" fill="#C47A5A" />
      <ellipse cx="44" cy="13" rx="3" ry="4" fill="#C47A5A" />
      {/* Eyes */}
      <circle cx="26" cy="21" r="3.5" fill="#1A0F0A" />
      <circle cx="38" cy="21" r="3.5" fill="#1A0F0A" />
      <circle cx="27" cy="20" r="1.2" fill="white" />
      <circle cx="39" cy="20" r="1.2" fill="white" />
      {/* Nose */}
      <ellipse cx="32" cy="27" rx="4" ry="2.5" fill="#3D1A10" />
      {/* Teeth */}
      <rect x="29" y="29" width="3" height="5" rx="1" fill="#F4E2A6" />
      <rect x="33" y="29" width="3" height="5" rx="1" fill="#F4E2A6" />
      {/* Tail */}
      <ellipse cx="32" cy="54" rx="12" ry="5" fill="#5C3520" />
      <ellipse cx="32" cy="54" rx="10" ry="3.5" fill="#4A2810" />
      {/* Gold fleur on chest */}
      <text x="27" y="42" fontSize="10" fill="#D4AF37">
        ⚜️
      </text>
    </svg>
  );
}

function EnvelopeIcon({ size = 26, gold }: { size?: number; gold: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="4"
        width="20"
        height="16"
        rx="3"
        fill={gold}
        opacity="0.15"
        stroke={gold}
        strokeWidth="1.5"
      />
      <path
        d="M2 7l10 7 10-7"
        stroke={gold}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Gold stitching dots on envelope */}
      <circle cx="5" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="7" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="9" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="15" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="17" cy="6" r="0.8" fill={gold} opacity="0.6" />
      <circle cx="19" cy="6" r="0.8" fill={gold} opacity="0.6" />
    </svg>
  );
}

function FleurIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22V11l-3 2 1-4 2-4 2 4 1 4-3-2v11z" />
      <path d="M12 7c-1.5 0-2.5-1.5-2-3 .5-1.5 2-2 2-2s1.5.5 2 2c.5 1.5-.5 3-2 3z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      className="w-5 h-5"
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
  );
}

function BackIcon({ gold }: { gold: string }) {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke={gold}
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function formatTime(iso: string) {
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

// ─── Main Component ───────────────────────────────────────────────────────────
export const TiGuyMessaging: React.FC<TiGuyMessagingProps> = ({
  open,
  onClose,
}) => {
  const { edgeLighting } = useTheme();
  const gold = edgeLighting || GOLD;

  const [tab, setTab] = useState<Tab>("tiguy");

  // Ti-Guy chat state
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Inbox state
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [convosLoading, setConvosLoading] = useState(false);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [dmMsgs, setDmMsgs] = useState<Message[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<
    Conversation["otherUser"][]
  >([]);
  const [searching, setSearching] = useState(false);
  const dmBottomRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // User info
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | undefined>();

  const totalUnread = convos.reduce((s, c) => s + (c.unreadCount || 0), 0);

  // Load user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setUserId(session.user.id);
      supabase
        .from("user_profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.username) setUsername(data.username);
        });
    });
  }, []);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setTab("tiguy");
      setChatMsgs([]);
      setActiveConvo(null);
      setDmMsgs([]);
      fetchConvos();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup realtime on close
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

  // Scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);
  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMsgs]);

  // ── Fetch convos ────────────────────────────────────────────────────────────
  const fetchConvos = useCallback(async () => {
    setConvosLoading(true);
    const { data } = await apiCall<{ conversations: Conversation[] }>(
      "/messaging/conversations",
    );
    setConvos(data?.conversations ?? []);
    setConvosLoading(false);
  }, []);

  // ── Ti-Guy send ─────────────────────────────────────────────────────────────
  const sendToTiGuy = useCallback(async () => {
    if (!chatInput.trim() || chatSending) return;
    const text = chatInput.trim();
    setChatInput("");
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, from: "user", text };
    setChatMsgs((p) => [...p, userMsg]);
    setChatSending(true);
    try {
      const history = chatMsgs.slice(-8).map((m) => ({
        sender: m.from === "user" ? "user" : "tiguy",
        text: m.text,
      }));
      const { data } = await apiCall<{ response: string }>("/tiguy/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history,
          context: { userId, username },
        }),
      });
      setChatMsgs((p) => [
        ...p,
        {
          id: `tg-${Date.now()}`,
          from: "tiguy",
          text: data?.response ?? "Osti, réessaye!",
        },
      ]);
    } catch {
      setChatMsgs((p) => [
        ...p,
        {
          id: `tg-err-${Date.now()}`,
          from: "tiguy",
          text: "Câlisse, chu tombé! Réessaye! 🦫",
        },
      ]);
    } finally {
      setChatSending(false);
    }
  }, [chatInput, chatSending, chatMsgs, userId, username]);

  // ── Open DM thread ──────────────────────────────────────────────────────────
  const openThread = useCallback(
    async (conv: Conversation) => {
      setActiveConvo(conv);
      setTab("thread");
      setDmMsgs([]);
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
      setDmMsgs(data?.messages ?? []);
      try {
        const ch = supabase
          .channel(`tg:conv:${conv.id}`)
          .on(
            "postgres_changes" as any,
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conv.id}`,
            },
            (payload: any) => {
              const m = payload.new as Message;
              setDmMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
            },
          )
          .subscribe();
        realtimeRef.current = ch;
      } catch {
        /* poll fallback */
      }
      pollRef.current = setInterval(async () => {
        const { data: d } = await apiCall<{ messages: Message[] }>(
          `/messaging/conversations/${conv.id}/messages`,
        );
        if (d?.messages) setDmMsgs(d.messages);
      }, 5000);
      setTimeout(() => fetchConvos(), 500);
    },
    [fetchConvos],
  );

  // ── Send DM ─────────────────────────────────────────────────────────────────
  const sendDM = useCallback(async () => {
    if (!dmInput.trim() || !activeConvo || dmSending) return;
    const content = dmInput.trim();
    setDmInput("");
    setDmSending(true);
    const optId = `opt-${Date.now()}`;
    setDmMsgs((p) => [
      ...p,
      {
        id: optId,
        content,
        senderId: userId ?? "me",
        createdAt: new Date().toISOString(),
      },
    ]);
    const { data, error } = await apiCall<{ message: Message }>(
      `/messaging/conversations/${activeConvo.id}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
    setDmSending(false);
    if (error) {
      setDmMsgs((p) => p.filter((m) => m.id !== optId));
      setDmInput(content);
      return;
    }
    if (data?.message) {
      setDmMsgs((p) => p.map((m) => (m.id === optId ? data.message : m)));
      fetchConvos();
    }
  }, [dmInput, activeConvo, dmSending, userId, fetchConvos]);

  // ── User search ─────────────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQ(q);
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

  const startDM = async (uid: string) => {
    setSearchQ("");
    setSearchResults([]);
    const { data } = await apiCall<{
      conversation?: { id: string };
      conversationId?: string;
    }>("/messaging/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ userId: uid }),
    });
    const cid = data?.conversation?.id ?? data?.conversationId;
    if (!cid) return;
    await fetchConvos();
    setConvos((prev) => {
      const found = prev.find((c) => c.id === cid);
      if (found) openThread(found);
      return prev;
    });
  };

  if (!open) return null;

  // ─── Shared header ──────────────────────────────────────────────────────────
  const renderHeader = () => (
    <div
      className="tg-panel-header flex-shrink-0 relative"
      style={{
        background: `linear-gradient(180deg, ${LEATHER_TAN} 0%, ${LEATHER_LIGHT} 30%, ${LEATHER_WARM} 100%)`,
        borderBottom: `3px solid ${gold}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.6), inset 0 -2px 0 ${LEATHER_DARKEST}`,
        paddingBottom: 2,
      }}
    >
      {/* Top bar: close + title */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl active:scale-90 transition-all"
          style={{
            background: `${LEATHER_DARKEST}80`,
            border: `1px solid ${gold}40`,
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke={gold}
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Center: beaver + title */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <BeaverIcon size={36} />
            <div>
              <h1
                className="text-xl font-black leading-none"
                style={{
                  color: gold,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  textShadow: `0 0 16px ${gold}80`,
                }}
              >
                Ti-Guy
              </h1>
              <p
                className="text-[0.5rem] uppercase tracking-[0.25em] opacity-70 font-bold"
                style={{ color: GOLD_LIGHT }}
              >
                Antigravity Gold ⚜️
              </p>
            </div>
          </div>
        </div>

        {/* Spacer to balance close button */}
        <div className="w-8" />
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 px-4 pb-3 relative z-10">
        {/* Ti-Guy tab */}
        <button
          type="button"
          onClick={() => setTab("tiguy")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95"
          style={{
            background:
              tab === "tiguy"
                ? `linear-gradient(135deg, ${gold}40, ${gold}20)`
                : `${LEATHER_DARKEST}60`,
            border: `1.5px solid ${tab === "tiguy" ? gold : gold + "30"}`,
            boxShadow: tab === "tiguy" ? `0 0 12px ${gold}30` : "none",
          }}
        >
          <span
            style={{ color: tab === "tiguy" ? gold : GOLD_DIM, fontSize: 18 }}
          >
            🦫
          </span>
          <span
            className="text-xs font-black tracking-wide"
            style={{ color: tab === "tiguy" ? gold : GOLD_DIM }}
          >
            Ti-Guy
          </span>
        </button>

        {/* Inbox tab */}
        <button
          type="button"
          onClick={() => setTab(tab === "thread" ? "thread" : "inbox")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all active:scale-95 relative"
          style={{
            background:
              tab !== "tiguy"
                ? `linear-gradient(135deg, ${gold}40, ${gold}20)`
                : `${LEATHER_DARKEST}60`,
            border: `1.5px solid ${tab !== "tiguy" ? gold : gold + "30"}`,
            boxShadow: tab !== "tiguy" ? `0 0 12px ${gold}30` : "none",
          }}
        >
          <EnvelopeIcon size={20} gold={tab !== "tiguy" ? gold : GOLD_DIM} />
          <span
            className="text-xs font-black tracking-wide"
            style={{ color: tab !== "tiguy" ? gold : GOLD_DIM }}
          >
            Messages
          </span>
          {totalUnread > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
              style={{
                background: gold,
                color: LEATHER_DARKEST,
                boxShadow: `0 0 8px ${gold}80`,
              }}
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Gold stitching line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${gold}60, transparent)`,
        }}
      />
    </div>
  );

  // ─── Ti-Guy chat content ────────────────────────────────────────────────────
  const renderTiGuy = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ background: LEATHER_DARK }}
      >
        {chatMsgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-70">
            <BeaverIcon size={64} />
            <p
              className="text-sm font-semibold text-center"
              style={{ color: GOLD_LIGHT }}
            >
              Allo! Chu Ti-Guy, ton concierge québécois. 🍁{"\n"}Jase avec moi!
            </p>
          </div>
        )}
        {chatMsgs.map((msg) =>
          msg.from === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm"
                style={{
                  background: BUBBLE_USER,
                  border: `1px solid ${gold}40`,
                  color: GOLD_LIGHT,
                }}
              >
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-start gap-2">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border"
                style={{ borderColor: gold, background: LEATHER_MID }}
              >
                <span className="text-xs font-black" style={{ color: gold }}>
                  TG
                </span>
              </div>
              <div
                className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm"
                style={{
                  background: BUBBLE_TG,
                  border: `1px solid ${gold}50`,
                  color: GOLD_LIGHT,
                  boxShadow: `0 0 10px ${gold}20`,
                }}
              >
                {msg.text}
              </div>
            </div>
          ),
        )}
        {chatSending && (
          <div className="flex items-start gap-2">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border"
              style={{ borderColor: gold, background: LEATHER_MID }}
            >
              <span className="text-xs font-black" style={{ color: gold }}>
                TG
              </span>
            </div>
            <div
              className="px-4 py-2.5 rounded-2xl rounded-bl-sm"
              style={{ background: BUBBLE_TG, border: `1px solid ${gold}50` }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: gold, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{
          background: `linear-gradient(180deg, ${LEATHER_WARM} 0%, ${LEATHER_LIGHT} 100%)`,
          borderTop: `2px solid ${gold}50`,
        }}
      >
        <div
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <FleurIcon size={18} />
        </div>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendToTiGuy()}
          placeholder="Jase avec Ti-Guy..."
          className="flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{
            background: LEATHER_DARKEST,
            border: `2px solid ${gold}50`,
            color: GOLD_LIGHT,
          }}
        />
        <button
          type="button"
          onClick={sendToTiGuy}
          disabled={!chatInput.trim() || chatSending}
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );

  // ─── Inbox content ──────────────────────────────────────────────────────────
  const renderInbox = () => (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: LEATHER_DARK }}
    >
      {/* New DM search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="🔍  Nouveau message — chercher un utilisateur..."
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{
            background: LEATHER_MID,
            border: `1.5px solid ${gold}40`,
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
            className="w-full flex items-center gap-3 px-2 py-2 mt-1 rounded-xl hover:bg-white/5 transition-all"
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
              <p className="text-xs opacity-60" style={{ color: GOLD_LIGHT }}>
                @{u.username}
              </p>
            </div>
          </button>
        ))}
        {/* Divider */}
        <div
          className="mt-2 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${gold}40, transparent)`,
          }}
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {convosLoading ? (
          <div className="flex items-center justify-center h-20">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{
                borderColor: `${gold} transparent transparent transparent`,
              }}
            />
          </div>
        ) : convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-60">
            <EnvelopeIcon size={36} gold={gold} />
            <p className="text-xs" style={{ color: GOLD_LIGHT }}>
              Aucune conversation. Démarre un nouveau DM!
            </p>
          </div>
        ) : (
          convos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openThread(c)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all active:scale-95"
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
                    style={{ background: gold, color: LEATHER_DARKEST }}
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

  // ─── Thread content ─────────────────────────────────────────────────────────
  const renderThread = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Thread header */}
      {activeConvo && (
        <div
          className="flex items-center gap-3 px-3 py-2.5 flex-shrink-0"
          style={{
            background: LEATHER_MID,
            borderBottom: `1px solid ${gold}30`,
          }}
        >
          <button
            type="button"
            onClick={() => setTab("inbox")}
            className="p-1.5 rounded-lg"
            aria-label="Retour"
          >
            <BackIcon gold={gold} />
          </button>
          <Avatar
            src={activeConvo.otherUser.avatar_url}
            alt={
              activeConvo.otherUser.display_name ||
              activeConvo.otherUser.username
            }
            size="xs"
            userId={activeConvo.otherUser.id}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: GOLD_LIGHT }}
            >
              {activeConvo.otherUser.display_name ||
                activeConvo.otherUser.username}
            </p>
            <p className="text-[10px] opacity-60" style={{ color: gold }}>
              @{activeConvo.otherUser.username}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ background: LEATHER_DARK }}
      >
        {dmMsgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-2 opacity-50">
            <p className="text-xs" style={{ color: GOLD_LIGHT }}>
              Aucun message encore. Dis bonjour!
            </p>
          </div>
        )}
        {dmMsgs.map((msg) => {
          const isMe = msg.senderId === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                style={{
                  background: isMe ? BUBBLE_USER : BUBBLE_TG,
                  border: `1px solid ${gold}40`,
                  color: GOLD_LIGHT,
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
        })}
        <div ref={dmBottomRef} />
      </div>

      {/* DM Input */}
      <div
        className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{
          background: `linear-gradient(180deg, ${LEATHER_WARM} 0%, ${LEATHER_LIGHT} 100%)`,
          borderTop: `2px solid ${gold}50`,
        }}
      >
        <div
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <FleurIcon size={18} />
        </div>
        <input
          type="text"
          value={dmInput}
          onChange={(e) => setDmInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendDM()}
          placeholder="Écris un message..."
          className="flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{
            background: LEATHER_DARKEST,
            border: `2px solid ${gold}50`,
            color: GOLD_LIGHT,
          }}
        />
        <button
          type="button"
          onClick={sendDM}
          disabled={!dmInput.trim() || dmSending}
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{
            background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
            border: `1px solid ${gold}`,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );

  // ─── Shell ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STITCH_STYLE}</style>
      <div
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ background: "rgba(0,0,0,0.92)" }}
        onClick={onClose}
      >
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${LEATHER_WARM} 0%, ${LEATHER_MID} 20%, ${LEATHER_DARK} 100%)`,
            border: `2px solid ${gold}30`,
            boxShadow: `inset 0 0 80px rgba(0,0,0,0.5)`,
            margin: "env(safe-area-inset-top) 0 0 0",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderHeader()}

          {tab === "tiguy" && renderTiGuy()}
          {tab === "inbox" && renderInbox()}
          {tab === "thread" && renderThread()}
        </div>
      </div>
    </>
  );
};

export default TiGuyMessaging;
