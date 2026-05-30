# 🔴 Backend Connectivity Fix - "Chargement de Zyeuté..." Stuck Screen

## Problem Diagnosis

The app is stuck on "Chargement de Zyeuté..." because the **frontend cannot reach the Railway backend**.

**Current Configuration:**

- ✅ Frontend API URL: `https://zyeutev5-production.up.railway.app` (hardcoded in `frontend/src/services/api.ts`)
- ✅ CORS: Backend allows all origins (`origin: true`)
- ❓ Railway Backend: **Status Unknown** - Need to verify

---

## 🔍 Step 1: Verify Railway Backend Status

### Check Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Navigate to your backend service
3. Check **Deployments** tab:
   - ✅ Status should be **"Active"** (green)
   - ❌ If status is "Failed" or "Building" → Backend is down

4. Check **Logs** tab (latest deployment):
   - Look for: `✅ PORT ${port} CLAIMED`
   - Look for: `🚀 Server fully initialized and ready!`
   - Look for errors: `❌ Unexpected database pool error`
   - Look for warnings: `⚠️ Supabase environment variables missing`

### Test Backend Health Endpoint

Open in browser or use curl:

```
https://zyeutev5-production.up.railway.app/api/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T...",
  "message": "Zyeuté Live"
}
```

**If you get:**

- ❌ **Connection timeout / Cannot reach** → Railway backend is down or URL is wrong
- ❌ **500 Internal Server Error** → Backend is crashing (see Step 2)
- ✅ **200 OK with JSON** → Backend is working (problem is elsewhere)

---

## 🔧 Step 2: Fix Railway Environment Variables

If the health check returns 500 or backend logs show errors, check these **REQUIRED** variables:

### Railway Dashboard → Your Service → Variables Tab

#### Critical Variables (Backend crashes without these):

| Variable                                                | Required Value                             | How to Get It                                                   |
| ------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `DATABASE_URL`                                          | PostgreSQL connection string               | Supabase → Settings → Database → Connection Pooling (port 6543) |
| `VITE_SUPABASE_URL` or `SUPABASE_URL`                   | `https://vuanulvyqkfefmjcikfk.supabase.co` | Supabase → Settings → API → Project URL                         |
| `VITE_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase anon key                     | Supabase → Settings → API → anon key                            |

#### Format for DATABASE_URL:

```
postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
```

**Important:** Use port **6543** (Connection Pooling), not 5432 (Direct connection)

### After Setting Variables:

1. Click **"Redeploy"** button in Railway
2. Wait 3-5 minutes for deployment
3. Check logs for: `✅ Database pool connection established`
4. Test health endpoint again

---

## 🔍 Step 3: Verify Vercel Environment Variables

### Vercel Dashboard → Your Project → Settings → Environment Variables

**Required:**

- `VITE_API_URL` = `https://zyeutev5-production.up.railway.app`

**Note:** The frontend code is currently **hardcoded** to use this URL, but having it as an env var is good practice for flexibility.

### If VITE_API_URL is set:

1. Vercel will auto-deploy on git push
2. Or manually trigger redeploy: Deployments → Latest → Redeploy

---

## 🔍 Step 4: Common Issues & Solutions

### Issue: "Connection timeout" when accessing Railway URL

**Causes:**

- Railway service is not deployed
- Railway URL is incorrect
- Railway service is paused/stopped

**Solutions:**

1. Check Railway Dashboard → Service status
2. Verify the URL matches: `https://zyeutev5-production.up.railway.app`
3. Check if service is paused (resume if needed)

---

### Issue: Health check returns 500

**Causes:**

- `DATABASE_URL` missing or invalid
- `SUPABASE_URL` or `SUPABASE_KEY` missing
- Database connection failure

**Solutions:**

1. Check Railway logs for specific error
2. Verify all required env vars are set (see Step 2)
3. Test DATABASE_URL format (must use port 6543)
4. Redeploy after fixing variables

---

### Issue: CORS errors in browser console

**Current Status:** ✅ CORS is already configured to allow all origins

- Backend uses: `app.use(cors({ origin: true, credentials: true }));`
- This allows requests from any domain (including zyeute.com)

**If you still see CORS errors:**

- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if error is actually a 500 (not CORS)

---

### Issue: Frontend stuck on loading screen

**Symptoms:**

- "Chargement de Zyeuté..." never completes
- No errors in browser console
- Network tab shows pending requests

**Diagnosis Steps:**

1. Open Browser DevTools (F12) → Network tab
2. Filter by "XHR" or "Fetch"
3. Look for requests to `/api/auth/me` or `/api/users/...`
4. Check request status:
   - **Pending/Failed** → Backend not reachable
   - **500 Error** → Backend crashing (check logs)
   - **Timeout** → Backend down or URL wrong

---

## ✅ Verification Checklist

After fixing the issues, verify:

- [ ] Railway backend shows "Active" status
- [ ] Health endpoint returns 200 OK: `https://zyeutev5-production.up.railway.app/api/health`
- [ ] Railway logs show: `🚀 Server fully initialized and ready!`
- [ ] All required env vars are set in Railway
- [ ] Railway service redeployed after env var changes
- [ ] Vercel has `VITE_API_URL` set (optional, frontend is hardcoded)
- [ ] Browser Network tab shows successful API calls
- [ ] App loads past "Chargement de Zyeuté..." screen

---

## 🚀 Quick Fix Sequence

1. **Check Railway Status** → Dashboard → Deployments → Status
2. **Test Health Endpoint** → `https://zyeutev5-production.up.railway.app/api/health`
3. **Check Railway Logs** → Look for errors
4. **Verify Env Vars** → Railway → Variables tab
5. **Redeploy Railway** → After fixing env vars
6. **Test Again** → Health endpoint should return 200 OK
7. **Refresh Browser** → Hard refresh (Ctrl+Shift+R)

---

## 📞 Still Not Working?

If backend health check works but frontend still can't connect:

1. **Check Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for network errors or CORS errors

2. **Check Network Tab:**
   - Open DevTools (F12) → Network tab
   - Filter by "XHR"
   - Look at failed requests and their error messages

3. **Verify Railway URL:**
   - Go to Railway Dashboard → Settings → Domains
   - Verify the URL matches what frontend is using
   - Current frontend expects: `https://zyeutev5-production.up.railway.app`

4. **Check Railway Service Logs:**
   - Railway Dashboard → Your Service → Logs
   - Look for incoming request logs
   - If no requests appear → Frontend isn't reaching backend (check URL)

---

**Last Updated:** 2026-01-12
**Status:** Backend connectivity troubleshooting guide
