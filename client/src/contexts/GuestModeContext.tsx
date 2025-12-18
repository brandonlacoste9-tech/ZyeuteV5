import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GUEST_MODE_KEY, GUEST_TIMESTAMP_KEY, GUEST_VIEWS_KEY } from '../lib/constants';

interface GuestModeContextType {
    isGuest: boolean;
    setIsGuest: (value: boolean) => void;
    enterGuestMode: () => void;
    exitGuestMode: () => void;
    startGuestSession: () => void;
    endGuestSession: () => void;
}

export const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function GuestModeProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage
    const [isGuest, setIsGuest] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(GUEST_MODE_KEY) === 'true';
        }
        return false;
    });

    // Sync localStorage changes to state
    useEffect(() => {
        const handleStorageChange = () => {
            setIsGuest(localStorage.getItem(GUEST_MODE_KEY) === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const enterGuestMode = () => setIsGuest(true);
    const exitGuestMode = () => setIsGuest(false);

    // ✅ Properly starts guest session with localStorage persistence
    // Handles private browsing mode gracefully
    const startGuestSession = () => {
        console.log('🎭 [GuestModeContext] Starting guest session...');
        try {
            localStorage.setItem(GUEST_MODE_KEY, 'true');
            localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
            localStorage.setItem(GUEST_VIEWS_KEY, '0');
            console.log('✅ [GuestModeContext] Guest session started, localStorage set');
        } catch (e) {
            // localStorage quota exceeded or in private/incognito browsing
            console.warn('⚠️ [GuestModeContext] Storage failed (private browsing?):', e);
        }
        // Always set in-memory state, even if storage fails
        setIsGuest(true);
    };

    // ✅ Properly ends guest session
    // Handles private browsing mode gracefully
    const endGuestSession = () => {
        console.log('🎭 [GuestModeContext] Ending guest session...');
        try {
            localStorage.removeItem(GUEST_MODE_KEY);
            localStorage.removeItem(GUEST_TIMESTAMP_KEY);
            localStorage.removeItem(GUEST_VIEWS_KEY);
        } catch (e) {
            console.warn('⚠️ [GuestModeContext] Storage cleanup failed:', e);
        }
        setIsGuest(false);
    };


    return (
        <GuestModeContext.Provider value={{
            isGuest,
            setIsGuest,
            enterGuestMode,
            exitGuestMode,
            startGuestSession,
            endGuestSession
        }}>
            {children}
        </GuestModeContext.Provider>
    );
}

export function useGuestMode() {
    const context = useContext(GuestModeContext);
    if (context === undefined) {
        // Return a safe default instead of throwing
        return {
            isGuest: false,
            setIsGuest: () => { },
            enterGuestMode: () => { },
            exitGuestMode: () => { },
            startGuestSession: () => {
                // Fallback: Still set localStorage even without context
                console.warn('🎭 [GuestMode] Using fallback - context not available');
                localStorage.setItem('zyeute_guest_mode', 'true');
                localStorage.setItem('zyeute_guest_timestamp', Date.now().toString());
                localStorage.setItem('zyeute_guest_views', '0');
            },
            endGuestSession: () => { },
        };
    }
    return context;
}

export default GuestModeContext;
