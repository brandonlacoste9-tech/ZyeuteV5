import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface GuestSession {
  isGuest: boolean;
  guestId: string;
  sessionStart: number;
  lastActive: number;
}

interface GuestModeContextType {
  guestSession: GuestSession | null;
  startGuestSession: () => void;
  endGuestSession: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

const GUEST_SESSION_KEY = 'zyeute-guest-session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadGuestSession(): GuestSession | null {
  const raw = localStorage.getItem(GUEST_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as GuestSession;
    // Expire after 24h of inactivity
    if (Date.now() - session.lastActive > SESSION_EXPIRY_MS) {
      localStorage.removeItem(GUEST_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(GUEST_SESSION_KEY);
    return null;
  }
}

function saveGuestSession(session: GuestSession) {
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
}

export const GuestModeProvider = ({ children }: { children: ReactNode }) => {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(loadGuestSession());

  useEffect(() => {
    if (guestSession) {
      saveGuestSession(guestSession);
    }
  }, [guestSession]);

  useEffect(() => {
    // Update lastActive on activity
    const updateLastActive = () => {
      if (guestSession) {
        setGuestSession({ ...guestSession, lastActive: Date.now() });
      }
    };
    window.addEventListener('click', updateLastActive);
    window.addEventListener('keydown', updateLastActive);
    return () => {
      window.removeEventListener('click', updateLastActive);
      window.removeEventListener('keydown', updateLastActive);
    };
  }, [guestSession]);

  const startGuestSession = () => {
    const now = Date.now();
    const session: GuestSession = {
      isGuest: true,
      guestId: crypto.randomUUID(),
      sessionStart: now,
      lastActive: now,
    };
    setGuestSession(session);
    saveGuestSession(session);
  };

  const endGuestSession = () => {
    setGuestSession(null);
    localStorage.removeItem(GUEST_SESSION_KEY);
  };

  return (
    <GuestModeContext.Provider value={{ guestSession, startGuestSession, endGuestSession }}>
      {children}
    </GuestModeContext.Provider>
  );
};

export function useGuestMode() {
  const ctx = useContext(GuestModeContext);
  if (!ctx) throw new Error('useGuestMode must be used within GuestModeProvider');
  return ctx;
}
