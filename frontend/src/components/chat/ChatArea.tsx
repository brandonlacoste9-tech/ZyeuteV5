/**
 * ChatArea - Messages Display
 * Leather wallet message bubbles
 */

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';

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
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  chatType: string;
}

export const ChatArea: React.FC<Props> = ({ 
  messages, 
  isLoading, 
  isTyping,
  chatType 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('fr-CA');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {} as Record<string, Message[]>);

  if (isLoading) {
    return (
      <div className="chat-area loading">
        <div className="loading-spinner">
          <div className="spinner-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>Aucun message</p>
          <span>Commence la conversation!</span>
        </div>
      )}

      {/* Messages by date */}
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date} className="message-group">
          {/* Date separator */}
          <div className="date-separator">
            <span>{date}</span>
          </div>

          {/* Messages */}
          {msgs.map((msg, idx) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              showAvatar={
                idx === 0 || 
                msgs[idx - 1]?.sender !== msg.sender
              }
              isConsecutive={
                idx > 0 && 
                msgs[idx - 1]?.sender === msg.sender
              }
            />
          ))}
        </div>
      ))}

      {/* TI-GUY typing indicator */}
      {isTyping && (
        <div className="typing-indicator">
          <div className="typing-avatar">🦫</div>
          <div className="typing-bubble">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
};

export default ChatArea;
