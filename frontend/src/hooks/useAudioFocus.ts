/**
 * useAudioFocus - Hook for managing audio focus per video component
 * Integrates with MediaSessionContext for single-video audio playback
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useMediaSession } from "../contexts/MediaSessionContext";

interface AudioFocusMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}

interface UseAudioFocusResult {
  /** Whether this component currently has audio focus */
  hasFocus: boolean;

  /** Request audio focus (returns true if granted) */
  requestFocus: (metadata?: AudioFocusMetadata) => boolean;

  /** Release audio focus */
  releaseFocus: () => void;

  /** Whether audio is currently muted (inverse of hasFocus in most cases) */
  isMuted: boolean;

  /** Toggle mute state (requests focus if trying to unmute) */
  toggleMute: () => void;
}

export function useAudioFocus(videoId: string): UseAudioFocusResult {
  const {
    currentAudioFocusId,
    requestAudioFocus,
    releaseAudioFocus,
    registerFocusLostCallback,
    unregisterFocusLostCallback,
  } = useMediaSession();

  const [isMuted, setIsMuted] = useState(true);
  const hasFocus = currentAudioFocusId === videoId;

  // Store the mute callback ref
  const muteCallbackRef = useRef(() => {
    setIsMuted(true);
  });

  // Register for focus-lost notifications
  useEffect(() => {
    registerFocusLostCallback(videoId, muteCallbackRef.current);

    return () => {
      unregisterFocusLostCallback(videoId);
    };
  }, [videoId, registerFocusLostCallback, unregisterFocusLostCallback]);

  // Sync muted state with focus
  useEffect(() => {
    if (!hasFocus && !isMuted) {
      // We lost focus but weren't muted - force mute
      setIsMuted(true);
    }
  }, [hasFocus, isMuted]);

  const requestFocus = useCallback(
    (metadata?: AudioFocusMetadata): boolean => {
      const granted = requestAudioFocus(videoId, metadata);
      if (granted) {
        setIsMuted(false);
      }
      return granted;
    },
    [videoId, requestAudioFocus],
  );

  const releaseFocus = useCallback(() => {
    releaseAudioFocus(videoId);
    setIsMuted(true);
  }, [videoId, releaseAudioFocus]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      // Trying to unmute - request focus
      requestFocus();
    } else {
      // Muting - release focus
      releaseFocus();
    }
  }, [isMuted, requestFocus, releaseFocus]);

  return {
    hasFocus,
    requestFocus,
    releaseFocus,
    isMuted,
    toggleMute,
  };
}
