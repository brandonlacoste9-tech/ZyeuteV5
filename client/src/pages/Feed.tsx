/**
 * Feed Page - Premium Quebec Heritage Design
 * Leather post cards with gold accents and stitching
 */

import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChatButton } from '@/components/ChatButton';
import { StoryCarousel } from '@/components/features/StoryCircle';
import { GiftModal } from '@/components/features/GiftModal';
import { GiftOverlay } from '@/components/features/GiftOverlay';
import { Onboarding, useOnboarding } from '@/components/Onboarding';
import { getCurrentUser, getStories } from '@/services/api';
import { ContinuousFeed } from '@/components/features/ContinuousFeed';
import type { User, Story } from '@/types';
import { logger } from '../lib/logger';
import { useGuestMode } from '@/hooks/useGuestMode';

const feedLogger = logger.withContext('Feed');


export const Feed: React.FC = () => {
  const location = useLocation();

  // State for stories and user (restored)
  const [stories, setStories] = React.useState<Array<{ user: User; story?: Story; isViewed?: boolean }>>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const { showOnboarding, isChecked, completeOnboarding } = useOnboarding();
  const { incrementViews } = useGuestMode();

  // Gift modal state
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Gift overlay animation state
  const [showGiftOverlay, setShowGiftOverlay] = useState(false);
  const [sentGiftEmoji, setSentGiftEmoji] = useState('');
  const [sentGiftType, setSentGiftType] = useState('');
  const [sentGiftRecipientName, setSentGiftRecipientName] = useState('');

  // Increment guest view counter on page load
  React.useEffect(() => {
    incrementViews();
  }, [incrementViews]);

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  // Fetch stories
  React.useEffect(() => {
    const fetchStories = async () => {
      try {
        const storyList = await getStories(currentUser?.id);
        setStories(storyList);
      } catch (error) {
        feedLogger.error('Error fetching stories:', error);
      }
    };

    fetchStories();
  }, [currentUser]);

  // Handle gift button click
  const handleGift = useCallback((postId: string, recipient: User) => {
    const guestMode = localStorage.getItem('zyeute_guest_mode');
    if (guestMode === 'true') {
      alert('Inscrivez-vous pour envoyer des cadeaux ! 🎁');
      return;
    }
    if (!currentUser) {
      alert('Tu dois être connecté pour envoyer un cadeau! 🎁');
      return;
    }
    if (currentUser.id === recipient.id) {
      alert('Tu ne peux pas t\'envoyer un cadeau! 😅');
      return;
    }
    setSelectedPostId(postId);
    setSelectedRecipient(recipient);
    setGiftModalOpen(true);
  }, [currentUser]);

  // Gift emoji lookup
  const GIFT_EMOJIS: Record<string, string> = {
    comete: '☄️',
    feuille_erable: '🍁',
    fleur_de_lys: '⚜️',
    feu: '🔥',
    coeur_or: '💛',
  };

  // Handle gift sent - update gift count and show overlay
  const handleGiftSent = useCallback((giftType: string) => {
    // Trigger overlay animation
    setSentGiftType(giftType);
    setSentGiftEmoji(GIFT_EMOJIS[giftType] || '🎁');
    setSentGiftRecipientName(selectedRecipient?.display_name || selectedRecipient?.username || 'Créateur');
    setShowGiftOverlay(true);

    setGiftModalOpen(false);
    setSelectedRecipient(null);
    setSelectedPostId(null);
  }, [selectedRecipient, GIFT_EMOJIS]);

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* First-time user onboarding */}
      {isChecked && showOnboarding && (
        <Onboarding onComplete={completeOnboarding} />
      )}

      {/* Premium Header - Fixed Top */}
      <div className="flex-none z-30 bg-neutral-900/95 backdrop-blur-md border-b border-gold-500/30 shadow-lg shadow-black/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gold-400 embossed tracking-tight drop-shadow-sm">
              Zyeuté
            </h1>
            <div className="flex items-center gap-3">
              <Link
                to="/notifications"
                className="relative text-stone-400 hover:text-gold-400 transition-colors group"
              >
                <svg className="w-6 h-6 group-hover:drop-shadow-[0_0_5px_rgba(255,191,0,0.5)] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border border-gold-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                  3
                </span>
              </Link>
              <Link
                to="/premium"
                className="bg-gradient-to-r from-gold-400 to-gold-600 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-[0_0_10px_rgba(255,191,0,0.3)] hover:shadow-[0_0_15px_rgba(255,191,0,0.5)] transition-all"
              >
                VIP
              </Link>
            </div>
          </div>
        </div>

        {/* Stories Section (Integrated into Header area) */}
        {stories.length > 0 && (
          <div className="py-2 bg-black/40 backdrop-blur-sm border-t border-white/5">
            <StoryCarousel stories={stories} />
          </div>
        )}

        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold-500/20" />
      </div>

      {/* Main Content - Continuous Video Feed */}
      <div className="flex-1 w-full bg-black relative">
        <ContinuousFeed />
      </div>

      {/* Premium Chat Button - Ti-Guy Bronze Emblem */}
      <ChatButton isFixed={true} />

      {/* Gift Modal */}
      {selectedRecipient && selectedPostId && (
        <GiftModal
          recipient={selectedRecipient}
          postId={selectedPostId}
          isOpen={giftModalOpen}
          onClose={() => {
            setGiftModalOpen(false);
            setSelectedRecipient(null);
            setSelectedPostId(null);
          }}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* Gift Overlay Animation */}
      <GiftOverlay
        giftType={sentGiftType}
        emoji={sentGiftEmoji}
        recipientName={sentGiftRecipientName}
        isVisible={showGiftOverlay}
        onComplete={() => setShowGiftOverlay(false)}
      />
    </div>
  );
};

export default Feed;
