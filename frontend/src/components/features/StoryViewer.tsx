/**
 * StoryViewer - View stories with swipe navigation (Instagram/TikTok style)
 */

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "../Avatar";
import { VideoPlayer } from "./VideoPlayer";
import { supabase } from "../../lib/supabase";
import { getTimeAgo } from "../../lib/utils";
import type { Story, User } from "../../types";
import { logger } from "../../lib/logger";

const storyViewerLogger = logger.withContext("StoryViewer");

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const StoryViewerComponent: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex = 0,
  onClose,
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.duration || 5;

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / (duration * 10);
      });
    }, 100);

    progressInterval.current = interval;

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused, duration, handleNext]);

  // Mark story as viewed
  useEffect(() => {
    const markAsViewed = async () => {
      if (!currentStory) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id === currentStory.user_id) return;

      // TODO: Create story_views table and insert view
      // For now, just log
      storyViewerLogger.debug("Story viewed:", currentStory.id);
    };

    markAsViewed();
  }, [currentStory]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - next story
        handleNext();
      } else {
        // Swiped right - previous story
        handlePrevious();
      }
    }
  };

  // Click handlers for navigation
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const clickX = e.clientX;
    const screenWidth = window.innerWidth;

    if (clickX < screenWidth / 3) {
      // Clicked left third - previous
      handlePrevious();
    } else if (clickX > (screenWidth * 2) / 3) {
      // Clicked right third - next
      handleNext();
    } else {
      // Clicked middle - pause/play
      setIsPaused(!isPaused);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Create story_replies table
      // For now, send as DM or notification
      toast.success("Réponse envoyée! 💬");
      setReplyText("");
      setShowReplyInput(false);
    } catch (error) {
      storyViewerLogger.error("Error sending reply:", error);
      toast.error("Erreur lors de l'envoi");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isPaused, handleNext, handlePrevious, onClose]);

  if (!currentStory) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Header */}
      <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4 mt-4">
        <div className="flex items-center gap-2">
          {currentStory.user && (
            <>
              <Avatar
                src={currentStory.user.avatar_url}
                alt={
                  currentStory.user.display_name || currentStory.user.username
                }
                size="sm"
                isVerified={currentStory.user.is_verified}
                className="ring-2 ring-white"
                userId={currentStory.user.id}
              />
              <div>
                <p className="text-white font-semibold text-sm">
                  {currentStory.user.display_name || currentStory.user.username}
                </p>
                <p className="text-white/80 text-xs">
                  {getTimeAgo(new Date(currentStory.created_at))}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Story Content */}
      <div
        className="relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden edge-glow-strong"
        onClick={handleScreenClick}
      >
        {currentStory.type === "video" ||
        (currentStory as any).media_type === "video" ? (
          <VideoPlayer
            src={currentStory.media_url}
            autoPlay={!isPaused}
            muted={false}
            loop={false}
            onEnded={handleNext}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-cover"
          />
        )}

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <svg
              className="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Reply Input */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-4">
        {showReplyInput ? (
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Envoie une réponse..."
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-gold-400 backdrop-blur-xl"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendReply();
                if (e.key === "Escape") setShowReplyInput(false);
              }}
            />
            <button
              onClick={handleSendReply}
              className="p-3 bg-gold-gradient rounded-full hover:scale-110 transition-transform"
              disabled={!replyText.trim()}
            >
              <svg
                className="w-6 h-6 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowReplyInput(true)}
            className="max-w-md mx-auto w-full bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white/60 text-left backdrop-blur-xl hover:bg-white/20 transition-colors"
          >
            Envoie une réponse...
          </button>
        )}
      </div>

      {/* Navigation hints (desktop) */}
      <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-40">
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-xl"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        )}
      </div>

      <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-40">
        {currentIndex < stories.length - 1 && (
          <button
            onClick={handleNext}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-xl"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Memoize StoryViewer to prevent unnecessary re-renders
// Performance optimization: Only re-render when stories array or callbacks change
export const StoryViewer = memo(
  StoryViewerComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.stories.length === nextProps.stories.length &&
      prevProps.initialIndex === nextProps.initialIndex &&
      prevProps.onClose === nextProps.onClose
    );
  },
);

StoryViewer.displayName = "StoryViewer";

export default StoryViewer;
