/**
 * ChatZyeute - Complete messaging component with all features wired
 * TI-GUY AI + Real User Messaging + Voice + File Sharing
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  Lock,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Check,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Hooks
import { useConversationSocket } from "@/hooks/useWebSocket";

// API
import {
  getMessages,
  sendTextMessage,
  sendMediaMessage,
  uploadChatFile,
  Conversation,
  Message,
} from "@/api/messaging";

// Components
import { ChatControlCenter } from "./ChatControlCenter";
import { ChatMediaUploader } from "./ChatMediaUploader";
import { Avatar } from "../Avatar";
import { OVHCloudBadge } from "./OVHCloudBadge";

// Voice recording hook
function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Impossible d'accéder au micro. Vérifie les permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordingTime(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

interface ChatZyeuteProps {
  conversation?: Conversation;
  onBack?: () => void;
}

export const ChatZyeute: React.FC<ChatZyeuteProps> = ({
  conversation: initialConversation,
  onBack,
}) => {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [conversation, setConversation] = useState<Conversation | undefined>(
    initialConversation
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice recorder
  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecorder();

  // WebSocket for real-time updates
  const {
    isConnected,
    typingUsers,
    isAITyping,
    sendTypingStart,
    sendTypingStop,
  } = useConversationSocket(conversationId || conversation?.id || null, {
    onMessageNew: (data) => {
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    },
    onAIReply: (data) => {
      setMessages((prev) => [...prev, data.response]);
      scrollToBottom();
    },
  });

  // Load messages on mount
  useEffect(() => {
    if (!conversationId && !conversation?.id) return;

    loadMessages();
  }, [conversationId, conversation?.id]);

  const loadMessages = async () => {
    const id = conversationId || conversation?.id;
    if (!id) return;

    setIsLoading(true);
    try {
      const msgs = await getMessages(id);
      setMessages(msgs);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Send text message
  const handleSend = async () => {
    if (!inputText.trim() || !conversation?.id) return;

    const text = inputText.trim();
    setInputText("");

    try {
      await sendTextMessage(conversation.id, text);
      sendTypingStop(conversation.id);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Handle input changes (typing indicator)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (conversation?.id && e.target.value) {
      sendTypingStart(conversation.id);
    }
  };

  // Send voice message
  const handleSendVoice = async () => {
    if (!audioBlob || !conversation?.id) return;

    try {
      // Upload voice file
      const { url, metadata } = await uploadChatFile(
        conversation.id,
        new File([audioBlob], "voice-message.webm", { type: "audio/webm" }),
        () => { } // Progress callback
      );

      // Send as voice message
      await sendMediaMessage(conversation.id, "voice", url, {
        duration: recordingTime,
        ...metadata,
      });

      clearRecording();
    } catch (err) {
      console.error("Failed to send voice:", err);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: any[]) => {
    if (!conversation?.id) return;

    for (const file of files) {
      try {
        const { url, metadata } = await uploadChatFile(
          conversation.id,
          file.file,
          () => { }
        );

        await sendMediaMessage(conversation.id, file.type, url, metadata);
      } catch (err) {
        console.error("Failed to upload file:", err);
      }
    }

    setShowUploader(false);
  };

  // Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-stone-500">
        Sélectionne une conversation
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full">
              ←
            </button>
          )}

          <Avatar
            src={conversation.otherUser.avatarUrl}
            size="md"
            isVerified={conversation.otherUser.isVerified}
          />

          <div>
            <h3 className="font-semibold text-white">
              {conversation.otherUser.displayName}
            </h3>
            <p className="text-sm text-stone-500">
              {isConnected ? (
                typingUsers.length > 0 ? (
                  <span className="text-gold-400">en train d'écrire...✍️</span>
                ) : isAITyping ? (
                  <span className="text-gold-400">TI-GUY réfléchit...🦫</span>
                ) : (
                  "en ligne"
                )
              ) : (
                "connexion..."
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.encryptionEnabled && (
            <Lock className="w-4 h-4 text-green-400" />
          )}
          <button className="p-2 hover:bg-white/5 rounded-full">
            <Phone className="w-5 h-5 text-stone-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full">
            <Video className="w-5 h-5 text-stone-400" />
          </button>
          <button
            onClick={() => setShowControlCenter(true)}
            className="p-2 hover:bg-white/5 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin text-gold-400">Chargement...⏳</div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            const isTI_GUY = msg.senderId === "00000000-0000-0000-0000-000000000001";

            return (
              <div
                key={msg.id || idx}
                className={cn(
                  "flex",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2",
                    isMe
                      ? "bg-gold-500 text-black"
                      : isTI_GUY
                        ? "bg-purple-500/20 border border-purple-500/30 text-white"
                        : "bg-stone-800 text-white"
                  )}
                >
                  {isTI_GUY && (
                    <div className="flex items-center gap-1 mb-1 text-purple-400 text-xs">
                      <span>🦫</span> TI-GUY
                    </div>
                  )}

                  {msg.contentType === "text" && (
                    <p>{msg.contentText}</p>
                  )}

                  {msg.contentType === "image" && (
                    <img
                      src={msg.contentUrl}
                      alt="Image"
                      className="rounded-lg max-w-full"
                    />
                  )}

                  {msg.contentType === "voice" && (
                    <audio controls src={msg.contentUrl} className="max-w-full" />
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-60">
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      msg.readAt ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gold-500/20">
        {audioBlob ? (
          // Voice preview
          <div className="flex items-center gap-3 bg-stone-800 rounded-2xl p-3">
            <div className="flex-1 flex items-center gap-2">
              <Mic className="w-5 h-5 text-gold-400" />
              <span className="text-white">
                Message vocal ({formatRecordingTime(recordingTime)})
              </span>
            </div>
            <button
              onClick={clearRecording}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <MicOff className="w-5 h-5 text-red-400" />
            </button>
            <button
              onClick={handleSendVoice}
              className="p-2 bg-gold-500 rounded-full"
            >
              <Send className="w-5 h-5 text-black" />
            </button>
          </div>
        ) : isRecording ? (
          // Recording in progress
          <div className="flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-mono">
              {formatRecordingTime(recordingTime)}
            </span>
            <button
              onClick={stopRecording}
              className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              Arrêter
            </button>
          </div>
        ) : (
          // Text input
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploader(true)}
              className="p-3 hover:bg-white/5 rounded-full"
            >
              <Paperclip className="w-5 h-5 text-stone-400" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Écris un message..."
              className="flex-1 bg-stone-800 rounded-full px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />

            <button
              onClick={startRecording}
              className="p-3 hover:bg-white/5 rounded-full"
            >
              <Mic className="w-5 h-5 text-stone-400" />
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={cn(
                "p-3 rounded-full transition-colors",
                inputText.trim()
                  ? "bg-gold-500 text-black"
                  : "bg-stone-800 text-stone-500"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Control Center */}
      <ChatControlCenter
        isOpen={showControlCenter}
        onClose={() => setShowControlCenter(false)}
        conversation={conversation as any}
        onUpdateSettings={(settings) => {
          setConversation((prev) => prev ? { ...prev, ...settings } : prev);
        }}
        onClearChat={() => {
          setMessages([]);
          setShowControlCenter(false);
        }}
        onBlockUser={() => {
          // TODO: Implement block
          setShowControlCenter(false);
        }}
      />

      {/* File Uploader */}
      <ChatMediaUploader
        isOpen={showUploader}
        onCancel={() => setShowUploader(false)}
        onUpload={handleFileUpload}
      />

      {/* OVH Cloud Montréal Badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
        <OVHCloudBadge variant="minimal" />
      </div>
    </div>
  );
};

export default ChatZyeute;
