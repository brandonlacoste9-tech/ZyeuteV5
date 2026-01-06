import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoCloseOutline,
  IoSend,
  IoAppsOutline,
  IoImageOutline,
  IoTimeOutline,
  IoChevronDownOutline,
} from "react-icons/io5";
import { useHaptics } from "@/hooks/useHaptics";
import {
  getTiGuyResponse,
  getTiGuyWelcomeMessage,
} from "@/utils/tiGuyResponses";
import { tiguyService } from "@/services/tiguyService";
import type { ChatMessage, ConversationSummary } from "@/types/chat";
import { toast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface ChatModalProps {
  onClose: () => void;
}

const MOCK_HISTORY: ConversationSummary[] = [
  {
    id: "1",
    type: "tiguy",
    title: "Recette de poutine authentique",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    pinned: true,
  },
  {
    id: "2",
    type: "dm",
    title: "Jean-Guy Tremblay",
    participants: ["Jean-Guy Tremblay"],
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "3",
    type: "tiguy",
    title: "Les meilleurs spots à Montréal",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: "4",
    type: "dm",
    title: "Équipe Zyeuté",
    participants: ["Sophie", "Marc"],
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    archived: true,
  },
];

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { tap, impact } = useHaptics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tiguMode, setTiguMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isJoualizing, setIsJoualizing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Slide-in animation on mount
  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);

    // Add welcome message
    const welcomeMessage = getTiGuyWelcomeMessage();
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory]);

  // Handle sending a message
  const handleSendMessage = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== "string") e.preventDefault();

    const text = typeof e === "string" ? e : inputText.trim();
    if ((!text && !selectedImage) || isTyping || loading) return;

    tap();

    const currentImage = selectedImage;

    // Add user message if not already added by quick action
    if (typeof e !== "string") {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        sender: "user",
        text: text,
        timestamp: new Date(),
        image: currentImage || undefined,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setSelectedImage(null);
      setImagePreview(null);
    }

    setIsTyping(true);

    if (tiguMode) {
      setLoading(true);
      try {
        const responseData = await tiguyService.sendMessage(
          text,
          currentImage || undefined,
        );
        const tiGuyMessage: ChatMessage = {
          id: `tiguy-${Date.now()}-${Math.random()}`,
          sender: "tiGuy",
          text: responseData.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, tiGuyMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: "tiGuy",
          text: "⚠️ TI-GUY est occupé, essaie plus tard!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        setLoading(false);
      }
    } else {
      // Simulate typing delay (800ms for natural feel)
      setTimeout(() => {
        const tiGuyResponse = getTiGuyResponse(text);
        setMessages((prev) => [...prev, tiGuyResponse]);
        setIsTyping(false);
      }, 800);
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

  const handleJoualize = async (style: "street" | "old" | "enhanced") => {
    const textToJoualize =
      inputText.trim() ||
      (messages.length > 1 ? messages[messages.length - 1].text : "");

    if (!textToJoualize || isJoualizing) return;

    tap();
    setIsJoualizing(true);
    setShowToolsMenu(false);

    try {
      const response = await fetch("/api/ai/joualize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supabase.auth.token")}`, // Placeholder for real JWT
        },
        body: JSON.stringify({ text: textToJoualize, style }),
      });

      if (!response.ok) throw new Error("Failed to joualize");

      const data = await response.json();
      setInputText(data.rewrittenText);
      toast.success("Texte transformé! ✨");
    } catch (error) {
      console.error("Joualizer error:", error);
      toast.error("Échec de la transformation. 🦫");
    } finally {
      setIsJoualizing(false);
    }
  };

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${message.sender}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Handle close with slide-out animation
  const handleClose = () => {
    impact();
    setIsVisible(false);
    // Delay unmounting until animation completes
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Format timestamp in French
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatHistoryTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return formatTime(date);
    } else if (days === 1) {
      return "Hier";
    } else {
      return date.toLocaleDateString("fr-CA", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center",
        "transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <style>{`
          .chat-tiguy-mode {
            background: linear-gradient(135deg, #0051A5 0%, #EF3E42 100%) !important;
            border: 2px solid #FFD700 !important;
          }
          .chat-leather-bg {
            background-color: #E8D7C1;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      <div
        className={cn(
          "w-full max-w-md h-[80vh] chat-leather-bg rounded-t-[2.5rem] rounded-b-[1.5rem] mb-24 md:mb-6 mx-2 transition-all duration-500",
          "flex flex-col overflow-hidden relative",
          "border-2 border-[#8B6914] shadow-[0_10px_40px_rgba(0,0,0,0.3)]",
          "transition-transform duration-300 ease-out",
          isVisible ? "translate-y-0" : "translate-y-full",
          tiguMode && "chat-tiguy-mode",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#D4C4A8]/90 backdrop-blur-md border-b border-[#8B6914]/30 p-4 flex items-center justify-between shadow-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#8B6914] shadow-md relative">
              <img
                src="/ti-guy-logo.jpg?v=2"
                alt="Ti-Guy"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-[#4A3728] font-bold text-lg tracking-tight">
                Ti-Guy
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                <p className="text-[#5D4037] text-xs font-medium uppercase tracking-wider">
                  En ligne
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
             {/* History Dropdown Trigger */}
            <div ref={historyRef} className="relative">
              <button
                onClick={() => {
                  tap();
                  setShowHistory(!showHistory);
                }}
                className={cn(
                  "p-2 rounded-full transition-colors border border-[#8B6914]/10 text-[#4A3728]",
                  showHistory ? "bg-[#B09A7D] text-[#2C1810]" : "bg-[#C1A88A]/50 hover:bg-[#C1A88A]"
                )}
                aria-label="Historique"
              >
                <IoTimeOutline className="w-5 h-5" />
              </button>

              {/* History Dropdown Panel */}
              {showHistory && (
                <div
                  className={cn(
                    "absolute top-full right-0 mt-2 w-64 rounded-md overflow-hidden z-50",
                    "bg-[#D4C4A8] border border-[#8B6914] shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
                    "animate-in fade-in slide-in-from-top-2 duration-200"
                  )}
                >
                  <div className="py-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-[#8B6914] uppercase tracking-widest border-b border-[#8B6914]/20 bg-[#C1A88A]/30">
                      Récemment
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                      {MOCK_HISTORY.map((item) => (
                        <button
                          key={item.id}
                          className={cn(
                            "w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-[#8B6914]/10 transition-colors border-b border-[#8B6914]/10 last:border-0",
                             item.archived && "opacity-60 grayscale-[0.5]"
                          )}
                          onClick={() => {
                            tap();
                            toast.info(`Chargement de: ${item.title}`);
                            setShowHistory(false);
                          }}
                        >
                          <div className="text-lg flex-shrink-0 mt-0.5">
                            {item.pinned ? "📌" : item.type === "tiguy" ? "🤖" : "👤"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2">
                              <span className={cn(
                                "text-sm font-semibold truncate",
                                item.archived ? "text-[#5D4037]" : "text-[#4A3728]"
                              )}>
                                {item.title}
                              </span>
                              <span className="text-[9px] text-[#8B6914] flex-shrink-0 whitespace-nowrap">
                                {formatHistoryTime(item.lastMessageAt)}
                              </span>
                            </div>
                            {item.type === "dm" && item.participants && (
                              <p className="text-[10px] text-[#5D4037] truncate">
                                {item.participants.join(", ")}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="bg-[#C1A88A]/30 border-t border-[#8B6914]/20 p-2 text-center">
                      <button
                        onClick={() => {
                          tap();
                          setShowHistory(false);
                          handleClose();
                          navigate("/messages");
                        }}
                        className="text-[10px] font-bold text-[#8B6914] hover:text-[#5D4037] uppercase tracking-widest transition-colors w-full py-1"
                      >
                        Voir tout les messages
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all border shadow-sm",
                tiguMode
                  ? "bg-red-600 border-yellow-400 text-white shadow-md scale-105"
                  : "bg-[#C1A88A] border-[#8B6914]/30 text-[#4A3728] hover:bg-[#B09A7D]",
              )}
              onClick={() => {
                tap();
                setTiguMode(!tiguMode);
              }}
            >
              {tiguMode ? "🔱 Mode" : "Standard"}
            </button>
            <button
              onClick={handleClose}
              className="p-2 bg-[#C1A88A]/50 hover:bg-[#C1A88A] rounded-full transition-colors border border-[#8B6914]/10 text-[#4A3728]"
              aria-label="Fermer"
            >
              <IoCloseOutline className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 items-end transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                message.sender === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              {message.sender === "tiGuy" && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#8B6914]/30 shadow-sm">
                  <img
                    src="/ti-guy-logo.jpg?v=2"
                    alt="Ti-Guy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm border",
                  message.sender === "user"
                    ? "bg-[#D2B48C] text-[#2C1810] font-medium border-[#8B6914]/20"
                    : "bg-[#FAF0E6] text-[#4A3728] border-[#8B6914]/10",
                )}
                style={{
                  borderRadius:
                    message.sender === "user"
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                }}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
                {message.image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-[#8B6914]/20 shadow-sm">
                    <img
                      src={message.image}
                      alt="Chat attachment"
                      className="w-full max-h-52 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#4A3728]">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center animate-pulse">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[#8B6914]/30">
                <img
                  src="/ti-guy-logo.jpg?v=2"
                  alt="Ti-Guy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-[#FAF0E6]/80 p-3 rounded-2xl rounded-bl-sm border border-[#8B6914]/10">
                <div className="flex gap-1.5">
                  <span
                    className="w-1.5 h-1.5 bg-[#8B6914] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-[#8B6914] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-[#8B6914] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions Scrollable */}
        <div className="px-5 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-[#8B6914]/10 bg-[#D4C4A8]/20">
          <button
            className="bg-[#C1A88A] hover:bg-[#B09A7D] text-[#4A3728] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#8B6914]/20 whitespace-nowrap transition-all active:scale-95 shadow-sm"
            onClick={async () => {
              tap();
              try {
                const joke = await tiguyService.getJoke();
                addMessage({ sender: "tiGuy", text: joke.joke });
              } catch (error) {
                addMessage({
                  sender: "tiGuy",
                  text: "Oups, j'ai oublié la chute! Réessaye plus tard!",
                });
              }
            }}
          >
            🎭 Joke
          </button>
          <button
            className="bg-[#C1A88A] hover:bg-[#B09A7D] text-[#4A3728] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#8B6914]/20 whitespace-nowrap transition-all active:scale-95 shadow-sm"
            onClick={() => {
              const text = "raconte-moi une histoire";
              handleSendMessage(text);
            }}
          >
            📜 Histoire
          </button>
          <button
            className="bg-[#C1A88A] hover:bg-[#B09A7D] text-[#4A3728] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#8B6914]/20 whitespace-nowrap transition-all active:scale-95 shadow-sm"
            onClick={() => {
              const text = "parle-moi du Québec";
              handleSendMessage(text);
            }}
          >
            ⚜️ Culture
          </button>
        </div>

        {/* Input Area */}
        <div
          className="p-4 border-t border-[#8B6914]/20 bg-[#D4C4A8]/90 backdrop-blur-xl relative z-10"
          style={{
            paddingBottom:
              "calc(max(1rem, env(safe-area-inset-bottom)) + 0.5rem)",
          }}
        >
          {imagePreview && (
            <div className="mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative inline-block group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-xl border-2 border-[#8B6914] shadow-sm"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedImage(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-500 transition-all hover:scale-110 active:scale-90"
                >
                  <IoCloseOutline size={14} />
                </button>
              </div>
            </div>
          )}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    setShowToolsMenu(!showToolsMenu);
                  }}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-full bg-[#C1A88A] text-[#4A3728] hover:bg-[#B09A7D] border transition-all shadow-sm group",
                    showToolsMenu
                      ? "border-[#8B6914] bg-[#B09A7D]"
                      : "border-[#8B6914]/20",
                  )}
                  aria-label="Extensions"
                >
                  <IoAppsOutline
                    className={cn(
                      "w-4 h-4 transition-transform",
                      showToolsMenu ? "rotate-45" : "group-hover:rotate-12",
                    )}
                  />
                </button>

                {/* Tools Dropup Menu */}
                {showToolsMenu && (
                  <div className="absolute bottom-12 left-0 w-44 bg-[#E8D7C1] rounded-xl p-2 border border-[#8B6914]/30 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50">
                    <div className="text-[9px] font-bold text-[#8B6914] uppercase tracking-widest px-2 py-1 mb-1">
                      Le Joualizer ⚜️
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoualize("street")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#D4C4A8] text-[#4A3728] text-xs flex items-center gap-2 transition-colors"
                    >
                      <span>🔥</span> Urban Street
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJoualize("old")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#D4C4A8] text-[#4A3728] text-xs flex items-center gap-2 transition-colors"
                    >
                      <span>🏡</span> Pure Laine
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJoualize("enhanced")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#D4C4A8] text-[#4A3728] text-xs flex items-center gap-2 transition-colors"
                    >
                      <span>🚀</span> Viral Boost
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  tap();
                  fileInputRef.current?.click();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#C1A88A] text-[#4A3728] hover:bg-[#B09A7D] border border-[#8B6914]/20 active:scale-90 transition-all shadow-sm group"
                aria-label="Téléverser"
              >
                <IoImageOutline className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
                placeholder="Jase avec moi..."
                className="w-full bg-[#FAF0E6] border-2 border-[#8B6914]/30 rounded-full py-2.5 pl-4 pr-10 text-sm text-[#4A3728] placeholder-[#8B6914]/50 focus:outline-none focus:border-[#8B6914] transition-all shadow-inner"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={cn(
                  "absolute right-1 top-1 bottom-1 aspect-square rounded-full",
                  "bg-[#8B6914] text-[#E8D7C1]",
                  "hover:bg-[#6D4C0A] transition-all active:scale-90",
                  "disabled:opacity-40 disabled:grayscale",
                  "flex items-center justify-center shadow-md group",
                )}
                aria-label="Envoyer"
              >
                <IoSend className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>

          <p className="mt-3 text-center text-[9px] font-bold text-[#8B6914]/70 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-[#8B6914]/30"></span>
            ⚜️ Zyeuté AI 🦫
            <span className="w-6 h-px bg-[#8B6914]/30"></span>
          </p>
        </div>
      </div>
    </div>
  );
};
