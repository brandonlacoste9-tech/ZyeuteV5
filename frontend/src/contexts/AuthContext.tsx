import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/api";
import { User } from "@/types"; // Use our extended User type
import { checkIsAdmin } from "@/lib/admin";
import {
  GUEST_MODE_KEY,
  GUEST_TIMESTAMP_KEY,
  GUEST_SESSION_DURATION,
  GUEST_VIEWS_KEY,
} from "@/lib/constants";

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

    if (guestMode === "true" && guestTimestamp) {
      const age = Date.now() - parseInt(guestTimestamp, 10);
      if (age < GUEST_SESSION_DURATION) {
        return true;
      } else {
        localStorage.removeItem(GUEST_MODE_KEY);
        localStorage.removeItem(GUEST_TIMESTAMP_KEY);
        localStorage.removeItem(GUEST_VIEWS_KEY);
        return false;
      }
    }
    return false;
  };

  // Performance tracking helper
  const trackPerformance = (operation: string, startTime: number) => {
    const duration = Date.now() - startTime;
    return duration;
  };

  const enhanceUser = async (sessionUser: any) => {
    if (!sessionUser) return null;
    try {
      // Fetch full profile (Role, Coins, etc.)
      const fullProfile = await getUserProfile(sessionUser.id);
      if (fullProfile) return fullProfile;

      // Fallback if profile doesn't exist yet (rare race condition)
      return {
        id: sessionUser.id,
        username:
          sessionUser.user_metadata?.username ||
          sessionUser.email?.split("@")[0],
        email: sessionUser.email,
        role: "citoyen", // Default
        created_at: new Date().toISOString(),
      } as unknown as User;
    } catch (e) {
      console.warn(
        "⚠️ [Auth Resilience] Profile fetch failed - Using fallback to prevent redirect loop:",
        e,
      );
      // Ensure we return a valid user object to prevent redirect loops even if the table query fails
      return {
        id: sessionUser.id,
        username:
          sessionUser.user_metadata?.username ||
          sessionUser.email?.split("@")[0],
        email: sessionUser.email,
        role: "citoyen", // Default safe role
        created_at: new Date().toISOString(),
      } as unknown as User;
    }
  };

  useEffect(() => {
    let mounted = true;
    const initStart = Date.now();

    // EMERGENCY FAILSAFE: Force loading to complete after 2s maximum
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("⚠️ EMERGENCY: Forcing UI render after 2 seconds");
        setIsLoading(false);
      }
    }, 2000);

    const initializeAuth = async () => {
      try {
        const sessionStart = Date.now();
        // 1. Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        trackPerformance("Supabase getSession", sessionStart);

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            const profile = await enhanceUser(initialSession.user);
            if (mounted && profile) {
              setUser(profile);
              // Check admin based on ROLE now, falling back to helper
              setIsAdmin(
                profile.role === "founder" ||
                profile.role === "moderator" ||
                (await checkIsAdmin(initialSession.user as any)),
              );
            }
          } else {
            // Fallback to Guest Mode check
            const validGuest = checkGuestMode();
            if (mounted) setIsGuest(validGuest);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Fallback to Guest Mode on error
        if (mounted) {
          const validGuest = checkGuestMode();
          setIsGuest(validGuest);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          clearTimeout(emergencyTimeout);
          trackPerformance("Total auth initialization", initStart);
        }
      }
    };

    initializeAuth();

    // 3. Listen for Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;
        // console.log('🔐 Auth State Changed:', event);

        setSession(newSession);

        if (newSession?.user) {
          setIsGuest(false);
          const profile = await enhanceUser(newSession.user);
          if (mounted && profile) {
            setUser(profile);
            setIsAdmin(
              profile.role === "founder" || profile.role === "moderator",
            );
          }
        } else {
          setUser(null);
          setIsAdmin(false);
          if (event === "SIGNED_OUT") {
            const validGuest = checkGuestMode();
            if (mounted) setIsGuest(validGuest);
          }
        }

        // Ensure loading is false only after all state updates are complete
        if (mounted) setIsLoading(false);
      },
    );

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setIsGuest(false);
      setIsAdmin(false);
      setUser(null);
      setSession(null);

      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_TIMESTAMP_KEY);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const enterGuestMode = () => {
    localStorage.setItem(GUEST_MODE_KEY, "true");
    localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
    setIsGuest(true);
  };

  // Log auth state changes to help debug redirect loops
  useEffect(() => {
    if (!isLoading) {
      console.log("[Auth] State stabilized:", {
        isAuthenticated: !!user || isGuest,
        userId: user?.id,
        isGuest,
        role: user?.role,
      });
    }
  }, [user, isGuest, isLoading]);

  const value = {
    user,
    session,
    isAuthenticated: !!user || isGuest,
    isAdmin,
    isGuest,
    isLoading,
    logout,
    enterGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
