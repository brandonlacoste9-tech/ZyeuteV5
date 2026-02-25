/**
 * Ti-Guy Messaging Area – Voyageur Luxury
 * Leather + gold aesthetic, dropdown (DMs, Last Chats, File upload, etc.)
 */

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4E2A6";
const LEATHER_DARK = "#1A0F0A";
const LEATHER_MID = "#2C1810";
const LEATHER_STRAP = "#3D2418";
const LEATHER_LIGHT = "#4A2E20";
const BUBBLE_USER = "#5C4033";
const BUBBLE_TIGUY =
  "linear-gradient(135deg, #6B4C9E 0%, #8B5A9E 50%, #A64D7A 100%)";

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
      {/* Classic fleur-de-lys: center stem + three petals */}
      <path d="M12 22V11l-3 2 1-4 2-4 2 4 1 4-3-2v11z" />
      <path d="M12 7c-1.5 0-2.5-1.5-2-3 .5-1.5 2-2 2-2s1.5.5 2 2c.5 1.5-.5 3-2 3z" />
    </svg>
  );
}

export interface TiGuyMessagingProps {
  open: boolean;
  onClose: () => void;
}

export const TiGuyMessaging: React.FC<TiGuyMessagingProps> = ({
  open,
  onClose,
}) => {
  const { edgeLighting } = useTheme();
  const gold = edgeLighting || GOLD;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages] = useState<
    Array<{ id: string; from: "user" | "tiguy"; text: string }>
  >([
    { id: "1", from: "user", text: "Salut!" },
    { id: "2", from: "tiguy", text: "TI-GUY" },
    { id: "3", from: "user", text: "Merci!" },
  ]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  if (!open) return null;

  const menuItems = [
    { id: "dms", label: "Messages directs", icon: "✉️" },
    { id: "last", label: "Derniers jasettes", icon: "💬" },
    { id: "upload", label: "Joindre un fichier", icon: "📎" },
    { id: "sep", label: "", separator: true },
    { id: "groupes", label: "Groupes", icon: "👥" },
    { id: "contacts", label: "Contacts", icon: "📇" },
    { id: "recherche", label: "Recherche", icon: "🔍" },
    { id: "appel", label: "Appel vocal / vidéo", icon: "📞" },
    { id: "partager", label: "Partager du contenu", icon: "↗️" },
    { id: "options", label: "Options Ti-Guy", icon: "⚙️" },
  ];

  const handleMenuItem = (id: string) => {
    setDropdownOpen(false);
    if (id === "upload") {
      fileInputRef.current?.click();
    }
    // TODO: wire DMs, Last Chats, etc. to real routes/handlers
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background: `linear-gradient(180deg, ${LEATHER_STRAP} 0%, ${LEATHER_MID} 30%, ${LEATHER_DARK} 100%)`,
          border: `2px solid ${gold}40`,
          boxShadow: `0 0 30px ${gold}20, inset 0 0 60px rgba(0,0,0,0.4)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header – leather strap with fleur-de-lys, title, gear */}
        <div
          className="flex items-center justify-between px-4 py-3 relative"
          style={{
            background: `linear-gradient(180deg, ${LEATHER_LIGHT} 0%, ${LEATHER_STRAP} 100%)`,
            borderBottom: `2px solid ${gold}50`,
            boxShadow: `inset 0 1px 0 ${gold}20`,
          }}
        >
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="p-2 rounded-lg press-scale"
              style={{
                color: gold,
                filter: `drop-shadow(0 0 6px ${gold}80)`,
              }}
              aria-label="Menu Conversation"
              aria-expanded={dropdownOpen}
            >
              <FleurDeLysIcon size={28} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute left-0 top-full mt-2 z-50 min-w-[220px] rounded-xl overflow-hidden py-1"
                style={{
                  background: `linear-gradient(180deg, ${LEATHER_STRAP} 0%, ${LEATHER_MID} 100%)`,
                  border: `2px solid ${gold}50`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${gold}20`,
                }}
              >
                {menuItems.map((item) =>
                  item.separator ? (
                    <div
                      key={item.id}
                      className="my-1 h-px"
                      style={{ background: `${gold}40` }}
                    />
                  ) : (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMenuItem(item.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-black/20 transition-colors"
                      style={{ color: GOLD_LIGHT }}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
          <h2
            className="text-lg font-semibold"
            style={{
              color: gold,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              textShadow: `0 0 12px ${gold}60`,
            }}
          >
            Conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg press-scale"
            style={{ color: gold, filter: `drop-shadow(0 0 4px ${gold}60)` }}
            aria-label="Paramètres"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* Chat area – stitched border, scrollable bubbles */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
          style={{
            background: LEATHER_DARK,
            borderLeft: `1px solid ${gold}30`,
            borderRight: `1px solid ${gold}30`,
          }}
        >
          {messages.map((msg) =>
            msg.from === "user" ? (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md"
                  style={{
                    background: BUBBLE_USER,
                    border: `1px solid ${gold}40`,
                    color: GOLD_LIGHT,
                    boxShadow: `inset 0 0 20px rgba(0,0,0,0.2)`,
                  }}
                >
                  <span className="text-sm">{msg.text}</span>
                </div>
              </div>
            ) : (
              <div
                key={msg.id}
                className="flex justify-start items-start gap-2"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border"
                  style={{ borderColor: gold, background: LEATHER_MID }}
                >
                  <img
                    src="/zyeute-beaver.svg"
                    alt=""
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md"
                  style={{
                    background: BUBBLE_TIGUY,
                    border: `1px solid ${gold}50`,
                    color: gold,
                    boxShadow: `0 0 12px ${gold}30`,
                  }}
                >
                  <span className="text-sm font-semibold">{msg.text}</span>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Input bar – leather belt with buckle, fleur-de-lys, input, send */}
        <div
          className="flex items-center gap-2 p-3"
          style={{
            background: `linear-gradient(180deg, ${LEATHER_LIGHT} 0%, ${LEATHER_STRAP} 100%)`,
            borderTop: `2px solid ${gold}50`,
            boxShadow: `inset 0 1px 0 ${gold}20`,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf"
            onChange={() => {}}
          />
          {/* Buckle */}
          <div
            className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 40%, #8B6914 100%)`,
              border: `1px solid ${gold}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
            }}
          >
            <FleurDeLysIcon size={18} className="text-[#1A0F0A]" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="[Type here...]"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm placeholder:opacity-70"
            style={{
              background: LEATHER_DARK,
              border: `2px solid ${gold}50`,
              color: GOLD_LIGHT,
            }}
          />
          <button
            type="button"
            className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center press-scale"
            style={{
              background: `linear-gradient(145deg, ${GOLD_LIGHT} 0%, ${gold} 50%, #8B6914 100%)`,
              border: `1px solid ${gold}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.4)`,
            }}
            aria-label="Envoyer"
          >
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default TiGuyMessaging;
