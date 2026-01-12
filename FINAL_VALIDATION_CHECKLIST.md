# 🏁 Final Validation Checklist - Pre-Google Meeting

## ✅ Pre-Meeting Validation (5 Minutes Before)

### 1. ✅ Verify Vercel CSP Headers

**Quick Test:**

```bash
curl -sI https://www.zyeute.com | grep -i content-security-policy
```

**Expected Output:**
Should contain: `media-src 'self' https://videos.pexels.com https://images.pexels.com`

**If missing or old:**

- Check that latest deployment completed in Vercel dashboard
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache

---

### 2. ✅ Verify Database Schema (Supabase SQL Editor)

Run these queries in **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Confirm English columns exist on publications table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'publications'
AND column_name IN ('visibility', 'is_hidden', 'fire_count');

-- Expected: Should return 3 rows (visibility, is_hidden, fire_count)

-- 2. Confirm user_profiles table is ready
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('bio', 'avatar_url', 'cash_credits', 'karma_credits');

-- Expected: Should return columns or empty if not needed

-- 3. Check if users table exists (might be user_profiles)
SELECT COUNT(*) as user_count FROM user_profiles;
-- OR
SELECT COUNT(*) as user_count FROM users;

-- Expected: Should return a number (even 0 is OK)
```

---

### 3. ✅ Sync System Clock (Critical for Auth)

**Windows:**

- Settings → Time & Language → Date & time
- Click **"Sync now"** button

**Mac:**

- System Settings → General → Date & Time
- Toggle **"Set time and date automatically"** OFF
- Wait 2 seconds
- Toggle **"Set time and date automatically"** ON

**Why:** Fixes "Session issued in the future" JWT errors

---

### 4. ✅ Clear Browser Cache (Clean Slate)

**Chrome/Edge:**

1. Open `https://www.zyeute.com`
2. Press `F12` (DevTools)
3. Go to **Application** tab
4. Click **"Clear site data"** button
5. Check all boxes
6. Click **"Clear data"**
7. Close DevTools
8. Hard refresh: `Ctrl+Shift+R`

**Firefox:**

1. Press `Ctrl+Shift+Delete`
2. Select **"Cached Web Content"**
3. Time range: **"Everything"**
4. Click **"Clear Now"**
5. Hard refresh: `Ctrl+Shift+R`

---

### 5. ✅ Test Login Flow

**Steps:**

1. Go to `https://www.zyeute.com`
2. Try to log in with a test account
3. Check browser console (F12 → Console tab)

**Success Indicators:**

- ✅ Login succeeds
- ✅ Feed loads with Pexels videos
- ✅ Videos play (not black screen)
- ✅ No 500 errors in console
- ✅ No CSP errors in console

**Failure Indicators:**

- ❌ **500 errors** → Database migration incomplete (check Supabase)
- ❌ **Black screen / videos don't load** → CSP header issue (check Vercel deployment)
- ❌ **401 errors / "Session in future"** → System clock not synced
- ❌ **CSP errors in console** → Headers not applied (wait for Vercel deployment)

---

## 🔍 Quick Health Checks

### Backend Health Check

```bash
curl https://zyeutev5-production.up.railway.app/api/health
```

**Expected:**

```json
{ "status": "healthy", "message": "Zyeuté Live", "timestamp": "..." }
```

### Pexels API Check

```bash
curl "https://zyeutev5-production.up.railway.app/api/pexels/curated?per_page=1&page=1"
```

**Expected:**

```json
{"page":1,"per_page":1,"videos":[...],"total_results":...}
```

---

## 📋 Final Pre-Meeting Checklist

- [ ] System clock synced (Windows: Sync now, Mac: Toggle auto-sync)
- [ ] Browser cache cleared (Application tab → Clear site data)
- [ ] CSP headers verified (curl command shows videos.pexels.com)
- [ ] Database schema verified (SQL queries return expected results)
- [ ] Test login successful
- [ ] Pexels videos playing (not black screen)
- [ ] No errors in browser console (F12)
- [ ] Backend health check returns 200 OK

---

## 🚨 Emergency Troubleshooting

### If Videos Are Black Screen:

1. Check CSP header: `curl -sI https://www.zyeute.com | grep -i content-security-policy`
2. Verify Vercel deployment completed (Dashboard → Deployments)
3. Hard refresh: `Ctrl+Shift+R`
4. Check browser console for CSP errors

### If 500 Errors:

1. Check Railway logs: Railway Dashboard → Deployments → Latest → Logs
2. Verify database schema: Run SQL queries above
3. Check Railway environment variables: Railway Dashboard → Variables

### If Auth Fails (401):

1. Sync system clock (most common cause)
2. Check Railway logs for JWT errors
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Railway

---

## 🎯 Success Criteria for Meeting

Your demo is ready when:

- ✅ App loads without errors
- ✅ User can log in
- ✅ Feed displays Pexels videos
- ✅ Videos play smoothly
- ✅ No console errors

---

**Last Updated:** 2026-01-12
**Status:** Pre-meeting validation checklist
