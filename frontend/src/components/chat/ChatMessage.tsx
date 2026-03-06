/**
 * ChatMessage - Individual Message Bubble
 * Leather wallet styled messages
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from '@/components/Toast';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received' | 'bot';
  isEncrypted?: boolean;
  reactions?: { emoji: string; count: number }[];
}

interface Props {
  message: Message;
  showAvatar: boolean;
  isConsecutive: boolean;
}

const REACTIONS = ['❤️', '👍', '🔥', '😂', '😮', '👏', '🦫', '⚜️'];

export const ChatMessage: React.FC<Props> = ({ 
  message, 
  showAvatar,
  isConsecutive 
}) => {
  const { tap } = useHaptics();
  const [showReactions, setShowReactions] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle encrypted message
  const displayContent = () => {
    if (message.isEncrypted && !isDecrypted) {
      return '🔒 Message sécurisé - Cliquer pour lire';
    }
    if (message.isEncrypted && isDecrypted) {
      try {
        return atob(message.content.replace('🔒', ''));
      } catch {
        return '[Message indisponible]';
      }
    }
    return message.content;
  };

  const handleDecrypt = () => {
    if (message.isEncrypted && !isDecrypted) {
      setIsDecrypted(true);
      tap();
    }
  };

  const handleReaction = (emoji: string) => {
    tap();
    toast.success(`Réaction ${emoji} ajoutée!`);
    setShowReactions(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent());
    toast.success('Copié!');
    setShowReactions(false);
  };

  return (
    <div 
      className={cn(
        'message-wrapper',
        message.type === 'sent' && 'sent',
        message.type === 'received' && 'received',
        message.type === 'bot' && 'bot',
        isConsecutive && 'consecutive'
      )}
    >
      {/* Avatar */}
      {showAvatar && message.type !== 'sent' && (
        <div className="message-avatar">
          {message.type === 'bot' ? '🦫' : '👤'}
        </div>
      )}

      <div className="message-content">
        {/* Sender name for groups */}
        {showAvatar && message.type !== 'sent' && (
          <div className="message-sender">
            {message.type === 'bot' ? 'TI-GUY' : message.sender}
          </div>
        )}

        {/* Message bubble */}
        <div 
          className={cn(
            'message-bubble stitched',
            message.isEncrypted && !isDecrypted && 'encrypted'
          )}
          onClick={handleDecrypt}
        >
          {/* Encrypted indicator */}
          {message.isEncrypted && !isDecrypted && (
            <div className="encrypted-indicator">
              <span>🔒</span>
            </div>
          )}

          {/* Message text */}
          <p className="message-text">
            {displayContent()}
          </p>

          {/* Timestamp */}
          <div className="message-meta">
            <span className="message-time">{formatTime(message.timestamp)}</span>
            {message.type === 'sent' && (
              <span className="message-status">✓✓</span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((r, i) => (
              <button 
                key={i} 
                className="reaction-badge"
                onClick={() => handleReaction(r.emoji)}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}

        {/* Reaction picker (on hover) */}
        <div className="reaction-picker">
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="reaction-btn"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Actions menu */}
      <button 
        className="message-actions-btn"
        onClick={() => setShowReactions(!showReactions)}
      >
        ⋮
      </button>

      {/* Context menu */}
      {showReactions && (
        <div className="context-menu">
          <button onClick={handleCopy}>📋 Copier</button>
          <button onClick={() => toast.info('Bientôt')}>🗑️ Supprimer</button>
          <button onClick={() => toast.info('Bientôt')}>↩️ Répondre</button>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
