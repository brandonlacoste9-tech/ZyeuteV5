import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found, using mock client');
}

// Create real Supabase client if credentials exist, otherwise use mock
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Mock implementation for development without Supabase
function createMockClient() {
  type SubscriptionCallback = (event: string, session: any) => void;
  const subscribers = new Set<SubscriptionCallback>();
  
  const notifySubscribers = (event: string, session: any) => {
    subscribers.forEach(callback => callback(event, session));
  };

  const mockUser = {
    id: 'mock-user-id',
    email: 'demo@example.com',
    user_metadata: {
      username: 'demo_user',
      avatar_url: 'https://github.com/shadcn.png'
    }
  };

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token'
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: mockUser }, error: null }),
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      signInWithPassword: async (credentials: any) => {
        notifySubscribers('SIGNED_IN', mockSession);
        return { data: { user: mockUser, session: mockSession }, error: null };
      },
      signUp: async (credentials: any) => ({ data: { user: mockUser, session: mockSession }, error: null }),
      signOut: async () => {
        notifySubscribers('SIGNED_OUT', null);
        return { error: null };
      },
      signInWithOAuth: async (options: any) => ({ data: { url: window.location.origin }, error: null }),
      onAuthStateChange: (callback: SubscriptionCallback) => {
        subscribers.add(callback);
        callback('SIGNED_IN', mockSession);
        return { data: { subscription: { unsubscribe: () => subscribers.delete(callback) } } };
      }
    },
    from: (table: string) => {
      const queryBuilder: any = {
        select: () => queryBuilder,
        insert: () => queryBuilder,
        update: () => queryBuilder,
        delete: () => queryBuilder,
        eq: () => queryBuilder,
        neq: () => queryBuilder,
        gt: () => queryBuilder,
        lt: () => queryBuilder,
        gte: () => queryBuilder,
        lte: () => queryBuilder,
        in: () => queryBuilder,
        is: () => queryBuilder,
        like: () => queryBuilder,
        ilike: () => queryBuilder,
        contains: () => queryBuilder,
        range: () => queryBuilder,
        order: () => queryBuilder,
        limit: () => queryBuilder,
        single: () => Promise.resolve({ data: {}, error: null }),
        maybeSingle: () => Promise.resolve({ data: {}, error: null }),
        then: (resolve: (value: any) => void) => resolve({ data: [], error: null })
      };
      return queryBuilder;
    },
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: 'https://placehold.co/600x400' } }),
        remove: async () => ({ data: {}, error: null }),
        list: async () => ({ data: [], error: null })
      })
    },
    channel: (name: string) => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {}
    }),
    removeChannel: () => {}
  } as any;
}

// Helper function to get dynamic redirect URL based on current domain
function getRedirectUrl(): string {
  // Always use current origin to support all domains:
  // - https://zyeute.com
  // - https://zyeute.ca
  // - https://zyeute-v3.vercel.app
  // - http://localhost:5173 (dev)
  const origin = window.location.origin;
  return `${origin}/auth/callback`;
}

// Helper functions
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, username: string) {
  const redirectUrl = getRedirectUrl();

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: redirectUrl
    }
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function signInWithGoogle() {
  const redirectUrl = getRedirectUrl();

  console.log('🔍 Google OAuth redirect URL:', redirectUrl);

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
}

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) return { url: null, error };
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: urlData.publicUrl, error: null };
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}

export function subscribeToTable(table: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
