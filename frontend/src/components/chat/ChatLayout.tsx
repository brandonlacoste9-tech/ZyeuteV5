/**
 * ChatLayout - Main Leather Wallet Container
 * TI-GUY's messaging area foundation
 */

import React, { useState, useEffect } from 'react';
import { ChatTypeMenu } from './ChatTypeMenu';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { messagingService } from '@/services/messagingService';
import { tiguyService } from '@/services/tiguyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import './chat.styles.css';

type ChatType = 'tiguy' | 'dms' | 'groups' | 'channels' | 'vault';

export const ChatLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState<ChatType>('tiguy');
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Mock user likes - replace with real data
  const userLikes = user?.totalLikes || 1500;
  
  // Load conversations on mount
  useEffect(() => {
    if (activeType !== 'tiguy') {
      loadConversations();
    }
  }, [activeType]);

  // Load Ti-Guy welcome message
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

    // Ti-Guy AI response
    if (activeType === 'tiguy') {
      setIsTyping(true);
      try {
        const response = await tiguyService.sendMessage(content);
        const text = typeof response === 'string' ? response : response.response;
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `tiguy-${Date.now()}`,
            sender: 'tiguy',
            content: text,
            timestamp: new Date().toISOString(),
            type: 'bot',
          }]);
          setIsTyping(false);
        }, 1000);
      } catch (error) {
        setIsTyping(false);
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

  return (
    <div className="chat-layout">
      {/* Gold stitching border */}
      <div className="chat-layout-inner stitched">
        
        {/* Header with Chat Type Menu */}
        <div className="chat-header">
          <ChatTypeMenu 
            userLikes={userLikes}
            activeType={activeType}
            onTypeChange={setActiveType}
            unreadCounts={{
              tiguy: 0,
              dms: 2,
              groups: 5,
            }}
          />
          
          <div className="chat-actions">
            <button className="header-btn" title="Rechercher">🔍</button>
            <button className="header-btn" title="Paramètres">⚙️</button>
          </div>
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
          onSend={handleSend}
          isTyping={isTyping}
          chatType={activeType}
        />
        
      </div>
    </div>
  );
};

export default ChatLayout;
