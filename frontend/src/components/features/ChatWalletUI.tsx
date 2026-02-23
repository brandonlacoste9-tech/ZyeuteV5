/**
 * ChatZyeute - Leather Wallet UI Design
 * ⚜️ Fleur-de-lis navigation hub (DMs, Chats, Media)
 * Stitched gold aesthetic with buckle typing area
 */

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// --- DESIGN TOKENS ---
const LEATHER_TOKENS = {
  // Leather textures
  leather: {
    dark: "#1A1510",
    medium: "#2A2018",
    light: "#3D3020",
    tan: "#8B6914",
  },
  // Gold accents
  gold: {
    dim: "#8B7355",
    DEFAULT: "#D4AF37",
    bright: "#F4D03F",
    shimmer: "#FFF8DC",
  },
  // Stitching
  stitch: {
    color: "#D4AF37",
    spacing: "8px",
    width: "2px",
  },
  // Shadows for depth
  shadow: {
    inner: "inset 0 2px 4px rgba(0,0,0,0.5)",
    outer: "0 4px 8px rgba(0,0,0,0.4)",
    gold: "0 0 20px rgba(212,175,55,0.3)",
  },
};

// --- NAV TAB TYPE ---
type NavTab = "dm" | "chats" | "media";

interface NavItem {
  id: NavTab;
  label: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dm", label: "Messages Directs", icon: "💬", description: "Chat privé 1 à 1" },
  { id: "chats", label: "Chats de Groupe", icon: "👥", description: "Discussions de groupe" },
  { id: "media", label: "Médias Partagés", icon: "📸", description: "Photos, vidéos, fichiers" },
];

// --- COMPONENTS ---

/**
 * LeatherPanel - Main container with stitched border
 */
const LeatherPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "medium" | "light";
}> = ({ children, className, variant = "dark" }) => {
  const bgColors = {
    dark: LEATHER_TOKENS.leather.dark,
    medium: LEATHER_TOKENS.leather.medium,
    light: LEATHER_TOKENS.leather.light,
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl",
        "border-2 border-[#3D3020]",
        className
      )}
      style={{
        background: `linear-gradient(145deg, ${bgColors[variant]} 0%, ${LEATHER_TOKENS.leather.dark} 100%)`,
        boxShadow: `${LEATHER_TOKENS.shadow.outer}, ${LEATHER_TOKENS.shadow.inner}`,
      }}
    >
      {/* Stitched border effect */}
      <div
        className="absolute inset-2 rounded-xl pointer-events-none"
        style={{
          border: `${LEATHER_TOKENS.stitch.width} dashed ${LEATHER_TOKENS.stitch.color}`,
          opacity: 0.6,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * FleurNavMenu - ⚜️ fleur-de-lis dropdown navigation hub
 */
const FleurNavMenu: React.FC<{
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ activeTab, onSelectTab, isOpen, onToggle }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onToggle]);

  return (
    <div ref={menuRef} className="relative">
      {/* ⚜️ Fleur-de-lis button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center transition-all duration-300"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(145deg, ${LEATHER_TOKENS.gold.DEFAULT}, ${LEATHER_TOKENS.gold.dim})`,
          border: `2px solid ${LEATHER_TOKENS.gold.bright}`,
          boxShadow: isOpen
            ? `0 0 20px ${LEATHER_TOKENS.gold.DEFAULT}80, ${LEATHER_TOKENS.shadow.outer}`
            : LEATHER_TOKENS.shadow.outer,
          transform: isOpen ? "rotate(15deg)" : "rotate(0deg)",
        }}
        aria-label="Navigation menu"
      >
        <span style={{ fontSize: 24, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>
          ⚜️
        </span>
      </button>

      {/* Dropdown menu — wallet clasp style */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-3 z-50 overflow-hidden"
          style={{
            width: 260,
            borderRadius: 16,
            background: `linear-gradient(180deg, ${LEATHER_TOKENS.leather.light} 0%, ${LEATHER_TOKENS.leather.dark} 100%)`,
            border: `2px solid ${LEATHER_TOKENS.gold.DEFAULT}`,
            boxShadow: `
              0 12px 24px rgba(0,0,0,0.6),
              0 0 30px ${LEATHER_TOKENS.gold.DEFAULT}20,
              inset 0 1px 2px rgba(255,255,255,0.1)
            `,
            animation: "walletOpen 0.25s ease-out",
          }}
        >
          {/* Stitched inner border */}
          <div
            className="absolute inset-2 rounded-xl pointer-events-none"
            style={{
              border: `1px dashed ${LEATHER_TOKENS.gold.dim}`,
              opacity: 0.4,
            }}
          />

          {/* Menu items */}
          <div className="relative z-10 py-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onToggle();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 transition-all duration-200"
                  style={{
                    background: isActive
                      ? `linear-gradient(90deg, ${LEATHER_TOKENS.gold.DEFAULT}15, transparent)`
                      : "transparent",
                    borderLeft: isActive
                      ? `3px solid ${LEATHER_TOKENS.gold.bright}`
                      : "3px solid transparent",
                  }}
                >
                  {/* Icon container */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive
                        ? `linear-gradient(145deg, ${LEATHER_TOKENS.gold.DEFAULT}, ${LEATHER_TOKENS.gold.dim})`
                        : LEATHER_TOKENS.leather.medium,
                      border: `1px solid ${isActive ? LEATHER_TOKENS.gold.bright : LEATHER_TOKENS.leather.tan}`,
                      boxShadow: isActive ? LEATHER_TOKENS.shadow.gold : "none",
                      fontSize: 18,
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Label */}
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isActive ? LEATHER_TOKENS.gold.bright : LEATHER_TOKENS.gold.dim,
                        margin: 0,
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: LEATHER_TOKENS.gold.dim,
                        margin: 0,
                        opacity: 0.7,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: LEATHER_TOKENS.gold.bright,
                        boxShadow: `0 0 8px ${LEATHER_TOKENS.gold.DEFAULT}`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer hint */}
          <div
            style={{
              padding: "8px 16px",
              borderTop: `1px solid ${LEATHER_TOKENS.leather.tan}`,
              background: LEATHER_TOKENS.leather.dark,
              borderRadius: "0 0 14px 14px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 11, color: LEATHER_TOKENS.gold.dim, margin: 0 }}>
              ⚜️ Zyeuté Messaging
            </p>
          </div>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes walletOpen {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

/**
 * GoldBuckle - The typing area styled as a leather belt buckle
 */
const GoldBuckle: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ value, onChange, onSend, placeholder, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full">
      {/* Belt strap background */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(180deg, 
            ${LEATHER_TOKENS.leather.medium} 0%, 
            ${LEATHER_TOKENS.leather.dark} 50%,
            ${LEATHER_TOKENS.leather.medium} 100%)`,
          boxShadow: LEATHER_TOKENS.shadow.inner,
        }}
      />

      {/* Stitching on belt */}
      <div
        className="absolute inset-1 rounded-full pointer-events-none"
        style={{
          border: `1px dashed ${LEATHER_TOKENS.gold.dim}`,
          opacity: 0.4,
        }}
      />

      {/* Main buckle container */}
      <div className="relative flex items-center gap-2 p-2">
        {/* Left buckle frame */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, 
              ${LEATHER_TOKENS.gold.DEFAULT} 0%, 
              ${LEATHER_TOKENS.gold.dim} 50%,
              ${LEATHER_TOKENS.gold.DEFAULT} 100%)`,
            boxShadow: `
              inset 0 1px 2px ${LEATHER_TOKENS.gold.shimmer},
              0 2px 4px rgba(0,0,0,0.4)
            `,
            border: `2px solid ${LEATHER_TOKENS.gold.bright}`,
          }}
        >
          <span className="text-2xl">⚜️</span>
        </div>

        {/* Input area (buckle tongue) */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyPress={(e) => e.key === "Enter" && onSend()}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full px-4 py-3 rounded-full",
              "bg-[#1A1510] text-[#F4D03F] placeholder-[#8B7355]",
              "border-2 transition-all duration-300",
              "focus:outline-none",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderColor: isFocused ? LEATHER_TOKENS.gold.bright : LEATHER_TOKENS.leather.tan,
              boxShadow: isFocused
                ? `0 0 15px ${LEATHER_TOKENS.gold.DEFAULT}40, inset 0 2px 4px rgba(0,0,0,0.5)`
                : "inset 0 2px 4px rgba(0,0,0,0.5)",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          />

          {/* Focus glow effect */}
          {isFocused && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
              style={{
                boxShadow: `0 0 20px ${LEATHER_TOKENS.gold.DEFAULT}30`,
              }}
            />
          )}
        </div>

        {/* Right buckle frame - Send button */}
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg",
            "flex items-center justify-center",
            "transition-all duration-200",
            !value.trim() && "opacity-50 cursor-not-allowed"
          )}
          style={{
            background: value.trim()
              ? `linear-gradient(145deg, 
                  ${LEATHER_TOKENS.gold.bright} 0%, 
                  ${LEATHER_TOKENS.gold.DEFAULT} 50%,
                  ${LEATHER_TOKENS.gold.dim} 100%)`
              : `linear-gradient(145deg, 
                  ${LEATHER_TOKENS.leather.light} 0%, 
                  ${LEATHER_TOKENS.leather.medium} 100%)`,
            boxShadow: value.trim()
              ? `0 0 15px ${LEATHER_TOKENS.gold.DEFAULT}, inset 0 1px 2px ${LEATHER_TOKENS.gold.shimmer}`
              : LEATHER_TOKENS.shadow.inner,
            border: `2px solid ${value.trim() ? LEATHER_TOKENS.gold.bright : LEATHER_TOKENS.leather.tan}`,
          }}
        >
          <svg
            className="w-6 h-6"
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

      {/* Belt holes decoration */}
      <div className="absolute left-20 top-1/2 -translate-y-1/2 flex gap-2 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: LEATHER_TOKENS.leather.dark,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * MessageBubble - Leather-stitched message container
 */
const MessageBubble: React.FC<{
  children: React.ReactNode;
  isMe?: boolean;
  isTIGuy?: boolean;
  timestamp?: string;
}> = ({ children, isMe, isTIGuy, timestamp }) => {
  return (
    <div
      className={cn(
        "relative max-w-[80%] rounded-2xl p-4",
        "mb-4",
        isMe && "ml-auto",
        !isMe && !isTIGuy && "mr-auto",
        isTIGuy && "mx-auto"
      )}
      style={{
        background: isMe
          ? `linear-gradient(145deg, ${LEATHER_TOKENS.gold.DEFAULT}20, ${LEATHER_TOKENS.gold.dim}10)`
          : isTIGuy
            ? `linear-gradient(145deg, #4A148C20, #311B9220)`
            : `linear-gradient(145deg, ${LEATHER_TOKENS.leather.medium}, ${LEATHER_TOKENS.leather.dark})`,
        border: isMe
          ? `2px solid ${LEATHER_TOKENS.gold.DEFAULT}`
          : isTIGuy
            ? "2px solid #7C3AED"
            : `2px solid ${LEATHER_TOKENS.leather.tan}`,
        boxShadow: `
          ${LEATHER_TOKENS.shadow.outer}
          ${isMe ? `, ${LEATHER_TOKENS.shadow.gold}` : ""}
        `,
      }}
    >
      {/* Inner stitching */}
      <div
        className="absolute inset-2 rounded-xl pointer-events-none"
        style={{
          border: `1px dashed ${isMe ? LEATHER_TOKENS.gold.dim : LEATHER_TOKENS.leather.tan}`,
          opacity: 0.5,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {isTIGuy && (
          <div className="flex items-center gap-2 mb-2 text-[#A78BFA]">
            <span className="text-lg">🦫</span>
            <span className="text-sm font-bold tracking-wider">TI-GUY</span>
          </div>
        )}

        <div
          className={cn(
            "text-[15px] leading-relaxed",
            isMe && "text-[#F4D03F]",
            !isMe && "text-[#D4C4A8]",
            isTIGuy && "text-[#E9D5FF]"
          )}
        >
          {children}
        </div>

        {timestamp && (
          <div className="mt-2 text-right">
            <span
              className="text-xs opacity-50"
              style={{ color: isMe ? LEATHER_TOKENS.gold.dim : LEATHER_TOKENS.leather.tan }}
            >
              {timestamp}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * WalletHeader - Leather wallet fold header with ⚜️ navigation
 */
const WalletHeader: React.FC<{
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  subtitle?: string;
  onSettings?: () => void;
}> = ({ activeTab, onSelectTab, subtitle, onSettings }) => {
  const [navOpen, setNavOpen] = useState(false);

  const tabLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "Conversation";

  return (
    <div
      className="relative rounded-t-2xl p-4 border-b-2"
      style={{
        background: `linear-gradient(180deg, 
          ${LEATHER_TOKENS.leather.light} 0%, 
          ${LEATHER_TOKENS.leather.medium} 50%,
          ${LEATHER_TOKENS.leather.dark} 100%)`,
        borderColor: LEATHER_TOKENS.leather.tan,
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)",
      }}
    >
      {/* Fold crease effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* ⚜️ Fleur-de-lis Navigation Hub — Top Left */}
          <FleurNavMenu
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            isOpen={navOpen}
            onToggle={() => setNavOpen(!navOpen)}
          />

          <div>
            <h2
              className="text-[#F4D03F] font-bold text-lg"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            >
              {tabLabel}
            </h2>
            {subtitle && <p className="text-[#8B7355] text-sm">{subtitle}</p>}
          </div>
        </div>

        {onSettings && (
          <button
            onClick={onSettings}
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{
              border: `1px solid ${LEATHER_TOKENS.leather.tan}`,
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: LEATHER_TOKENS.gold.DEFAULT }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * MediaGallery - Placeholder for shared media view
 */
const MediaGallery: React.FC = () => (
  <div
    className="flex-1 flex flex-col items-center justify-center p-8"
    style={{ color: LEATHER_TOKENS.gold.dim }}
  >
    <span style={{ fontSize: 48, marginBottom: 16 }}>📸</span>
    <p style={{ fontWeight: 700, fontSize: 16, color: LEATHER_TOKENS.gold.DEFAULT }}>
      Médias Partagés
    </p>
    <p style={{ fontSize: 13, textAlign: "center", marginTop: 8, opacity: 0.7 }}>
      Photos, vidéos et fichiers partagés dans cette conversation apparaîtront ici.
    </p>
  </div>
);

/**
 * Main Chat UI Component
 */
export const ChatWalletUI: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<NavTab>("dm");
  const [messages, setMessages] = useState([
    { id: 1, text: "Salut! Bienvenue dans la messagerie Zyeuté.", isMe: false, time: "14:30" },
    { id: 2, text: "Merci! L'interface est magnifique.", isMe: true, time: "14:31" },
    { id: 3, text: "🦫 Je suis là pour t'aider aussi!", isTIGuy: true, time: "14:32" },
  ]);

  const [groupMessages] = useState([
    { id: 10, text: "Bienvenue dans le groupe Québec Design!", isMe: false, time: "10:00" },
    { id: 11, text: "Merci! Content d'être ici.", isMe: true, time: "10:05" },
    { id: 12, text: "🦫 N'hésitez pas à poser vos questions au groupe!", isTIGuy: true, time: "10:06" },
  ]);

  const chatAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputValue,
      isMe: true,
      time: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }),
    };

    if (activeTab === "chats") {
      // In a real app, update groupMessages state
    }

    setMessages([...messages, newMsg]);
    setInputValue("");

    // Auto-scroll
    setTimeout(() => {
      chatAreaRef.current?.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const currentMessages = activeTab === "chats" ? groupMessages : messages;

  return (
    <div
      className="w-full max-w-md mx-auto h-[800px] p-4"
      style={{ background: "#0D0B08" }}
    >
      <LeatherPanel className="h-full flex flex-col overflow-hidden">
        {/* Header with ⚜️ navigation */}
        <WalletHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          subtitle={
            activeTab === "dm"
              ? "3 conversations"
              : activeTab === "chats"
                ? "2 groupes actifs"
                : "12 fichiers partagés"
          }
          onSettings={() => console.log("Settings")}
        />

        {/* Content area — switches based on active tab */}
        {activeTab === "media" ? (
          <MediaGallery />
        ) : (
          <>
            {/* Messages area */}
            <div
              ref={chatAreaRef}
              className="flex-1 overflow-y-auto p-4 space-y-2"
              style={{
                background: `linear-gradient(180deg, ${LEATHER_TOKENS.leather.dark} 0%, ${LEATHER_TOKENS.leather.medium} 100%)`,
              }}
            >
              {currentMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  isMe={msg.isMe}
                  isTIGuy={(msg as any).isTIGuy}
                  timestamp={msg.time}
                >
                  {msg.text}
                </MessageBubble>
              ))}
            </div>

            {/* Buckle typing area */}
            <div
              className="p-4 border-t-2"
              style={{
                borderColor: LEATHER_TOKENS.leather.tan,
                background: LEATHER_TOKENS.leather.dark,
              }}
            >
              <GoldBuckle
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                placeholder={
                  activeTab === "dm"
                    ? "Écris ton message..."
                    : "Message au groupe..."
                }
              />
            </div>
          </>
        )}
      </LeatherPanel>
    </div>
  );
};

export default ChatWalletUI;
