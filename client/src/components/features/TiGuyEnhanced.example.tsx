/**
 * Ti-Guy Enhanced Example - Integration with TiGuyAgent
 * This example shows how to integrate the AI-powered TiGuyAgent with the chat interface
 * 
 * NOTE: This is an EXAMPLE file showing how to enhance the existing TiGuy component
 * with AI capabilities. To use this, you would replace the static responses in 
 * TiGuy.tsx with calls to the TiGuyAgent service.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import { TiGuyAgent, type TiGuyInput, type TiGuyResponse } from '../../services/tiGuyAgent';
import { toast } from '../../components/Toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'tiguy';
  timestamp: Date;
  metadata?: {
    emojis?: string[];
    tags?: string[];
    flagged?: boolean;
  };
}

const INTENT_KEYWORDS: Record<TiGuyInput['intent'], string[]> = {
  joke: ['blague', 'drôle', 'funny', 'haha', 'lol'],
  rant: ['fâché', 'frustré', 'rant', 'chiant', 'tabarnak'],
  event: ['party', 'événement', 'event', 'soirée', 'festival'],
  ad: ['promo', 'rabais', 'deal', 'spécial', 'offre'],
  poem: ['poème', 'poem', 'poésie', 'écriture', 'vers'],
};

const QUICK_ACTIONS = [
  { label: "Fais-moi rire!", intent: 'joke' as const },
  { label: "Annonce un event", intent: 'event' as const },
  { label: "Écris un poème", intent: 'poem' as const },
];

export const TiGuyEnhanced: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addTiGuyMessage("Allô! Moi c'est Ti-Guy, ton assistant québécois! 🦫", {});
      }, 500);
    }
  }, [isOpen]);

  // Add Ti-Guy message with metadata
  const addTiGuyMessage = (text: string, metadata: Message['metadata']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'tiguy',
      timestamp: new Date(),
      metadata,
    };
    
    setMessages((prev) => [...prev, newMessage]);
  };

  // Detect intent from user message
  const detectIntent = (text: string): TiGuyInput['intent'] => {
    const lowerText = text.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return intent as TiGuyInput['intent'];
      }
    }
    
    // Default to joke for fun interactions
    return 'joke';
  };

  // Handle user message with AI
  const handleSendMessage = async (text?: string, forceIntent?: TiGuyInput['intent']) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Show typing indicator
    setIsTyping(true);

    try {
      // Detect intent or use forced intent
      const intent = forceIntent || detectIntent(messageText);
      
      // Call AI service
      const response = await TiGuyAgent({
        text: messageText,
        intent,
      });

      setIsTyping(false);

      if (response) {
        // Check for flagged content
        if (response.flagged) {
          toast.warning('⚠️ Ce contenu a été signalé pour révision');
        }

        // Add Ti-Guy's reply with metadata
        addTiGuyMessage(response.reply, {
          emojis: response.emojis,
          tags: response.tags,
          flagged: response.flagged,
        });
      } else {
        // Fallback if AI fails
        addTiGuyMessage(
          "Désolé mon loup, j'ai un peu de difficulté là. Réessaie dans quelques secondes! 🦫",
          {}
        );
        toast.error('Ti-Guy a gelé temporairement');
      }
    } catch (error) {
      console.error('Ti-Guy Error:', error);
      setIsTyping(false);
      addTiGuyMessage(
        "Oups! J'ai un petit problème technique. Réessaie! 😅",
        {}
      );
    }
  };

  // Handle quick action
  const handleQuickAction = (label: string, intent: TiGuyInput['intent']) => {
    handleSendMessage(label, intent);
  };

  return (
    <>
      {/* Floating button - Premium Beaver Emblem */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-20 z-50 w-14 h-14 btn-gold rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform glow-gold animate-bounce"
          aria-label="Ouvre Ti-Guy"
        >
          <span className="text-3xl">🦫</span>
        </button>
      )}

      {/* Chat window - Luxury Leather Design */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] leather-card rounded-2xl shadow-2xl overflow-hidden stitched">
          {/* Header - Gold Gradient with Embossed Beaver */}
          <div className="bg-neutral-900 p-4 flex items-center justify-between border-b-2 border-gold-700/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center border-2 border-gold-700 glow-gold relative">
                <span className="text-2xl">🦫</span>
                <div className="absolute inset-0 rounded-full border-2 border-neutral-700" style={{ transform: 'scale(1.1)' }} />
              </div>
              <div>
                <h3 className="text-gold-400 font-bold embossed">Ti-Guy AI</h3>
                <p className="text-stone-400 text-xs embossed">Assistant québécois intelligent</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gold-500/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Messages - Dark Leather Background */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-black gold-scrollbar">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    'flex gap-2',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'tiguy' && (
                    <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0 border border-gold-700 glow-gold-subtle">
                      <span className="text-lg">🦫</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[70%] p-3 rounded-2xl text-sm',
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-black font-medium'
                        : 'bg-neutral-800 text-white border border-neutral-700'
                    )}
                  >
                    {message.text}
                    
                    {/* Show AI-generated metadata */}
                    {message.metadata?.emojis && message.metadata.emojis.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-neutral-700 flex gap-1">
                        {message.metadata.emojis.map((emoji, i) => (
                          <span key={i} className="text-lg">{emoji}</span>
                        ))}
                      </div>
                    )}
                    
                    {message.metadata?.tags && message.metadata.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.metadata.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center border border-gold-700">
                  <span className="text-lg">🦫</span>
                </div>
                <div className="bg-neutral-800 p-3 rounded-2xl border border-neutral-700">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions - Leather Buttons */}
          {messages.length <= 2 && (
            <div className="p-3 border-t border-gold-700/30 bg-neutral-900">
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.intent}
                    onClick={() => handleQuickAction(action.label, action.intent)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-full text-gold-400 text-xs transition-colors embossed border border-neutral-700"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input - Premium Gold Accent */}
          <div className="p-3 border-t-2 border-gold-700/50 bg-neutral-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Pose une question..."
                className="input-premium text-sm"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="p-2 btn-gold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform glow-gold"
              >
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Quebec Pride Footer */}
          <div className="px-4 py-2 bg-neutral-950 border-t border-gold-700/20">
            <p className="text-center text-stone-500 text-xs embossed flex items-center justify-center gap-1">
              <span className="text-gold-500">⚜️</span>
              <span>Propulsé par GPT-4 québécois</span>
              <span className="text-gold-500">🦫</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TiGuyEnhanced;
