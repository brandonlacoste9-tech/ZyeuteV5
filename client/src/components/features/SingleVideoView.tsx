/**
 * SingleVideoView - Individual video view in continuous feed
 * Full-screen video with overlay UI matching app aesthetic
 */

import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { Avatar } from '../Avatar';
import { Image } from '../Image';
import { useHaptics } from '@/hooks/useHaptics';
import { usePresence } from '@/hooks/usePresence';
import type { Post, User } from '@/types';

interface SingleVideoViewProps {
  post: Post;
  user: User;
  isActive: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  priority?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  videoSource?: import('@/hooks/usePrefetchVideo').VideoSource;
  isCached?: boolean;
  debug?: {
    activeRequests: number;
    concurrency: number;
    tier: number;
  };
}

export const SingleVideoView = React.memo<SingleVideoViewProps>(({
  post,
  user,
  isActive,
  onFireToggle,
  onComment,
  onShare,
  priority = false,
  preload = 'metadata',
  videoSource,
  isCached,
  debug,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const { tap, impact } = useHaptics();
  const navigate = useNavigate();

  // Real-time Presence & Engagement
  const { viewerCount, engagement } = usePresence(post.id);
  const [isLiked, setIsLiked] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // Derive counts from props OR real-time updates
  const fireCount = engagement.fireCount ?? post.fire_count;
  const commentCount = engagement.commentCount ?? post.comment_count;

  const handleFire = () => {
    // Only toggle if not already liked (or toggle off?)
    // Double tap usually only LIKES (doesn't unlike).
    // If double tap, we force like? 
    // But handleFire toggles.
    // Let's make handleDoubleTap force like if not liked, or just trigger animation?
    // Usually double tap always shows animation.
    setIsLiked(true);
    if (!isLiked) {
        onFireToggle?.(post.id, fireCount);
    }
    impact();
  };
  
  const handleLikeToggle = () => {
      setIsLiked(!isLiked);
      onFireToggle?.(post.id, fireCount);
      impact();
  }

  const handleDoubleTap = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleFire();
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
      impact();
  };

  const handleComment = () => {
    onComment?.(post.id);
    tap();
  };

  const handleShare = () => {
    onShare?.(post.id);
    tap();
  };

  // Deep Enhance: Select best video source
  const isVideo = post.type === 'video';
  const videoSrc = (isVideo && post.processing_status === 'ready' && post.enhanced_url) 
    ? post.enhanced_url 
    : (post.media_url || (isVideo ? post.original_url : '') || '');

  // Deep Enhance: Visual Filters
  const filterStyle = isVideo && post.visual_filter && post.visual_filter !== 'none' 
    ? { filter: post.visual_filter } 
    : {};

  return (
    <div
      ref={videoRef}
      className="w-full h-full flex-shrink-0 snap-center snap-always relative bg-black select-none"
      onDoubleClick={handleDoubleTap}
    >
      {/* Full-screen Media */}
      <div className="absolute inset-0 w-full h-full">
        {post.type === 'video' ? (
          <VideoPlayer
            src={videoSrc}
            poster={post.thumbnail_url || post.media_url} 
            autoPlay={isActive}
            muted={!isActive}
            loop
            className="w-full h-full object-cover"
            style={filterStyle}
            priority={priority}
            preload={isActive ? 'auto' : preload}
            videoSource={videoSource}
            debug={debug}
          />
        ) : (
          <Image
            src={post.media_url}
            alt={post.caption || 'Post media'}
            className="w-full h-full object-cover"
            style={filterStyle}
            fetchPriority={priority ? 'high' : 'auto'}
            loading={priority ? 'eager' : 'lazy'}
          />
        )}
      </div>

       {/* Double Tap Heart Animation */}
       {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-heart-pump">
            <svg 
                className="w-24 h-24 text-orange-500 drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]"
                fill="currentColor" 
                viewBox="0 0 24 24"
            >
                 <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

      {/* Deep Enhance Status Badge (Top Right) */}
      <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 items-end">
         {post.type === 'video' && post.processing_status === 'ready' && post.enhanced_url && (
            <div className="bg-gold-500/90 text-black px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-md animate-in fade-in zoom-in duration-300">
               <span>✨</span>
               <span>4K ULTRA</span>
            </div>
         )}
         {post.type === 'video' && post.processing_status === 'processing' && (
            <div className="bg-black/60 text-white border border-white/20 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 backdrop-blur-md">
               <span className="animate-spin">⚙️</span>
               <span>Enhancing...</span>
            </div>
         )}
      </div>

      {/* User Info Overlay (Top Left) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
        <Link
          to={`/profile/${user.username}`}
          onClick={tap}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full border border-gold-500/50 blur-[2px]"></div>
          <Avatar
            src={user.avatar_url}
            size="md"
            isVerified={user.is_verified}
            className="ring-2 ring-gold-500/40"
            userId={user.id}
          />
        </Link>
        <div className="flex-1">
          <Link
            to={`/profile/${user.username}`}
            onClick={tap}
            className="font-bold text-white hover:text-gold-400 transition-colors flex items-center gap-1 text-sm"
          >
            {user.display_name || user.username}
            {user.is_verified && (
              <span className="text-gold-500 drop-shadow-[0_0_3px_rgba(255,191,0,0.8)]">
                ✓
              </span>
            )}
          </Link>
          {post.region && (
            <p className="text-stone-300 text-xs flex items-center gap-1">
              <span>📍</span>
              <span>{post.city || post.region}</span>
            </p>
          )}
        </div>

        {/* Live Viewer Count (Zyeuteurs) */}
        {viewerCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-600/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-red-400/30 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.4)]">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_white]" />
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">
              {viewerCount} {viewerCount > 1 ? 'Zyeuteurs' : 'Zyeuteur'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-20">
        {/* Caption */}
        {post.caption && (
          <div className="mb-4">
            <Link
              to={`/profile/${user.username}`}
              onClick={tap}
              className="font-bold text-white hover:text-gold-400 transition-colors mr-2"
            >
              {user.username}
            </Link>
            <span className="text-white text-sm leading-relaxed">
              {post.caption}
            </span>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                to={`/explore?tag=${tag}`}
                onClick={tap}
                className="text-gold-400 hover:text-gold-300 text-xs font-medium transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Action Buttons (Right Side) */}
        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
          {/* Fire Button */}
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleLikeToggle();
            }}
            className={`flex flex-col items-center gap-1 transition-all press-scale ${isLiked
              ? 'text-orange-500 scale-110 drop-shadow-[0_0_10px_rgba(255,100,0,0.6)]'
              : 'text-white hover:text-gold-400'
              }`}
          >
            <svg
              className="w-8 h-8"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
            <span className="font-bold text-sm font-mono text-white drop-shadow-lg">
              {fireCount}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleComment();
            }}
            className="flex flex-col items-center gap-1 text-white hover:text-gold-400 transition-colors press-scale"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-bold text-sm font-mono text-white drop-shadow-lg">
              {commentCount}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleShare();
            }}
            className="text-white hover:text-gold-400 transition-colors press-scale"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Returns true if props are equal (no re-render needed)
    return (
        prevProps.post.id === nextProps.post.id &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.post.fire_count === nextProps.post.fire_count &&
        prevProps.post.comment_count === nextProps.post.comment_count &&
        prevProps.post.comment_count === nextProps.post.comment_count &&
        ((prevProps.post.type === 'video' && nextProps.post.type === 'video') ? 
            prevProps.post.processing_status === nextProps.post.processing_status : 
            true)
    );
});

