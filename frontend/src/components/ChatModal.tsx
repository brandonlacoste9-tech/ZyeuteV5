/**
 * ChatModal.tsx
 * SOVEREIGN LEATHER & GOLD - Louis Vuitton x Québec Aesthetic
 * Luxury chat interface with deep brown leather, gold Fleur-de-lis, and regal typography
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IoCloseOutline,
  IoSend,
  IoMenuOutline,
  IoImageOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useHaptics } from "@/hooks/useHaptics";
import { tiguyService } from "@/services/tiguyService";
import type { ChatMessage } from "@/types/chat";
import { toast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import { getTiGuyWelcomeMessage } from "@/utils/tiGuyResponses";

interface ChatModalProps {
  onClose: () => void;
}

// Fleur-de-lis SVG pattern for background
const FLEUR_DE_LIS_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.15'%3E%3Cpath d='M30 5c0-2.76-2.24-5-5-5s-5 2.24-5 5c0 1.38.56 2.63 1.46 3.54L20 12l-1.46-3.46C17.56 7.63 17 6.38 17 5c0-2.76-2.24-5-5-5S7 2.24 7 5c0 1.38.56 2.63 1.46 3.54L10 15l5.54 1.46C17.38 17.56 18.62 18 20 18s2.62-.44 4.46-1.54L30 15l1.54-6.46C33.38 7.56 34.62 7 36 7c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5c0 1.38.56 2.63 1.46 3.54L28 12l-1.46-3.46C25.56 7.63 25 6.38 25 5c0-2.76-2.24-5-5-5s-5 2.24-5 5c0 1.38.56 2.63 1.46 3.54L18 12l5.54 1.46C25.38 14.56 26.62 15 28 15s2.62-.44 4.46-1.54L38 12l1.54-6.46C41.38 4.56 42.62 4 44 4c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// Tiny Gold Beaver Icon SVG
const BeaverSealIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
      fill="#d4af37"
      stroke="#d4af37"
      strokeWidth="1.5"
    />
    {/* Simplified beaver shape */}
    <circle cx="12" cy="10" r="3" fill="#d4af37" opacity="0.8" />
    <ellipse cx="10" cy="8" rx="1" ry="1.5" fill="#b8860b" />
    <ellipse cx="14" cy="8" rx="1" ry="1.5" fill="#b8860b" />
    <path
      d="M8 14 Q12 16 16 14"
      stroke="#d4af37"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Piasse Gold Coin Component
const PiasseCoin = ({ pulsing = true }: { pulsing?: boolean }) => (
  <div
    className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#d4af37] shadow-lg",
      pulsing && "animate-pulse"
    )}
    style={{
      background:
        "radial-gradient(circle, #d4af37 0%, #b8860b 50%, #8b6914 100%)",
      boxShadow: "0 0 15px rgba(212, 175, 55, 0.5), inset 0 0 10px rgba(0,0,0,0.3)",
    }}
  >
    <span className="text-[10px] font-bold text-black">₱</span>
  </div>
);

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showDMMenu, setShowDMMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animations & Welcome
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    setMessages([getTiGuyWelcomeMessage()]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClose = () => {
    impact();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `${msg.sender}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== "string") e.preventDefault();
    const text = typeof e === "string" ? e : inputText.trim();

    if (!text || isTyping) return;

    tap();

    if (typeof e !== "string") {
      addMessage({ sender: "user", text: text });
      setInputText("");
    } else {
      addMessage({ sender: "user", text: text });
    }

    setIsTyping(true);

    try {
      const response = await tiguyService.sendMessage(text);
      // Handle both { response: string } and direct string responses
      const responseText = typeof response === "string" ? response : response.response || response.message || "Je n'ai pas de réponse pour ça, tsé?";
      addMessage({ sender: "tiGuy", text: responseText });
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Erreur de connexion. Réessaie!");
      addMessage({
        sender: "tiGuy",
        text: "Oups, j'ai eu un p'tit problème de connexion là! 🦫 Réessaie dans une minute, tsé?",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      addMessage({ sender: "user", text: "📎 Fichier attaché", image: imageUrl });
    };
    reader.readAsDataURL(file);
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-md h-[90vh] max-h-[800px] rounded-lg overflow-hidden shadow-2xl transform transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#3d2b1f", // Deep Leather Brown
          backgroundImage: FLEUR_DE_LIS_PATTERN,
          border: "3px solid #d4af37", // Gold border
          boxShadow:
            "0 0 40px rgba(0,0,0,0.9), 0 0 20px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* SOVEREIGN HEADER */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b-2 border-[#d4af37]/30"
          style={{
            background:
              "linear-gradient(180deg, rgba(61, 43, 31, 0.95) 0%, rgba(45, 32, 22, 0.95) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Left: Hamburger Menu + Piasse Coin */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDMMenu(!showDMMenu)}
              className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
              style={{ color: "#d4af37" }}
            >
              <IoMenuOutline className="w-6 h-6" />
            </button>
            <PiasseCoin pulsing={true} />
          </div>

          {/* Center: TI-GUY in Bold Serif */}
          <h2
            className="text-2xl font-bold tracking-wider"
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              color: "#d4af37",
              textShadow: "0 2px 8px rgba(212, 175, 55, 0.5), 0 0 20px rgba(212, 175, 55, 0.3)",
              letterSpacing: "0.1em",
            }}
          >
            TI-GUY
          </h2>

          {/* Right: Close Button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
            style={{ color: "#d4af37" }}
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        {/* MESSAGES - NO BUBBLES, DIRECT ON LEATHER */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            background: "#3d2b1f",
            backgroundImage: FLEUR_DE_LIS_PATTERN,
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Tiny Gold Beaver for Ti-Guy messages */}
              {message.sender === "tiGuy" && (
                <div className="flex-shrink-0 mt-1">
                  <BeaverSealIcon className="w-6 h-6 drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]" />
                </div>
              )}

              {/* Message Text - BOLD GOLD INK, NO BUBBLE */}
              <div
                className={cn(
                  "flex-1",
                  message.sender === "tiGuy" && "border-l-2 pl-3",
                  message.sender === "user" && "border-r-2 pr-3 text-right"
                )}
                style={{
                  borderColor: message.sender === "tiGuy" ? "#d4af37" : "transparent",
                }}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="rounded-lg mb-2 max-w-full"
                  />
                )}
                <p
                  className="leading-relaxed"
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: message.sender === "tiGuy" ? "#d4af37" : "#f5f5dc",
                    textShadow:
                      message.sender === "tiGuy"
                        ? "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(212, 175, 55, 0.3)"
                        : "0 2px 4px rgba(0,0,0,0.8)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {message.text}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <BeaverSealIcon className="w-6 h-6 drop-shadow-[0_0_5px_rgba(212,175,55,0.8)] animate-pulse" />
              </div>
              <div className="flex-1 border-l-2 pl-3" style={{ borderColor: "#d4af37" }}>
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: "#d4af37",
                      animationDelay: "0ms",
                    }}
                  />
                  <span
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: "#d4af37",
                      animationDelay: "150ms",
                    }}
                  />
                  <span
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{
                      backgroundColor: "#d4af37",
                      animationDelay: "300ms",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SOVEREIGN INPUT - GOLD-BORDERED LEATHER STRIP */}
        <div
          className="p-4 border-t-2"
          style={{
            background:
              "linear-gradient(180deg, rgba(45, 32, 22, 0.95) 0%, rgba(61, 43, 31, 0.95) 100%)",
            borderColor: "#d4af37",
            boxShadow: "0 -5px 20px rgba(0,0,0,0.5)",
          }}
        >
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3"
            style={{
              border: "2px solid #d4af37",
              borderRadius: "12px",
              padding: "12px",
              background: "rgba(61, 43, 31, 0.8)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5), 0 0 10px rgba(212, 175, 55, 0.2)",
            }}
          >
            {/* Left: Character Switch + File Attach */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
                style={{ color: "#d4af37" }}
                title="Changer de personnage"
              >
                <IoSwapHorizontalOutline className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
                style={{ color: "#d4af37" }}
                title="Joindre un fichier"
              >
                <IoImageOutline className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Jase avec moi..."
              className="flex-1 bg-transparent outline-none"
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#d4af37",
                fontFamily: "'Inter', sans-serif",
              }}
            />

            {/* Right: Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              style={{
                background:
                  inputText.trim() && !isTyping
                    ? "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)"
                    : "rgba(212, 175, 55, 0.3)",
                boxShadow:
                  inputText.trim() && !isTyping
                    ? "0 0 15px rgba(212, 175, 55, 0.5)"
                    : "none",
              }}
            >
              <IoSend className="w-5 h-5" style={{ color: "#000" }} />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
