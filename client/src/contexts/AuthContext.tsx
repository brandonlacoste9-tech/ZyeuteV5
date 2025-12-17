import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/admin';
import {
    GUEST_MODE_KEY,
    GUEST_TIMESTAMP_KEY,
    GUEST_SESSION_DURATION,
    GUEST_VIEWS_KEY
} from '@/lib/constants';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isGuest: boolean;
    isLoading: boolean;
    logout: () => Promise<void>;
    enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check guest mode validity
    const checkGuestMode = (): boolean => {
        const guestMode = localStorage.getItem(GUEST_MODE_KEY);
        const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);

        if (guestMode === 'true' && guestTimestamp) {
            const age = Date.now() - parseInt(guestTimestamp, 10);
            if (age < GUEST_SESSION_DURATION) {
                return true;
            } else {
                // Expired
                localStorage.removeItem(GUEST_MODE_KEY);
                localStorage.removeItem(GUEST_TIMESTAMP_KEY);
                localStorage.removeItem(GUEST_VIEWS_KEY);
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            try {
                // 1. Check Supabase Session with Timeout
                // Emergency Fix: Race against 5s timeout
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: Session | null } }>((_, reject) =>
                    setTimeout(() => reject(new Error('Auth check timed out')), 5000)
                );

                const { data: { session: initialSession } } = await Promise.race([sessionPromise, timeoutPromise]);

                if (initialSession?.user) {
                    if (mounted) {
                        setSession(initialSession);
                        setUser(initialSession.user);
                        // Check admin status
                        const adminStatus = await checkIsAdmin(initialSession.user);
                        if (mounted) setIsAdmin(adminStatus);
                    }
                } else {
                    // 2. Fallback to Guest Mode
                    const validGuest = checkGuestMode();
                    if (mounted) setIsGuest(validGuest);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Fallback to Guest Mode on error
                if (mounted) {
                    const validGuest = checkGuestMode();
                    setIsGuest(validGuest);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        initializeAuth();

        // 3. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (!mounted) return;

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                setIsGuest(false); // Logged in users are not guests
                const adminStatus = await checkIsAdmin(newSession.user);
                if (mounted) setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
                // Re-check guest mode on logout
                const validGuest = checkGuestMode();
                if (mounted) setIsGuest(validGuest);
            }

            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        // Clear guest mode too just in case of mixed state
        setIsGuest(false);
        setIsAdmin(false);
        setUser(null);
        setSession(null);
        setIsLoading(false);
    };

    const enterGuestMode = () => {
        localStorage.setItem(GUEST_MODE_KEY, 'true');
        localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
        setIsGuest(true);
    };

    const value = {
        user,
        session,
        isAuthenticated: !!user || isGuest,
        isAdmin,
        isGuest,
        isLoading,
        logout,
        enterGuestMode
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
