/**
 * 💬 Messages / DMs Page
 * Direct messaging interface for Zyeuté users
 * With Ambient Mood Lighting ✨
 */

import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";

interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isOnline: boolean;
    isVerified: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: Date;
    isRead: boolean;
    isMine: boolean;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isMine: boolean;
  status: "sent" | "delivered" | "read";
}

// Mock data - would come from API
const mockConversations: Conversation[] = [
  {
    id: "1",
    user: {
      id: "u1",
      username: "marie_mtl",
      displayName: "Marie Lavoie",
      avatarUrl: undefined,
      isOnline: true,
      isVerified: true,
    },
    lastMessage: {
      text: "Hé! T'as vu le nouveau vidéo de Loud? C'est malade!",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
      isRead: false,
      isMine: false,
    },
    unreadCount: 2,
  },
  {
    id: "2",
    user: {
      id: "u2",
      username: "jean_qc",
      displayName: "Jean-François",
      avatarUrl: undefined,
      isOnline: false,
      isVerified: false,
    },
    lastMessage: {
      text: "On se rejoint au Centre Bell ce soir?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: true,
      isMine: true,
    },
    unreadCount: 0,
  },
  {
    id: "3",
    user: {
      id: "u3",
      username: "sophie_plateau",
      displayName: "Sophie",
      avatarUrl: undefined,
      isOnline: true,
      isVerified: false,
    },
    lastMessage: {
      text: "Merci pour la poutine! La Banquise c'était sick",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true,
      isMine: false,
    },
    unreadCount: 0,
  },
  {
    id: "4",
    user: {
      id: "u4",
      username: "alex_514",
      displayName: "Alexandre Tremblay",
      avatarUrl: undefined,
      isOnline: false,
      isVerified: true,
    },
    lastMessage: {
      text: "Check mon nouveau post! 🔥",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      isRead: true,
      isMine: false,
    },
    unreadCount: 0,
  },
];

const mockMessages: Message[] = [
  {
    id: "m1",
    text: "Salut! Comment ça va?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isMine: false,
    status: "read",
  },
  {
    id: "m2",
    text: "Ça va super bien! Toi?",
    timestamp: new Date(Date.now() - 1000 * 60 * 28),
    isMine: true,
    status: "read",
  },
  {
    id: "m3",
    text: "Parfait! T'as vu le match des Habs hier?",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    isMine: false,
    status: "read",
  },
  {
    id: "m4",
    text: "Oui! Gallagher était en feu! 🔥",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    isMine: true,
    status: "read",
  },
  {
    id: "m5",
    text: "Hé! T'as vu le nouveau vidéo de Loud? C'est malade!",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isMine: false,
    status: "delivered",
  },
];

type AmbientMode = 'default' | 'thinking' | 'royal' | 'night' | 'charging' | 'warning';

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const haptics = useHaptics();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ambientMode, setAmbientMode] = useState<AmbientMode>('default');
  const [glowPhase, setGlowPhase] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Breathing animation loop
  useEffect(() => {
    let animationId: number;
    let startTime = Date.now();
    
    const breathe = () => {
      const elapsed = Date.now() - startTime;
      const phase = (elapsed % 10000) / 10000;
      const value = 0.3 + (Math.sin(phase * Math.PI * 2) + 1) / 2 * 0.2;
      setGlowPhase(value);
      animationId = requestAnimationFrame(breathe);
    };
    
    animationId = requestAnimationFrame(breathe);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Ambient colors based on mode
  const ambientColors = {
    default: ['#1a1a2e', '#16213e', '#0f3460'],
    thinking: ['#2d1b4e', '#1a1a2e', '#4a148c'],
    royal: ['#0d1b2a', '#1b263b', '#d4af37'],
    night: ['#000000', '#0a0a0a', '#1a1a1a'],
    charging: ['#1a1a2e', '#2e1a12', '#d4af37'],
    warning: ['#2e1a12', '#4a2c1f', '#8b0000'],
  };

  const currentColors = ambientColors[ambientMode];

  // Filter conversations based on search
  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Load messages when conversation is selected
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMessages(mockMessages);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "maintenant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return date.toLocaleDateString("fr-CA");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: `m${Date.now()}`,
      text: newMessage,
      timestamp: new Date(),
      isMine: true,
      status: "sent",
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient Mood Lighting Background */}
      <div 
        className="absolute inset-0 -z-10 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at center bottom, ${currentColors[0]} 0%, ${currentColors[1]} 50%, ${currentColors[2]} 100%)`,
          opacity: 0.4 * glowPhase,
          filter: 'blur(60px)',
        }}
      />
      
      {/* Gold Edge Glow for Royal/Charging Mode */}
      {(ambientMode === 'royal' || ambientMode === 'charging') && (
        <div 
          className="absolute inset-4 rounded-3xl pointer-events-none -z-5"
          style={{
            boxShadow: `inset 0 0 ${100 * glowPhase}px rgba(212, 175, 55, ${0.3 * glowPhase})`,
          }}
        />
      )}

      <Header title="Messages" showSearch={false} />

      {/* Ambient Mode Toggle */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          onClick={() => setAmbientMode(prev => prev === 'royal' ? 'default' : 'royal')}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all shadow-lg",
            ambientMode === 'royal' 
              ? "bg-[#d4af37] text-black" 
              : "bg-gray-800/80 text-white/80 hover:bg-gray-700"
          )}
        >
          ✨ Royal
        </button>
        <button
          onClick={() => setAmbientMode(prev => prev === 'thinking' ? 'default' : 'thinking')}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all shadow-lg",
            ambientMode === 'thinking' 
              ? "bg-purple-500 text-white" 
              : "bg-gray-800/80 text-white/80 hover:bg-gray-700"
          )}
        >
          💭 Think
        </button>
        <button
          onClick={() => setAmbientMode('default')}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-all shadow-lg",
            ambientMode === 'default' 
              ? "bg-blue-500 text-white" 
              : "bg-gray-800/80 text-white/80 hover:bg-gray-700"
          )}
        >
          🌙 Default
        </button>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Conversations List */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
            "flex flex-col",
            selectedConversation && "hidden md:flex",
          )}
        >
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* New Message Button */}
          <button className="m-4 px-4 py-2 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nouveau message
          </button>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Aucune conversation trouvée</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                    selectedConversation?.id === conv.id &&
                      "bg-gray-100 dark:bg-gray-700",
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold">
                      {conv.user.avatarUrl ? (
                        <img
                          src={conv.user.avatarUrl}
                          alt={conv.user.username}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        conv.user.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {conv.user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          "font-semibold truncate",
                          conv.unreadCount > 0 && "text-black dark:text-white",
                        )}
                      >
                        {conv.user.displayName}
                      </span>
                      {conv.user.isVerified && (
                        <span className="text-gold-500">✓</span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm truncate",
                        conv.unreadCount > 0
                          ? "text-black dark:text-white font-medium"
                          : "text-gray-500",
                      )}
                    >
                      {conv.lastMessage.isMine && "Toi: "}
                      {conv.lastMessage.text}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">
                      {formatTime(conv.lastMessage.timestamp)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-gold-500 text-black rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-white dark:bg-gray-800",
            !selectedConversation && "hidden md:flex",
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold">
                    {selectedConversation.user.displayName
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  {selectedConversation.user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">
                      {selectedConversation.user.displayName}
                    </span>
                    {selectedConversation.user.isVerified && (
                      <span className="text-gold-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.user.isOnline
                      ? "En ligne"
                      : "Hors ligne"}
                  </p>
                </div>

                <Link
                  to={`/profile/${selectedConversation.user.username}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.isMine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-2 rounded-2xl",
                        msg.isMine
                          ? "bg-gradient-to-r from-gold-400 to-gold-600 text-black"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
                      )}
                    >
                      <p>{msg.text}</p>
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1",
                          msg.isMine ? "justify-end" : "justify-start",
                        )}
                      >
                        <span className="text-xs opacity-70">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.isMine && (
                          <span className="text-xs">
                            {msg.status === "read"
                              ? "✓✓"
                              : msg.status === "delivered"
                                ? "✓"
                                : "○"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Écris ton message..."
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-gradient-to-r from-gold-400 to-gold-600 text-black rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
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
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <svg
                className="w-24 h-24 mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Tes messages</h3>
              <p className="text-center max-w-xs">
                Sélectionne une conversation pour commencer à jaser! 🦫
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
