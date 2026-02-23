/**
 * ChatTypeSelector - Dropdown menu for switching chat types
 * Styled as leather wallet tab with gold accents
 * Unlocks at 2K likes
 */

import React, { useState } from "react";
import { ChevronDown, Lock, Users, MessageCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatType {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  likesRequired: number;
  isUnlocked: boolean;
}

interface ChatTypeSelectorProps {
  currentType: string;
  onSelect: (type: string) => void;
  userLikes: number; // Current user's like count
}

const CHAT_TYPES: ChatType[] = [
  {
    id: "dm",
    label: "Message Direct",
    icon: <MessageCircle className="w-5 h-5" />,
    description: "Chat privé 1 à 1",
    likesRequired: 0,
    isUnlocked: true,
  },
  {
    id: "group",
    label: "Groupe",
    icon: <Users className="w-5 h-5" />,
    description: "Discussions de groupe",
    likesRequired: 2000,
    isUnlocked: false,
  },
  {
    id: "ai",
    label: "TI-GUY AI",
    icon: <Bot className="w-5 h-5" />,
    description: "Assistant IA personnel",
    likesRequired: 2000,
    isUnlocked: false,
  },
];

// Leather design tokens
const LEATHER = {
  dark: "#1A1510",
  medium: "#2A2018",
  light: "#3D3020",
  gold: "#D4AF37",
  goldDim: "#8B7355",
  goldBright: "#F4D03F",
};

export const ChatTypeSelector: React.FC<ChatTypeSelectorProps> = ({
  currentType,
  onSelect,
  userLikes,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentChatType = CHAT_TYPES.find((t) => t.id === currentType) || CHAT_TYPES[0];

  // Update unlock status based on likes
  const chatTypes = CHAT_TYPES.map((type) => ({
    ...type,
    isUnlocked: userLikes >= type.likesRequired,
  }));

  return (
    <div className="relative">
      {/* Main selector button - Leather tab style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "transition-all duration-200",
          "border-2",
          isOpen && "ring-2 ring-offset-2"
        )}
        style={{
          background: `linear-gradient(145deg, ${LEATHER.medium}, ${LEATHER.dark})`,
          borderColor: LEATHER.gold,
          boxShadow: `
            0 4px 8px rgba(0,0,0,0.4),
            inset 0 1px 2px rgba(255,255,255,0.1)
          `,
          ringColor: LEATHER.gold,
        }}
      >
        {/* Icon */}
        <div
          className="p-2 rounded-lg"
          style={{
            background: `linear-gradient(145deg, ${LEATHER.gold}, ${LEATHER.goldDim})`,
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3)",
          }}
        >
          <span style={{ color: LEATHER.dark }}>{currentChatType.icon}</span>
        </div>

        {/* Label */}
        <div className="text-left">
          <p
            className="font-bold text-sm"
            style={{ color: LEATHER.goldBright }}
          >
            {currentChatType.label}
          </p>
          <p className="text-xs" style={{ color: LEATHER.goldDim }}>
            {currentChatType.description}
          </p>
        </div>

        {/* Dropdown arrow */}
        <ChevronDown
          className={cn(
            "w-5 h-5 ml-2 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          style={{ color: LEATHER.gold }}
        />

        {/* Stitching decoration */}
        <div
          className="absolute inset-1 rounded-lg pointer-events-none"
          style={{
            border: `1px dashed ${LEATHER.goldDim}`,
            opacity: 0.4,
          }}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${LEATHER.medium}, ${LEATHER.dark})`,
              border: `2px solid ${LEATHER.gold}`,
              boxShadow: `
                0 8px 16px rgba(0,0,0,0.5),
                0 0 20px ${LEATHER.gold}30
              `,
            }}
          >
            {/* Progress bar - 2K likes goal */}
            <div className="px-4 py-3 border-b" style={{ borderColor: LEATHER.light }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: LEATHER.goldDim }}>
                  PROGRESSION
                </span>
                <span className="text-xs font-bold" style={{ color: LEATHER.gold }}>
                  {userLikes.toLocaleString()} / 2,000 ❤️
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: LEATHER.dark }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((userLikes / 2000) * 100, 100)}%`,
                    background: `linear-gradient(90deg, ${LEATHER.goldDim}, ${LEATHER.goldBright})`,
                    boxShadow: `0 0 10px ${LEATHER.gold}`,
                  }}
                />
              </div>
              {userLikes < 2000 && (
                <p className="text-xs mt-2 text-center" style={{ color: LEATHER.goldDim }}>
                  Atteins 2,000 likes pour débloquer les groupes!
                </p>
              )}
            </div>

            {/* Chat type options */}
            <div className="py-2">
              {chatTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    if (type.isUnlocked) {
                      onSelect(type.id);
                      setIsOpen(false);
                    }
                  }}
                  disabled={!type.isUnlocked}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3",
                    "transition-all duration-200",
                    type.isUnlocked && "hover:bg-white/5",
                    !type.isUnlocked && "opacity-50 cursor-not-allowed",
                    currentType === type.id && "bg-white/10"
                  )}
                >
                  {/* Icon */}
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: type.isUnlocked
                        ? `linear-gradient(145deg, ${LEATHER.gold}, ${LEATHER.goldDim})`
                        : LEATHER.light,
                    }}
                  >
                    <span style={{ color: type.isUnlocked ? LEATHER.dark : LEATHER.goldDim }}
                    >
                      {type.isUnlocked ? type.icon : <Lock className="w-4 h-4" />}
                    </span>
                  </div>

                  {/* Label */}
                  <div className="flex-1 text-left">
                    <p
                      className="font-bold text-sm"
                      style={{ color: type.isUnlocked ? LEATHER.goldBright : LEATHER.goldDim }}
                    >
                      {type.label}
                    </p>
                    <p className="text-xs" style={{ color: LEATHER.goldDim }}>
                      {type.description}
                    </p>
                  </div>

                  {/* Lock status */}
                  {!type.isUnlocked && (
                    <div
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        background: LEATHER.dark,
                        color: LEATHER.goldDim,
                        border: `1px solid ${LEATHER.goldDim}`,
                      }}
                    >
                      🔒 {type.likesRequired.toLocaleString()}
                    </div>
                  )}

                  {/* Selected indicator */}
                  {currentType === type.id && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: LEATHER.goldBright,
                        boxShadow: `0 0 8px ${LEATHER.gold}`,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Footer - likes info */}
            <div
              className="px-4 py-3 border-t text-center"
              style={{ borderColor: LEATHER.light, background: LEATHER.dark }}
            >
              <p className="text-xs" style={{ color: LEATHER.goldDim }}>
                💡 Gagne des likes en postant du contenu!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatTypeSelector;
