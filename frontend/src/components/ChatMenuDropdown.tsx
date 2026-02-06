/**
 * ChatMenuDropdown.tsx
 * Hamburger menu for ChatModal: Recent Chats, DMs, Images
 * Slides in from left with gold/leather aesthetic
 */

import React from "react";
import {
  IoCloseOutline,
  IoTimeOutline,
  IoChatbubbleEllipsesOutline,
  IoImagesOutline,
  IoPersonCircleOutline,
  IoCheckmarkDoneOutline,
} from "react-icons/io5";
import { cn } from "@/lib/utils";

interface RecentChat {
  id: string;
  name: string;
  preview: string;
  timestamp: Date;
  unread?: number;
  avatar?: string;
}

interface DMConversation {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: Date;
  unread?: number;
  avatar?: string;
  isOnline?: boolean;
}

interface MediaItem {
  id: string;
  thumbnail: string;
  timestamp: Date;
  sender: string;
}

interface ChatMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onChatSelect?: (chatId: string) => void;
  onDMSelect?: (dmId: string) => void;
  onImageSelect?: (imageId: string) => void;
}

// Mock data for demonstration
const MOCK_RECENT_CHATS: RecentChat[] = [
  {
    id: "1",
    name: "Ti-Guy",
    preview: "Salut! Comment ça va aujourd'hui?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    unread: 2,
  },
  {
    id: "2",
    name: "Support Zyeuté",
    preview: "Merci pour ton message!",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "3",
    name: "Agent Québec",
    preview: "Bienvenue sur Zyeuté! 🇨🇦",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

const MOCK_DMS: DMConversation[] = [
  {
    id: "dm1",
    userName: "Marie-Claude",
    lastMessage: "Merci pour le partage! J'adore ça!",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    unread: 1,
    isOnline: true,
  },
  {
    id: "dm2",
    userName: "Jean-François",
    lastMessage: "On se parle plus tard? 👍",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    isOnline: false,
  },
  {
    id: "dm3",
    userName: "Sophie Tremblay",
    lastMessage: "Super vidéo!",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    unread: 3,
    isOnline: true,
  },
];

const MOCK_IMAGES: MediaItem[] = [
  {
    id: "img1",
    thumbnail: "https://picsum.photos/seed/1/200/200",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    sender: "Ti-Guy",
  },
  {
    id: "img2",
    thumbnail: "https://picsum.photos/seed/2/200/200",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    sender: "Marie-Claude",
  },
  {
    id: "img3",
    thumbnail: "https://picsum.photos/seed/3/200/200",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sender: "Jean-François",
  },
  {
    id: "img4",
    thumbnail: "https://picsum.photos/seed/4/200/200",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    sender: "Sophie",
  },
];

const formatTimeAgo = (date: Date): string => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
};

export const ChatMenuDropdown: React.FC<ChatMenuDropdownProps> = ({
  isOpen,
  onClose,
  onChatSelect,
  onDMSelect,
  onImageSelect,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]"
        onClick={onClose}
        style={{
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Menu Panel */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 w-[85%] max-w-[380px] z-[120] overflow-hidden",
          "shadow-2xl transform transition-transform duration-300 ease-out",
        )}
        style={{
          background: "#2b1f17",
          border: "3px solid #d4af37",
          borderLeft: "none",
          borderTopRightRadius: "24px",
          borderBottomRightRadius: "24px",
          boxShadow:
            "0 0 40px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(0,0,0,0.5)",
          animation: "slideInLeft 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b-2 border-[#d4af37]/40"
          style={{
            background:
              "linear-gradient(180deg, rgba(43, 31, 23, 0.98) 0%, rgba(35, 25, 18, 0.98) 100%)",
          }}
        >
          <h3
            className="text-xl font-bold"
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              color: "#d4af37",
              textShadow: "0 2px 8px rgba(212, 175, 55, 0.6)",
            }}
          >
            Menu
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-[#d4af37]/20"
            style={{ color: "#d4af37" }}
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto"
          style={{
            height: "calc(100% - 70px)",
            background: "#2b1f17",
          }}
        >
          {/* SECTION 1: Recent Chats */}
          <div className="px-5 py-4 border-b border-[#d4af37]/20">
            <div className="flex items-center gap-2 mb-3">
              <IoTimeOutline className="w-5 h-5" style={{ color: "#d4af37" }} />
              <h4
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "#d4af37" }}
              >
                Conversations Récentes
              </h4>
            </div>
            <div className="space-y-2">
              {MOCK_RECENT_CHATS.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect?.(chat.id)}
                  className="w-full text-left p-3 rounded-xl transition-all hover:bg-[#d4af37]/10 active:scale-98"
                  style={{
                    background: "rgba(43, 31, 23, 0.5)",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-semibold text-sm truncate"
                          style={{ color: "#f5f5dc" }}
                        >
                          {chat.name}
                        </span>
                        {chat.unread && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "#d4af37",
                              color: "#000",
                            }}
                          >
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs truncate"
                        style={{ color: "rgba(245, 245, 220, 0.6)" }}
                      >
                        {chat.preview}
                      </p>
                    </div>
                    <span
                      className="text-[10px] ml-2 flex-shrink-0"
                      style={{ color: "rgba(212, 175, 55, 0.6)" }}
                    >
                      {formatTimeAgo(chat.timestamp)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: DMs */}
          <div className="px-5 py-4 border-b border-[#d4af37]/20">
            <div className="flex items-center gap-2 mb-3">
              <IoChatbubbleEllipsesOutline
                className="w-5 h-5"
                style={{ color: "#d4af37" }}
              />
              <h4
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "#d4af37" }}
              >
                Messages Directs
              </h4>
            </div>
            <div className="space-y-2">
              {MOCK_DMS.map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => onDMSelect?.(dm.id)}
                  className="w-full text-left p-3 rounded-xl transition-all hover:bg-[#d4af37]/10 active:scale-98"
                  style={{
                    background: "rgba(43, 31, 23, 0.5)",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <IoPersonCircleOutline
                        className="w-10 h-10"
                        style={{ color: "#d4af37" }}
                      />
                      {dm.isOnline && (
                        <span
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                          style={{
                            background: "#22c55e",
                            borderColor: "#2b1f17",
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-sm truncate"
                            style={{ color: "#f5f5dc" }}
                          >
                            {dm.userName}
                          </span>
                          {dm.unread && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "#d4af37",
                                color: "#000",
                              }}
                            >
                              {dm.unread}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[10px] flex-shrink-0"
                          style={{ color: "rgba(212, 175, 55, 0.6)" }}
                        >
                          {formatTimeAgo(dm.timestamp)}
                        </span>
                      </div>
                      <p
                        className="text-xs truncate"
                        style={{ color: "rgba(245, 245, 220, 0.6)" }}
                      >
                        {dm.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: Images Gallery */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <IoImagesOutline
                className="w-5 h-5"
                style={{ color: "#d4af37" }}
              />
              <h4
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "#d4af37" }}
              >
                Images Partagées
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOCK_IMAGES.map((image) => (
                <button
                  key={image.id}
                  onClick={() => onImageSelect?.(image.id)}
                  className="aspect-square rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95 relative group"
                  style={{
                    border: "2px solid rgba(212, 175, 55, 0.3)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <img
                    src={image.thumbnail}
                    alt={`Shared by ${image.sender}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "#d4af37" }}
                    >
                      {image.sender}
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: "rgba(245, 245, 220, 0.8)" }}
                    >
                      {formatTimeAgo(image.timestamp)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}
      </style>
    </>
  );
};
