/**
 * StoryCircle - Story thumbnail for horizontal carousel
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { User, Story } from '../../types';

export interface StoryCircleProps {
  user: User;
  story?: Story;
  isViewed?: boolean;
  isOwnStory?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({
  user,
  story,
  isViewed = false,
  isOwnStory = false,
  onClick,
  className,
}) => {
  const hasStory = !!story;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link
      to={hasStory ? `/stories/${user.id}` : '/story/create'}
      onClick={handleClick}
      className={cn('flex flex-col items-center gap-2 flex-shrink-0', className)}
    >
      {/* Story ring */}
      <div
        className={cn(
          'relative w-20 h-20 rounded-full p-0.5',
          hasStory && !isViewed && 'story-ring animate-pulse-slow edge-glow',
          hasStory && isViewed && 'bg-gray-600',
          !hasStory && isOwnStory && 'bg-gradient-to-br from-gray-600 to-gray-800 edge-glow-subtle'
        )}
      >
        {/* Avatar */}
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 ring-2 ring-black">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name || user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <svg
                className="w-1/2 h-1/2 text-gold-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Add story button (own story, no story yet) */}
        {isOwnStory && !hasStory && (
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center ring-2 ring-black">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Username */}
      <span className="text-white text-xs text-center line-clamp-1 max-w-[80px]">
        {isOwnStory ? 'Toi' : (user.display_name || user.username)}
      </span>
    </Link>
  );
};

/**
 * Story carousel container
 */
export const StoryCarousel: React.FC<{
  stories: Array<{ user: User; story?: Story; isViewed?: boolean }>;
  currentUser?: User;
  onStoryClick?: (userStories: Story[], startIndex: number) => void;
  className?: string;
}> = ({ stories, currentUser, onStoryClick, className }) => {
  return (
    <div className={cn('overflow-x-auto scrollbar-hide', className)}>
      <div className="flex gap-4 p-4">
        {/* Current user's story (always first) */}
        {currentUser && (
          <StoryCircle
            user={currentUser}
            isOwnStory
            story={stories.find(s => s.user.id === currentUser.id)?.story}
            onClick={() => {
              const currentUserStory = stories.find(s => s.user.id === currentUser.id)?.story;
              if (currentUserStory && onStoryClick) {
                onStoryClick([currentUserStory], 0);
              }
            }}
          />
        )}

        {/* Other users' stories */}
        {stories
          .filter(s => s.user.id !== currentUser?.id)
          .map(({ user, story, isViewed }, index) => (
            <StoryCircle
              key={user.id}
              user={user}
              story={story}
              isViewed={isViewed}
              onClick={() => {
                if (story && onStoryClick) {
                  // Get all stories for this user
                  const userStories = stories
                    .filter(s => s.user.id === user.id && s.story)
                    .map(s => s.story!);
                  onStoryClick(userStories, 0);
                }
              }}
            />
          ))}
      </div>
    </div>
  );
};
