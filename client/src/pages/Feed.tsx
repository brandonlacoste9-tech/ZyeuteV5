/**
 * Feed Page - Premium Quebec Heritage Design
 * Leather post cards with gold accents and stitching
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ChatButton } from '@/components/ChatButton';
import { GoldButton } from '@/components/GoldButton';
import { SectionHeader } from '@/components/SectionHeader';
import { StoryCarousel } from '@/components/features/StoryCircle';
import { VideoCard } from '@/components/features/VideoCard';
import { GiftModal } from '@/components/features/GiftModal';
import { GiftOverlay } from '@/components/features/GiftOverlay';
import { Onboarding, useOnboarding } from '@/components/Onboarding';
import { FeedSkeleton } from '@/components/ui/Spinner';
import { getCurrentUser, getStories, togglePostFire } from '@/services/api';
import { ContinuousFeed } from '@/components/features/ContinuousFeed';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import type { Post, User, Story } from '@/types';
import { logger } from '../lib/logger';
import copy from '../lib/copy';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

const feedLogger = logger.withContext('Feed');


export const Feed: React.FC = () => {
  const location = useLocation();

  // Infinite scroll for posts
  const { posts, loadMoreRef, isLoading, isFetchingNextPage, hasNextPage, refetch } = useInfiniteFeed('explore');

  const [stories, setStories] = React.useState<Array<{ user: User; story?: Story; isViewed?: boolean }>>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const { showOnboarding, isChecked, completeOnboarding } = useOnboarding();

  // Guest mode tracking
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

  // Smart Autoplay: Determine which post is visible
  const postIds = useMemo(() => posts.map(p => p.id), [posts]);
  const { activeId: activePostId, setRef } = useIntersectionObserver(postIds, {
    threshold: 0.6,
    rootMargin: "-20% 0px -20% 0px" // Trigger when element is in middle 60% of screen
  });

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

  // Refresh feed when navigating from upload (with refreshFeed flag)
  React.useEffect(() => {
    if (location.state?.refreshFeed) {
      refetch(); // Use refetch from React Query instead
      // Clear the state to prevent infinite refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchPosts]);

  // Load more on scroll
  const handleScroll = React.useCallback(() => {
    if (isLoading || !hasMore) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      setPage(prev => prev + 1);
      fetchPosts(page + 1);
    }
  }, [isLoading, hasMore, page, fetchPosts]);

  // Handle fire toggle - memoized to prevent VideoCard re-renders
  const handleFireToggle = React.useCallback(async (postId: string, _currentFire: number) => {
    const guestMode = localStorage.getItem('zyeute_guest_mode');
    if (guestMode === 'true') {
      alert('Inscrivez-vous pour donner du feu ! 🔥');
      return;
    }
    if (!currentUser) return;

    try {
      const success = await togglePostFire(postId, currentUser.id);
      if (success) {
        // Optimistically update local state
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, fire_count: p.fire_count + (p.is_fired ? -1 : 1), is_fired: !p.is_fired }
            : p
        ));
      }
    } catch (error) {
      feedLogger.error('Error toggling fire:', error);
    }
  }, [currentUser]);

  // Memoize comment handler to prevent VideoCard re-renders
  const handleComment = React.useCallback((postId: string) => {
    // Navigate to post detail page for comments
    window.location.href = `/p/${postId}`;
  }, []);

  // Handle share
  const handleShare = React.useCallback(async (postId: string) => {
    try {
      const url = `${window.location.origin}/p/${postId}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Regarde ça sur Zyeuté!',
          url: url,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url);
        alert('Lien copié dans le presse-papiers! 📋');
      }
    } catch (error) {
      feedLogger.error('Error sharing:', error);
    }
  }, []);

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
    if (selectedPostId) {
      setPosts(prev => prev.map(p =>
        p.id === selectedPostId
          ? { ...p, gift_count: (p.gift_count || 0) + 1 }
          : p
      ));
    }

    // Trigger overlay animation
    setSentGiftType(giftType);
    setSentGiftEmoji(GIFT_EMOJIS[giftType] || '🎁');
    setSentGiftRecipientName(selectedRecipient?.display_name || selectedRecipient?.username || 'Créateur');
    setShowGiftOverlay(true);

    setGiftModalOpen(false);
    setSelectedRecipient(null);
    setSelectedPostId(null);
  }, [selectedPostId, selectedRecipient]);

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Memoize horizontal posts slice (expensive array operation)
  // Performance optimization: Only recompute when posts array changes
  const horizontalPosts = useMemo(() => {
    return posts.slice(0, 10);
  }, [posts]);

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
