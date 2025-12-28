/**
 * Ti-Guy - Premium Quebec Heritage Emblem Design
 * The Zyeuté Mascot & AI Assistant featuring the iconic beaver emblem
 * Luxury leather chat widget with gold medallion styling
 * Inspired by the Ti-Guy Quebec CA logo
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../Button';
import { cn } from '../../lib/utils';
import tiGuyEmblem from '@assets/TI-GUY_NEW_SHARP_1765507001190.jpg';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'tiguy';
  timestamp: Date;
}

const TI_GUY_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Allô! Moi c'est Ti-Guy, ton petit castor préféré! 🦫",
    "Salut mon ami! Comment ça va aujourd'hui? ⚜️",
    "Heille! Content de te jaser! 🇨🇦",
  ],
  help: [
    "Je peux t'aider à naviguer l'app! Pose-moi n'importe quelle question! 💡",
    "T'as besoin d'aide? Je suis là pour toi! 🦫",
  ],
  upload: [
    "Pour uploader une photo ou vidéo, clique sur le + en bas! 📸",
    "Veux-tu créer du contenu? Va dans la section Upload! 🎥",
  ],
  fire: [
    "Les feux 🔥 c'est comme des likes, mais en plus hot! Plus t'en reçois, plus ton contenu est malade!",
    "Donne des feux aux posts que tu trouves sick! C'est notre système de rating! 🔥",
  ],
  story: [
    "Les Stories disparaissent après 24 heures! Parfait pour du contenu éphémère! ⏰",
    "Crée une Story en cliquant sur ton avatar en haut du feed! ✨",
  ],
  quebec: [
    "Zyeuté, c'est fait au Québec, pour le Québec! On célèbre notre culture! 🇨🇦⚜️",
    "Utilise des hashtags québécois comme #514 #450 #quebec #montreal! 🏔️",
  ],
  gifts: [
    "Tu peux envoyer des cadeaux virtuels aux créateurs que tu aimes! 🎁",
    "Les cadeaux supportent nos créateurs québécois! C'est comme un tip! 💰",
  ],
  premium: [
    "Deviens VIP pour débloquer Ti-Guy Artiste et Studio! 👑",
    "Les membres Or ont accès à toutes mes fonctionnalités AI! ✨",
  ],
  default: [
    "Hmm, je comprends pas trop... Peux-tu reformuler? 🤔",
    "Je suis un petit castor, pas Google! Essaie une autre question! 😅",
    "Désolé, j'ai pas compris! Je suis encore en train d'apprendre! 🦫",
  ],
};

const QUICK_ACTIONS = [
  { label: "How does it work?", key: "help" },
  { label: "Upload a photo", key: "upload" },
  { label: "What are the lights?", key: "fire" },
  { label: "Become a VIP?", key: "premium" },
];

export const TiGuy: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add Ti-Guy message with progress indicator
  const addTiGuyMessage = useCallback((responseKey: string) => {
    setIsTyping(true);
    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 10, 90);
        return next;
      });
    }, 100);

    setTimeout(() => {
      const responses = TI_GUY_RESPONSES[responseKey] || TI_GUY_RESPONSES.default;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const newMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'tiguy',
        timestamp: new Date(),
      };

      setProgress(100);
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
      setGenerating(false);
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 500);
    }, 1000);
  }, []);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addTiGuyMessage('greeting');
      }, 500);
    }
  }, [isOpen, messages.length, addTiGuyMessage]);

  // Handle user message - now uses DeepSeek AI
  const handleSendMessage = async (text?: string) => {
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
    setGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90));
    }, 200);

    try {
      // Call DeepSeek AI via backend - serialize messages properly
      const serializedHistory = messages.slice(-10).map(msg => ({
        text: msg.text,
        sender: msg.sender,
      }));

      const response = await fetch('/api/ai/tiguy-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
          conversationHistory: serializedHistory,
        }),
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      const aiResponse = data.response || data.error || "Oups! J'ai eu un petit bug. Réessaie! 🦫";

      const newMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'tiguy',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Ti-Guy API error:', error);

      // Show error message instead of silent fallback
      const newMessage: Message = {
        id: Date.now().toString(),
        text: "Oups, j'ai eu un p'tit problème de connexion là! 🦫 Réessaie dans une minute, tsé?",
        sender: 'tiguy',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    } finally {
      setIsTyping(false);
      setGenerating(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Handle quick action
  const handleQuickAction = (key: string, label: string) => {
    handleSendMessage(label);
  };

  return (
    <>
      {/* Floating button removed - using ChatButton component instead */}
      {/* The ChatButton opens ChatModal which uses TiGuy chat functionality */}

      {/* Chat window - Luxury Leather Emblem Design */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1a1512 0%, #0d0a08 50%, #1a1512 100%)',
            border: '3px solid #4a3b22',
            boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 15px rgba(255, 191, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Header - Emblem Style with Beaver Logo */}
          <div
            className="p-4 flex items-center justify-between relative"
            style={{
              background: 'linear-gradient(180deg, #2d2218 0%, #1a1512 100%)',
              borderBottom: '2px solid #4a3b22',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Circular Emblem Avatar */}
              <div
                className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  border: '3px solid #B38600',
                  boxShadow: '0 0 15px rgba(255, 191, 0, 0.3), inset 0 0 10px rgba(0,0,0,0.5)',
                }}
              >
                <img
                  src={tiGuyEmblem}
                  alt="Ti-Guy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3
                  className="font-bold text-lg"
                  style={{
                    background: 'linear-gradient(180deg, #FFD966 0%, #B38600 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  Ti-Guy
                </h3>
                <p
                  className="text-xs font-bold tracking-wider"
                  style={{ color: '#8B7355' }}
                >
                  QUEBEC CA 🦫
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full transition-colors"
              style={{
                background: 'rgba(179, 134, 0, 0.2)',
              }}
            >
              <svg className="w-5 h-5" style={{ color: '#B38600' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Messages - Dark Leather Background */}
          <div
            className="h-96 overflow-y-auto p-4 space-y-3"
            style={{
              background: 'linear-gradient(180deg, #0d0a08 0%, #1a1512 50%, #0d0a08 100%)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'tiguy' && (
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{
                      border: '2px solid #B38600',
                      boxShadow: '0 0 8px rgba(255, 191, 0, 0.3)',
                    }}
                  >
                    <img
                      src={tiGuyEmblem}
                      alt="Ti-Guy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[70%] p-3 rounded-2xl text-sm',
                    message.sender === 'user'
                      ? 'text-black font-medium'
                      : 'text-white'
                  )}
                  style={
                    message.sender === 'user'
                      ? {
                        background: 'linear-gradient(135deg, #FFD966 0%, #B38600 100%)',
                        boxShadow: '0 2px 8px rgba(179, 134, 0, 0.4)',
                      }
                      : {
                        background: 'linear-gradient(135deg, #2d2218 0%, #1a1512 100%)',
                        border: '1px solid #4a3b22',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                      }
                  }
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center">
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                  style={{
                    border: '2px solid #B38600',
                    boxShadow: '0 0 8px rgba(255, 191, 0, 0.3)',
                  }}
                >
                  <img
                    src={tiGuyEmblem}
                    alt="Ti-Guy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="p-3 rounded-2xl flex-1"
                  style={{
                    background: 'linear-gradient(135deg, #2d2218 0%, #1a1512 100%)',
                    border: '1px solid #4a3b22',
                  }}
                >
                  {generating && progress > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: '#B38600' }}>Ti-Guy réfléchit...</span>
                        <span style={{ color: '#8B7355' }}>{progress}%</span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid #4a3b22',
                        }}
                      >
                        <div
                          className="h-full transition-all duration-100 ease-out"
                          style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #B38600 0%, #FFD966 100%)',
                            boxShadow: '0 0 10px rgba(255, 191, 0, 0.5)',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#B38600', animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#B38600', animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#B38600', animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions - Leather Buttons */}
          {messages.length <= 2 && (
            <div
              className="p-3"
              style={{
                background: 'linear-gradient(180deg, #1a1512 0%, #2d2218 100%)',
                borderTop: '1px solid #4a3b22',
              }}
            >
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => handleQuickAction(action.key, action.label)}
                    className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105"
                    style={{
                      background: 'rgba(26, 21, 18, 0.8)',
                      border: '1px solid #B38600',
                      color: '#B38600',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input - Premium Gold Accent */}
          <div
            className="p-3"
            style={{
              background: 'linear-gradient(180deg, #2d2218 0%, #1a1512 100%)',
              borderTop: '2px solid #4a3b22',
            }}
          >
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
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid #4a3b22',
                  color: '#FFD966',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #FFD966 0%, #B38600 100%)',
                  boxShadow: '0 0 10px rgba(255, 191, 0, 0.3)',
                }}
              >
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Quebec Pride Footer */}
          <div
            className="px-4 py-2"
            style={{
              background: 'linear-gradient(180deg, #1a1512 0%, #0d0a08 100%)',
              borderTop: '1px solid #4a3b22',
            }}
          >
            <p
              className="text-center text-xs flex items-center justify-center gap-1"
              style={{ color: '#8B7355' }}
            >
              <span style={{ color: '#B38600' }}>⚜️</span>
              <span>Powered by Quebec AI</span>
              <span style={{ color: '#B38600' }}>🦫</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TiGuy;
