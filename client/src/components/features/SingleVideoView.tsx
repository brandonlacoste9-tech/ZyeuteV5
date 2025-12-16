/**
 * SingleVideoView - Individual video view in continuous feed
 * Full-screen video with overlay UI matching app aesthetic
 */

import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VideoPlayer } from './VideoPlayer';
import { Avatar } from '../Avatar';
import { useHaptics } from '@/hooks/useHaptics';
import type { Post, User } from '@/types';

interface SingleVideoViewProps {
  post: Post;
  user: User;
  isActive: boolean;
  onFireToggle?: (postId: string, currentFire: number) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const SingleVideoView: React.FC<SingleVideoViewProps> = ({
  post,
  user,
  isActive,
  onFireToggle,
  onComment,
  onShare,
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isLiked, setIsLiked] = React.useState(false);
  const { tap, impact } = useHaptics();
  const navigate = useNavigate();

  const handleFire = () => {
    setIsLiked(!isLiked);
    onFireToggle?.(post.id, post.fire_count);
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

  return (
    <div
      ref={videoRef}
      className="w-full h-full flex-shrink-0 snap-center snap-always relative bg-black"
    >
      {/* Full-screen Media */}
      <div className="absolute inset-0 w-full h-full">
        {post.type === 'video' ? (
          <VideoPlayer
            src={post.media_url}
            poster={post.media_url}
            autoPlay={isActive}
            muted={!isActive}
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={post.media_url}
            alt={post.caption || 'Post media'}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

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
            {post.hashtags.map((tag, i) => (
              <Link
                key={i}
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
            onClick={handleFire}
            className={`flex flex-col items-center gap-1 transition-all ${isLiked
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
              {post.fire_count}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleComment}
            className="flex flex-col items-center gap-1 text-white hover:text-gold-400 transition-colors"
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
              {post.comment_count}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="text-white hover:text-gold-400 transition-colors"
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
};

