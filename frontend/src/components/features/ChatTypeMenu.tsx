/**
 * ChatTypeMenu - Leather Wallet Dropdown Menu
 * Unlocks at 2K likes milestone
 * Switch between DMs, Groups, Channels, etc.
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "@/components/Toast";

// Fleur-de-lis pattern
const FLEUR_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Cpath d='M30 10c-1-4-4-6-7-6s-6 2-7 6l2 5-2-5c-1-4-4-6-7-6s-6 2-7 6c0 3 2 5 4 7l6 2-6-2c-2-2-4-4-4-7 0-4 2-6 6-7s6 2 7 6l4 9 4-9c1-4 4-6 7-6s6 2 7 6c0 3-2 5-4 7l-6 2 6-2c2-2 4-4 4-7 0-4-2-6-6-7s-6 2-7 6l-2 5 2-5z'/%3E%3C/g%3E%3C/svg%3E")`;

type ChatType = 'dms' | 'groups' | 'channels' | 'vault' | 'tiguy';

interface ChatTypeOption {
  id: ChatType;
  label: string;
  labelFr: string;
  icon: string;
  description: string;
  unlocked: boolean;
  likesRequired: number;
}

interface Props {
  userLikes: number;
  activeType: ChatType;
  onTypeChange: (type: ChatType) => void;
  unreadCounts?: Record<ChatType, number>;
}

const CHAT_TYPES: ChatTypeOption[] = [
  {
    id: 'tiguy',
    label: 'Ti-Guy AI',
    labelFr: 'Ti-Guy AI',
    icon: '🦫',
    description: 'Ton assistant québécois',
    unlocked: true,
    likesRequired: 0,
  },
  {
    id: 'dms',
    label: 'Direct Messages',
    labelFr: 'Messages Privés',
    icon: '💬',
    description: 'Conversations 1-on-1',
    unlocked: true,
    likesRequired: 0,
  },
  {
    id: 'groups',
    label: 'Group Chats',
    labelFr: 'Groupes',
    icon: '👥',
    description: 'Discussions de groupe',
    unlocked: true,
    likesRequired: 0,
  },
  {
    id: 'channels',
    label: 'Channels',
    labelFr: 'Canaux',
    icon: '📢',
    description: 'Communautés publiques',
    unlocked: false,
    likesRequired: 2000, // 2K likes to unlock
  },
  {
    id: 'vault',
    label: 'The Vault',
    labelFr: 'Le Coffre',
    icon: '🏛️',
    description: 'Messages chiffrés & éphémères',
    unlocked: false,
    likesRequired: 2000, // 2K likes to unlock
  },
];

export const ChatTypeMenu: React.FC<Props> = ({
  userLikes,
  activeType,
  onTypeChange,
  unreadCounts = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { tap, impact } = useHaptics();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if user just unlocked 2K milestone
  useEffect(() => {
    if (userLikes >= 2000) {
      const wasUnlocked = localStorage.getItem('chatMenuUnlocked');
      if (!wasUnlocked) {
        setShowUnlockAnimation(true);
        localStorage.setItem('chatMenuUnlocked', 'true');
        toast.success("🎉 2K LIKES! Menu débloqué!");
        setTimeout(() => setShowUnlockAnimation(false), 3000);
      }
    }
  }, [userLikes]);

  const activeChatType = CHAT_TYPES.find(t => t.id === activeType) || CHAT_TYPES[0];
  const isPremiumUnlocked = userLikes >= 2000;

  const handleSelect = (type: ChatTypeOption) => {
    tap();

    if (!type.unlocked && !isPremiumUnlocked && type.likesRequired > 0) {
      toast.info(`🔒 Débloque à ${type.likesRequired.toLocaleString()} likes!`);
      impact();
      return;
    }

    onTypeChange(type.id);
    setIsOpen(false);
  };

  // Calculate progress to 2K
  const progressTo2K = Math.min((userLikes / 2000) * 100, 100);
  const likesRemaining = Math.max(2000 - userLikes, 0);

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button - Belt Buckle Style */}
      <button
        onClick={() => { setIsOpen(!isOpen); tap(); }}
        className={cn(
          "relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300",
          "border-2 border-[#d4af37]/50",
          "bg-gradient-to-br from-[#2b1f17] to-[#1a1410]",
          "hover:shadow-lg hover:shadow-[#d4af37]/20",
          isOpen && "ring-2 ring-[#d4af37] shadow-lg shadow-[#d4af37]/30"
        )}
        style={{ backgroundImage: FLEUR_PATTERN }}
      >
        {/* Gold Stitching Effect */}
        <span className="absolute inset-1 border border-dashed border-[#d4af37]/40 rounded-lg pointer-events-none" />

        {/* Icon */}
        <span className="text-2xl">{activeChatType.icon}</span>

        {/* Label */}
        <div className="flex flex-col items-start">
          <span className="text-[#d4af37] font-bold text-sm tracking-wide">
            {activeChatType.labelFr}
          </span>
          <span className="text-[#8b7355] text-[10px]">
            {isPremiumUnlocked ? '✨ Premium' : `${userLikes.toLocaleString()} likes`}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={cn(
            "w-4 h-4 text-[#d4af37] transition-transform duration-300",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>

        {/* Unread Badge */}
        {(unreadCounts?.[activeType] || 0) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d4af37] text-black text-xs font-bold rounded-full flex items-center justify-center">
            {(unreadCounts?.[activeType] ?? 0) > 9 ? '9+' : unreadCounts?.[activeType]}
          </span>
        )}

        {/* Unlock Animation */}
        {showUnlockAnimation && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/50 to-[#d4af37]/0 animate-shimmer rounded-xl" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            background: 'linear-gradient(180deg, #2b1f17 0%, #1a1410 100%)',
            border: '3px solid #d4af37',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Gold stitching */}
          <div className="absolute inset-1 border border-dashed border-[#d4af37]/40 rounded-xl pointer-events-none" />

          {/* Progress Bar to 2K (if not unlocked) */}
          {!isPremiumUnlocked && (
            <div className="px-4 pt-4 pb-2 border-b border-[#d4af37]/20">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#8b7355]">Progression vers 2K</span>
                <span className="text-[#d4af37] font-bold">{Math.floor(progressTo2K)}%</span>
              </div>
              <div className="h-2 bg-[#1a1410] rounded-full overflow-hidden border border-[#d4af37]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] transition-all duration-500"
                  style={{ width: `${progressTo2K}%` }}
                />
              </div>
              <p className="text-[10px] text-[#8b7355] mt-1">
                {likesRemaining > 0
                  ? `Encore ${likesRemaining.toLocaleString()} likes pour débloquer les canaux!`
                  : '🎉 Félicitations! Menu premium débloqué!'
                }
              </p>
            </div>
          )}

          {/* Unlocked Banner */}
          {isPremiumUnlocked && (
            <div className="px-4 py-2 bg-gradient-to-r from-[#d4af37]/20 to-transparent border-b border-[#d4af37]/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="text-[#d4af37] text-xs font-bold">MENU PREMIUM ACTIVÉ</span>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-2 space-y-1">
            {CHAT_TYPES.map((type) => {
              const isLocked = !type.unlocked && !isPremiumUnlocked && type.likesRequired > 0;
              const isActive = activeType === type.id;
              const unreadCount = unreadCounts[type.id] || 0;

              return (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative overflow-hidden",
                    isActive
                      ? "bg-[#d4af37]/20 border border-[#d4af37]/50"
                      : "hover:bg-[#d4af37]/10 border border-transparent",
                    isLocked && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {/* Selection Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#d4af37] rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span className={cn(
                    "text-2xl transition-transform",
                    !isLocked && "group-hover:scale-110"
                  )}>
                    {isLocked ? '🔒' : type.icon}
                  </span>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        isActive ? "text-[#d4af37]" : "text-[#e8dcc8]"
                      )}>
                        {type.labelFr}
                      </span>
                      {type.id === 'tiguy' && (
                        <span className="px-1.5 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-[9px] rounded border border-[#d4af37]/30">
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b7355]">
                      {isLocked
                        ? `Débloque à ${type.likesRequired.toLocaleString()} likes`
                        : type.description
                      }
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {unreadCount > 0 && !isLocked && (
                    <span className="w-5 h-5 bg-[#d4af37] text-black text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}

                  {/* Lock Icon for locked items */}
                  {isLocked && (
                    <div className="flex items-center gap-1 text-[#8b7355]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#d4af37]/20 bg-[#1a1410]/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b7355]">Total likes:</span>
              <span className="text-[#d4af37] font-bold">{userLikes.toLocaleString()} ⚜️</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ChatTypeMenu;
