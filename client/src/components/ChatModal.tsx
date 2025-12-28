/**
 * ChatModal - Premium Full-Screen Chat Interface
 * Features TI-Guy's authentic Quebec French slang personality
 * Smooth slide animations and gold/leather theme
 */

import React, { useState, useEffect, useRef } from 'react';
import { IoCloseOutline, IoSend, IoAppsOutline, IoImageOutline } from 'react-icons/io5';
import { useHaptics } from '@/hooks/useHaptics';
import { getTiGuyResponse, getTiGuyWelcomeMessage } from '@/utils/tiGuyResponses';
import { tiguyService } from '@/services/tiguyService';
import type { ChatMessage } from '@/types/chat';
import { toast } from '@/components/Toast';
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
  const [tiguMode, setTiguMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isJoualizing, setIsJoualizing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleSendMessage = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string') e.preventDefault();
    
    const text = typeof e === 'string' ? e : inputText.trim();
    if ((!text && !selectedImage) || isTyping || loading) return;

    tap();

    const currentImage = selectedImage;

    // Add user message if not already added by quick action
    if (typeof e !== 'string') {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        sender: 'user',
        text: text,
        timestamp: new Date(),
        image: currentImage || undefined
      };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setSelectedImage(null);
      setImagePreview(null);
    }

    setIsTyping(true);

    if (tiguMode) {
      setLoading(true);
      try {
        const responseData = await tiguyService.sendMessage(text, currentImage || undefined);
        const tiGuyMessage: ChatMessage = {
          id: `tiguy-${Date.now()}-${Math.random()}`,
          sender: 'tiGuy',
          text: responseData.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, tiGuyMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: 'tiGuy',
          text: '⚠️ TI-GUY est occupé, essaie plus tard!',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
        setLoading(false);
      }
    } else {
      // Simulate typing delay (800ms for natural feel)
      setTimeout(() => {
        const tiGuyResponse = getTiGuyResponse(text);
        setMessages(prev => [...prev, tiGuyResponse]);
        setIsTyping(false);
      }, 800);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop grosse! (max 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoualize = async (style: 'street' | 'old' | 'enhanced') => {
    const textToJoualize = inputText.trim() || (messages.length > 1 ? messages[messages.length - 1].text : '');
    
    if (!textToJoualize || isJoualizing) return;

    tap();
    setIsJoualizing(true);
    setShowToolsMenu(false);

    try {
      const response = await fetch('/api/ai/joualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` // Placeholder for real JWT
        },
        body: JSON.stringify({ text: textToJoualize, style }),
      });

      if (!response.ok) throw new Error('Failed to joualize');

      const data = await response.json();
      setInputText(data.rewrittenText);
      toast.success('Texte transformé! ✨');
    } catch (error) {
      console.error('Joualizer error:', error);
      toast.error('Échec de la transformation. 🦫');
    } finally {
      setIsJoualizing(false);
    }
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${message.sender}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
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
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
        <style>{`
          .chat-tiguy-mode {
            background: linear-gradient(135deg, #0051A5 0%, #EF3E42 100%) !important;
            border: 2px solid #FFD700 !important;
          }
          .chat-leather-bg {
            background: linear-gradient(180deg, #1a1512 0%, #0d0a08 100%);
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div
          className={cn(
            'w-full max-w-md h-[90vh] chat-leather-bg rounded-t-[2.5rem] transition-all duration-500',
            'flex flex-col overflow-hidden',
            'border-t-4 border-gold-500 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]',
            'transition-transform duration-300 ease-out',
            isVisible ? 'translate-y-0' : 'translate-y-full',
            tiguMode && 'chat-tiguy-mode'
          )}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="bg-neutral-900/95 backdrop-blur-md border-b border-gold-500/30 p-5 flex items-center justify-between shadow-lg relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-600 shadow-[0_0_15px_rgba(212,175,55,0.3)] relative">
              <img
                src="/ti-guy-logo.jpg?v=2"
                alt="Ti-Guy"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-gold-400 font-bold text-xl tracking-tight">Ti-Guy</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">En ligne</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border shadow-lg",
                tiguMode 
                  ? "bg-red-600 border-yellow-400 text-white shadow-[0_0_15px_rgba(255,215,0,0.4)] scale-105" 
                  : "bg-neutral-800 border-neutral-700 text-neutral-400"
              )}
              onClick={() => {
                tap();
                setTiguMode(!tiguMode);
              }}
            >
              {tiguMode ? '🔱 Ti-Guy Mode' : 'Standard'}
            </button>
            <button
              onClick={handleClose}
              className="p-2.5 bg-neutral-800/80 hover:bg-neutral-700/80 rounded-full transition-colors border border-white/5"
              aria-label="Fermer"
            >
              <IoCloseOutline className="w-6 h-6 text-white/70" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 gold-scrollbar no-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 items-end transition-all duration-300 animate-in fade-in slide-in-from-bottom-2',
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {message.sender === 'tiGuy' && (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gold-800/50 shadow-md">
                  <img
                    src="/ti-guy-logo.jpg?v=2"
                    alt="Ti-Guy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-3xl p-4 text-sm leading-relaxed shadow-xl border',
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-black font-semibold border-gold-300/30'
                    : 'bg-neutral-800/90 text-zinc-100 border-white/5 backdrop-blur-sm'
                )}
                style={{
                  borderRadius: message.sender === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px'
                }}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                {message.image && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-black/10 shadow-md">
                    <img src={message.image} alt="Chat attachment" className="w-full max-h-60 object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-2 opacity-60">
                   <span className="text-[10px] font-medium uppercase tracking-widest">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center animate-pulse">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gold-800/30">
                <img
                  src="/ti-guy-logo.jpg?v=2"
                  alt="Ti-Guy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-neutral-800/60 p-4 rounded-3xl rounded-bl-sm border border-white/5">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gold-400/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gold-400/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gold-400/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions Scrollable */}
        <div className="px-5 py-3 flex gap-2.5 overflow-x-auto no-scrollbar border-t border-white/5 bg-black/20">
          <button 
            className="bg-leather-800/80 hover:bg-leather-700 text-gold-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gold-500/20 whitespace-nowrap transition-all active:scale-95 shadow-lg"
            onClick={async () => {
              tap();
              try {
                const joke = await tiguyService.getJoke();
                addMessage({ sender: 'tiGuy', text: joke.joke });
              } catch (error) {
                addMessage({ sender: 'tiGuy', text: "Oups, j'ai oublié la chute! Réessaye plus tard!" });
              }
            }}
          >
            🎭 Joke
          </button>
          <button 
            className="bg-leather-800/80 hover:bg-leather-700 text-gold-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gold-500/20 whitespace-nowrap transition-all active:scale-95 shadow-lg"
            onClick={() => {
              const text = "raconte-moi une histoire";
              handleSendMessage(text);
            }}
          >
            📜 Histoire
          </button>
          <button 
            className="bg-leather-800/80 hover:bg-leather-700 text-gold-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gold-500/20 whitespace-nowrap transition-all active:scale-95 shadow-lg"
            onClick={() => {
              const text = "parle-moi du Québec";
              handleSendMessage(text);
            }}
          >
            ⚜️ Culture
          </button>
        </div>

        {/* Input Area */}
        <div className="p-5 pb-8 border-t border-gold-500/30 bg-neutral-900/90 backdrop-blur-xl relative z-10">
          {imagePreview && (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="relative inline-block group">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded-2xl border-2 border-gold-500 shadow-[0_0_15px_rgba(255,215,0,0.3)]" 
                />
                <button 
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedImage(null);
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-all hover:scale-110 active:scale-90"
                >
                  <IoCloseOutline size={18} />
                </button>
              </div>
            </div>
          )}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3"
          >
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { tap(); setShowToolsMenu(!showToolsMenu); }}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full bg-leather-800 text-gold-500/80 hover:text-gold-400 border transition-all shadow-md group",
                    showToolsMenu ? "border-gold-500 bg-leather-700 shadow-gold-500/20" : "border-gold-500/20"
                  )}
                  aria-label="Extensions"
                >
                  <IoAppsOutline className={cn("w-5 h-5 transition-transform", showToolsMenu ? "rotate-45" : "group-hover:rotate-12")} />
                </button>

                {/* Tools Dropup Menu */}
                {showToolsMenu && (
                  <div className="absolute bottom-14 left-0 w-48 leather-card rounded-2xl p-2 stitched border-gold-500/40 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50">
                    <div className="text-[10px] font-bold text-gold-500/60 uppercase tracking-widest px-3 py-1 mb-1">
                      Le Joualizer ⚜️
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoualize('street')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gold-500/10 text-zinc-100 text-sm flex items-center gap-2 transition-colors"
                    >
                      <span>🔥</span> Urban Street
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJoualize('old')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gold-500/10 text-zinc-100 text-sm flex items-center gap-2 transition-colors"
                    >
                      <span>🏡</span> Pure Laine
                    </button>
                    <button
                      type="button"
                      onClick={() => handleJoualize('enhanced')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gold-500/10 text-zinc-100 text-sm flex items-center gap-2 transition-colors"
                    >
                      <span>🚀</span> Viral Boost
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { tap(); fileInputRef.current?.click(); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-leather-800 text-gold-500/80 hover:text-gold-400 border border-gold-500/20 active:scale-90 transition-all shadow-md group"
                aria-label="Téléverser"
              >
                <IoImageOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Jase avec moi..."
                className="w-full bg-black/60 border-2 border-leather-700 rounded-3xl py-4 pl-5 pr-14 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-500/60 transition-all shadow-inner"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={cn(
                  'absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full',
                  'bg-gradient-to-br from-gold-400 to-amber-600',
                  'text-black transition-all active:scale-90',
                  'disabled:opacity-40 disabled:grayscale',
                  'flex items-center justify-center shadow-lg group'
                )}
                aria-label="Envoyer"
              >
                <IoSend className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
          
          <p className="mt-4 text-center text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-zinc-800"></span>
            ⚜️ Zyeuté AI 🦫
            <span className="w-8 h-px bg-zinc-800"></span>
          </p>
        </div>
      </div>
    </div>
  );
};
