/**
 * ChatButton - Premium Bronze Emblem Medallion Style
 * Features the TI-GUY Quebec CA beaver emblem design
 * Circular button with baroque beaver holding maple leaf
 */

import React, { useState } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { ChatModal } from './ChatModal';
import { cn } from '@/lib/utils';
import tiGuyEmblem from '@assets/TI-GUY_NEW_SHARP_1765507001190.jpg';

interface ChatButtonProps {
  onClick?: () => void;
  isFixed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-14 h-14',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

export const ChatButton: React.FC<ChatButtonProps> = ({
  onClick,
  isFixed = true,
  className,
  size = 'md',
}) => {
  const { impact } = useHaptics();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleClick = () => {
    impact();
    setIsChatOpen(true);
    if (onClick) {
      onClick();
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const positionClasses = isFixed
    ? 'fixed bottom-32 right-4 z-40'
    : 'relative';

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          positionClasses,
          sizeClasses[size],
          'rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300 ease-in-out',
          'transform hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-black',
          'group overflow-hidden',
          className
        )}
        style={{
          boxShadow: `
            0 0 25px rgba(212, 175, 55, 0.6),
            0 6px 16px rgba(0, 0, 0, 0.7),
            0 0 0 3px #D4AF37
          `,
          border: '3px solid #8B6914',
        }}
        aria-label="Ouvrir le chat Ti-Guy"
        data-testid="button-tiguy-chat"
      >
        <img
          src={tiGuyEmblem}
          alt="Ti-Guy - Assistant IA Québécois"
          className="w-full h-full object-cover rounded-full"
        />
        
        <div
          className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
          }}
        />
      </button>

      {isChatOpen && <ChatModal onClose={handleCloseChat} />}
    </>
  );
};

