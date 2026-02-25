/**
 * 🦫 TI-GUY Full-Screen Mobile Chat
 * Full cell phone size with vintage Quebec leather UI
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Settings, X, ChevronDown, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "tiguy";
  timestamp: Date;
  intent?: string;
}

interface TIGuyFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username?: string;
}

export const TIGuyFullScreen: React.FC<TIGuyFullScreenProps> = ({
  isOpen,
  onClose,
  userId,
  username,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Salut! Moi c'est TI-GUY, ton guide québécois! Pose-moi des questions sur le Québec, la culture, ou cherche du contenu! 🦫⚜️",
      sender: "tiguy",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/tiguy/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: userMessage.text,
          context: { userId },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const tiguyMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: "tiguy",
          timestamp: new Date(),
          intent: data.intent,
        };
        setMessages((prev) => [...prev, tiguyMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: "Osti, j'ai un petit problème technique! Réessaie dans un peu. 🦫",
            sender: "tiguy",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Tabarnouche, la connexion est brisée! 🔧",
          sender: "tiguy",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    "Quoi de neuf?",
    "Montre-moi du contenu",
    "Raconte-moi une joke",
    "Où manger?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Full-screen leather background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #3D2314 0%, #2D1810 50%, #1D1208 100%)",
        }}
      />

      {/* Leather texture overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header
        className="relative px-4 py-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(180deg, #5D3A1A 0%, #4A3018 100%)",
          borderBottom: "3px solid #2D1810",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top stitching */}
        <div
          className="absolute top-1 left-4 right-4 h-px"
          style={{
            background:
              "repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 6px, transparent 6px, transparent 10px)",
          }}
        />

        {/* Left: Back button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, #6B4423 0%, #4A3018 100%)",
            border: "2px solid #D4AF37",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <ChevronDown className="w-5 h-5 text-amber-400" />
        </button>

        {/* Center: TI-GUY Branding */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚜️</span>
            <h1
              className="text-xl font-bold text-amber-300"
              style={{
                fontFamily: "Georgia, serif",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              TI-GUY
            </h1>
            <span className="text-2xl">🦫</span>
          </div>
          <span className="text-xs text-amber-500/70">Ton guide québécois</span>
        </div>

        {/* Right: Settings */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, #6B4423 0%, #4A3018 100%)",
            border: "2px solid #D4AF37",
            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <MoreVertical className="w-5 h-5 text-amber-400" />
        </button>

        {/* Bottom stitching */}
        <div
          className="absolute bottom-0 left-4 right-4 h-px opacity-50"
          style={{
            background:
              "repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 6px, transparent 6px, transparent 10px)",
          }}
        />
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative">
        {/* Welcome badge */}
        <div className="flex justify-center mb-6">
          <div
            className="px-4 py-2 rounded-full"
            style={{
              background: "linear-gradient(145deg, #5D3A1A 0%, #4A3018 100%)",
              border: "1px solid #D4AF37",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <span className="text-amber-400 text-xs">Aujourd'hui</span>
          </div>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-4 py-3 relative"
              style={{
                background:
                  message.sender === "tiguy"
                    ? "linear-gradient(145deg, #5D3A7A 0%, #4A2560 100%)"
                    : "linear-gradient(145deg, #8B6914 0%, #6B5010 100%)",
                border: `2px solid ${message.sender === "tiguy" ? "#7A4A9A" : "#D4AF37"}`,
                borderRadius:
                  message.sender === "tiguy"
                    ? "20px 20px 20px 4px"
                    : "20px 20px 4px 20px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              }}
            >
              {/* Inner stitching */}
              <div
                className="absolute inset-1 rounded-lg pointer-events-none"
                style={{
                  border: `1px dashed ${
                    message.sender === "tiguy"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(212,175,55,0.4)"
                  }`,
                }}
              />

              {/* TI-GUY Header */}
              {message.sender === "tiguy" && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-lg">🦫</span>
                  <span
                    className="text-amber-300 text-xs font-bold uppercase tracking-wider"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    TI-GUY
                  </span>
                  <span className="text-amber-500/50 text-xs">⚜️</span>
                </div>
              )}

              {/* Message text */}
              <p
                className="text-amber-100 relative z-10 leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: "16px" }}
              >
                {message.text}
              </p>

              {/* Timestamp */}
              <div className="mt-1 text-right">
                <span className="text-xs text-amber-400/50">
                  {message.timestamp.toLocaleTimeString("fr-CA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                background: "linear-gradient(145deg, #5D3A7A 0%, #4A2560 100%)",
                border: "2px solid #7A4A9A",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🦫</span>
                <span className="text-amber-200 text-sm">TI-GUY réflechit</span>
                <div className="flex gap-1 ml-1">
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(reply);
              }}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm"
              style={{
                background: "linear-gradient(145deg, #4A3018 0%, #3D2314 100%)",
                border: "1px solid #D4AF37",
                color: "#D4AF37",
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area - Belt Style */}
      <div
        className="relative px-4 py-4"
        style={{
          background: "linear-gradient(180deg, #4A3018 0%, #3D2314 100%)",
          borderTop: "3px solid #2D1810",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Top stitching */}
        <div
          className="absolute top-1 left-4 right-4 h-px opacity-50"
          style={{
            background:
              "repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 6px, transparent 6px, transparent 10px)",
          }}
        />

        <div className="flex items-center gap-3">
          {/* Fleur-de-lis buckle */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(145deg, #D4AF37 0%, #B8960B 50%, #8B6914 100%)",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
              border: "2px solid #5D3A1A",
            }}
          >
            <span className="text-amber-900 text-xl">⚜️</span>
          </div>

          {/* Text input */}
          <div className="flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Écris ton message ici..."
              disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-xl bg-amber-950/50 border-2 border-amber-700/50 text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500/50"
              style={{ fontFamily: "Georgia, serif", fontSize: "16px" }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim()}
            className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(145deg, #D4AF37 0%, #B8960B 50%, #8B6914 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <Send size={22} className="text-amber-900" />
          </button>
        </div>

        {/* Credit indicator */}
        <div className="mt-2 text-center">
          <span className="text-xs text-amber-600/70">
            💳 Crédits Dialogflow CX: $813.16
          </span>
        </div>
      </div>
    </div>
  );
};

export default TIGuyFullScreen;
