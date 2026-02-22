/**
 * ChatInterfaceEnhanced - Full-featured Messenger
 * Features: Emoji Picker, Reactions, Voice Recording, Group Chat
 * Leather & Gold Stitched Theme
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "react-icons/io5";

// Fleur-de-lis pattern
const FLEUR_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M30 10c-1-4-4-6-7-6s-6 2-7 6l2 5-2-5c-1-4-4-6-7-6s-6 2-7 6c0 3 2 5 4 7l6 2-6-2c-2-2-4-4-4-7 0-4 2-6 6-7s6 2 7 6l4 9 4-9c1-4 4-6 7-6s6 2 7 6c0 3-2 5-4 7l-6 2 6-2c2-2 4-4 4-7 0-4-2-6-6-7s-6 2-7 6l-2 5 2-5z'/%3E%3C/g%3E%3C/svg%3E")`;

// Emoji categories
const EMOJI_CATEGORIES = {
  recent: ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"],
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩"],
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🦫", "🦆", "🦅"],
  food: ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🍍", "🥝", "🍅", "🥑"],
  activities: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🥍", "🥅"],
  travel: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🚲"],
  objects: ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸"],
  symbols: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖"],
  flags: ["🇨🇦", "🇫🇷", "🇺🇸", "🇬🇧", "🇩🇪", "🇮🇹", "🇪🇸", "🇯🇵", "🇰🇷", "🇨🇳", "🇧🇷", "🇲🇽", "🇦🇺", "🇮🇳", "🇷🇺", "🇿🇦"],
};

// Reaction emojis
const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🎉", "🔥", "👏", "🦫", "⚜️"];

interface ChatInterfaceProps {
  onClose?: () => void;
}

type SidebarTab = "history" | "dms" | "groups" | "mystuff";
type MyStuffSubmenu = "files" | "photos" | "audio" | "videos" | "settings";
type MessageType = "text" | "voice" | "image" | "video" | "file";

interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

interface EnhancedMessage extends ChatMessage {
  type?: MessageType;
  reactions?: Reaction[];
  replyTo?: string;
  isForwarded?: boolean;
  isPinned?: boolean;
  metadata?: {
    duration?: number; // For voice messages
    size?: string; // For files
    filename?: string;
  };
}

interface ChatThread {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isTiGuy?: boolean;
  isGroup?: boolean;
  members?: number;
  online?: number;
}

interface GroupChat {
  id: string;
  name: string;
  avatar?: string;
  members: string[];
  admins: string[];
  description?: string;
  isPublic?: boolean;
}

export const ChatInterfaceEnhanced: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [activeTab, setActiveTab] = useState<SidebarTab>("history");
  const [activeSubmenu, setActiveSubmenu] = useState<MyStuffSubmenu>("files");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState<string>("tiguy");
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showVoiceWaveform, setShowVoiceWaveform] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>("recent");
  const [messageReactions, setMessageReactions] = useState<Record<string, Reaction[]>>({});
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Mock data
  const chatThreads: ChatThread[] = [
    { id: "tiguy", name: "Ti-Guy AI", lastMessage: "Salut mon ami!", timestamp: "2m", unread: 0, isTiGuy: true },
    { id: "1", name: "Marie-Louise", lastMessage: "On se voit demain?", timestamp: "15m", unread: 2 },
    { id: "2", name: "Jean-Guy", lastMessage: "Tabarnak c'était fou!", timestamp: "1h", unread: 0 },
    { id: "3", name: "Sophie", lastMessage: "🎬 Nouvelle vidéo", timestamp: "3h", unread: 5 },
  ];

  const dmThreads: ChatThread[] = [
    { id: "dm1", name: "@marie_quebec", lastMessage: "Merci!", timestamp: "5m", unread: 1 },
    { id: "dm2", name: "@ti_guy_fan", lastMessage: "Photo envoyée", timestamp: "30m", unread: 0 },
  ];

  const groupChats: ChatThread[] = [
    { id: "g1", name: "🏒 Les Habs Fans", lastMessage: "Quelle game hier!", timestamp: "10m", unread: 12, isGroup: true, members: 24, online: 8 },
    { id: "g2", name: "🍁 Québec Pride", lastMessage: "Belle photo du Château!", timestamp: "1h", unread: 3, isGroup: true, members: 156, online: 23 },
    { id: "g3", name: "💻 Dev Team", lastMessage: "PR merged ✅", timestamp: "3h", unread: 0, isGroup: true, members: 8, online: 4 },
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "tiGuy",
        text: "Ayoye! Bienvenue dans Zyeuté Messenger! 🦫⚜️\n\nChu Ti-Guy, ton assistant québécois. Nouveau: tu peux réagir aux messages, m'envoyer des messages vocaux, et créer des groupes!",
        timestamp: new Date(),
        reactions: [{ emoji: "👍", users: ["user1"], count: 1 }],
      },
    ]);
  }, []);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // REAL VOICE RECORDING
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Update visualization
      const updateVisualization = () => {
        if (!analyserRef.current || !isRecording) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioVisualization(prev => [...prev.slice(-20), average]);
        if (isRecording) requestAnimationFrame(updateVisualization);
      };
      updateVisualization();

      // Set up media recorder
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setMessages(prev => [...prev, {
          id: `voice-${Date.now()}`,
          sender: "user",
          text: "",
          timestamp: new Date(),
          type: "voice",
          metadata: { duration: recordingTime },
        }]);

        // Ti-Guy responds
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `tiguy-voice-${Date.now()}`,
            sender: "tiGuy",
            text: "J'ai entendu ton message vocal! Chu en train de réfléchir... 🦫",
            timestamp: new Date(),
          }]);
          setIsTyping(false);
        }, 1500);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setShowVoiceWaveform(true);
      impact();
    } catch (err) {
      toast.error("Impossible d'accéder au micro");
      console.error("Microphone error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setShowVoiceWaveform(false);
    setAudioVisualization([]);
  };

  // Send text message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    tap();
    
    const userMsg: EnhancedMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
      type: "text",
      replyTo: replyingTo?.id,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setReplyingTo(null);
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
        type: "text",
      }]);
    } catch (error) {
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

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[messageId] || [];
      const existing = current.find(r => r.emoji === emoji);
      
      if (existing) {
        // Toggle reaction
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
        // Add new reaction
        return {
          ...prev,
          [messageId]: [...current, { emoji, users: ["currentUser"], count: 1 }],
        };
      }
    });
    tap();
  };

  // File upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    tap();
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const type: MessageType = isImage ? "image" : isVideo ? "video" : "file";
    
    setMessages(prev => [...prev, {
      id: `file-${Date.now()}`,
      sender: "user",
      text: isImage || isVideo ? "" : file.name,
      timestamp: new Date(),
      type,
      metadata: { 
        filename: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      },
    }]);
  };

  // Emoji picker component
  const EmojiPicker = () => (
    <div className="absolute bottom-20 left-4 right-4 bg-[#2b1f17] border-2 border-[#d4af37]/40 rounded-2xl shadow-2xl overflow-hidden z-50">
      {/* Categories */}
      <div className="flex gap-1 p-2 border-b border-[#d4af37]/20 overflow-x-auto">
        {Object.keys(EMOJI_CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedEmojiCategory(cat as keyof typeof EMOJI_CATEGORIES)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs uppercase whitespace-nowrap transition-all",
              selectedEmojiCategory === cat
                ? "bg-[#d4af37]/30 text-[#d4af37]"
                : "text-[#8b7355] hover:bg-[#d4af37]/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {/* Emojis */}
      <div className="p-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, i) => (
          <button
            key={i}
            onClick={() => {
              setInputText(prev => prev + emoji);
              tap();
            }}
            className="text-2xl p-2 rounded-lg hover:bg-[#d4af37]/20 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  // Reaction bar component
  const ReactionBar = ({ messageId }: { messageId: string }) => (
    <div className="flex items-center gap-1 bg-[#1a1410] border border-[#d4af37]/30 rounded-full px-2 py-1 shadow-lg animate-in fade-in zoom-in duration-200">
      {REACTION_EMOJIS.slice(0, 6).map(emoji => (
        <button
          key={emoji}
          onClick={() => { addReaction(messageId, emoji); setHoveredMessage(null); }}
          className="text-lg p-1 hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
      <button
        onClick={() => setShowEmojiPicker(true)}
        className="p-1 text-[#8b7355] hover:text-[#d4af37]"
      >
        <IoAdd className="w-4 h-4" />
      </button>
    </div>
  );

  // Message menu
  const MessageMenu = ({ message, onClose }: { message: EnhancedMessage; onClose: () => void }) => (
    <div className="absolute right-0 top-8 bg-[#2b1f17] border border-[#d4af37]/30 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[160px]">
      {[
        { icon: IoHappy, label: "Réagir", action: () => { setHoveredMessage(message.id); onClose(); } },
        { icon: IoArrowBack, label: "Répondre", action: () => { setReplyingTo(message); onClose(); } },
        { icon: IoCopy, label: "Copier", action: () => { navigator.clipboard.writeText(message.text); toast.success("Copié!"); onClose(); } },
        { icon: IoShare, label: "Transférer", action: () => { toast.info("Bientôt disponible"); onClose(); } },
        { icon: IoTrash, label: "Supprimer", action: () => { toast.info("Bientôt disponible"); onClose(); }, danger: true },
      ].map(({ icon: Icon, label, action, danger }) => (
        <button
          key={label}
          onClick={action}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
            danger 
              ? "text-red-400 hover:bg-red-500/10" 
              : "text-[#e8dcc8] hover:bg-[#d4af37]/10"
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm">{label}</span>
        </button>
      ))}
    </div>
  );

  // Create group modal
  const CreateGroupModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md rounded-3xl overflow-hidden border-4 border-[#d4af37]/50"
        style={{ background: "#2b1f17", backgroundImage: FLEUR_PATTERN }}
      >
        <div className="p-6 border-b border-[#d4af37]/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#d4af37]">Nouveau Groupe</h2>
            <button onClick={() => setShowGroupModal(false)} className="text-[#8b7355] hover:text-[#d4af37]">
              <IoClose className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#8b7355] mb-2">Nom du groupe</label>
            <input
              type="text"
              placeholder="Ex: Les Habs Fans 🏒"
              className="w-full px-4 py-3 rounded-xl bg-[#1a1410] border border-[#d4af37]/30 text-[#e8dcc8] placeholder-[#8b7355] focus:border-[#d4af37] outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#8b7355] mb-2">Description</label>
            <textarea
              rows={3}
              placeholder="De quoi parle votre groupe?"
              className="w-full px-4 py-3 rounded-xl bg-[#1a1410] border border-[#d4af37]/30 text-[#e8dcc8] placeholder-[#8b7355] focus:border-[#d4af37] outline-none resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#8b7355] mb-2">Ajouter des membres</label>
            <div className="flex gap-2 flex-wrap">
              {["Marie", "Jean-Guy", "Sophie"].map(name => (
                <button
                  key={name}
                  className="px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] text-sm"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-[#d4af37]/30 flex gap-3">
          <button
            onClick={() => setShowGroupModal(false)}
            className="flex-1 py-3 rounded-xl bg-[#3a2820] text-[#8b7355] hover:bg-[#4a3530] transition-all"
          >
            Annuler
          </button>
          <button
            onClick={() => { toast.success("Groupe créé!"); setShowGroupModal(false); }}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-600 text-black font-bold hover:shadow-lg hover:shadow-[#d4af37]/30 transition-all"
          >
            Créer le groupe
          </button>
        </div>
      </div>
    </div>
  );

  // Render sidebar content
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

      case "groups":
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] uppercase tracking-widest text-[#d4af37]/50 font-semibold">
                Groupes
              </span>
              <button
                onClick={() => setShowGroupModal(true)}
                className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/30 transition-all"
              >
                <IoAdd className="w-4 h-4" />
              </button>
            </div>
            {groupChats.map(group => (
              <button
                key={group.id}
                onClick={() => { setActiveChat(group.id); tap(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                  activeChat === group.id
                    ? "bg-[#d4af37]/20 border border-[#d4af37]/40"
                    : "hover:bg-[#d4af37]/10 border border-transparent"
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">
                    {group.name[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#2b1f17]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      activeChat === group.id ? "text-[#d4af37]" : "text-[#e8dcc8]"
                    )}>
                      {group.name}
                    </span>
                    <span className="text-[10px] text-[#8b7355]">{group.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#8b7355] truncate flex-1">{group.lastMessage}</p>
                    <span className="text-[10px] text-green-400">{group.online} en ligne</span>
                  </div>
                </div>
                {group.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">
                    {group.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        );
      
      case "mystuff":
        return (
          <div className="space-y-3">
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
            </div>
          </div>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex bg-black/90 backdrop-blur-sm">
      {/* Main Container */}
      <div className="flex w-full h-full max-w-6xl mx-auto my-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#d4af37]/50">
        
        {/* SIDEBAR */}
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
                <span className="text-xl font-bold tracking-widest text-[#d4af37]"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  ZYEUTÉ
                </span>
              </div>
            </div>

            {/* Tab Switcher with Groups */}
            <div className="flex gap-1 p-1 rounded-xl bg-[#3a2820]/80 border border-[#d4af37]/20">
              {[
                { id: "history", icon: IoTime, label: "Historique" },
                { id: "dms", icon: IoChatbubbles, label: "DMs" },
                { id: "groups", icon: IoPeople, label: "Groupes" },
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
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col relative" style={{ background: "#1a1410" }}>
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#d4af37]/30"
            style={{ background: "linear-gradient(90deg, rgba(43,31,23,0.98), rgba(35,25,18,0.98))" }}>
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-[#d4af37]/20 text-[#d4af37]">
                {sidebarOpen ? <IoChevronDown className="w-5 h-5 -rotate-90" /> : <IoChevronUp className="w-5 h-5 -rotate-90" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-2xl shadow-lg shadow-[#d4af37]/20">
                  🦫
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#e8dcc8]">Ti-Guy</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 text-[10px] text-[#d4af37] uppercase">AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8b7355]">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    En ligne
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoCall className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoVideocamOutline className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-xl hover:bg-[#d4af37]/20 text-[#d4af37] transition-all">
                <IoEllipsisHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: "#2b1f17", backgroundImage: FLEUR_PATTERN }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-3 group", message.sender === "user" ? "flex-row-reverse" : "")}
                onMouseEnter={() => setHoveredMessage(message.id)}
                onMouseLeave={() => { if (showMessageMenu !== message.id) setHoveredMessage(null); }}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2",
                  message.sender === "tiGuy" ? "bg-gradient-to-br from-amber-400 to-amber-700 border-[#d4af37]" : "bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-400"
                )}>
                  {message.sender === "tiGuy" ? "🦫" : "👤"}
                </div>

                {/* Message Content */}
                <div className={cn("max-w-[70%] relative", message.sender === "user" ? "items-end" : "items-start")}>
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className="mb-1 px-3 py-1 rounded-lg bg-[#1a1410] border-l-2 border-[#d4af37] text-xs text-[#8b7355]">
                      Réponse à un message
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn(
                    "rounded-2xl px-5 py-3 shadow-lg relative",
                    message.sender === "user" ? "rounded-br-sm" : "rounded-bl-sm",
                    message.isError && "border-red-500/50 bg-red-500/10"
                  )} style={{
                    background: message.sender === "user" 
                      ? "linear-gradient(135deg, rgba(109,40,217,0.4), rgba(79,70,229,0.3))"
                      : "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))",
                    border: message.isError ? "2px solid rgba(239,68,68,0.5)" : message.sender === "user" 
                      ? "2px solid rgba(139,92,246,0.4)" : "2px solid rgba(212,175,55,0.4)",
                  }}>
                    <p className={cn("leading-relaxed whitespace-pre-wrap text-[15px]", message.sender === "user" ? "text-violet-100" : "text-amber-100")}>
                      {message.text}
                    </p>
                    
                    {/* Message Menu Button */}
                    <button
                      onClick={() => setShowMessageMenu(showMessageMenu === message.id ? null : message.id)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-[#1a1410] border border-[#d4af37]/30 text-[#8b7355] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IoEllipsisHorizontal className="w-3 h-3" />
                    </button>
                    
                    {/* Message Menu Dropdown */}
                    {showMessageMenu === message.id && (
                      <MessageMenu message={message} onClose={() => setShowMessageMenu(null)} />
                    )}
                  </div>

                  {/* Reactions */}
                  {(messageReactions[message.id] || message.reactions) && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(messageReactions[message.id] || message.reactions)?.map(reaction => (
                        <button
                          key={reaction.emoji}
                          onClick={() => addReaction(message.id, reaction.emoji)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs border transition-all",
                            reaction.users.includes("currentUser")
                              ? "bg-[#d4af37]/30 border-[#d4af37]"
                              : "bg-[#1a1410] border-[#d4af37]/30 hover:border-[#d4af37]"
                          )}
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reaction Bar on Hover */}
                  {hoveredMessage === message.id && !showMessageMenu && (
                    <div className={cn("absolute -bottom-8", message.sender === "user" ? "right-0" : "left-0")}>
                      <ReactionBar messageId={message.id} />
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className={cn("flex items-center gap-2 mt-1 text-xs text-[#8b7355]", message.sender === "user" && "justify-end")}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.sender === "user" && (
                      <IoCheckmarkDone className="w-4 h-4 text-[#d4af37]" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border-2 border-[#d4af37] flex items-center justify-center text-lg">🦫</div>
                <div className="rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(146,64,14,0.5), rgba(120,53,15,0.4))", border: "2px solid rgba(212,175,55,0.4)" }}>
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Voice Recording Visualization */}
            {showVoiceWaveform && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/40">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-lg font-bold text-red-300 font-mono">
                    {formatDuration(recordingTime)}
                  </span>
                  <div className="flex items-end gap-1 h-8">
                    {audioVisualization.map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(8, height / 3)}px` }}
                      />
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

          {/* Input Area */}
          <div className="px-6 py-4 border-t-2 border-[#d4af37]/30 relative"
            style={{ background: "linear-gradient(180deg, rgba(35,25,18,0.98) 0%, rgba(43,31,23,0.98) 100%)", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
            
            {/* Emoji Picker */}
            {showEmojiPicker && <EmojiPicker />}

            {/* Toolbar */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn(
                  "w-10 h-10 rounded-xl border transition-all flex items-center justify-center text-lg",
                  showEmojiPicker 
                    ? "bg-[#d4af37]/30 border-[#d4af37]" 
                    : "bg-[#3a2820]/80 border-[#d4af37]/20 hover:border-[#d4af37]/50"
                )}
              >
                😀
              </button>
              {["🎨", "🖼️", "📎", "🎵", "📍"].map((emoji, i) => (
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
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
              {/* Voice Button */}
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={cn(
                  "p-4 rounded-2xl transition-all transform active:scale-95 flex-shrink-0",
                  isRecording ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse" : "bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20"
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
              <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 rounded-2xl bg-[#3a2820] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-all">
                <IoAttach className="w-6 h-6" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={cn(
                  "p-4 rounded-2xl transition-all transform",
                  inputText.trim() && !isTyping ? "bg-gradient-to-br from-[#d4af37] to-amber-600 text-black shadow-lg shadow-[#d4af37]/40 hover:scale-105" : "bg-[#3a2820] text-[#8b7355] cursor-not-allowed"
                )}
              >
                <IoSend className="w-6 h-6" />
              </button>
            </form>

            {/* Voice Hint */}
            <div className="text-center mt-2 text-xs text-[#8b7355]">
              🎙️ Maintenez le bouton micro pour parler avec Ti-Guy • 😀 Cliquez pour les emojis
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showGroupModal && <CreateGroupModal />}
    </div>,
    document.body
  );
};

export default ChatInterfaceEnhanced;
