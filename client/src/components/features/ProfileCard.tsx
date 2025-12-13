/**
 * ProfileCard - Display user profile information
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { formatNumber } from '../../lib/utils';
import type { User } from '../../types';
import { cn } from '../../lib/utils';

export interface ProfileCardProps {
  user: User;
  showFollowButton?: boolean;
  onFollowClick?: () => void;
  isFollowing?: boolean;
  className?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  showFollowButton = true,
  onFollowClick,
  isFollowing = false,
  className,
}) => {
  return (
    <div className={cn('glass-card rounded-2xl p-6', className)}>
      {/* Avatar and basic info */}
      <div className="flex flex-col items-center text-center">
        <Link to={`/profile/${user.username}`}>
          <Avatar
            src={user.avatar_url}
            alt={user.display_name || user.username}
            size="2xl"
            isVerified={user.is_verified}
            isOnline={user.is_online}
          />
        </Link>

        <Link
          to={`/profile/${user.username}`}
          className="mt-4 hover:opacity-80 transition-opacity"
        >
          <h3 className="text-white text-xl font-bold">
            {user.display_name || user.username}
          </h3>
          <p className="text-white/60 text-sm">@{user.username}</p>
        </Link>

        {user.bio && (
          <p className="mt-3 text-white/80 text-sm line-clamp-3">
            {user.bio}
          </p>
        )}

        {user.city && (
          <p className="mt-2 text-gold-400 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {user.city}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <Link
          to={`/profile/${user.username}`}
          className="hover:bg-white/5 rounded-lg p-2 transition-colors"
        >
          <div className="text-2xl font-bold text-gold-400">
            {formatNumber(user.posts_count || 0)}
          </div>
          <div className="text-xs text-white/60">Posts</div>
        </Link>

        <Link
          to={`/profile/${user.username}/followers`}
          className="hover:bg-white/5 rounded-lg p-2 transition-colors"
        >
          <div className="text-2xl font-bold text-gold-400">
            {formatNumber(user.followers_count || 0)}
          </div>
          <div className="text-xs text-white/60">Abonnés</div>
        </Link>

        <div className="hover:bg-white/5 rounded-lg p-2 transition-colors cursor-default">
          <div className="text-2xl font-bold text-orange-500">
            {formatNumber(user.fire_score || 0)}
          </div>
          <div className="text-xs text-white/60">Feux</div>
        </div>
      </div>

      {/* Follow button */}
      {showFollowButton && (
        <div className="mt-6">
          <Button
            variant={isFollowing ? 'outline' : 'primary'}
            size="md"
            className="w-full"
            onClick={onFollowClick}
          >
            {isFollowing ? 'Suivi' : 'Suivre'}
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Compact profile card for lists
 */
export const ProfileCardCompact: React.FC<{
  user: User;
  onFollowClick?: () => void;
  isFollowing?: boolean;
  className?: string;
}> = ({ user, onFollowClick, isFollowing, className }) => {
  return (
    <div className={cn('flex items-center justify-between p-3', className)}>
      <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
        <Avatar
          src={user.avatar_url}
          size="md"
          isVerified={user.is_verified}
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">
            {user.display_name || user.username}
          </p>
          <p className="text-white/60 text-sm truncate">
            @{user.username}
          </p>
        </div>
      </Link>

      {onFollowClick && (
        <Button
          variant={isFollowing ? 'outline' : 'primary'}
          size="sm"
          onClick={onFollowClick}
        >
          {isFollowing ? 'Suivi' : 'Suivre'}
        </Button>
      )}
    </div>
  );
};
