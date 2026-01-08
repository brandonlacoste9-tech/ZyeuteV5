/**
 * AUTH CLIENT ABSTRACTION
 * 
 * This abstraction allows us to swap Supabase auth for Clerk without changing
 * the rest of the application.
 * 
 * TODO: Replace implementation with Clerk once integrated
 */

import type { User } from "../shared/schema";

export interface AuthResult {
  user: User | null;
  error: Error | null;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export type AuthCallback = (event: string, session: any) => void;
export type Unsubscribe = () => void;

export interface AuthClient {
  getCurrentUser(): Promise<User | null>;
  getSession(): Promise<any | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(credentials: SignUpData): Promise<AuthResult>;
  signOut(): Promise<void>;
  signInWithOAuth(provider: "google" | "microsoft"): Promise<{ url: string | null; error: Error | null }>;
  onAuthStateChange(callback: AuthCallback): { data: { subscription: { unsubscribe: Unsubscribe } } };
  getAccessToken(): Promise<string | null>;
}

/**
 * Create Supabase-based auth client (temporary implementation)
 * TODO: Replace with Clerk implementation
 * 
 * When Clerk is integrated, replace this entire function with:
 * 
 * function createClerkAuthClient(): AuthClient {
 *   import { clerkClient } from "@clerk/clerk-express";
 *   // Implement Clerk-based auth methods
 * }
 */
function createSupabaseAuthClient(): AuthClient {
  // Dynamic import to avoid circular dependencies
  let authFunctions: any = null;
  
  const getAuthFunctions = async () => {
    if (!authFunctions) {
      authFunctions = await import("../frontend/src/lib/legacySupabase");
    }
    return authFunctions;
  };

  return {
    async getCurrentUser() {
      const auth = await getAuthFunctions();
      const user = await auth.getCurrentUser();
      // TODO: Map Supabase user to internal User type
      return user as User | null;
    },

    async getSession() {
      const auth = await getAuthFunctions();
      return await auth.getSession();
    },

    async signIn(email: string, password: string) {
      const auth = await getAuthFunctions();
      const result = await auth.signIn(email, password);
      return {
        user: result.data?.user as User | null,
        error: result.error as Error | null,
      };
    },

    async signUp(credentials: SignUpData) {
      const auth = await getAuthFunctions();
      const result = await auth.signUp(credentials.email, credentials.password, credentials.username);
      return {
        user: result.data?.user as User | null,
        error: result.error as Error | null,
      };
    },

    async signOut() {
      const auth = await getAuthFunctions();
      await auth.signOut();
    },

    async signInWithOAuth(provider: "google" | "microsoft") {
      const auth = await getAuthFunctions();
      if (provider === "google") {
        const result = await auth.signInWithGoogle();
        return {
          url: result.data?.url || null,
          error: result.error as Error | null,
        };
      }
      // TODO: Add Microsoft OAuth when Clerk is integrated
      return { url: null, error: new Error("Microsoft OAuth not yet implemented") };
    },

    onAuthStateChange(callback: AuthCallback) {
      // This needs to be synchronous, so we import directly
      // TODO: Fix this when migrating to Clerk - Clerk has different API
      // For now, return a mock subscription object
      // The actual implementation will be in the frontend AuthContext
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },

    async getAccessToken() {
      const session = await this.getSession();
      return (session as any)?.access_token || null;
    },
  };
}

// Export the auth client instance
// TODO: Replace with Clerk client when integrated
export const authClient: AuthClient = createSupabaseAuthClient();
