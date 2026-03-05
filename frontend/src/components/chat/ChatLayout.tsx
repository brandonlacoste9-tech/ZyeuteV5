/**
 * ChatLayout - Main Leather Wallet Container with Ambient Mood Lighting
 * TI-GUY's messaging area with dynamic glow effects
 */

import React, { useState, useEffect, useMemo } from 'react';
// Removed ChatTypeMenu import since it is not used or does not exist.
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { messagingService } from '@/services/messagingService';
import { tiguyService } from '@/services/tiguyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { useHaptics } from '@/hooks/useHaptics';
import './chat.styles.css';

type ChatType = 'tiguy' | 'dms' | 'groups' | 'channels' | 'vault';
type AmbientMode = 'default' | 'thinking' | 'royal' | 'night' | 'charging' | 'warning';

interface AmbientGlowConfig {
  mode: AmbientMode;
  colors: string[];
  intensity: number;
  pulseSpeed: number;
}

export const ChatLayout: React.FC = () => {
  const { user } = useAuth();
  const haptics = useHaptics();
  const [activeType, setActiveType] = useState<ChatType>('tiguy');
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [ambientMode, setAmbientMode] = useState<AmbientMode>('default');
  const [charge, setCharge] = useState(100);
  const [glowPhase, setGlowPhase] = useState(0);

  // Mock user likes - replace with real data
  const userLikes = (user as any)?.totalLikes || 1500;

  // Breathing animation loop
  useEffect(() => {
    // DISABLED: Breathing animation causing system freezes
    // Use static glow instead
    setGlowPhase(0.4);
    return () => { };
  }, []);

  // Ambient glow configuration based on mode
  const ambientConfig: Record<AmbientMode, AmbientGlowConfig> = {
    default: {
      mode: 'default',
      colors: ['#1a1a2e', '#16213e', '#0f3460'], // Deep navy → teal
      intensity: 0.4,
      pulseSpeed: 10,
    },
    thinking: {
      mode: 'thinking',
      colors: ['#2d1b4e', '#1a1a2e', '#4a148c'], // Purple glow with dark edges
      intensity: 0.6,
      pulseSpeed: 8,
    },
    royal: {
      mode: 'royal',
      colors: ['#0d1b2a', '#1b263b', '#d4af37'], // Deep blue → gold
      intensity: 0.5,
      pulseSpeed: 12,
    },
    night: {
      mode: 'night',
      colors: ['#000000', '#0a0a0a', '#1a1a1a'], // Cool dark with vignette
      intensity: 0.3,
      pulseSpeed: 15,
    },
    charging: {
      mode: 'charging',
      colors: ['#1a1a2e', '#2e1a12', '#d4af37'], // Gold shift
      intensity: 0.7,
      pulseSpeed: 6,
    },
    warning: {
      mode: 'warning',
      colors: ['#2e1a12', '#4a2c1f', '#8b0000'], // Red glow
      intensity: 0.8,
      pulseSpeed: 4,
    },
  };

  const currentConfig = ambientConfig[ambientMode];

  // Simplified background - no heavy blur/animation to prevent GPU freeze
  const backgroundStyle = useMemo(() => {
    return {
      background: `linear-gradient(180deg, 
        ${currentConfig.colors[0]} 0%, 
        ${currentConfig.colors[1]} 50%, 
        ${currentConfig.colors[2]} 100%)`,
      opacity: 0.2,
    };
  }, [currentConfig]);

  // Simplified edge glow - static only
  const edgeGlowStyle = useMemo(() => {
    if (ambientMode !== 'royal' && ambientMode !== 'charging') return {};
    return {
      boxShadow: 'inset 0 0 40px rgba(212, 175, 55, 0.15)',
    };
  }, [ambientMode]);

  // TI-GUY energy/charge simulation
  useEffect(() => {
    if (isTyping && charge > 0) {
      const interval = setInterval(() => {
        setCharge(c => Math.max(0, c - 2));
      }, 200);
      return () => clearInterval(interval);
    } else if (!isTyping && charge < 100) {
      const interval = setInterval(() => {
        setCharge(c => Math.min(100, c + 5));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isTyping, charge]);

  // Update ambient mode based on state
  useEffect(() => {
    if (isTyping) {
      setAmbientMode('thinking');
    } else if (charge < 20) {
      setAmbientMode('warning');
    } else if (charge < 50) {
      setAmbientMode('charging');
    } else {
      setAmbientMode('default');
    }
  }, [isTyping, charge]);

  // Load conversations on mount
  useEffect(() => {
    if (activeType !== 'tiguy') {
      loadConversations();
    }
  }, [activeType]);

  // Load TI-GUY welcome message
  useEffect(() => {
    if (activeType === 'tiguy') {
      setMessages([
        {
          id: 'welcome',
          sender: 'tiguy',
          content: "Ayoye! Bienvenue sur Zyeuté Messenger! 🦫⚜️\n\nChu Ti-Guy, ton assistant québécois. Pose-moi tes questions!",
          timestamp: new Date().toISOString(),
          type: 'bot',
        }
      ]);
    }
  }, [activeType]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data.conversations);
    } catch (error) {
      toast.error("Erreur de chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (content: string, options?: {
    isEncrypted?: boolean;
    ephemeralDuration?: number;
    mediaUrl?: string;
  }) => {
    if (!content.trim()) return;

    haptics.tap();

    // Add user message
    const userMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: options?.isEncrypted ? `🔒${btoa(content)}` : content,
      timestamp: new Date().toISOString(),
      type: 'sent',
      isEncrypted: options?.isEncrypted,
    };

    setMessages(prev => [...prev, userMessage]);

    // TI-GUY AI response
    if (activeType === 'tiguy') {
      setIsTyping(true);
      haptics.impact();

      try {
        const response = await tiguyService.sendMessage(content);
        const text = typeof response === 'string' ? response : (response as any).response;

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `tiguy-${Date.now()}`,
            sender: 'tiguy',
            content: text,
            timestamp: new Date().toISOString(),
            type: 'bot',
          }]);
          setIsTyping(false);
          haptics.success();
        }, 1500);
      } catch (error) {
        setIsTyping(false);
        haptics.error();
        toast.error("Ti-Guy est indisponible");
      }
    }

    // Handle ephemeral
    if (options?.ephemeralDuration && options.ephemeralDuration > 0) {
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        toast.info("💨 Message éphémère supprimé");
      }, options.ephemeralDuration * 1000);
    }
  };

  // Toggle royal mode on double click of header
  const [royalClicks, setRoyalClicks] = useState(0);
  const handleHeaderClick = () => {
    const newClicks = royalClicks + 1;
    setRoyalClicks(newClicks);

    if (newClicks >= 3) {
      setAmbientMode(prev => prev === 'royal' ? 'default' : 'royal');
      setRoyalClicks(0);
      haptics.selection();
      toast.info(ambientMode === 'royal' ? 'Mode royal désactivé' : '✨ Mode royal activé!');
    }

    setTimeout(() => setRoyalClicks(0), 500);
  };

  return (
    <div className="chat-layout">
      {/* Ambient Mood Lighting Background */}
      <div
        className="ambient-glow-layer"
        style={backgroundStyle}
      />

      {/* Gold Edge Glow Effect (Royal Mode) */}
      {(ambientMode === 'royal' || ambientMode === 'charging') && (
        <div
          className="edge-glow-layer"
          style={edgeGlowStyle}
        />
      )}

      {/* Floating Particles DISABLED - caused system freezes */}

      {/* Main Chat Container */}
      <div className="chat-layout-inner stitched" style={edgeGlowStyle}>

        {/* Header with Chat Type Menu */}
        <div
          className="chat-header"
          onClick={handleHeaderClick}
          style={{ cursor: 'pointer' }}
          title="Triple-click pour mode royal"
        >
          {/* TI-GUY Energy Indicator */}
          <div className="energy-indicator" title={`Énergie TI-GUY: ${charge}%`}>
            <div className={`fleur-de-lys ${charge < 20 ? 'critical' : charge < 50 ? 'low' : ''}`}>
              ⚜️
            </div>
            <div className="energy-bar">
              <div
                className="energy-fill"
                style={{
                  width: `${charge}%`,
                  background: charge < 20 ? '#ef4444' : charge < 50 ? '#f59e0b' : '#d4af37'
                }}
              />
            </div>
          </div>

          <div className="chat-actions">
            <button className="header-btn" title="Rechercher">🔍</button>
            <button className="header-btn" title="Paramètres">⚙️</button>
          </div>
        </div>

        {/* Ambient Mode Indicator */}
        <div className={`ambient-indicator ${ambientMode}`}>
          {ambientMode === 'thinking' && (
            <>
              <span className="pulse-dot" />
              TI-GUY réfléchit...
            </>
          )}
          {ambientMode === 'royal' && '✨ Mode Royal'}
          {ambientMode === 'charging' && '⚡ Recharge...'}
          {ambientMode === 'warning' && '🔋 Batterie faible'}
        </div>

        {/* Chat Area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          isTyping={isTyping}
          chatType={activeType}
        />

        {/* Input Area */}
        <ChatInput
          {...{
            onSend: handleSend,
            isTyping,
            chatType: activeType,
            ambientMode
          } as any}
        />

      </div>
    </div>
  );
};

export default ChatLayout;
