# Zyeute V5 — Infinite Loading Spinner Diagnosis

## Root Causes Identified

### 1. React StrictMode + `hasInitialized` Ref Guard (PRIMARY)

In `AuthContext.tsx`, a `useRef(false)` guard prevents double-initialization in StrictMode. However, **React 18 StrictMode unmounts and remounts components** — the ref value persists across this cycle because refs aren't reset on unmount.

**The problem:** On the second mount (the "real" one in StrictMode dev), `hasInitialized.current` is already `true`, so the effect body just calls `setIsLoading(false)` and returns early **without setting up the `onAuthStateChange` listener**. This means:
- In dev mode: auth state changes (like token refresh) never propagate.
- The emergency timeout fires at 4s, which masks the issue in some cases but not all.

**In production (no StrictMode):** This guard works fine. The real issue in production is #2 and #3.

### 2. Render Free Tier Cold Start (30-60s)

The backend is on `plan: free` on Render. After 15 min of inactivity, the service spins down. The first request after sleep takes **30-60 seconds** to wake. During this time:
- `getUserProfile("me")` calls `/api/auth/me` which proxies to Render
- The `apiCall` has a 15s timeout, but `enhanceUser` in AuthContext has a 5s `Promise.race` timeout
- The emergency failsafe fires at 4s

**However**, the feed endpoint (`/api/feed/infinite`) also hits Render. Even after auth resolves (via failsafe), the feed call hangs until Render wakes. The user sees a blank feed with the `LoadingScreen` from the `Suspense` fallback in `AppRoutes`.

### 3. `getSessionWithTimeout` Called Redundantly

Every `apiCall` invokes `getSessionWithTimeout(3000)` to get the auth token. The `useInfiniteFeed` hook also calls it. When the Supabase client has a valid cached session, this is fast. But when:
- The session is expired and needs refresh
- The Supabase client is using placeholder credentials (missing env vars)
- The Navigator Lock was previously blocking (now bypassed with `noOpLock`)

...the 3s timeout per call stacks up across multiple parallel requests on mount.

### 4. Version Bump Clears Auth Tokens

`main.tsx` has `APP_VERSION = "20260604-1"`. On every deploy with a version bump, **all `sb-*` and `supabase.*` localStorage keys are wiped**. This forces a fresh auth flow on every deploy, which means:
- `getSession()` returns null (no cached session)
- User appears logged out until they re-authenticate
- The app shows the feed in "guest" mode, but the feed API call still needs Render to be awake

## The Fix

The fix addresses all four issues:

1. **Remove the `hasInitialized` ref guard** — it's unnecessary with the `noOpLock` bypass already preventing the original 10s hang. Instead, use a proper cleanup pattern.
2. **Reduce emergency failsafe to 3s** and add a **secondary render gate** that shows the feed immediately in guest mode if auth hasn't resolved.
3. **Add `staleTime` to the QueryClient** defaults to prevent refetch storms on mount.
4. **Cache the session token** in memory to avoid redundant `getSessionWithTimeout` calls.
