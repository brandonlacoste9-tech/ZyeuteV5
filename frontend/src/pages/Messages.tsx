import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Send,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { tiguyService } from "@/services/tiguyService";
import { getTiGuyResponse } from "@/utils/tiGuyResponses";
import type { ChatMessage } from "@/types/chat";
import { toast } from "@/components/Toast";

// --- Types ---

interface Conversation {
  id: string;
  type: "tiguy" | "dm";
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount?: number;
  isOnline?: boolean;
}

// --- Mock Data ---

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "tiguy-main",
    type: "tiguy",
    name: "Ti-Guy",
    avatar: "/ti-guy-logo.jpg?v=2",
    lastMessage: "Heille! T'as vu la game hier? 🏒",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isOnline: true,
  },
  {
    id: "dm-1",
    type: "dm",
    name: "Jean-Guy Tremblay",
    lastMessage: "On se pogne une poutine tantôt?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "dm-2",
    type: "dm",
    name: "Sophie Lapointe",
    lastMessage: "Merci pour le partage! ✨",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "dm-3",
    type: "dm",
    name: "Marc-André",
    lastMessage: "C'est malade ce spot là!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "dm-4",
    type: "dm",
    name: "Équipe Zyeuté",
    lastMessage: "Nouvelle mise à jour disponible 🚀",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
];

// --- Components ---

const ConversationCard: React.FC<{
  conversation: Conversation;
  onClick: () => void;
}> = ({ conversation, onClick }) => {
  const { tap } = useHaptics();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        tap();
        onClick();
      }}
      className="p-4 flex items-center gap-4 border-b border-white/10 bg-white/5 backdrop-blur-sm active:bg-white/10 transition-colors"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
          {conversation.avatar ? (
            <img
              src={conversation.avatar}
              alt={conversation.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {conversation.name.charAt(0)}
            </div>
          )}
        </div>
        {conversation.isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-white font-bold text-base truncate pr-2">
            {conversation.name}
          </h3>
          <span className="text-white/50 text-xs whitespace-nowrap">
            {new Intl.DateTimeFormat("fr-CA", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(conversation.timestamp)}
          </span>
        </div>
        <p className="text-white/70 text-sm truncate pr-4">
          {conversation.lastMessage}
        </p>
      </div>

      <ChevronRight className="w-5 h-5 text-white/30" />
    </motion.div>
  );
};

const ChatThread: React.FC<{
  conversation: Conversation;
  onBack: () => void;
}> = ({ conversation, onBack }) => {
  const { tap } = useHaptics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [joualStyle, setJoualStyle] = useState<"street" | "old" | "enhanced">("street");

  // Load initial history (mock)
  useEffect(() => {
    const initialMsg: ChatMessage = {
      id: "init",
      sender: conversation.type === "tiguy" ? "tiGuy" : "user", // Simulate context
      text: conversation.lastMessage,
      timestamp: conversation.timestamp,
    };
    setMessages([initialMsg]);
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    tap();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Ti-Guy Response Logic (even for DMs in this mock, or specific Ti-Guy logic)
    if (conversation.type === "tiguy") {
      try {
        // Simulate network/thinking delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Use service or fallback
        let responseText;
        try {
            const result = await tiguyService.sendMessage(userMsg.text);
            responseText = result.response;
        } catch {
             const fallback = getTiGuyResponse(userMsg.text);
             responseText = fallback.text;
        }

        const reply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "tiGuy",
          text: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, reply]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Mock DM reply
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "tiGuy", // Using tiGuy sender type for "other" in this mock setup implies left alignment usually
            text: "Ça marche! 👍",
            timestamp: new Date(),
          },
        ]);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1512]">
      {/* Thread Header */}
      <div className="p-4 pt-safe-top flex items-center gap-4 bg-white/5 backdrop-blur-md border-b border-white/10 z-10">
        <button
          onClick={() => {
            tap();
            onBack();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
          {conversation.avatar ? (
             <img src={conversation.avatar} alt={conversation.name} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
               {conversation.name.charAt(0)}
             </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg leading-tight">
            {conversation.name}
          </h3>
          {conversation.isOnline && (
            <p className="text-green-400 text-xs font-medium">En ligne</p>
          )}
        </div>
        <div className="flex gap-2 text-white/70">
          <Phone className="w-5 h-5" />
          <Video className="w-5 h-5 ml-2" />
          <MoreVertical className="w-5 h-5 ml-2" />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                isMe ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  isMe
                    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-sm"
                    : "bg-[#2A2A2A] text-white/90 border border-white/10 rounded-tl-sm"
                )}
              >
                {msg.text}
                <div className="mt-1 text-[10px] opacity-50 text-right">
                    {new Intl.DateTimeFormat("fr-CA", { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.timestamp))}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
           <div className="flex gap-2 items-center text-white/50 text-xs ml-4">
             <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
             <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-100" />
             <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-200" />
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 pb-safe-bottom bg-[#1a1512] border-t border-white/10">
         {/* Le Joualizer Selector (Ti-Guy Only) */}
         {conversation.type === "tiguy" && (
            <div className="flex justify-center gap-2 mb-3">
              {(["street", "old", "enhanced"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setJoualStyle(style)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                    joualStyle === style
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/50 border-white/20 hover:border-white/50"
                  )}
                >
                  {style === "street" && "🔥 Urban"}
                  {style === "old" && "🧶 Pure Laine"}
                  {style === "enhanced" && "💞 Viral"}
                </button>
              ))}
            </div>
         )}

        <div className="flex items-center gap-3">
            <button className="text-white/70 hover:text-white transition-colors">
                <ImageIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Jase avec moi..."
                    className="w-full bg-white/10 border border-white/10 rounded-full py-3 pl-4 pr-10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all"
                />
            </div>
            <button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white shadow-lg disabled:opacity-50 disabled:grayscale transition-all active:scale-90"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { tap } = useHaptics();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Gradient Background (Blue -> Purple -> Pink)
  const bgStyle = {
    background: "linear-gradient(135deg, #0f172a 0%, #3b0764 50%, #831843 100%)",
  };

  return (
    <div 
        className="fixed inset-0 z-50 overflow-hidden flex flex-col"
        style={bgStyle}
    >
      <AnimatePresence mode="wait">
        {!selectedConversation ? (
          // List View
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-4 pt-safe-top flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10">
              <div className="flex items-center gap-3">
                <button 
                    onClick={() => {
                        tap();
                        navigate(-1);
                    }}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
              </div>
              <button 
                onClick={() => tap()}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-2">
                {MOCK_CONVERSATIONS.map((conv) => (
                  <ConversationCard
                    key={conv.id}
                    conversation={conv}
                    onClick={() => setSelectedConversation(conv)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          // Thread View
          <motion.div
            key="thread"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full absolute inset-0 bg-black" // Override bg for thread to be distinct or consistent? Prompt says "Gradient background persists" but thread usually has solid or pattern. Let's make thread opaque.
            style={{ zIndex: 20 }}
          >
             {/* Thread Component */}
             <ChatThread 
                conversation={selectedConversation} 
                onBack={() => setSelectedConversation(null)} 
             />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;
