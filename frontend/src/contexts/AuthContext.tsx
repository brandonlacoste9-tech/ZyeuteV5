import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase, getSessionWithTimeout } from "@/lib/supabase";
import { getUserProfile } from "@/services/api";
import { User } from "@/types"; // Use our extended User type
import { checkIsAdmin } from "@/lib/admin";

function profileGrantsAdmin(profile: User | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.role === "founder" ||
    profile.role === "moderator" ||
    profile.isAdmin === true
  );
}

async function resolveIsAdmin(
  profile: User | null,
  sessionUser: { id: string } | null | undefined,
): Promise<boolean> {
  if (profileGrantsAdmin(profile)) return true;
  if (!sessionUser) return false;
  return checkIsAdmin(sessionUser as Parameters<typeof checkIsAdmin>[0]);
}
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

  const enhanceUser = async (sessionUser: any) => {
    if (!sessionUser) return null;
    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 4000),
      );
      const fullProfile = await Promise.race([
        getUserProfile("me"),
        timeoutPromise,
      ]);
      if (fullProfile) return fullProfile;

      return {
        id: sessionUser.id,
        username:
          sessionUser.user_metadata?.username ||
          sessionUser.email?.split("@")[0],
        email: sessionUser.email,
        role: "citoyen",
        created_at: sessionUser.created_at || new Date().toISOString(),
      } as unknown as User;
    } catch (e) {
      console.warn(
        "⚠️ [Auth Resilience] Profile fetch failed - Using fallback:",
        e instanceof Error ? e.message : e,
      );
      return {
        id: sessionUser.id,
        username:
          sessionUser.user_metadata?.username ||
          sessionUser.email?.split("@")[0],
        email: sessionUser.email,
        role: "citoyen",
        created_at: sessionUser.created_at || new Date().toISOString(),
      } as unknown as User;
    }
  };

  useEffect(() => {
    let mounted = true;
    const initStart = Date.now();
    console.log("🕯️ [Auth] Starting initialization...");

    // EMERGENCY FAILSAFE: Force loading to complete after 3s
    // Prevents infinite spinner when backend is cold-starting or unreachable
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        const elapsed = Date.now() - initStart;
        console.warn(`⚠️ EMERGENCY: Forcing UI render after ${elapsed}ms`);
        setIsLoading(false);
      }
    }, 3000);

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await getSessionWithTimeout(2500);

        if (!mounted) return;

        if ((initialSession as any)?.user) {
          setSession(initialSession as any);
          // Start profile enhancement but don't block on it
          enhanceUser((initialSession as any).user)
            .then(async (profile) => {
              if (!mounted) return;
              if (profile) {
                setUser(profile);
                const admin = await resolveIsAdmin(
                  profile,
                  (initialSession as any).user,
                ).catch(() => profileGrantsAdmin(profile));
                if (mounted) setIsAdmin(admin);
              }
              setIsLoading(false);
              clearTimeout(emergencyTimeout);
            })
            .catch(() => {
              if (mounted) {
                setIsLoading(false);
                clearTimeout(emergencyTimeout);
              }
            });
        } else {
          // No session — check guest mode and resolve immediately
          const validGuest = checkGuestMode();
          if (mounted) {
            setIsGuest(validGuest);
            setIsLoading(false);
            clearTimeout(emergencyTimeout);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          const validGuest = checkGuestMode();
          setIsGuest(validGuest);
          setIsLoading(false);
          clearTimeout(emergencyTimeout);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.user) {
          setIsGuest(false);
          // Defer profile fetch to avoid Supabase deadlock on simultaneous calls
          setTimeout(() => {
            if (!mounted) return;
            enhanceUser(newSession.user)
              .then(async (profile) => {
                if (mounted && profile) {
                  setUser(profile);
                  const admin = await resolveIsAdmin(
                    profile,
                    newSession.user,
                  ).catch(() => profileGrantsAdmin(profile));
                  if (mounted) setIsAdmin(admin);
                }
                if (mounted) setIsLoading(false);
              })
              .catch(() => mounted && setIsLoading(false));
          }, 0);
        } else {
          setUser(null);
          setIsAdmin(false);
          if (event === "SIGNED_OUT") {
            const validGuest = checkGuestMode();
            if (mounted) setIsGuest(validGuest);
          }
          if (mounted) setIsLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_MODE_KEY, "true");
    localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
    setIsGuest(true);
  }, []);

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

  const value = React.useMemo(
    () => ({
      user,
      session,
      isAuthenticated: !!user || isGuest,
      isAdmin,
      isGuest,
      isLoading,
      logout,
      enterGuestMode,
    }),
    [user, session, isAdmin, isGuest, isLoading, logout, enterGuestMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
