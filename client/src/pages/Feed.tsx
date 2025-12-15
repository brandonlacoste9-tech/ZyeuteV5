/**
 * Feed Page - Premium Quebec Heritage Design
 * Leather post cards with gold accents and stitching
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ChatButton } from '@/components/ChatButton';
import { GoldButton } from '@/components/GoldButton';
import { SectionHeader } from '@/components/SectionHeader';
import { StoryCarousel } from '@/components/features/StoryCircle';
import { VideoCard } from '@/components/features/VideoCard';
import { GiftModal } from '@/components/features/GiftModal';
import { GiftOverlay } from '@/components/features/GiftOverlay';
import { Onboarding, useOnboarding } from '@/components/Onboarding';
import { FeedSkeleton } from '@/components/ui/Spinner';
import { getCurrentUser, getFeedPosts, getStories, togglePostFire } from '@/services/api';
import type { Post, User, Story } from '@/types';
import { logger } from '../lib/logger';
import copy from '../lib/copy';
import { useGuestMode } from '@/hooks/useGuestMode';

const feedLogger = logger.withContext('Feed');


export const Feed: React.FC = () => {
  const location = useLocation();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [stories, setStories] = React.useState<Array<{ user: User; story?: Story; isViewed?: boolean }>>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(0);
  
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

  // Increment guest view counter on page load
  React.useEffect(() => {
    incrementViews();
  }, []);

  // Fetch current user
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);
    };

    fetchCurrentUser();
  }, []);

  // Fetch posts
  const fetchPosts = React.useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      feedLogger.debug('[Feed] Fetching posts, page:', pageNum);
      const data = await getFeedPosts(pageNum, 20);
      feedLogger.debug('[Feed] Received posts data:', { 
        count: data?.length || 0, 
        posts: data,
        firstPost: data?.[0] 
      });

      if (pageNum === 0) {
        setPosts(data || []);
        feedLogger.debug('[Feed] Set posts (page 0):', data?.length || 0);
      } else {
        setPosts(prev => {
          const updated = [...prev, ...(data || [])];
          feedLogger.debug('[Feed] Appended posts (page > 0):', updated.length);
          return updated;
        });
      }
      setHasMore((data?.length || 0) === 20);
    } catch (error) {
      feedLogger.error('[Feed] Error fetching posts:', error);
      // Set empty array on error to show empty state
      if (pageNum === 0) {
        setPosts([]);
      }
    } finally {
      setIsLoading(false);
      feedLogger.debug('[Feed] Fetch complete, isLoading set to false');
    }
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

  // Initial fetch and refresh on navigation
  React.useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  // Refresh feed when navigating from upload (with refreshFeed flag)
  React.useEffect(() => {
    if (location.state?.refreshFeed) {
      fetchPosts(0);
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
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* First-time user onboarding */}
      {isChecked && showOnboarding && (
        <Onboarding onComplete={completeOnboarding} />
      )}
      
      {/* Premium Header with leather texture */}
      <div className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-gold-500/30 shadow-lg shadow-black/50">
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
        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gold-500/20" />
        <div className="absolute bottom-[2px] left-0 right-0 border-b border-dashed border-gold-500/30 opacity-50" />
      </div>

      {/* Recent Stories Section */}
      {stories.length > 0 && (
        <>
          <SectionHeader title="Recent Stories" />
          <div className="border-b border-neutral-800 py-4 bg-black/20 backdrop-blur-sm">
            <StoryCarousel stories={stories} />
          </div>
        </>
      )}

      {/* Videos Section - Horizontal Scroll */}
      {posts.length > 0 && (
        <>
          <SectionHeader title="Videos" showArrow linkTo="/explore" />
          <div className="flex overflow-x-auto gap-4 px-4 pb-6 scrollbar-hide">
            {horizontalPosts.map((post, index) => (
              <div
                key={`h-${post.id}`}
                className="animate-fade-in-up flex-shrink-0"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'both',
                }}
              >
                <VideoCard
                  post={post}
                  user={post.user!}
                  variant="horizontal"
                  autoPlay={false}
                  muted={true}
                  onFireToggle={handleFireToggle}
                  onComment={handleComment}
                  onShare={handleShare}
                  onGift={handleGift}
                />
              </div>
            ))}
            {/* Padding at end for better scroll UX */}
            <div className="flex-shrink-0 w-2" />
          </div>
        </>
      )}

      {/* Latest Hitants Section - Vertical Feed */}
      <SectionHeader title="Latest Hitants" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Debug info - remove in production */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-2 bg-black/50 rounded text-xs text-white/60">
            <div>Posts count: {posts.length}</div>
            <div>Is loading: {isLoading ? 'true' : 'false'}</div>
            <div>Has more: {hasMore ? 'true' : 'false'}</div>
            <div>Current user: {currentUser?.username || 'none'}</div>
          </div>
        )}
        {isLoading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="leather-card rounded-2xl p-12 text-center stitched slide-up">
            <div className="text-6xl mb-4 bounce-in">🦫</div>
            <h3 className="text-xl font-bold text-gold-400 mb-2 embossed">{copy.empty.feed.title}</h3>
            <p className="text-stone-400 mb-6">
              {copy.empty.feed.subtitle}
            </p>
            <Link to="/explore">
              <GoldButton className="px-8 py-3 rounded-xl press-effect hover-glow" size="lg">
                {copy.empty.feed.action}
              </GoldButton>
            </Link>
          </div>
        ) : (
          <>
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both',
                }}
              >
                <VideoCard
                  post={post}
                  user={post.user!}
                  autoPlay={false}
                  muted={true}
                  onFireToggle={handleFireToggle}
                  onComment={handleComment}
                  onShare={handleShare}
                  onGift={handleGift}
                />
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={() => {
                    setPage(prev => prev + 1);
                    fetchPosts(page + 1);
                  }}
                  disabled={isLoading}
                  className="btn-leather px-8 py-3 rounded-xl disabled:opacity-50 font-medium text-gold-400 border-gold-500/30 press-effect hover-glow flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-gold" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      {copy.feedback.loading.generic}
                    </>
                  ) : (
                    copy.actions.loadMore
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quebec Pride Footer */}
      <div className="text-center py-8 text-stone-500 text-sm">
        <p className="flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <span className="text-gold-500 drop-shadow-[0_0_5px_rgba(255,191,0,0.5)]">⚜️</span>
          <span>Fait au Québec, pour le Québec</span>
          <span className="text-red-500 drop-shadow-[0_0_5px_rgba(255,0,0,0.3)]">🇨🇦</span>
        </p>
      </div>

      {/* Premium Chat Button - Ti-Guy Bronze Emblem */}
      <ChatButton isFixed={true} />

      <BottomNav />

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
