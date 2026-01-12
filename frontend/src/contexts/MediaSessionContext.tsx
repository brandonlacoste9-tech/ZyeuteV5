/**
 * MediaSessionContext - Global Audio Focus Manager
 * Ensures only one video can play audio at a time (TikTok-style)
 * Integrates with navigator.mediaSession for lock-screen controls
 */

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
} from "react";

interface MediaMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}

interface MediaSessionContextType {
  /** ID of the component currently holding audio focus */
  currentAudioFocusId: string | null;

  /**
   * Request audio focus for a component.
   * Returns true if focus was granted (previous holder is notified to mute).
   */
  requestAudioFocus: (id: string, metadata?: MediaMetadata) => boolean;

  /** Release audio focus (call when component unmounts or scrolls away) */
  releaseAudioFocus: (id: string) => void;

  /** Force mute all (e.g., when app goes to background) */
  forceMuteAll: () => void;

  /** Register a callback to be notified when focus is lost */
  registerFocusLostCallback: (id: string, callback: () => void) => void;

  /** Unregister the focus lost callback */
  unregisterFocusLostCallback: (id: string) => void;
}

const MediaSessionContext = createContext<MediaSessionContextType | undefined>(
  undefined,
);

export const useMediaSession = () => {
  const context = useContext(MediaSessionContext);
  if (!context) {
    throw new Error(
      "useMediaSession must be used within a MediaSessionProvider",
    );
  }
  return context;
};

export const MediaSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentAudioFocusId, setCurrentAudioFocusId] = useState<string | null>(
    null,
  );

  // Map of component IDs to their "focus lost" callbacks
  const focusLostCallbacksRef = useRef<Map<string, () => void>>(new Map());

  // Update browser's mediaSession metadata
  const updateMediaSession = useCallback((metadata?: MediaMetadata) => {
    if ("mediaSession" in navigator && metadata) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: metadata.title || "Zyeuté",
        artist: metadata.artist || "Video",
        artwork: metadata.artwork
          ? [{ src: metadata.artwork, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
    }
  }, []);

  const requestAudioFocus = useCallback(
    (id: string, metadata?: MediaMetadata): boolean => {
      // If same component is requesting, just return true
      if (currentAudioFocusId === id) {
        updateMediaSession(metadata);
        return true;
      }

      // Notify previous holder to mute
      if (currentAudioFocusId) {
        const previousCallback =
          focusLostCallbacksRef.current.get(currentAudioFocusId);
        if (previousCallback) {
          previousCallback();
        }
      }

      // Grant focus to new requester
      setCurrentAudioFocusId(id);
      updateMediaSession(metadata);

      return true;
    },
    [currentAudioFocusId, updateMediaSession],
  );

  const releaseAudioFocus = useCallback(
    (id: string) => {
      if (currentAudioFocusId === id) {
        setCurrentAudioFocusId(null);

        // Clear browser mediaSession
        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = null;
        }
      }
    },
    [currentAudioFocusId],
  );

  const forceMuteAll = useCallback(() => {
    // Notify all registered callbacks
    focusLostCallbacksRef.current.forEach((callback) => {
      callback();
    });

    setCurrentAudioFocusId(null);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
    }
  }, []);

  const registerFocusLostCallback = useCallback(
    (id: string, callback: () => void) => {
      focusLostCallbacksRef.current.set(id, callback);
    },
    [],
  );

  const unregisterFocusLostCallback = useCallback((id: string) => {
    focusLostCallbacksRef.current.delete(id);
  }, []);

  return (
    <MediaSessionContext.Provider
      value={{
        currentAudioFocusId,
        requestAudioFocus,
        releaseAudioFocus,
        forceMuteAll,
        registerFocusLostCallback,
        unregisterFocusLostCallback,
      }}
    >
      {children}
    </MediaSessionContext.Provider>
  );
};
