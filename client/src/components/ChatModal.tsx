/**
 * ChatModal - Premium Full-Screen Chat Interface
 * Features TI-Guy's authentic Quebec French slang personality
 * Smooth slide animations and gold/leather theme
 */

import React, { useState, useEffect, useRef } from 'react';
import { IoCloseOutline, IoSend } from 'react-icons/io5';
import { useHaptics } from '@/hooks/useHaptics';
import { getTiGuyResponse, getTiGuyWelcomeMessage } from '@/utils/tiGuyResponses';
import type { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatModalProps {
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ onClose }) => {
  const { tap, impact } = useHaptics();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Slide-in animation on mount
  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
    
    // Add welcome message
    const welcomeMessage = getTiGuyWelcomeMessage();
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle sending a message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const text = inputText.trim();
    if (!text || isTyping) return;

    tap();

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay (800ms for natural feel)
    setTimeout(() => {
      const tiGuyResponse = getTiGuyResponse(text);
      setMessages(prev => [...prev, tiGuyResponse]);
      setIsTyping(false);
    }, 800);
  };

  // Handle close with slide-out animation
  const handleClose = () => {
    impact();
    setIsVisible(false);
    // Delay unmounting until animation completes
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Format timestamp in French
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center',
        'transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className={cn(
          'w-full max-w-md h-full bg-black leather-overlay',
          'flex flex-col',
          'border-t-4 border-gold-500',
          'shadow-2xl',
          'transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-md border-b-2 border-gold-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold-700 glow-gold relative">
              <img
                src="/ti-guy-logo.jpg?v=2"
                alt="Ti-Guy"
                className="w-full h-full object-cover"
              />
              {/* Embossed effect ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-neutral-700 pointer-events-none"
                style={{ transform: 'scale(1.1)' }}
              />
            </div>
            <div>
              <h3 className="text-gold-400 font-bold text-lg embossed">Ti-Guy</h3>
              <p className="text-stone-400 text-xs embossed">Ton assistant québécois</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gold-500/20 rounded-full transition-colors"
            aria-label="Fermer le chat"
          >
            <IoCloseOutline className="w-6 h-6 text-gold-400" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black gold-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {/* TI-Guy Avatar (only for TI-Guy messages) */}
              {message.sender === 'tiGuy' && (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gold-700 glow-gold-subtle">
                  <img
                    src="/ti-guy-logo.jpg?v=2"
                    alt="Ti-Guy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl p-3 text-sm',
                  'transition-all duration-200',
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-black font-medium'
                    : 'bg-neutral-800 text-white border border-neutral-700'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <span
                  className={cn(
                    'text-xs mt-1 block',
                    message.sender === 'user' ? 'text-black/60' : 'text-stone-400'
                  )}
                >
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gold-700">
                <img
                  src="/ti-guy-logo.jpg?v=2"
                  alt="Ti-Guy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-neutral-800 p-3 rounded-2xl border border-neutral-700">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 p-4 border-t-2 border-gold-500/30 bg-neutral-900 backdrop-blur-md">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pose une question..."
              className="flex-1 input-premium text-sm"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={cn(
                'p-3 rounded-full',
                'bg-gradient-to-r from-gold-400 to-gold-600',
                'text-black font-bold',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:scale-110 active:scale-95',
                'transition-transform duration-200',
                'glow-gold',
                'flex items-center justify-center'
              )}
              aria-label="Envoyer"
            >
              <IoSend className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Quebec Pride Footer */}
        <div className="px-4 py-2 bg-neutral-950 border-t border-gold-500/20">
          <p className="text-center text-stone-500 text-xs embossed flex items-center justify-center gap-1">
            <span className="text-gold-500">⚜️</span>
            <span>Propulsé par l&apos;IA québécoise</span>
            <span className="text-gold-500">🦫</span>
          </p>
        </div>
      </div>
    </div>
  );
};
