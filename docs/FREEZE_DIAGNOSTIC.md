# Zyeuté Freeze Diagnostic Guide

The app freezes after login and the feed won't show videos. This doc tracks fixes applied and next steps.

## Fixes Applied (Latest)

### 1. **Auth Token Mismatch** ✅
- **Problem:** `useInfiniteFeed` used `localStorage.getItem("token")` but Supabase stores JWT under different keys.
- **Fix:** Now uses `supabase.auth.getSession()` to get the correct Bearer token for `/api/feed/infinite`.
- **Files:** `frontend/src/hooks/useInfiniteFeed.ts`

### 2. **Service Worker Blocking** ✅
- **Problem:** SW registration on `load` could block or interfere with initial render.
- **Fix:** Deferred SW registration with `requestIdleCallback` so it runs after the main thread is idle.
- **Bypass:** Add `?noSW=1` to URL to skip SW registration entirely for testing.
- **Files:** `frontend/index.html`

### 3. **React Query Aggressiveness** ✅
- **Problem:** Feed could refetch too often on mount, causing cascading requests.
- **Fix:** Added `staleTime: 30_000`, `gcTime`, `retry: 2` with exponential backoff.
- **Files:** `frontend/src/hooks/useInfiniteFeed.ts`

---

## If Freeze Persists: Next Steps

### A. Restore Full App Routing
The current `App.tsx` is a minimal debug version (Login + MinimalFeed). The real feed (`LaZyeute`) is not in the routes. Restore the full routing if you're testing the production flow.

### B. Disable StrictMode (Dev Only)
In `main.tsx`, temporarily remove `<React.StrictMode>` — it double-invokes effects in dev and can expose race conditions.

### C. Check Environment Mismatch
- **Vercel:** Rewrites `/api/*` → Railway backend
- **Local:** Vite proxy `/api` → `localhost:8080`
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel env vars.

### D. Network Tab
1. Open DevTools → Network
2. Log in and navigate to feed
3. Check:
   - Does `GET /api/feed/infinite` fire?
   - Status: 200 or 401/500?
   - Does `GET /api/auth/me` complete?

### E. Console Errors
- Look for Supabase auth errors
- Look for "Failed to fetch feed"
- Look for CORS or CSP violations

### F. Pre-Hydration Freeze
If the freeze happens before React renders:
- Comment out the `Object.values` monkey-patch in `main.tsx`
- Comment out the Service Worker block in `index.html`
- Check if `supabase.ts` console.log on import causes issues

### G. Build System
```bash
rm -rf node_modules dist .vite
npm install
npm run build
```
Redeploy to Vercel and test.

---

## Debug Mode
Add `?debug=1` to the URL to enable feed diagnostic logging in the console.
