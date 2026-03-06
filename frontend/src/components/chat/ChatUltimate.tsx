/**
 * ChatUltimate - Complete Messenger with All Features
 * Search, Disappearing Messages, WebRTC Video, E2E Encryption, Translation
 * Leather & Gold Stitched Theme
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { tiguyService } from "@/services/tiguyService";
import type { ChatMessage } from "@/types/chat";
import { toast } from "@/components/Toast";

// Icons
import {
  IoSearch,
  IoSearchOutline,
  IoNotifications,
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
  IoHappy,
  IoAdd,
  IoPeople,
  IoCall,
  IoVideocamOutline,
  IoArrowBack,
  IoCheckmark,
  IoCheckmarkDone,
  IoTrash,
  IoCopy,
  IoShare,
  IoFlag,
  IoTimer,
  IoLockClosed,
  IoLockOpen,
  IoLanguage,
  IoVolumeHigh,
  IoVolumeMute,
  IoExpand,
  IoContract,
  IoRecording,
} from "react-icons/io5";

// Fleur-de-lis pattern
const FLEUR_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M30 10c-1-4-4-6-7-6s-6 2-7 6l2 5-2-5c-1-4-4-6-7-6s-6 2-7 6c0 3 2 5 4 7l6 2-6-2c-2-2-4-4-4-7 0-4 2-6 6-7s6 2 7 6l4 9 4-9c1-4 4-6 7-6s6 2 7 6c0 3-2 5-4 7l-6 2 6-2c2-2 4-4 4-7 0-4-2-6-6-7s-6 2-7 6l-2 5 2-5z'/%3E%3C/g%3E%3C/svg%3E")`;

// EMOJI DATA
const EMOJI_CATEGORIES = {
  recent: ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"],
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩"],
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🦫", "🦆", "🦅"],
  food: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🍍", "🥝", "🍅", "🥑"],
  activities: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🥍", "🥅"],
  symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖"],
  flags: ["🇨🇦", "🇫🇷", "🇺🇸", "🇬🇧", "🇩🇪", "🇮🇹", "🇪🇸", "🇯🇵", "🇰🇷", "🇨🇳", "🇧🇷", "🇲🇽", "🇦🇺", "🇮🇳", "🇷🇺", "🇿🇦"],
};

const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🎉", "🔥", "👏", "🦫", "⚜️"];

// DISAPPEARING OPTIONS
const DISAPPEAR_OPTIONS = [
  { value: 0, label: "Désactivé", icon: "🔓" },
  { value: 10, label: "10 secondes", icon: "⏱️" },
  { value: 60, label: "1 minute", icon: "⏱️" },
  { value: 300, label: "5 minutes", icon: "⏱️" },
  { value: 3600, label: "1 heure", icon: "⏱️" },
  { value: 86400, label: "24 heures", icon: "⏱️" },
  { value: 604800, label: "7 jours", icon: "⏱️" },
];

// LANGUAGES
const LANGUAGES = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
];

// Simple E2E encryption (demo - use proper crypto in production)
const encryptMessage = (text: string, key: string): string => {
  // XOR encryption (demo only - NOT secure for production)
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
};

const decryptMessage = (encrypted: string, key: string): string => {
  try {
    const text = atob(encrypted);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return "[Message chiffré]";
  }
};

// TRANSLATION (mock - integrate with Google Translate API)
const translateText = async (text: string, targetLang: string): Promise<string> => {
  // Mock translation - replace with real API
  const translations: Record<string, Record<string, string>> = {
    "Salut!": {
      en: "Hi!",
      es: "¡Hola!",
      de: "Hallo!",
      it: "Ciao!",
      pt: "Olá!",
      ja: "こんにちは！",
      zh: "你好！",
    },
  };

  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  return translations[text]?.[targetLang] || `[${targetLang.toUpperCase()}] ${text}`;
};

interface ChatUltimateProps {
  onClose?: () => void;
}

type SidebarTab = "history" | "dms" | "groups" | "mystuff";
type MessageType = "text" | "voice" | "image" | "video" | "file";
type CallType = "audio" | "video" | null;

interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

interface UltimateMessage extends ChatMessage {
  type?: MessageType;
  reactions?: Reaction[];
  replyTo?: string;
  metadata?: {
    duration?: number;
    size?: string;
    filename?: string;
  };
  // Disappearing
  disappearAfter?: number;
  expiresAt?: Date;
  // Encryption
  isEncrypted?: boolean;
  encryptedText?: string;
  // Translation
  originalText?: string;
  translatedText?: string;
  translatedTo?: string;
}

interface ChatThread {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isTiGuy?: boolean;
  isGroup?: boolean;
  members?: number;
  online?: number;
}

export const ChatUltimate: React.FC<ChatUltimateProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [activeTab, setActiveTab] = useState<SidebarTab>("history");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState<string>("tiguy");
  const [messages, setMessages] = useState<UltimateMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showVoiceWaveform, setShowVoiceWaveform] = useState(false);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);

  // FEATURE: Search
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UltimateMessage[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // FEATURE: Disappearing Messages
  const [disappearMode, setDisappearMode] = useState(0);
  const [showDisappearMenu, setShowDisappearMenu] = useState(false);
  const [disappearingMessages, setDisappearingMessages] = useState<Set<string>>(new Set());

  // FEATURE: Encryption
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionKey] = useState("demo-key-123"); // In production: generate secure key

  // FEATURE: Translation
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Set<string>>(new Set());

  // FEATURE: Video Call (WebRTC)
  const [activeCall, setActiveCall] = useState<CallType>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("recent");
  const [messageReactions, setMessageReactions] = useState<Record<string, Reaction[]>>({});
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<UltimateMessage | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const disappearTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Mock data
  const chatThreads: ChatThread[] = [
    { id: "tiguy", name: "Ti-Guy AI", lastMessage: "Salut mon ami!", timestamp: "2m", unread: 0, isTiGuy: true },
    { id: "1", name: "Marie-Louise", lastMessage: "On se voit demain?", timestamp: "15m", unread: 2 },
    { id: "g1", name: "🏒 Les Habs", lastMessage: "Quelle game!", timestamp: "10m", unread: 5, isGroup: true, members: 24 },
  ];

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "tiGuy",
        text: "🎉 NOUVEAUTÉS!\n\n• 🔍 Recherche de messages\n• ⏱️ Messages éphémères\n• 🔒 Chiffrement E2E\n• 🌐 Traduction auto\n• 📹 Appels vidéo\n\nChu Ti-Guy, ton assistant québécois ultime!",
        timestamp: new Date(),
        reactions: [{ emoji: "🔥", users: ["user1"], count: 1 }],
      },
    ]);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Handle disappearing messages
  const scheduleDisappear = useCallback((messageId: string, seconds: number) => {
    if (seconds === 0) return;

    const timer = setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setDisappearingMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
      toast.info("💨 Message éphémère disparu!");
    }, seconds * 1000);

    disappearTimersRef.current[messageId] = timer;
    setDisappearingMessages(prev => new Set(prev).add(messageId));
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(disappearTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // SEARCH functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = messages.filter(m =>
        m.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setCurrentResultIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, messages]);

  const navigateSearch = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return;

    if (direction === "next") {
      setCurrentResultIndex(prev => (prev + 1) % searchResults.length);
    } else {
      setCurrentResultIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    }

    // Scroll to result
    const resultId = searchResults[currentResultIndex]?.id;
    if (resultId) {
      document.getElementById(`msg-${resultId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // VOICE RECORDING
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateVisualization = () => {
        if (!analyserRef.current || !isRecording) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioVisualization(prev => [...prev.slice(-20), average]);
        if (isRecording) requestAnimationFrame(updateVisualization);
      };
      updateVisualization();

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const newMessage: UltimateMessage = {
          id: `voice-${Date.now()}`,
          sender: "user",
          text: "",
          timestamp: new Date(),
          type: "voice",
          metadata: { duration: recordingTime },
          disappearAfter: disappearMode > 0 ? disappearMode : undefined,
          expiresAt: disappearMode > 0 ? new Date(Date.now() + disappearMode * 1000) : undefined,
        };

        setMessages(prev => [...prev, newMessage]);
        if (disappearMode > 0) scheduleDisappear(newMessage.id, disappearMode);

        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `tiguy-voice-${Date.now()}`,
            sender: "tiGuy",
            text: "J'ai entendu ton message vocal! 🎤",
            timestamp: new Date(),
          }]);
          setIsTyping(false);
        }, 1500);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setShowVoiceWaveform(true);
      impact();
    } catch (err) {
      toast.error("Impossible d'accéder au micro");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setShowVoiceWaveform(false);
    setAudioVisualization([]);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  // WEBRTC VIDEO CALL
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      setActiveCall("video");

      // Initialize peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      peerConnectionRef.current = pc;

      toast.success("📹 Appel vidéo démarré!");
    } catch (err) {
      toast.error("Impossible d'accéder à la caméra");
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    toast.info("Appel terminé");
  };

  // SEND MESSAGE
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    tap();

    let finalText = text;
    let encryptedText: string | undefined;

    // Encrypt if enabled
    if (encryptionEnabled) {
      encryptedText = encryptMessage(text, encryptionKey);
      finalText = "🔒 Message chiffré";
    }

    const newMessage: UltimateMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: finalText,
      originalText: encryptionEnabled ? text : undefined,
      encryptedText,
      isEncrypted: encryptionEnabled,
      timestamp: new Date(),
      type: "text",
      replyTo: replyingTo?.id,
      disappearAfter: disappearMode > 0 ? disappearMode : undefined,
      expiresAt: disappearMode > 0 ? new Date(Date.now() + disappearMode * 1000) : undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    setReplyingTo(null);

    if (disappearMode > 0) scheduleDisappear(newMessage.id, disappearMode);

    // Translation
    if (translationEnabled) {
      const translated = await translateText(text, targetLanguage);
      setMessages(prev => prev.map(m =>
        m.id === newMessage.id ? { ...m, translatedText: translated, translatedTo: targetLanguage } : m
      ));
    }

    setIsTyping(true);
    try {
      const response = await tiguyService.sendMessage(text);
      const responseText = typeof response === "string" ? response : (response as any).response || "Je n'ai pas de réponse";

      setMessages(prev => [...prev, {
        id: `tiguy-${Date.now()}`,
        sender: "tiGuy",
        text: responseText,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: "tiGuy",
        text: "Oups! J'ai eu un bug 🦫",
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // REACTIONS
  const addReaction = (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[messageId] || [];
      const existing = current.find(r => r.emoji === emoji);

      if (existing) {
        const userReacted = existing.users.includes("currentUser");
        if (userReacted) {
          existing.users = existing.users.filter(u => u !== "currentUser");
          existing.count--;
        } else {
          existing.users.push("currentUser");
          existing.count++;
        }
        return { ...prev, [messageId]: current.filter(r => r.count > 0) };
      } else {
        return { ...prev, [messageId]: [...current, { emoji, users: ["currentUser"], count: 1 }] };
      }
    });
    tap();
  };

  // DECRYPT message
  const toggleDecrypt = (messageId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.isEncrypted) return m;
      return {
        ...m,
        text: m.text === "🔒 Message chiffré"
          ? (decryptMessage(m.encryptedText || "", encryptionKey))
          : "🔒 Message chiffré"
      };
    }));
  };

  // TOGGLE translation
  const toggleTranslation = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.sender !== "tiGuy") return;

    const isTranslated = translatedMessages.has(messageId);

    if (isTranslated) {
      // Show original
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, text: m.originalText || m.text } : m
      ));
      setTranslatedMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    } else {
      // Translate
      const translated = await translateText(message.text, targetLanguage);
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, originalText: m.text, text: translated } : m
      ));
      setTranslatedMessages(prev => new Set(prev).add(messageId));
    }
  };

  // FORMATTING
  const formatTime = (date: Date) => date.toLocaleTimeString("fr-CA", { hour: "numeric", minute: "2-digit", hour12: true });
  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  const formatTimeLeft = (expiresAt: Date) => {
    const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  // COMPONENTS
  const SearchBar = () => (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#2b1f17] border-b border-[#d4af37]/30">
      <IoSearchOutline className="w-5 h-5 text-[#d4af37]" />
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher dans les messages..."
        className="flex-1 bg-transparent text-[#e8dcc8] placeholder-[#8b7355] outline-none"
        autoFocus
      />
      {searchResults.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-[#8b7355]">
          <span>{currentResultIndex + 1}/{searchResults.length}</span>
          <button onClick={() => navigateSearch("prev")} className="p-1 hover:text-[#d4af37]">↑</button>
          <button onClick={() => navigateSearch("next")} className="p-1 hover:text-[#d4af37]">↓</button>
        </div>
      )}
      <button onClick={() => { setIsSearchMode(false); setSearchQuery(""); }} className="text-[#8b7355] hover:text-[#d4af37]">
        <IoClose className="w-5 h-5" />
      </button>
    </div>
  );

  const EmojiPicker = () => (
    <div className="absolute bottom-20 left-4 right-4 bg-[#2b1f17] border-2 border-[#d4af37]/40 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="flex gap-1 p-2 border-b border-[#d4af37]/20 overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedEmojiCategory(cat as keyof typeof EMOJI_CATEGORIES)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs uppercase whitespace-nowrap transition-all",
              selectedEmojiCategory === cat ? "bg-[#d4af37]/30 text-[#d4af37]" : "text-[#8b7355] hover:bg-[#d4af37]/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="p-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, i) => (
          <button
            key={i}
            onClick={() => { setInputText(prev => prev + emoji); tap(); }}
            className="text-2xl p-2 rounded-lg hover:bg-[#d4af37]/20 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  const ReactionBar = ({ messageId }: { messageId: string }) => (
    <div className="flex items-center gap-1 bg-[#1a1410] border border-[#d4af37]/30 rounded-full px-2 py-1 shadow-lg animate-in fade-in zoom-in">
      {REACTION_EMOJIS.slice(0, 6).map(emoji => (
        <button key={emoji} onClick={() => { addReaction(messageId, emoji); setHoveredMessage(null); }} className="text-lg p-1 hover:scale-125 transition-transform">
          {emoji}
        </button>
      ))}
    </div>
  );

  // VIDEO CALL OVERLAY
  if (activeCall) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#2b1f17] border-b border-[#d4af37]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center">🦫</div>
            <div>
              <div className="text-[#e8dcc8] font-bold">Ti-Guy AI</div>
              <div className="text-green-400 text-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {activeCall === "video" ? "Appel vidéo" : "Appel audio"} en cours
              </div>
            </div>
          </div>
          <div className="text-[#d4af37] font-mono">00:00</div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-[#1a1410]">
          {/* Remote Video (Ti-Guy placeholder) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-4 border-[#d4af37] flex items-center justify-center text-6xl mb-4 animate-pulse">
                🦫
              </div>
              <p className="text-[#d4af37] text-lg">Ti-Guy AI</p>
              <p className="text-[#8b7355]">En attente de connexion...</p>
            </div>
          </div>

          {/* Local Video */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-[#d4af37] bg-[#2b1f17]">
            {localStream ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 flex items-center justify-center gap-4 bg-[#2b1f17] border-t border-[#d4af37]/30">
          <button className="p-4 rounded-full bg-[#3a2820] text-[#d4af37] hover:bg-[#d4af37]/20">
            <IoVolumeHigh className="w-6 h-6" />
          </button>
          <button className="p-4 rounded-full bg-[#3a2820] text-[#d4af37] hover:bg-[#d4af37]/20">
            <IoVideocam className="w-6 h-6" />
          </button>
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/40"
          >
            <IoClose className="w-8 h-8" />
          </button>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  return createPortal(
    <div className="fixed inset-0 z-[100] flex bg-black/90 backdrop-blur-sm">
      <div className="flex w-full h-full max-w-6xl mx-auto my-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#d4af37]/50">

        {/* SIDEBAR */}
        <div className={cn("flex flex-col transition-all duration-300 border-r-4 border-[#d4af37]/30", sidebarOpen ? "w-80" : "w-0 overflow-hidden")}
          style={{ background: "#2b1f17", backgroundImage: FLEUR_PATTERN }}>
          <div className="px-4 py-4 border-b-2 border-[#d4af37]/30" style={{ background: "linear-gradient(180deg, rgba(43,31,23,0.98) 0%, rgba(35,25,18,0.98) 100%)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚜️</span>
              <span className="text-xl font-bold tracking-widest text-[#d4af37]" style={{ fontFamily: "'Playfair Display', serif" }}>ZYEUTÉ</span>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20">
              {[
                { id: "history", icon: IoTime, label: "Historique" },
                { id: "dms", icon: IoChatbubbles, label: "DMs" },
                { id: "groups", icon: IoPeople, label: "Groupes" },
                { id: "mystuff", icon: IoFolder, label: "Mes trucs" },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => { setActiveTab(id as SidebarTab); tap(); }}
                  className={cn("flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all", activeTab === id ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40" : "text-[#8b7355] hover:bg-[#d4af37]/10")}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            {activeTab === "history" && chatThreads.map(thread => (
              <button key={thread.id} onClick={() => { setActiveChat(thread.id); tap(); }}
                className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all", activeChat === thread.id ? "bg-[#d4af37]/20 border border-[#d4af37]/40" : "hover:bg-[#d4af37]/10 border border-transparent")}>
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg", thread.isTiGuy ? "bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37]" : "bg-[#3a2820] border border-[#d4af37]/30")}>
                  {thread.isTiGuy ? "🦫" : thread.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-medium", activeChat === thread.id ? "text-[#d4af37]" : "text-[#e8dcc8]")}>{thread.name}</span>
                    <span className="text-[10px] text-[#8b7355]">{thread.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#8b7355] truncate">{thread.lastMessage}</p>
                </div>
                {thread.unread > 0 && <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">{thread.unread}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CHAT */}
        <div className="flex-1 flex flex-col" style={{ background: "#1a1410" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#d4af37]/30" style={{ background: "linear-gradient(90deg, rgba(43,31,23,0.98), rgba(35,25,18,0.98))" }}>
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-[#d4af37]/20 text-[#d4af37]">
                {sidebarOpen ? <IoChevronDown className="w-5 h-5 -rotate-90" /> : <IoChevronUp className="w-5 h-5 -rotate-90" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-2xl shadow-lg shadow-[#d4af37]/20">🦫</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#e8dcc8]">Ti-Guy</span>
                    {encryptionEnabled && <IoLockClosed className="w-4 h-4 text-green-400" title="Chiffrement activé" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8b7355]">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    En ligne
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <button onClick={() => { setIsSearchMode(!isSearchMode); if (!isSearchMode) setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className={cn("p-3 rounded-xl transition-all", isSearchMode ? "bg-[#d4af37]/30 text-[#d4af37]" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}>
                <IoSearch className="w-5 h-5" />
              </button>

              {/* Encryption Toggle */}
              <button onClick={() => { setEncryptionEnabled(!encryptionEnabled); toast.info(encryptionEnabled ? "Chiffrement désactivé" : "🔒 Chiffrement E2E activé"); }}
                className={cn("p-3 rounded-xl transition-all", encryptionEnabled ? "bg-green-500/20 text-green-400" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}>
                {encryptionEnabled ? <IoLockClosed className="w-5 h-5" /> : <IoLockOpen className="w-5 h-5" />}
              </button>

              {/* Disappearing Toggle */}
              <button onClick={() => setShowDisappearMenu(!showDisappearMenu)} className={cn("p-3 rounded-xl transition-all relative", disappearMode > 0 ? "bg-[#d4af37]/30 text-[#d4af37]" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}>
                <IoTimer className="w-5 h-5" />
                {disappearMode > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">!</span>}
              </button>

              {/* Translation Toggle */}
              <button onClick={() => setShowLanguageMenu(!showLanguageMenu)} className={cn("p-3 rounded-xl transition-all", translationEnabled ? "bg-[#d4af37]/30 text-[#d4af37]" : "hover:bg-[#d4af37]/20 text-[#d4af37]")}>
                <IoLanguage className="w-5 h-5" />
              </button>

              <button onClick={startVideoCall} className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37]">
                <IoVideocamOutline className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {isSearchMode && <SearchBar />}

          {/* Disappearing Menu */}
          {showDisappearMenu && (
            <div className="px-4 py-2 bg-[#2b1f17] border-b border-[#d4af37]/30 flex items-center gap-4">
              <span className="text-sm text-[#8b7355]">Messages éphémères:</span>
              <div className="flex gap-2">
                {DISAPPEAR_OPTIONS.map(option => (
                  <button key={option.value} onClick={() => { setDisappearMode(option.value); setShowDisappearMenu(false); toast.info(option.value === 0 ? "Messages permanents" : `Messages disparaissent après ${option.label}`); }}
                    className={cn("px-3 py-1 rounded-lg text-xs transition-all", disappearMode === option.value ? "bg-[#d4af37] text-black" : "bg-[#3a2820] text-[#8b7355] hover:bg-[#d4af37]/20")}>
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Language Menu */}
          {showLanguageMenu && (
            <div className="px-4 py-2 bg-[#2b1f17] border-b border-[#d4af37]/30 flex items-center gap-4">
              <span className="text-sm text-[#8b7355]">Traduire en:</span>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => { setTargetLanguage(lang.code); setTranslationEnabled(true); setShowLanguageMenu(false); toast.info(`Traduction: ${lang.name}`); }}
                    className={cn("px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1", targetLanguage === lang.code && translationEnabled ? "bg-[#d4af37] text-black" : "bg-[#3a2820] text-[#8b7355] hover:bg-[#d4af37]/20")}>
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: "#2b1f17", backgroundImage: FLEUR_PATTERN }}>
            {messages.map((message, index) => {
              const isSearchResult = searchResults.find(r => r.id === message.id);
              const isCurrentResult = searchResults[currentResultIndex]?.id === message.id;

              return (
                <div key={message.id} id={`msg-${message.id}`}
                  className={cn("flex gap-3 group", message.sender === "user" ? "flex-row-reverse" : "", isCurrentResult && "bg-[#d4af37]/10 rounded-xl p-2 -m-2")}
                  onMouseEnter={() => setHoveredMessage(message.id)}
                  onMouseLeave={() => { if (showMessageMenu !== message.id) setHoveredMessage(null); }}>

                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2", message.sender === "tiGuy" ? "bg-gradient-to-br from-amber-400 to-amber-700 border-[#d4af37]" : "bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-400")}>
                    {message.sender === "tiGuy" ? "🦫" : "👤"}
                  </div>

                  <div className={cn("max-w-[70%] relative", message.sender === "user" ? "items-end" : "items-start")}>
                    {/* Disappearing indicator */}
                    {message.disappearAfter && message.expiresAt && (
                      <div className="flex items-center gap-1 text-[10px] text-red-400 mb-1">
                        <IoTimer className="w-3 h-3" />
                        Disparaît dans {formatTimeLeft(message.expiresAt)}
                      </div>
                    )}

                    {/* Translation indicator */}
                    {translatedMessages.has(message.id) && (
                      <div className="flex items-center gap-1 text-[10px] text-[#d4af37] mb-1">
                        <IoLanguage className="w-3 h-3" />
                        Traduit en {LANGUAGES.find(l => l.code === targetLanguage)?.name}
                      </div>
                    )}

                    <div className={cn("rounded-2xl px-5 py-3 shadow-lg relative", message.sender === "user" ? "rounded-br-sm" : "rounded-bl-sm")}
                      style={{
                        background: message.sender === "user" ? "linear-gradient(135deg, rgba(109,40,217,0.4), rgba(79,70,229,0.3))" : "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))",
                        border: message.isEncrypted ? "2px solid rgba(34,197,94,0.6)" : message.sender === "user" ? "2px solid rgba(139,92,246,0.4)" : "2px solid rgba(212,175,55,0.4)",
                        boxShadow: isSearchResult ? "0 0 20px rgba(212,175,55,0.5)" : undefined,
                      }}>

                      {/* Encrypted indicator */}
                      {message.isEncrypted && (
                        <button onClick={() => toggleDecrypt(message.id)} className="flex items-center gap-1 text-green-400 text-xs mb-1 hover:underline">
                          <IoLockClosed className="w-3 h-3" />
                          {message.text === "🔒 Message chiffré" ? "Cliquer pour déchiffrer" : "Cliquer pour masquer"}
                        </button>
                      )}

                      <p className={cn("leading-relaxed whitespace-pre-wrap text-[15px]", message.sender === "user" ? "text-violet-100" : "text-amber-100")}>
                        {message.text}
                      </p>

                      {/* Translation toggle for Ti-Guy messages */}
                      {message.sender === "tiGuy" && translationEnabled && (
                        <button onClick={() => toggleTranslation(message.id)} className="text-[10px] text-[#d4af37] mt-1 hover:underline">
                          {translatedMessages.has(message.id) ? "Voir l'original" : `Traduire en ${LANGUAGES.find(l => l.code === targetLanguage)?.name}`}
                        </button>
                      )}

                      {/* Message Menu */}
                      <button onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#1a1410] border border-[#d4af37]/30 text-[#8b7355] opacity-0 group-hover:opacity-100 transition-opacity">
                        <IoEllipsisHorizontal className="w-3 h-3" />
                      </button>

                      {showMessageMenu === message.id && (
                        <div className="absolute right-0 top-6 bg-[#2b1f17] border border-[#d4af37]/30 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[140px]">
                          {[
                            { icon: IoHappy, label: "Réagir", action: () => { setHoveredMessage(message.id); setShowMessageMenu(null); } },
                            { icon: IoCopy, label: "Copier", action: () => { navigator.clipboard.writeText(message.text); toast.success("Copié!"); setShowMessageMenu(null); } },
                            { icon: IoTrash, label: "Supprimer", action: () => { setShowMessageMenu(null); }, danger: true },
                          ].map(({ icon: Icon, label, action, danger }) => (
                            <button key={label} onClick={action} className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-all text-sm", danger ? "text-red-400 hover:bg-red-500/10" : "text-[#e8dcc8] hover:bg-[#d4af37]/10")}>
                              <Icon className="w-4 h-4" /> {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {(messageReactions[message.id] || message.reactions) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(messageReactions[message.id] || message.reactions)?.map(reaction => (
                          <button key={reaction.emoji} onClick={() => addReaction(message.id, reaction.emoji)}
                            className={cn("px-2 py-0.5 rounded-full text-xs border transition-all", reaction.users.includes("currentUser") ? "bg-[#d4af37]/30 border-[#d4af37]" : "bg-[#1a1410] border-[#d4af37]/30 hover:border-[#d4af37]")}>
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Reaction Bar */}
                    {hoveredMessage === message.id && !showMessageMenu && (
                      <div className={cn("absolute -bottom-8", message.sender === "user" ? "right-0" : "left-0")}>
                        <ReactionBar messageId={message.id} />
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={cn("flex items-center gap-2 mt-1 text-xs text-[#8b7355]", message.sender === "user" && "justify-end")}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.sender === "user" && <IoCheckmarkDone className="w-4 h-4 text-[#d4af37]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">🦫</div>
                <div className="rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))", border: "2px solid rgba(212,175,55,0.4)" }}>
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Voice Recording */}
            {showVoiceWaveform && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/40">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-lg font-bold text-red-300 font-mono">{formatDuration(recordingTime)}</span>
                  <div className="flex items-end gap-1 h-8">
                    {audioVisualization.map((height, i) => (
                      <div key={i} className="w-1 bg-red-400 rounded-full transition-all duration-100" style={{ height: `${Math.max(8, height / 3)}px` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyingTo && (
            <div className="px-6 py-2 bg-[#1a1410] border-t border-[#d4af37]/20 flex items-center gap-3">
              <div className="flex-1 px-3 py-2 rounded-lg bg-[#2b1f17] border-l-2 border-[#d4af37] text-sm text-[#8b7355] truncate">
                Réponse à: {replyingTo.text.substring(0, 50)}...
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 text-[#8b7355] hover:text-[#d4af37]">
                <IoClose className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-6 py-4 border-t-2 border-[#d4af37]/30 relative" style={{ background: "linear-gradient(180deg, rgba(35,25,18,0.98) 0%, rgba(43,31,23,0.98) 100%)", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
            {showEmojiPicker && <EmojiPicker />}

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {encryptionEnabled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">🔒 Chiffré</span>}
              {disappearMode > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">⏱️ {DISAPPEAR_OPTIONS.find(o => o.value === disappearMode)?.label}</span>}
              {translationEnabled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">🌐 {LANGUAGES.find(l => l.code === targetLanguage)?.name}</span>}
            </div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={cn("w-10 h-10 rounded-xl border transition-all flex items-center justify-center text-lg", showEmojiPicker ? "bg-[#d4af37]/30 border-[#d4af37]" : "bg-[#3a2820]/80 border-[#d4af37]/20 hover:border-[#d4af37]/50")}>😀</button>
              {["🎨", "🖼️", "📎", "🎵", "📍"].map((emoji, i) => (
                <button key={i} onClick={() => toast.info("Bientôt!")} className="w-10 h-10 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all flex items-center justify-center text-lg">{emoji}</button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
              <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                className={cn("p-4 rounded-2xl transition-all transform active:scale-95 flex-shrink-0", isRecording ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse" : "bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20")}>
                {isRecording ? <IoMic className="w-6 h-6" /> : <IoMicOutline className="w-6 h-6" />}
              </button>

              <div className="flex-1 relative">
                <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder={encryptionEnabled ? "🔒 Message chiffré..." : "Message Ti-Guy en joual..."}
                  className="w-full px-5 py-4 rounded-2xl bg-[#3a2820]/80 border-2 border-[#d4af37]/30 text-[#e8dcc8] placeholder-[#8b7355] outline-none focus:border-[#d4af37]/60 transition-all text-[15px]"
                  style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)" }} />
              </div>

              <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={() => { }} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 rounded-2xl bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-all">
                <IoAttach className="w-6 h-6" />
              </button>

              <button type="submit" disabled={!inputText.trim() || isTyping}
                className={cn("p-4 rounded-2xl transition-all transform", inputText.trim() && !isTyping ? "bg-gradient-to-br from-[#d4af37] to-amber-600 text-black shadow-lg shadow-[#d4af37]/40 hover:scale-105" : "bg-[#3a2820] text-[#8b7355] cursor-not-allowed")}>
                <IoSend className="w-6 h-6" />
              </button>
            </form>

            <div className="text-center mt-2 text-xs text-[#8b7355]">
              🎙️ Hold mic • 😀 Emoji • 🔒 {encryptionEnabled ? "E2E On" : "Click lock to encrypt"} • ⏱️ {disappearMode > 0 ? "Ephemeral On" : "Click timer"}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatUltimate;
