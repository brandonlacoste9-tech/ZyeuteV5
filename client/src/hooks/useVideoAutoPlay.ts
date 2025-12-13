/**
 * Custom hook for auto-playing videos on scroll (TikTok-style)
 */

import { useEffect, useRef, useState } from 'react';
import { logger } from '../lib/logger';

const useVideoAutoPlayLogger = logger.withContext('UseVideoAutoPlay');


interface UseVideoAutoPlayOptions {
  threshold?: number;
  rootMargin?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export const useVideoAutoPlay = (options: UseVideoAutoPlayOptions = {}) => {
  const {
    threshold = 0.5,
    rootMargin = '0px',
    onPlay,
    onPause,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);

          if (entry.isIntersecting) {
            // Video is visible - play it
            video.play().then(() => {
              setIsPlaying(true);
              onPlay?.();
            }).catch((error) => {
              useVideoAutoPlayLogger.warn('Auto-play prevented:', error);
            });
          } else {
            // Video is not visible - pause it
            video.pause();
            setIsPlaying(false);
            onPause?.();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, onPlay, onPause]);

  return {
    videoRef,
    isVisible,
    isPlaying,
  };
};

