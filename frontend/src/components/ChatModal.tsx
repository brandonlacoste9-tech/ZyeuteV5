/**
 * ChatModal.tsx
 * SOVEREIGN LEATHER & GOLD - Louis Vuitton x Québec Aesthetic
 * Matches exact mockup: Zyeuté branding, bubbles, toolbar, mic button
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IoCloseOutline,
  IoMenuOutline,
  IoHappyOutline,
  IoAttachOutline,
  IoCameraOutline,
  IoMicOutline,
  IoSparklesOutline,
  IoImagesOutline,
  IoDocumentOutline,
  IoSettingsOutline,
  IoEllipsisHorizontalOutline,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";
import { RiAlertFill } from "react-icons/ri";
import { useHaptics } from "@/hooks/useHaptics";
import { tiguyService } from "@/services/tiguyService";
import type { ChatMessage } from "@/types/chat";
import { toast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import { getTiGuyWelcomeMessage } from "@/utils/tiGuyResponses";
import { ChatMenuDropdown } from "@/components/ChatMenuDropdown";

interface ChatModalProps {
  onClose: () => void;
}

// Fleur-de-lis SVG pattern for background
const FLEUR_DE_LIS_PATTERN = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.08'%3E%3Cpath d='M40 20c-1.5-5-5-8-9-8s-7.5 3-9 8l3 7-3-7c-1.5-5-5-8-9-8s-7.5 3-9 8c0 4 2 7 5 9l8 3-8-3c-3-2-5-5-5-9 0-5 3-7.5 8-9s8 3 9 8l5 12 5-12c1-5 4-8 9-8s8 4 8 9c0 4-2 7-5 9l-8 3 8-3c3-2 5-5 5-9 0-5-3-7.5-8-9s-8 3-9 8l-3 7 3-7z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// Large Fleur-de-lis Header Emblem
const FleurDeLisEmblem = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 100 120"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]"
  >
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#f4e5c3", stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: "#d4af37", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#b8860b", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <g fill="url(#goldGrad)" stroke="#8b6914" strokeWidth="2">
      {/* Center petal */}
      <path d="M50 10 Q45 25 45 40 L45 70 Q45 80 50 85 Q55 80 55 70 L55 40 Q55 25 50 10 Z" />
      {/* Left petal */}
      <path d="M30 30 Q20 35 15 45 Q12 55 18 62 Q25 65 32 60 L45 50 Q40 40 30 30 Z" />
      {/* Right petal */}
      <path d="M70 30 Q80 35 85 45 Q88 55 82 62 Q75 65 68 60 L55 50 Q60 40 70 30 Z" />
      {/* Bottom curls */}
      <path d="M35 85 Q30 90 25 95 Q20 100 20 105 Q20 110 25 110 Q30 110 35 105 Z" />
      <path d="M65 85 Q70 90 75 95 Q80 100 80 105 Q80 110 75 110 Q70 110 65 105 Z" />
      {/* Center decoration */}
      <circle
        cx="50"
        cy="55"
        r="8"
        fill="#f4e5c3"
        stroke="#8b6914"
        strokeWidth="1.5"
      />
    </g>
  </svg>
);

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isTyping) return;

    tap();
    addMessage({ sender: "user", text });
    setInputText("");
    setIsTyping(true);

    try {
      const response = await tiguyService.sendMessage(text);
      const responseText =
        typeof response === "string"
          ? response
          : response.response ||
            response.message ||
            "Je n'ai pas de réponse pour ça, tsé?";
      addMessage({ sender: "tiGuy", text: responseText });
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Erreur de connexion. Réessaie!");
      addMessage({
        sender: "tiGuy",
        text: "[clawdbot] ⚠️ Agent failed before reply: Unknown model, ollama/gemma2:2b.\nLogs: clawdbot logs --follow",
        isError: true,
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
      addMessage({
        sender: "user",
        text: "📎 Fichier attaché",
        image: imageUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* PHONE FRAME */}
      <div
        className={cn(
          "relative w-full max-w-md h-[90vh] max-h-[800px] rounded-[32px] overflow-hidden shadow-2xl transform transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#2b1f17", // Deep charcoal leather
          backgroundImage: FLEUR_DE_LIS_PATTERN,
          border: "4px solid #d4af37",
          boxShadow:
            "0 0 50px rgba(212, 175, 55, 0.6), 0 0 100px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(0,0,0,0.5)",
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b-2 border-[#d4af37]/40"
          style={{
            background:
              "linear-gradient(180deg, rgba(43, 31, 23, 0.98) 0%, rgba(35, 25, 18, 0.98) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Left: Hamburger Menu */}
          <button
            onClick={() => {
              tap();
              setIsMenuOpen(true);
            }}
            className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
            style={{ color: "#d4af37" }}
          >
            <IoMenuOutline className="w-7 h-7" />
          </button>

          {/* Center: Fleur-de-lis + Zyeuté */}
          <div className="flex flex-col items-center gap-1">
            <FleurDeLisEmblem />
            <div className="flex items-center gap-2">
              <div
                className="h-px w-8"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #d4af37, transparent)",
                }}
              />
              <h2
                className="text-xl font-bold tracking-[0.2em]"
                style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  color: "#d4af37",
                  textShadow:
                    "0 2px 8px rgba(212, 175, 55, 0.6), 0 0 20px rgba(212, 175, 55, 0.4)",
                }}
              >
                Zyeuté
              </h2>
              <div
                className="h-px w-8"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #d4af37, transparent)",
                }}
              />
            </div>
          </div>

          {/* Right: Close Button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
            style={{ color: "#d4af37" }}
          >
            <IoCloseOutline className="w-7 h-7" />
          </button>
        </div>

        {/* MESSAGES AREA */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{
            background: "#2b1f17",
            backgroundImage: FLEUR_DE_LIS_PATTERN,
            maxHeight: "calc(100% - 220px)",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col",
                message.sender === "user" ? "items-end" : "items-start",
              )}
            >
              {/* MESSAGE BUBBLE */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-lg",
                  message.sender === "user" && "rounded-br-sm",
                  message.sender === "tiGuy" && "rounded-bl-sm",
                )}
                style={{
                  background:
                    message.sender === "user"
                      ? message.isError
                        ? "rgba(50, 35, 25, 0.95)" // Dark for errors
                        : "rgba(60, 45, 35, 0.85)" // Light gold fill
                      : "rgba(25, 18, 12, 0.95)", // Dark for bot
                  border:
                    message.sender === "user"
                      ? "2px solid #d4af37"
                      : "2px solid #5a4a3a",
                  boxShadow:
                    message.sender === "user"
                      ? "0 2px 8px rgba(212, 175, 55, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.1)"
                      : "0 2px 8px rgba(0, 0, 0, 0.4)",
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
                  className="leading-relaxed whitespace-pre-wrap"
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: message.sender === "user" ? "#f5f5dc" : "#d4af37",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {message.text}
                </p>
              </div>

              {/* TIMESTAMP + STATUS */}
              <div className="flex items-center gap-1 mt-1 px-2">
                <span
                  className="text-xs"
                  style={{
                    color: "rgba(212, 175, 55, 0.6)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {formatTime(message.timestamp)}
                </span>
                {message.sender === "user" && !message.isError && (
                  <IoCheckmarkDoneOutline
                    className="w-4 h-4"
                    style={{ color: "#d4af37" }}
                  />
                )}
                {message.isError && (
                  <RiAlertFill
                    className="w-4 h-4"
                    style={{ color: "#ff6b6b" }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-start">
              <div
                className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3"
                style={{
                  background: "rgba(25, 18, 12, 0.95)",
                  border: "2px solid #5a4a3a",
                }}
              >
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: "#d4af37",
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* TOOLBAR ROW */}
        <div
          className="flex items-center justify-around px-6 py-3 border-t border-[#d4af37]/20"
          style={{
            background: "rgba(35, 25, 18, 0.95)",
          }}
        >
          {[
            { Icon: IoSparklesOutline, label: "Effets" },
            { Icon: IoHappyOutline, label: "Emoji" },
            { Icon: IoImagesOutline, label: "Galerie" },
            { Icon: IoDocumentOutline, label: "Document" },
            { Icon: IoSettingsOutline, label: "Paramètres" },
            { Icon: IoEllipsisHorizontalOutline, label: "Plus" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              onClick={() => toast.info(`${label} bientôt disponible`)}
              className="p-2 rounded-full transition-all hover:bg-[#d4af37]/20 active:scale-95"
              style={{ color: "#d4af37" }}
              title={label}
            >
              <Icon className="w-6 h-6" />
            </button>
          ))}
        </div>

        {/* INPUT BAR */}
        <div
          className="px-4 py-3 border-t-2"
          style={{
            background:
              "linear-gradient(180deg, rgba(35, 25, 18, 0.98) 0%, rgba(43, 31, 23, 0.98) 100%)",
            borderColor: "#d4af37",
            boxShadow: "0 -5px 20px rgba(0,0,0,0.5)",
          }}
        >
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3"
          >
            {/* Left Icons */}
            <button
              type="button"
              onClick={() => toast.info("Emoji bientôt disponible")}
              className="p-2 rounded-full transition-all hover:bg-[#d4af37]/20 active:scale-95"
              style={{ color: "#d4af37" }}
            >
              <IoHappyOutline className="w-6 h-6" />
            </button>

            {/* Input Field */}
            <div
              className="flex-1 flex items-center gap-2 px-4 py-3 rounded-full"
              style={{
                background: "rgba(43, 31, 23, 0.8)",
                border: "2px solid #d4af37",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message"
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#f5f5dc",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            {/* Right Icons */}
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
              className="p-2 rounded-full transition-all hover:bg-[#d4af37]/20 active:scale-95"
              style={{ color: "#d4af37" }}
            >
              <IoAttachOutline className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Caméra bientôt disponible")}
              className="p-2 rounded-full transition-all hover:bg-[#d4af37]/20 active:scale-95"
              style={{ color: "#d4af37" }}
            >
              <IoCameraOutline className="w-6 h-6" />
            </button>

            {/* MIC BUTTON (Primary Submit) */}
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-4 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
              style={{
                background:
                  inputText.trim() && !isTyping
                    ? "radial-gradient(circle, #f4e5c3 0%, #d4af37 50%, #b8860b 100%)"
                    : "rgba(212, 175, 55, 0.3)",
                boxShadow:
                  inputText.trim() && !isTyping
                    ? "0 0 20px rgba(212, 175, 55, 0.8), 0 0 40px rgba(212, 175, 55, 0.4)"
                    : "none",
                border: "2px solid #8b6914",
              }}
            >
              <IoMicOutline className="w-7 h-7" style={{ color: "#000" }} />
            </button>
          </form>
        </div>

        {/* MENU DROPDOWN */}
        <ChatMenuDropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onChatSelect={(chatId) => {
            toast.info(`Opening chat: ${chatId}`);
            setIsMenuOpen(false);
          }}
          onDMSelect={(dmId) => {
            toast.info(`Opening DM: ${dmId}`);
            setIsMenuOpen(false);
          }}
          onImageSelect={(imageId) => {
            toast.info(`Opening image: ${imageId}`);
            setIsMenuOpen(false);
          }}
        />
      </div>
    </div>,
    document.body,
  );
};
