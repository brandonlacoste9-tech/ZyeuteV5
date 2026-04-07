/**
 * 🦫 TI-GUY Chat - Vintage Quebec Leather UI
 * Inspired by classic Quebec craftsmanship with fleur-de-lis
 * Uses Dialogflow CX credits ($813.16)
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Settings, X, ChevronDown } from "lucide-react";
import { tiguyService } from "@/services/tiguyService";

interface Message {
  id: string;
  text: string;
  sender: "user" | "tiguy";
  timestamp: Date;
  intent?: string;
  action?: any;
}

interface TIGuyChatProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const TIGuyChat: React.FC<TIGuyChatProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Salut! Moi c'est TI-GUY, ton guide québécois! 🦫",
      sender: "tiguy",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
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
      const data = await tiguyService.sendMessage(userMessage.text, undefined, {
        history: messages.slice(-6).map((message) => ({
          sender: message.sender,
          text: message.text,
        })),
        context: { userId },
      });
      const tiguyMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: (data as { response?: string }).response ||
          "Osti, j'ai un petit problème technique! Réessaie dans un peu. 🦫",
        sender: "tiguy",
        timestamp: new Date(),
        intent: (data as { intent?: string }).intent,
        action: (data as { action?: any }).action,
      };
      setMessages((prev) => [...prev, tiguyMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Tabarnouche, la connexion est brisée! 🔧",
        sender: "tiguy",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-full shadow-2xl border-4 border-amber-700 flex items-center justify-center hover:scale-105 transition-transform"
          style={{
            background:
              "linear-gradient(145deg, #8B4513 0%, #5D3A1A 50%, #3D2314 100%)",
          }}
        >
          <span className="text-3xl">🦫</span>
        </button>
      )}

      {isExpanded && (
        <div
          className="w-96 h-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            background:
              "linear-gradient(180deg, #4A3018 0%, #3D2314 50%, #2D1810 100%)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          }}
        >
          {/* Header */}
          <div
            className="relative px-6 py-4 flex items-center justify-between"
            style={{
              background: "linear-gradient(180deg, #6B4423 0%, #4A3018 100%)",
              borderBottom: "2px solid #3D2314",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="absolute inset-x-2 top-1 h-px opacity-40"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 8px, transparent 8px, transparent 12px)",
              }}
            />

            <div className="text-amber-400 text-2xl">⚜️</div>

            <h2
              className="text-amber-200 text-xl font-bold tracking-wide"
              style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                fontFamily: "Georgia, serif",
              }}
            >
              Conversation
            </h2>

            <div className="flex items-center gap-2">
              <button className="p-2 text-amber-400 hover:text-amber-200 transition-colors">
                <Settings size={20} />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-amber-400 hover:text-amber-200 transition-colors"
              >
                <ChevronDown size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-amber-400 hover:text-amber-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl relative"
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
                  }}
                >
                  <div
                    className="absolute inset-1 rounded-xl pointer-events-none"
                    style={{
                      border: `1px dashed ${message.sender === "tiguy" ? "rgba(255,255,255,0.3)" : "rgba(212,175,55,0.5)"}`,
                    }}
                  />

                  {message.sender === "tiguy" && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-amber-300 text-xs">🦫</span>
                      <span
                        className="text-amber-300 text-xs font-bold uppercase tracking-wider"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        TI-GUY
                      </span>
                    </div>
                  )}

                  <p
                    className="text-amber-100 relative z-10"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(145deg, #5D3A7A 0%, #4A2560 100%)",
                    border: "2px solid #7A4A9A",
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-amber-300 text-xs">🦫</span>
                    <span className="text-amber-200 text-xs">
                      TI-GUY réflechit...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="relative px-4 py-4"
            style={{
              background:
                "linear-gradient(180deg, #5D3A1A 0%, #4A3018 50%, #3D2314 100%)",
              borderTop: "3px solid #2D1810",
            }}
          >
            <div
              className="absolute top-1 left-4 right-4 h-px opacity-40"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 8px, transparent 8px, transparent 12px)",
              }}
            />

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(145deg, #D4AF37 0%, #B8960B 50%, #8B6914 100%)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                <span className="text-amber-900 text-lg">⚜️</span>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="[ Tape ton message ici... ]"
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-900/50 border-2 border-amber-700 text-amber-100 placeholder-amber-600 focus:outline-none focus:border-amber-500"
                style={{ fontFamily: "Georgia, serif" }}
              />

              <button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105"
                style={{
                  background:
                    "linear-gradient(145deg, #D4AF37 0%, #B8960B 50%, #8B6914 100%)",
                }}
              >
                <Send size={20} className="text-amber-900" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TIGuyChat;
