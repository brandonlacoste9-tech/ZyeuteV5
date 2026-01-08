/**
 * LEGACY SUPABASE ABSTRACTION LAYER
 * 
 * TODO: Remove once Clerk + Neon/Postgres are fully integrated
 * 
 * This file centralizes all Supabase usage so we can easily swap it out.
 * All components should import from this file, not directly from @supabase/supabase-js
 */

// Import internal Supabase client (marked as internal use only)
import { supabase as internalSupabase } from "./supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

// Re-export types for backwards compatibility
export type { Session, User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Auth Operations
 */
export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const {
    data: { user },
  } = await internalSupabase.auth.getUser();
  return user;
}

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await internalSupabase.auth.getSession();
  return session;
}

export async function signIn(email: string, password: string) {
  return await internalSupabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  username: string,
) {
  const redirectUrl = `${window.location.origin}/auth/callback`;
  return await internalSupabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: redirectUrl,
    },
  });
}

export async function signOut() {
  return await internalSupabase.auth.signOut();
}

export async function signInWithGoogle() {
  const redirectUrl = `${window.location.origin}/auth/callback`;
  return await internalSupabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  });
}

export function onAuthStateChange(
  callback: (event: any, session: Session | null) => void,
) {
  return internalSupabase.auth.onAuthStateChange(callback);
}

/**
 * Storage Operations
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> {
  const { data, error } = await internalSupabase.storage
    .from(bucket)
    .upload(path, file);
  if (error) return { url: null, error };
  const { data: urlData } = internalSupabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}

export async function deleteFile(
  bucket: string,
  path: string,
): Promise<{ error: Error | null }> {
  const { error } = await internalSupabase.storage.from(bucket).remove([path]);
  return { error };
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = internalSupabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Realtime/Channel Operations
 */
export interface RealtimeChannel {
  on: (event: string, filter: any, callback: (payload: any) => void) => RealtimeChannel;
  subscribe: (callback?: (status: string) => void) => Promise<void>;
  unsubscribe: () => Promise<void>;
  track: (state: any) => Promise<void>;
  presenceState?: () => Record<string, any>; // For presence tracking (optional for type safety)
}

export function createChannel(
  name: string,
  config?: { presence?: { key: string } },
): RealtimeChannel {
  // Supabase channels already have presenceState method
  // Cast to our interface which includes it
  return internalSupabase.channel(name, config) as unknown as RealtimeChannel;
}

export function removeChannel(channel: RealtimeChannel) {
  return internalSupabase.removeChannel(channel as any);
}

/**
 * Database Query Operations
 * TODO: These should be moved to repository layer once Neon is set up
 */
export function queryTable(table: string) {
  return internalSupabase.from(table);
}

/**
 * Subscribe to table changes (realtime)
 * TODO: Evaluate if we need this after migration - may use Soketi/Pusher instead
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
) {
  const channel = internalSupabase
    .channel(`public:${table}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, callback)
    .subscribe();

  return () => {
    internalSupabase.removeChannel(channel);
  };
}
