/**
 * 🧳 TiGuyLeatherChat — Leather Wallet Chat UI for Ti-Guy
 *
 * Premium hand-stitched leather UI with gold accents, belt buckle input,
 * and purple Ti-Guy AI bubbles. Inspired by Quebec craftsmanship.
 *
 * Features:
 * - Leather texture background with gold stitching
 * - Belt buckle send button
 * - Purple Ti-Guy bot bubbles
 * - Dropdown mode switcher (DM / Group / Hive)
 * - 2K likes milestone trigger for mode unlock
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────
interface ChatMessage {
    id: number;
    type: "user" | "ti-guy" | "system";
    text: string;
    timestamp: string;
    skill?: string;
}

type ChatMode = "dm" | "group" | "hive";

interface TiGuyLeatherChatProps {
    /** User's total like count — unlocks group/hive modes at 2000 */
    userLikeCount?: number;
    /** Called when sending a message to the backend */
    onSendMessage?: (message: string, mode: ChatMode) => Promise<string>;
    /** Whether the chat panel is visible */
    isOpen?: boolean;
    /** Toggle chat open/closed */
    onToggle?: () => void;
}

// ── Constants ──────────────────────────────────────────────
const TIGUY_GREETINGS = [
    "Ayoye! Chus Ti-Guy, ton chum d'IA! 🦫⚜️",
    "Salut là! Ti-Guy est dans place! Qu'est-ce tu veux? 🔥",
    "Eille! Le Grand Castor est prêt à t'aider! 🐿️",
];

const MODE_CONFIG: Record<ChatMode, { label: string; icon: string; minLikes: number }> = {
    dm: { label: "Message Direct", icon: "💬", minLikes: 0 },
    group: { label: "Chat de Groupe", icon: "👥", minLikes: 2000 },
    hive: { label: "La Ruche", icon: "🐝", minLikes: 2000 },
};

// ── Component ──────────────────────────────────────────────
export function TiGuyLeatherChat({
    userLikeCount = 0,
    onSendMessage,
    isOpen = false,
    onToggle,
}: TiGuyLeatherChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            type: "ti-guy",
            text: TIGUY_GREETINGS[Math.floor(Math.random() * TIGUY_GREETINGS.length)],
            timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>("dm");
    const [showModeMenu, setShowModeMenu] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const canAccessMode = (mode: ChatMode) => userLikeCount >= MODE_CONFIG[mode].minLikes;

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now(),
            type: "user",
            text,
            timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            let response: string;
            if (onSendMessage) {
                response = await onSendMessage(text, chatMode);
            } else {
                // Fallback: call the Ti-Guy API directly
                const res = await fetch("/api/tiguy/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text, skill: "chat" }),
                });
                const data = await res.json();
                response = data.response || "Désolé, j'ai pas compris. Réessaye!";
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: "ti-guy",
                    text: response,
                    timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    type: "system",
                    text: "Oups! Problème de connexion. Réessaye! 🔧",
                    timestamp: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, chatMode, onSendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <style>{leatherStyles}</style>

            <div className="leather-chat-root">
                {/* ── Floating Beaver Coin Toggle ── */}
                <button
                    className="leather-coin"
                    onClick={onToggle}
                    aria-label="Ouvrir Ti-Guy"
                >
                    <span className="leather-coin-emoji">🦫</span>
                    <span className="leather-coin-label">TI-GUY</span>
                </button>

                {/* ── Chat Panel ── */}
                {isOpen && (
                    <div className="leather-panel">
                        {/* Header */}
                        <div className="leather-header">
                            <div className="leather-header-left">
                                <span className="leather-fleur">⚜️</span>
                                <div className="leather-header-title">
                                    <span className="leather-title-text">Conversation</span>
                                    <span className="leather-mode-badge">
                                        {MODE_CONFIG[chatMode].icon} {MODE_CONFIG[chatMode].label}
                                    </span>
                                </div>
                            </div>
                            <div className="leather-header-right">
                                {/* Mode Switcher */}
                                <button
                                    className="leather-gear-btn"
                                    onClick={() => setShowModeMenu(!showModeMenu)}
                                    aria-label="Changer de mode"
                                >
                                    ⚙️
                                </button>
                                <button
                                    className="leather-close-btn"
                                    onClick={onToggle}
                                    aria-label="Fermer"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Mode Dropdown */}
                            {showModeMenu && (
                                <div className="leather-mode-menu">
                                    {(Object.keys(MODE_CONFIG) as ChatMode[]).map((mode) => {
                                        const cfg = MODE_CONFIG[mode];
                                        const locked = !canAccessMode(mode);
                                        return (
                                            <button
                                                key={mode}
                                                className={`leather-mode-item ${chatMode === mode ? "active" : ""} ${locked ? "locked" : ""}`}
                                                onClick={() => {
                                                    if (!locked) {
                                                        setChatMode(mode);
                                                        setShowModeMenu(false);
                                                    }
                                                }}
                                                disabled={locked}
                                            >
                                                <span>{cfg.icon}</span>
                                                <span>{cfg.label}</span>
                                                {locked && (
                                                    <span className="leather-lock">
                                                        🔒 {cfg.minLikes.toLocaleString()} 🔥
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Chat Area */}
                        <div className="leather-chat-area">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`leather-msg leather-msg-${msg.type}`}>
                                    {msg.type === "ti-guy" && <span className="leather-msg-beaver">🦫</span>}
                                    <div className="leather-msg-content">
                                        {msg.type === "ti-guy" && (
                                            <span className="leather-msg-name">TI-GUY</span>
                                        )}
                                        <span className="leather-msg-text">{msg.text}</span>
                                        <span className="leather-msg-time">{msg.timestamp}</span>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="leather-msg leather-msg-ti-guy">
                                    <span className="leather-msg-beaver">🦫</span>
                                    <div className="leather-msg-content">
                                        <span className="leather-typing">
                                            <span className="leather-dot" />
                                            <span className="leather-dot" />
                                            <span className="leather-dot" />
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Footer / Input */}
                        <div className="leather-footer">
                            <div className="leather-buckle">
                                <div className="leather-buckle-inner">⚜️</div>
                            </div>
                            <input
                                ref={inputRef}
                                className="leather-input"
                                type="text"
                                placeholder="Écris ici..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                aria-label="Message"
                            />
                            <button
                                className="leather-send-btn"
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                aria-label="Envoyer"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ── Styles ─────────────────────────────────────────────────
const leatherStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Fira+Sans:wght@400;500;600&display=swap');

  :root {
    --lw-brown: #4a2c1f;
    --lw-dark: #2e1a12;
    --lw-gold-thread: #b8860b;
    --lw-gold-metal: #d4af37;
    --lw-purple: #5e2c73;
    --lw-purple-dark: #3a1848;
  }

  /* ── Root ── */
  .leather-chat-root {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    font-family: 'Fira Sans', sans-serif;
  }

  /* ── Floating Coin ── */
  .leather-coin {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fde68a, #b8860b 55%, #4a2c1f);
    border: 3px solid var(--lw-gold-metal);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 0 0 rgba(212,175,55,0.4), 0 8px 32px rgba(0,0,0,0.5);
  }
  .leather-coin:hover {
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(212,175,55,0.15), 0 12px 40px rgba(0,0,0,0.6);
  }
  .leather-coin-emoji { font-size: 28px; }
  .leather-coin-label {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    font-weight: 700;
    color: var(--lw-gold-metal);
    letter-spacing: 0.12em;
    white-space: nowrap;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    font-family: 'Cinzel', serif;
  }

  /* ── Panel ── */
  .leather-panel {
    position: fixed;
    bottom: 110px;
    right: 28px;
    width: 375px;
    height: 640px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 140px);
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 4px solid var(--lw-dark);
    box-shadow:
      0 32px 80px rgba(0,0,0,0.7),
      inset 0 0 60px rgba(0,0,0,0.3),
      0 0 0 1px rgba(212,175,55,0.1);
    animation: leatherPanelIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: bottom right;
    /* Leather texture via CSS gradient layers */
    background:
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      ),
      radial-gradient(ellipse at 30% 20%, #5c3a21 0%, #3d2314 40%, #2e1a12 70%, #1a0f08 100%);
  }
  @keyframes leatherPanelIn {
    from { opacity: 0; transform: scale(0.85) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Gold stitching border effect */
  .leather-panel::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 2px dashed var(--lw-gold-thread);
    border-radius: 18px;
    pointer-events: none;
    z-index: 1;
    opacity: 0.6;
  }

  /* ── Header ── */
  .leather-header {
    padding: 16px 20px 12px;
    background: linear-gradient(to bottom, var(--lw-brown), var(--lw-dark));
    border-bottom: 3px solid var(--lw-dark);
    flex-shrink: 0;
    position: relative;
    z-index: 2;
  }
  .leather-header::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 10px;
    right: 10px;
    height: 1px;
    border-bottom: 2px dashed var(--lw-gold-thread);
    opacity: 0.5;
  }
  .leather-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .leather-fleur {
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  }
  .leather-header-title {
    display: flex;
    flex-direction: column;
  }
  .leather-title-text {
    font-family: 'Cinzel', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--lw-gold-metal);
    text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
  }
  .leather-mode-badge {
    font-size: 10px;
    color: rgba(212,175,55,0.6);
    letter-spacing: 0.08em;
    margin-top: 2px;
  }
  .leather-header-right {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
  }
  .leather-gear-btn,
  .leather-close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    transition: transform 0.2s;
  }
  .leather-gear-btn:hover,
  .leather-close-btn:hover {
    transform: scale(1.15);
  }
  .leather-close-btn {
    color: var(--lw-gold-metal);
    font-size: 16px;
  }

  /* ── Mode Menu ── */
  .leather-mode-menu {
    position: absolute;
    top: 58px;
    right: 12px;
    background: linear-gradient(160deg, #3d2314, #2e1a12);
    border: 2px dashed var(--lw-gold-thread);
    border-radius: 12px;
    overflow: hidden;
    z-index: 10;
    min-width: 200px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.6);
    animation: menuIn 0.2s ease-out;
  }
  @keyframes menuIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .leather-mode-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    color: var(--lw-gold-metal);
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
    font-family: 'Fira Sans', sans-serif;
  }
  .leather-mode-item:hover:not(.locked) {
    background: rgba(212,175,55,0.1);
  }
  .leather-mode-item.active {
    background: rgba(212,175,55,0.15);
    font-weight: 600;
  }
  .leather-mode-item.locked {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .leather-lock {
    margin-left: auto;
    font-size: 11px;
    opacity: 0.7;
  }

  /* ── Chat Area ── */
  .leather-chat-area {
    flex: 1;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    z-index: 2;
    position: relative;
  }
  .leather-chat-area::-webkit-scrollbar {
    width: 4px;
  }
  .leather-chat-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .leather-chat-area::-webkit-scrollbar-thumb {
    background: rgba(212,175,55,0.3);
    border-radius: 2px;
  }

  /* ── Messages ── */
  .leather-msg {
    max-width: 78%;
    display: flex;
    gap: 8px;
    animation: msgIn 0.3s ease-out;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .leather-msg-user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  .leather-msg-ti-guy {
    align-self: flex-start;
  }
  .leather-msg-system {
    align-self: center;
    max-width: 90%;
  }

  .leather-msg-content {
    padding: 10px 16px;
    border-radius: 16px;
    position: relative;
    box-shadow: 2px 3px 8px rgba(0,0,0,0.3);
    border: 1.5px dashed transparent;
  }

  /* User bubble — dark brown leather */
  .leather-msg-user .leather-msg-content {
    background: linear-gradient(135deg, #5c3a21, #3d2314);
    border-color: rgba(184,134,11,0.3);
    border-bottom-right-radius: 4px;
    color: var(--lw-gold-metal);
  }

  /* Ti-Guy bubble — royal purple leather */
  .leather-msg-ti-guy .leather-msg-content {
    background: linear-gradient(135deg, var(--lw-purple), var(--lw-purple-dark));
    border-color: rgba(184,134,11,0.3);
    border-bottom-left-radius: 4px;
    color: var(--lw-gold-metal);
  }

  /* System bubble */
  .leather-msg-system .leather-msg-content {
    background: rgba(46,26,18,0.6);
    border-color: rgba(184,134,11,0.2);
    border-radius: 12px;
    text-align: center;
    color: rgba(212,175,55,0.7);
    font-size: 12px;
  }

  .leather-msg-beaver {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 4px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
  }
  .leather-msg-name {
    display: block;
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 700;
    color: rgba(212,175,55,0.8);
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }
  .leather-msg-text {
    display: block;
    font-size: 15px;
    line-height: 1.5;
  }
  .leather-msg-time {
    display: block;
    font-size: 10px;
    color: rgba(212,175,55,0.4);
    text-align: right;
    margin-top: 4px;
  }

  /* Typing indicator */
  .leather-typing {
    display: flex;
    gap: 4px;
    padding: 4px 0;
  }
  .leather-dot {
    width: 7px;
    height: 7px;
    background: var(--lw-gold-metal);
    border-radius: 50%;
    opacity: 0.4;
    animation: dotBounce 1.4s ease-in-out infinite;
  }
  .leather-dot:nth-child(2) { animation-delay: 0.2s; }
  .leather-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dotBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-6px); opacity: 1; }
  }

  /* ── Footer ── */
  .leather-footer {
    padding: 10px 12px;
    background: linear-gradient(to top, var(--lw-brown), var(--lw-dark));
    border-top: 3px solid var(--lw-dark);
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
  }
  .leather-footer::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 10px;
    right: 10px;
    height: 1px;
    border-top: 2px dashed var(--lw-gold-thread);
    opacity: 0.5;
  }

  /* Belt buckle */
  .leather-buckle {
    width: 52px;
    height: 44px;
    background: linear-gradient(135deg, var(--lw-gold-metal), #a8860b);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 3px 8px rgba(0,0,0,0.4);
    flex-shrink: 0;
    position: relative;
  }
  .leather-buckle::after {
    content: '';
    position: absolute;
    inset: 6px;
    background: var(--lw-dark);
    border-radius: 4px;
  }
  .leather-buckle-inner {
    position: relative;
    z-index: 1;
    font-size: 16px;
  }

  /* Input */
  .leather-input {
    flex: 1;
    height: 44px;
    background: var(--lw-dark);
    border: 2px dashed var(--lw-gold-thread);
    border-radius: 22px;
    padding: 0 18px;
    color: var(--lw-gold-metal);
    font-size: 15px;
    font-family: 'Fira Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .leather-input::placeholder {
    color: rgba(212,175,55,0.35);
  }
  .leather-input:focus {
    border-color: var(--lw-gold-metal);
    box-shadow: 0 0 0 3px rgba(212,175,55,0.1);
  }

  /* Send button */
  .leather-send-btn {
    width: 48px;
    height: 44px;
    background: linear-gradient(135deg, var(--lw-gold-metal), #a8860b);
    border-radius: 8px;
    border: none;
    color: var(--lw-dark);
    font-size: 20px;
    cursor: pointer;
    box-shadow: 2px 3px 8px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s, box-shadow 0.15s;
    flex-shrink: 0;
  }
  .leather-send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 2px 3px 12px rgba(0,0,0,0.5);
  }
  .leather-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Responsive ── */
  @media (max-width: 420px) {
    .leather-panel {
      width: calc(100vw - 16px);
      right: 8px;
      bottom: 100px;
      height: calc(100vh - 120px);
      border-radius: 20px;
    }
    .leather-chat-root {
      right: 8px;
      bottom: 16px;
    }
  }
`;

export default TiGuyLeatherChat;
