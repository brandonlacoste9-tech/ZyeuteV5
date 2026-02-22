/**
 * ChatInterface - Leather & Gold Stitched Messenger
 * Louis Vuitton x Québec Aesthetic
 */

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { tiguyService } from "@/services/tiguyService";
import type { ChatMessage } from "@/types/chat";
import { toast } from "@/components/Toast";

// Icons
import {
  IoSearch,
  IoNotifications,
  IoPerson,
  IoMic,
  IoMicOutline,
  IoAttach,
  IoSend,
  IoChevronDown,
  IoChevronUp,
  IoTime,
  IoChatbubbles,
  IoFolder,
  IoSettings,
  IoImage,
  IoDocument,
  IoMusicalNote,
  IoVideocam,
  IoClose,
  IoEllipsisHorizontal,
} from "react-icons/io5";

// Fleur-de-lis pattern for background
const FLEUR_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M30 10c-1-4-4-6-7-6s-6 2-7 6l2 5-2-5c-1-4-4-6-7-6s-6 2-7 6c0 3 2 5 4 7l6 2-6-2c-2-2-4-4-4-7 0-4 2-6 6-7s6 2 7 6l4 9 4-9c1-4 4-6 7-6s6 2 7 6c0 3-2 5-4 7l-6 2 6-2c2-2 4-4 4-7 0-4-2-6-6-7s-6 2-7 6l-2 5 2-5z'/%3E%3C/g%3E%3C/svg%3E")`;

interface ChatInterfaceProps {
  onClose?: () => void;
}

type SidebarTab = "history" | "dms" | "mystuff";
type MyStuffSubmenu = "files" | "photos" | "audio" | "videos" | "settings";

interface ChatThread {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isTiGuy?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [activeTab, setActiveTab] = useState<SidebarTab>("history");
  const [activeSubmenu, setActiveSubmenu] = useState<MyStuffSubmenu>("files");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState<string>("tiguy");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceWaveform, setShowVoiceWaveform] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock chat threads
  const chatThreads: ChatThread[] = [
    { id: "tiguy", name: "Ti-Guy AI", lastMessage: "Salut mon ami!", timestamp: "2m", unread: 0, isTiGuy: true },
    { id: "1", name: "Marie-Louise", lastMessage: "On se voit demain?", timestamp: "15m", unread: 2 },
    { id: "2", name: "Jean-Guy", lastMessage: "Tabarnak c'était fou!", timestamp: "1h", unread: 0 },
    { id: "3", name: "Sophie", lastMessage: "🎬 Nouvelle vidéo", timestamp: "3h", unread: 5 },
    { id: "4", name: "Ti-Paul", lastMessage: "Sti c'est beau ça", timestamp: "1d", unread: 0 },
  ];

  const dmThreads: ChatThread[] = [
    { id: "dm1", name: "@marie_quebec", lastMessage: "Merci!", timestamp: "5m", unread: 1 },
    { id: "dm2", name: "@ti_guy_fan", lastMessage: "Photo envoyée", timestamp: "30m", unread: 0 },
    { id: "dm3", name: "@zyeute_mod", lastMessage: "Rapport reçu", timestamp: "2h", unread: 0 },
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "tiGuy",
        text: "Ayoye! Bienvenue dans Zyeuté Messenger! 🦫⚜️\n\nChu Ti-Guy, ton assistant québécois. Tu peux me parler en joual, m'envoyer des photos, ou utiliser le micro pour jaser!",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    tap();
    
    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await tiguyService.sendMessage(text);
      const responseText = typeof response === "string" 
        ? response 
        : response.response || "Je n'ai pas de réponse pour ça, tsé?";
      
      setMessages(prev => [...prev, {
        id: `tiguy-${Date.now()}`,
        sender: "tiGuy",
        text: responseText,
        timestamp: new Date(),
      }]);
    } catch (error) {
      toast.error("Erreur de connexion");
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: "tiGuy",
        text: "Oups! J'ai eu un bug. Réessaie svp! 🦫",
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Voice recording simulation
  const startRecording = () => {
    impact();
    setIsRecording(true);
    setShowVoiceWaveform(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setTimeout(() => {
      setShowVoiceWaveform(false);
      // Simulate voice message
      setMessages(prev => [...prev, {
        id: `voice-${Date.now()}`,
        sender: "user",
        text: "🎤 Message vocal (0:05)",
        timestamp: new Date(),
      }]);
      
      // Ti-Guy responds to voice
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `tiguy-voice-${Date.now()}`,
          sender: "tiGuy",
          text: "J'ai entendu ton message! Chu en train de réfléchir... 🦫",
          timestamp: new Date(),
        }]);
        setIsTyping(false);
      }, 1500);
    }, 500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    tap();
    const isImage = file.type.startsWith("image/");
    const icon = isImage ? "🖼️" : "📎";
    
    setMessages(prev => [...prev, {
      id: `file-${Date.now()}`,
      sender: "user",
      text: `${icon} ${file.name}`,
      timestamp: new Date(),
    }]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case "history":
        return (
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#d4af37]/50 font-semibold">
              Conversations récentes
            </div>
            {chatThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => { setActiveChat(thread.id); tap(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  activeChat === thread.id
                    ? "bg-[#d4af37]/20 border border-[#d4af37]/40"
                    : "hover:bg-[#d4af37]/10 border border-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                  thread.isTiGuy
                    ? "bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37]"
                    : "bg-[#3a2820] border border-[#d4af37]/30"
                )}>
                  {thread.isTiGuy ? "🦫" : thread.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      activeChat === thread.id ? "text-[#d4af37]" : "text-[#e8dcc8]"
                    )}>
                      {thread.name}
                    </span>
                    <span className="text-[10px] text-[#8b7355]">{thread.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#8b7355] truncate">{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">
                    {thread.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        );
      
      case "dms":
        return (
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#d4af37]/50 font-semibold">
              Messages privés
            </div>
            {dmThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => { setActiveChat(thread.id); tap(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  activeChat === thread.id
                    ? "bg-[#d4af37]/20 border border-[#d4af37]/40"
                    : "hover:bg-[#d4af37]/10 border border-transparent"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-400/50 flex items-center justify-center text-sm">
                  {thread.name[1]}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      activeChat === thread.id ? "text-[#d4af37]" : "text-[#e8dcc8]"
                    )}>
                      {thread.name}
                    </span>
                    <span className="text-[10px] text-[#8b7355]">{thread.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#8b7355] truncate">{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">
                    {thread.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        );
      
      case "mystuff":
        return (
          <div className="space-y-3">
            {/* Submenu */}
            <div className="flex gap-1 px-2">
              {[
                { id: "files", icon: IoDocument, label: "Fichiers" },
                { id: "photos", icon: IoImage, label: "Photos" },
                { id: "audio", icon: IoMusicalNote, label: "Audio" },
                { id: "videos", icon: IoVideocam, label: "Vidéos" },
                { id: "settings", icon: IoSettings, label: "Params" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveSubmenu(id as MyStuffSubmenu); tap(); }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                    activeSubmenu === id
                      ? "bg-[#d4af37]/20 text-[#d4af37]"
                      : "text-[#8b7355] hover:bg-[#d4af37]/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] uppercase">{label}</span>
                </button>
              ))}
            </div>
            
            {/* Content based on submenu */}
            <div className="px-3 space-y-2">
              {activeSubmenu === "files" && (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-[#d4af37]/50 font-semibold">
                    Mes fichiers
                  </div>
                  {["Document.pdf", "Contrat.docx", "Notes.txt"].map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[#3a2820]/50 border border-[#d4af37]/10">
                      <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center text-red-400">
                        <IoDocument className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-[#c4b5a5]">{file}</span>
                    </div>
                  ))}
                </>
              )}
              {activeSubmenu === "photos" && (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-[#d4af37]/50 font-semibold">
                    Mes photos
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square rounded-lg bg-[#3a2820] border border-[#d4af37]/20 flex items-center justify-center text-2xl">
                        🖼️
                      </div>
                    ))}
                  </div>
                </>
              )}
              {activeSubmenu === "settings" && (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-[#d4af37]/50 font-semibold">
                    Paramètres
                  </div>
                  {["Notifications", "Confidentialité", "Apparence", "Langue"].map((setting) => (
                    <button
                      key={setting}
                      onClick={() => toast.info(`${setting} - bientôt disponible`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-[#3a2820]/50 border border-[#d4af37]/10 hover:border-[#d4af37]/30 transition-all text-left"
                    >
                      <span className="text-sm text-[#c4b5a5]">{setting}</span>
                      <IoChevronDown className="w-4 h-4 text-[#8b7355] -rotate-90" />
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex bg-black/90 backdrop-blur-sm">
      {/* Main Container */}
      <div className="flex w-full h-full max-w-6xl mx-auto my-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#d4af37]/50">
        
        {/* SIDEBAR - Leather Stitched Panel */}
        <div
          className={cn(
            "flex flex-col transition-all duration-300 border-r-4 border-[#d4af37]/30",
            sidebarOpen ? "w-80" : "w-0 overflow-hidden"
          )}
          style={{
            background: "#2b1f17",
            backgroundImage: FLEUR_PATTERN,
            boxShadow: "inset -10px 0 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Sidebar Header */}
          <div
            className="px-4 py-4 border-b-2 border-[#d4af37]/30"
            style={{
              background: "linear-gradient(180deg, rgba(43,31,23,0.98) 0%, rgba(35,25,18,0.98) 100%)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚜️</span>
                <span
                  className="text-xl font-bold tracking-widest text-[#d4af37]"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    textShadow: "0 2px 8px rgba(212,175,55,0.4)",
                  }}
                >
                  ZYEUTÉ
                </span>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#d4af37]/20 text-[#d4af37]">
                  <IoClose className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20">
              {[
                { id: "history", icon: IoTime, label: "Historique" },
                { id: "dms", icon: IoChatbubbles, label: "DMs" },
                { id: "mystuff", icon: IoFolder, label: "Mes trucs" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id as SidebarTab); tap(); }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                    activeTab === id
                      ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40"
                      : "text-[#8b7355] hover:bg-[#d4af37]/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
            {renderSidebarContent()}
          </div>

          {/* Sidebar Footer */}
          <div className="px-4 py-3 border-t border-[#d4af37]/20 bg-[#3a2820]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">
                👤
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#e8dcc8]">Mon Profil</div>
                <div className="text-xs text-[#8b7355]">En ligne</div>
              </div>
              <button
                onClick={() => toast.info("Paramètres du profil")}
                className="p-2 rounded-lg hover:bg-[#d4af37]/20 text-[#d4af37]"
              >
                <IoSettings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col" style={{ background: "#1a1410" }}>
          {/* Chat Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b-2 border-[#d4af37]/30"
            style={{
              background: "linear-gradient(90deg, rgba(43,31,23,0.98), rgba(35,25,18,0.98))",
            }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-[#d4af37]/20 text-[#d4af37] transition-all"
              >
                {sidebarOpen ? <IoChevronDown className="w-5 h-5 -rotate-90" /> : <IoChevronUp className="w-5 h-5 -rotate-90" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-2xl shadow-lg shadow-[#d4af37]/20">
                  🦫
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#e8dcc8]">Ti-Guy</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 text-[10px] text-[#d4af37] uppercase tracking-wider">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8b7355]">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    En ligne • Powered by KimiClaw
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoSearch className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoNotifications className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoEllipsisHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{
              background: "#2b1f17",
              backgroundImage: FLEUR_PATTERN,
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender === "user" ? "flex-row-reverse" : ""
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2",
                    message.sender === "tiGuy"
                      ? "bg-gradient-to-br from-amber-400 to-amber-700 border-[#d4af37]"
                      : "bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-400"
                  )}
                >
                  {message.sender === "tiGuy" ? "🦫" : "👤"}
                </div>

                {/* Message Bubble */}
                <div className={cn("max-w-[70%]", message.sender === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-5 py-3 shadow-lg",
                      message.sender === "user" ? "rounded-br-sm" : "rounded-bl-sm",
                      message.isError && "border-red-500/50 bg-red-500/10"
                    )}
                    style={{
                      background:
                        message.sender === "user"
                          ? "linear-gradient(135deg, rgba(109,40,217,0.4), rgba(79,70,229,0.3))"
                          : "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))",
                      border: message.isError
                        ? "2px solid rgba(239,68,68,0.5)"
                        : message.sender === "user"
                        ? "2px solid rgba(139,92,246,0.4)"
                        : "2px solid rgba(212,175,55,0.4)",
                      boxShadow:
                        message.sender === "user"
                          ? "0 4px 15px rgba(109,40,217,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                          : "0 4px 15px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="rounded-lg mb-2 max-w-full max-h-48 object-cover"
                      />
                    )}
                    <p
                      className={cn(
                        "leading-relaxed whitespace-pre-wrap text-[15px]",
                        message.sender === "user" ? "text-violet-100" : "text-amber-100"
                      )}
                    >
                      {message.text}
                    </p>
                  </div>
                  <div className={cn("flex items-center gap-2 mt-1 text-xs text-[#8b7355]", message.sender === "user" && "justify-end")}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.sender === "user" && <span className="text-[#d4af37]">✓✓</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">
                  🦫
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))",
                    border: "2px solid rgba(212,175,55,0.4)",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Voice Waveform */}
            {showVoiceWaveform && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-1 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/40">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                  <span className="ml-3 text-sm text-red-300">Enregistrement...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="px-6 py-4 border-t-2 border-[#d4af37]/30"
            style={{
              background: "linear-gradient(180deg, rgba(35,25,18,0.98) 0%, rgba(43,31,23,0.98) 100%)",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {["🎨", "😀", "🖼️", "📎", "🎵", "📍"].map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => toast.info("Bientôt disponible!")}
                  className="w-10 h-10 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 transition-all flex items-center justify-center text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Main Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-3"
            >
              {/* Voice Button (Hold to talk) */}
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={cn(
                  "p-4 rounded-2xl transition-all transform active:scale-95 flex-shrink-0",
                  isRecording
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse"
                    : "bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20"
                )}
              >
                {isRecording ? <IoMic className="w-6 h-6" /> : <IoMicOutline className="w-6 h-6" />}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message Ti-Guy en joual..."
                  className="w-full px-5 py-4 rounded-2xl bg-[#3a2820]/80 border-2 border-[#d4af37]/30 text-[#e8dcc8] placeholder-[#8b7355] outline-none focus:border-[#d4af37]/60 transition-all text-[15px]"
                  style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)" }}
                />
              </div>

              {/* File Attach */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-2xl bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-all"
              >
                <IoAttach className="w-6 h-6" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={cn(
                  "p-4 rounded-2xl transition-all transform",
                  inputText.trim() && !isTyping
                    ? "bg-gradient-to-br from-[#d4af37] to-amber-600 text-black shadow-lg shadow-[#d4af37]/40 hover:scale-105"
                    : "bg-[#3a2820] text-[#8b7355] cursor-not-allowed"
                )}
              >
                <IoSend className="w-6 h-6" />
              </button>
            </form>

            {/* Voice Hint */}
            <div className="text-center mt-2 text-xs text-[#8b7355]">
              🎙️ Maintenez le bouton micro pour parler avec Ti-Guy
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatInterface;
