/**
 * ChatModal.tsx
 * Premium Dark Tan Leather Stitched Aesthetic
 * Features TI-Guy's authentic Quebec personality
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IoCloseOutline,
  IoSend,
  IoAppsOutline,
  IoImageOutline,
  IoTrashOutline,
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

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tiguMode, setTiguMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

    if ((!text && !selectedImage) || isTyping || loading) return;

    tap();

    // If text is from form, clear input
    if (typeof e !== "string") {
      addMessage({
        sender: "user",
        text: text,
        image: imagePreview || undefined,
      });
      setInputText("");
      setSelectedImage(null);
      setImagePreview(null);
    } else {
      // It's a quick action or direct call
      addMessage({ sender: "user", text: text });
    }

    setIsTyping(true);

    try {
      const response = await tiguyService.sendMessage(
        text,
        selectedImage || undefined,
      );

      // Natural delay for "typing"
      setTimeout(
        () => {
          setIsTyping(false);
          addMessage({
            sender: "tiGuy",
            text: response.response,
          });
          impact();
        },
        1000 + Math.random() * 500,
      );
    } catch (error) {
      setIsTyping(false);
      toast.error("Un tite erreur technique, mon chum!");
      addMessage({
        sender: "tiGuy",
        text: "Oups, j'ai une tite friture dans les circuits. Réessaie une autre fois!",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop grosse! (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoualize = (style: "street" | "old" | "enhanced") => {
    if (!inputText.trim()) return;
    tap();
    const prefix = {
      street: "Wesh, yo, check ça: ",
      old: "Ben voyons, écoute ben: ",
      enhanced: "T'es une légende, r'garde: ",
    };
    setInputText(prefix[style] + inputText);
    setShowToolsMenu(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-end justify-center",
        "transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full px-0",
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <style>{`
        .chat-leather-tan {
          background-color: #8D6E63;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.2'/%3E%3C/svg%3E");
        }
        .leather-stitched {
          position: relative;
          border: 2px dashed #4E342E;
          margin: 8px;
          border-radius: 2.5rem;
          background: rgba(0, 0, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(78, 52, 46, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4E342E;
          border-radius: 10px;
        }
      `}</style>

      <div
        className={cn(
          "w-full max-w-md h-full chat-leather-tan flex flex-col overflow-hidden shadow-2xl transition-all duration-500",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col leather-stitched overflow-hidden">
          {/* Header */}
          <div className="bg-stone-900/40 backdrop-blur-xl border-b border-stone-900/20 p-5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-stone-800 shadow-2xl relative ring-2 ring-stone-900/10">
                <img
                  src="/ti-guy-logo.jpg?v=2"
                  alt="Ti-Guy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-stone-50 font-black text-2xl tracking-tighter">
                  Ti-Guy
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-green-500/50"></span>
                  <p className="text-stone-300 text-[10px] font-black uppercase tracking-widest">
                    AI Cameraman • Actif
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-xl",
                  tiguMode
                    ? "bg-stone-950 border-stone-700 text-amber-500 scale-105"
                    : "bg-stone-100/10 border-white/10 text-stone-100",
                )}
                onClick={() => {
                  tap();
                  setTiguMode(!tiguMode);
                }}
              >
                {tiguMode ? "🔱 Mode TIGU" : "Normal"}
              </button>
              <button
                onClick={handleClose}
                className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-all text-white border border-white/10 shadow-lg"
              >
                <IoCloseOutline className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar no-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 items-end transition-all duration-500",
                  message.sender === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                {message.sender === "tiGuy" && (
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-stone-900/20 shadow-lg">
                    <img
                      src="/ti-guy-logo.jpg?v=2"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-[2rem] p-4 text-sm leading-relaxed shadow-xl border",
                    message.sender === "user"
                      ? "bg-stone-950 text-stone-100 font-bold border-stone-800"
                      : "bg-white text-stone-950 border-stone-900/10 backdrop-blur-sm",
                  )}
                  style={{
                    borderRadius:
                      message.sender === "user"
                        ? "24px 24px 4px 24px"
                        : "24px 24px 24px 4px",
                  }}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  {message.image && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-black/10 shadow-inner">
                      <img
                        src={message.image}
                        alt="Upload"
                        className="w-full max-h-64 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-2 opacity-40">
                    <span className="text-[9px] font-black uppercase tracking-widest italic font-serif">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="bg-white/90 p-3 rounded-2xl rounded-bl-sm border border-stone-900/10 shadow-lg">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-stone-900/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-stone-900/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-stone-900/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 flex gap-2.5 overflow-x-auto no-scrollbar border-t border-stone-900/10 bg-black/10 backdrop-blur-md">
            {[
              { icon: "🎭", label: "Joke", action: "raconte-moi une joke" },
              {
                icon: "📜",
                label: "Histoire",
                action: "Raconte-moi une courte histoire",
              },
              { icon: "⚜️", label: "Culture", action: "Parle-moi du Québec" },
              { icon: "🏒", label: "Hockey", action: "On jase-tu de hockey?" },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(btn.action)}
                className="bg-stone-950/80 hover:bg-stone-950 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-white/5 whitespace-nowrap transition-all active:scale-95 shadow-2xl flex items-center gap-2"
              >
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div
            className="p-5 border-t border-stone-900/20 bg-stone-100/5 backdrop-blur-3xl relative z-10"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            {imagePreview && (
              <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    className="w-20 h-20 object-cover rounded-2xl border-4 border-stone-950 shadow-2xl"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-red-700 transition-all border-2 border-white"
                  >
                    <IoTrashOutline size={18} />
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-3"
            >
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToolsMenu(!showToolsMenu)}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-xl border-2",
                      showToolsMenu
                        ? "bg-stone-950 border-stone-700 text-amber-500 rotate-45"
                        : "bg-white border-stone-200 text-stone-900",
                    )}
                  >
                    <IoAppsOutline size={24} />
                  </button>
                  {showToolsMenu && (
                    <div className="absolute bottom-16 left-0 w-56 bg-stone-950 border border-stone-800 rounded-3xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 z-[100]">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 mb-2 underline decoration-amber-500/50">
                        Joualizer ⚜️
                      </p>
                      <button
                        type="button"
                        onClick={() => handleJoualize("street")}
                        className="w-full text-left px-4 py-3 rounded-2xl hover:bg-stone-900 text-white text-sm font-black flex items-center gap-3 transition-colors"
                      >
                        <span>🔥</span> Urban Street
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJoualize("old")}
                        className="w-full text-left px-4 py-3 rounded-2xl hover:bg-stone-900 text-white text-sm font-black flex items-center gap-3 transition-colors"
                      >
                        <span>🏡</span> Pure Laine
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJoualize("enhanced")}
                        className="w-full text-left px-4 py-3 rounded-2xl hover:bg-stone-900 text-white text-sm font-black flex items-center gap-3 transition-colors"
                      >
                        <span>🚀</span> Viral Boost
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-2 border-stone-200 text-stone-900 shadow-xl active:scale-90 transition-all"
                >
                  <IoImageOutline size={24} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écris à Ti-Guy..."
                  className="w-full bg-white border-3 border-stone-950 rounded-full py-4.5 pl-6 pr-14 text-sm text-stone-950 placeholder-stone-500/60 focus:outline-none shadow-2xl font-black ring-4 ring-stone-900/5"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !selectedImage) || isTyping}
                  className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-stone-950 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-20"
                >
                  <IoSend size={20} />
                </button>
              </div>
            </form>
            <p className="mt-5 text-center text-[9px] font-black text-stone-950/40 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
              <span className="w-12 h-px bg-stone-950/10"></span>
              Zyeuté • Produit du Québec
              <span className="w-12 h-px bg-stone-950/10"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
