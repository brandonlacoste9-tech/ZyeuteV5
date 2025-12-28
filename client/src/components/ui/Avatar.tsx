/**
 * Avatar component with gold ring, verified badge, and optimization features.
 * Features:
 * - Lazy loading for off-screen instances
 * - Progressive image loading (blur-up / fade-in)
 * - In-memory caching for instant display of previously loaded avatars
 * - Memoized for performance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
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
  userId?: string; // For caching key
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

// Global cache to track images that have already loaded in this session
// This allows us to skip the fade-in animation for images the user has already seen
const loadedImageCache = new Set<string>();

const AvatarComponent: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  isVerified = false,
  isOnline = false,
  hasStory = false,
  className,
  onClick,
  userId,
}) => {
  // Unique cache key: prefer userId if stable, otherwise fallback to src
  const cacheKey = userId || src;
  
  // Track if the image is loaded. Initialize based on cache to skip animation if possible.
  const [isLoaded, setIsLoaded] = useState(() => {
    return !!(cacheKey && loadedImageCache.has(cacheKey));
  });

  const [hasError, setHasError] = useState(false);

  // Lazy load hook
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Load 200px before appearing
    skip: isLoaded, // Skip observation if already loaded (optional optimization)
  });

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (cacheKey) {
      loadedImageCache.add(cacheKey);
    }
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const containerClass = cn(
    'relative inline-block flex-shrink-0', // flex-shrink-0 prevents squash in flex containers
    onClick && 'cursor-pointer',
    sizeClasses[size], // Set explicit size on container to prevent layout shift
    className
  );

  const imageClass = cn(
    'w-full h-full rounded-full object-cover transition-opacity duration-300',
    isLoaded ? 'opacity-100' : 'opacity-0'
  );

  const placeholderClass = cn(
    'absolute inset-0 w-full h-full rounded-full flex items-center justify-center bg-zinc-800 text-gold-500/50',
    isLoaded ? 'opacity-0' : 'opacity-100',
     // If not loaded, ensure placeholder is visible. If loaded, fade it out.
    'transition-opacity duration-300'
  );

  // Story ring class
  const ringClass = hasStory 
    ? 'ring-4 ring-gold-500 ring-offset-2 ring-offset-black animate-pulse-slow' 
    : '';

  return (
    <div ref={ref} className={containerClass} onClick={onClick}>
      
      {/* Placeholder / Fallback */}
      <div className={placeholderClass}>
         <svg
            className="w-1/2 h-1/2"
            fill="currentColor"
            viewBox="0 0 24 24"
         >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
         </svg>
      </div>

      {/* Actual Image */}
      {src && !hasError && (inView || isLoaded) && (
        <img
          src={src}
          alt={alt}
          className={cn(imageClass, ringClass)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Verified Badge */}
      {isVerified && (
        <div
          className={cn(
            'absolute bottom-0 right-0 bg-gold-500 rounded-full flex items-center justify-center ring-2 ring-black z-10',
            badgeSizes[size]
          )}
        >
          <svg
            className="w-full h-full p-[1px] text-black"
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
            'absolute bottom-0 right-0 bg-green-500 rounded-full ring-2 ring-black z-10',
            badgeSizes[size]
          )}
        />
      )}
    </div>
  );
};

// Memoize optimization
// Only re-render if identity-relevant props change
export const Avatar = React.memo(AvatarComponent, (prev, next) => {
  return (
    prev.src === next.src &&
    prev.userId === next.userId &&
    prev.size === next.size &&
    prev.isVerified === next.isVerified &&
    prev.isOnline === next.isOnline &&
    prev.hasStory === next.hasStory &&
    prev.className === next.className
  );
});

Avatar.displayName = 'Avatar';

/**
 * Avatar Group - Display multiple avatars
 */
export const AvatarGroup: React.FC<{
  avatars: Array<{ src?: string; alt?: string; userId?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}> = ({ avatars, max = 3, size = 'sm' }) => {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayAvatars.map((avatar, i) => (
        <Avatar
          key={avatar.userId || i} // Prefer userId for stable keys
          {...avatar}
          size={size}
          className="ring-2 ring-black"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            'rounded-full bg-zinc-800 ring-2 ring-black flex items-center justify-center text-xs text-gold-400 font-semibold relative z-0'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
