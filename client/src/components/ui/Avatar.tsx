/**
 * Avatar component with gold ring and verified badge
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isVerified?: boolean;
  isOnline?: boolean;
  hasStory?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
};

const badgeSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
  '2xl': 'w-7 h-7',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  isVerified = false,
  isOnline = false,
  hasStory = false,
  className,
  onClick,
}) => {
  const containerClass = cn(
    'relative inline-block',
    onClick && 'cursor-pointer',
    className
  );

  const avatarClass = cn(
    sizeClasses[size],
    'rounded-full object-cover bg-gradient-to-br from-gray-700 to-gray-900',
    hasStory && 'ring-4 ring-gold-500 ring-offset-2 ring-offset-black animate-pulse-slow',
    onClick && 'hover:opacity-90 transition-opacity'
  );

  return (
    <div className={containerClass} onClick={onClick}>
      {/* Avatar Image */}
      {src ? (
        <img
          src={src}
          alt={alt}
          className={avatarClass}
        />
      ) : (
        <div className={cn(avatarClass, 'flex items-center justify-center text-gold-400')}>
          <svg
            className="w-2/3 h-2/3"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      )}

      {/* Verified Badge */}
      {isVerified && (
        <div
          className={cn(
            'absolute bottom-0 right-0 bg-gold-500 rounded-full flex items-center justify-center ring-2 ring-black',
            badgeSizes[size]
          )}
        >
          <svg
            className="w-full h-full p-0.5 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      )}

      {/* Online Indicator */}
      {isOnline && (
        <div
          className={cn(
            'absolute bottom-0 right-0 bg-green-500 rounded-full ring-2 ring-black',
            badgeSizes[size]
          )}
        />
      )}
    </div>
  );
};

/**
 * Avatar Group - Display multiple avatars
 */
export const AvatarGroup: React.FC<{
  avatars: Array<{ src?: string; alt?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}> = ({ avatars, max = 3, size = 'sm' }) => {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayAvatars.map((avatar, i) => (
        <Avatar
          key={i}
          {...avatar}
          size={size}
          className="ring-2 ring-black"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            'rounded-full bg-gray-800 ring-2 ring-black flex items-center justify-center text-xs text-gold-400 font-semibold'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
