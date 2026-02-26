/**
 * 🦫 TI-GUY Full-Screen Mobile Chat
 * Full cell phone size with vintage Quebec leather UI
 * Features: Chat, Voice, File Upload, Skills, History
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  X,
  ChevronDown,
  MoreVertical,
  Mic,
  Paperclip,
  Image as ImageIcon,
  Sparkles,
  History,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "tiguy";
  timestamp: Date;
  intent?: string;
  type?: "text" | "voice" | "image" | "file";
  audioUrl?: string;
  imageUrl?: string;
}

interface TIGuyFullScreenProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username?: string;
}

// TI-GUY Skills/Commands
const TIGUY_SKILLS = [
  { icon: "🎨", label: "Image", command: "Crée une image de..." },
  { icon: "🎬", label: "Vidéo", command: "Génère un vidéo de..." },
  { icon: "🏒", label: "Hockey", command: "Quoi de neuf avec les Habs?" },
  { icon: "🌤️", label: "Météo", command: "Quel temps fait-il?" },
  { icon: "🍟", label: "Bouffe", command: "Où manger une poutine?" },
  {
    icon: "🎵",
    label: "Musique",
    command: "Recommande-moi de la musique québécoise",
  },
  { icon: "🔍", label: "Chercher", command: "Cherche sur Google..." },
  { icon: "📸", label: "Screenshot", command: "Prends une capture de..." },
];

export const TIGuyFullScreen: React.FC<TIGuyFullScreenProps> = ({
  isOpen,
  onClose,
  userId,
  username,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Salut! Moi c'est TI-GUY, ton guide québécois! 🦫⚜️\n\nJe peux:\n🎨 Générer des images\n🎬 Créer des vidéos\n🏒 Parler des Habs\n🌤️ Donner la météo\n🍟 Trouver des restos\n🎵 Recommander de la musique\n🔍 Chercher sur le web\n🎙️ Discuter en audio",
      sender: "tiguy",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { date: string; preview: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-play voice messages when they arrive
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === "tiguy" && lastMessage?.audioUrl) {
      // Try to play automatically (may be blocked by browser policy)
      const audio = new Audio(lastMessage.audioUrl);
      audio.play().catch(() => {
        // Auto-play blocked, user will need to click the play button
        console.log("Auto-play blocked by browser");
      });
    }
  }, [messages]);

  // Load chat history and greet with voice on mount
  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
      // Greet user with voice after a short delay
      setTimeout(() => {
        speakGreeting();
      }, 500);
    }
  }, [isOpen]);

  // Speak a greeting with TI-GUY's funny beaver voice
  const speakGreeting = async () => {
    const text =
      "Salut mon chum! C'est TI-GUY, ton guide québécois préféré! Pose-moi des questions sur le Québec!";

    try {
      const response = await fetch("/api/tiguy/voice/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text, voice: "ti-guy" }),
      });

      if (response.ok) {
        const data = await response.json();
        const audioUrl = `data:audio/mp3;base64,${data.audio}`;

        // Play audio
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {
          console.log("Auto-play blocked, user interaction needed");
        });

        // Add message with audio
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text,
            sender: "tiguy",
            timestamp: new Date(),
            type: "voice",
            audioUrl,
          },
        ]);
      }
    } catch (error) {
      console.error("Greeting failed:", error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/tiguy/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const sendMessage = async (
    text: string = inputText,
    type: "text" | "voice" | "image" = "text",
    audioBase64?: string,
  ) => {
    if ((!text.trim() && !audioBase64) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
      type,
    };

    if (type === "voice" && audioBase64) {
      userMessage.audioUrl = `data:audio/webm;base64,${audioBase64}`;
    }

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
          message: text.trim(),
          audio: audioBase64,
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
          type: data.audio ? "voice" : "text",
          audioUrl: data.audio
            ? `data:audio/mp3;base64,${data.audio}`
            : undefined,
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

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(",")[1];
          await sendMessage("🎙️ Message vocal", "voice", base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("J'ai besoin d'accéder à ton micro! 🎤");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // File upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64File = (reader.result as string).split(",")[1];

      // Add file message
      const fileMessage: Message = {
        id: Date.now().toString(),
        text: `📎 ${file.name}`,
        sender: "user",
        timestamp: new Date(),
        type: "file",
      };

      if (file.type.startsWith("image/")) {
        fileMessage.imageUrl = reader.result as string;
        fileMessage.type = "image";
      }

      setMessages((prev) => [...prev, fileMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/tiguy/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            message: `Analyse ce fichier: ${file.name}`,
            image: file.type.startsWith("image/") ? base64File : undefined,
            context: { userId },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: data.response,
              sender: "tiguy",
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error("File upload error:", error);
      } finally {
        setIsLoading(false);
      }
    };
  };

  const quickReplies = ["Quoi de neuf?", "Génère une image", "Météo", "Blague"];

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

        {/* Right: History & Skills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: showHistory
                ? "linear-gradient(145deg, #D4AF37 0%, #B8960B 100%)"
                : "linear-gradient(145deg, #6B4423 0%, #4A3018 100%)",
              border: "2px solid #D4AF37",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <History
              className={`w-5 h-5 ${showHistory ? "text-amber-900" : "text-amber-400"}`}
            />
          </button>
          <button
            onClick={() => setShowSkills(!showSkills)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: showSkills
                ? "linear-gradient(145deg, #D4AF37 0%, #B8960B 100%)"
                : "linear-gradient(145deg, #6B4423 0%, #4A3018 100%)",
              border: "2px solid #D4AF37",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <Sparkles
              className={`w-5 h-5 ${showSkills ? "text-amber-900" : "text-amber-400"}`}
            />
          </button>
        </div>

        {/* Bottom stitching */}
        <div
          className="absolute bottom-0 left-4 right-4 h-px opacity-50"
          style={{
            background:
              "repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 6px, transparent 6px, transparent 10px)",
          }}
        />
      </header>

      {/* Skills Panel */}
      {showSkills && (
        <div
          className="absolute top-20 left-4 right-4 z-40 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #4A3018 0%, #3D2314 100%)",
            border: "2px solid #D4AF37",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="p-4">
            <h3 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Mes talents
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {TIGUY_SKILLS.map((skill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(skill.command);
                    setShowSkills(false);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(145deg, #5D3A1A 0%, #4A3018 100%)",
                    border: "1px solid #D4AF37",
                  }}
                >
                  <span className="text-xl">{skill.icon}</span>
                  <span className="text-[10px] text-amber-300">
                    {skill.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div
          className="absolute top-20 left-4 right-4 z-40 rounded-2xl overflow-hidden max-h-64 overflow-y-auto"
          style={{
            background: "linear-gradient(145deg, #4A3018 0%, #3D2314 100%)",
            border: "2px solid #D4AF37",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="p-4">
            <h3 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Conversations récentes
            </h3>
            {chatHistory.length === 0 ? (
              <p className="text-amber-500/70 text-sm">
                Aucune conversation sauvegardée
              </p>
            ) : (
              <div className="space-y-2">
                {chatHistory.map((chat, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(212,175,55,0.1)",
                    }}
                  >
                    <span className="text-amber-300">{chat.date}</span>
                    <p className="text-amber-100/70 truncate">{chat.preview}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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

              {/* Image Message */}
              {message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Shared"
                  className="max-w-full rounded-lg mb-2"
                  style={{ maxHeight: "200px" }}
                />
              )}

              {/* Voice Message with Custom Player */}
              {message.audioUrl && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-black/20">
                  <button
                    onClick={() => {
                      const audio = new Audio(message.audioUrl);
                      audio.play().catch((err) => {
                        console.error("Audio play failed:", err);
                        alert("Cliquez pour écouter le message vocal");
                      });
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                    style={{
                      background:
                        "linear-gradient(145deg, #D4AF37 0%, #B8960B 100%)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    <svg
                      className="w-5 h-5 text-amber-900 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <div className="text-amber-300 text-xs font-bold">
                      Message vocal 🎙️
                    </div>
                    <div className="text-amber-500/70 text-xs">
                      Cliquez pour écouter
                    </div>
                  </div>
                  <audio
                    src={message.audioUrl}
                    controls
                    className="w-24 h-8 opacity-70"
                  />
                </div>
              )}

              {/* Message text */}
              {message.text && (
                <p
                  className="text-amber-100 relative z-10 leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "Georgia, serif", fontSize: "16px" }}
                >
                  {message.text}
                </p>
              )}

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

        <div className="flex items-center gap-2">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: "linear-gradient(145deg, #5D3A1A 0%, #4A3018 100%)",
              border: "2px solid #D4AF37",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <Paperclip className="w-5 h-5 text-amber-400" />
          </button>

          {/* Voice Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: isRecording
                ? "linear-gradient(145deg, #DC2626 0%, #991B1B 100%)"
                : "linear-gradient(145deg, #5D3A1A 0%, #4A3018 100%)",
              border: "2px solid #D4AF37",
              boxShadow: isRecording
                ? "0 0 15px rgba(220,38,38,0.5)"
                : "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {isRecording ? (
              <span className="w-3 h-3 bg-white rounded-sm animate-pulse" />
            ) : (
              <Mic className="w-5 h-5 text-amber-400" />
            )}
          </button>

          {/* Text input */}
          <div className="flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                isRecording ? "Enregistrement..." : "Écris ton message..."
              }
              disabled={isLoading || isRecording}
              className="w-full px-4 py-3 rounded-xl bg-amber-950/50 border-2 border-amber-700/50 text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500/50"
              style={{ fontFamily: "Georgia, serif", fontSize: "16px" }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || isRecording || !inputText.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(145deg, #D4AF37 0%, #B8960B 50%, #8B6914 100%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <Send size={20} className="text-amber-900" />
          </button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs">
              Enregistrement en cours...
            </span>
            <span className="text-red-400 text-xs">
              (Clique le micro pour arrêter)
            </span>
          </div>
        )}

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
