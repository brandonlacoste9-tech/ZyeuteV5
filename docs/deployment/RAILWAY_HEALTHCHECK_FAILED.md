# Railway Healthcheck Still Failing 🔴

**Status:** Build successful, but healthcheck failing  
**Issue:** Backend not starting (service unavailable)

---

## What's Happening

✅ **Build:** Completed successfully  
✅ **Image:** Pushed successfully  
❌ **Healthcheck:** Failing - "service unavailable"  
❌ **Backend:** Not responding to `/api/health`

---

## Critical: Check Deployment Logs

**Railway Dashboard → Latest Deployment → Logs Tab**

**Look for these errors:**

### Error 1: Missing DATABASE_URL

```
🔥 [Startup] DATABASE_URL is not set. Set it in .env or your environment.
🔥 [Startup] EXITING: Missing DATABASE_URL environment variable
```

**Fix:** Set `DATABASE_URL` in Railway Variables

### Error 2: Database Connection Failed

```
🔥 [Startup] CANNOT CONNECT TO DATABASE: [error details]
🔥 [Startup] EXITING: Database connection failed - [error message]
```

**Fix:** Check `DATABASE_URL` format, verify Supabase is accessible

### Error 3: Migration Failed

```
🔥 [Startup] EXITING: Migration failed - [error]
```

**Fix:** Check migration logs, verify database permissions

### Error 4: Port Binding Issue

```
Error: listen EADDRINUSE: address already in use
```

**Fix:** Railway sets PORT automatically, backend should use `process.env.PORT`

---

## Immediate Actions

### Step 1: Check Logs (CRITICAL)

**Railway Dashboard:**

1. Go to: Latest Deployment
2. Click **Logs** tab
3. **Scroll to startup logs** (after build completes)
4. **Look for:** `🔥 [Startup] EXITING:` messages
5. **Share the exact error** - this will tell us what's wrong

### Step 2: Verify DATABASE_URL is Set

**Railway Dashboard → Variables Tab:**

Check if `DATABASE_URL` exists:

- ✅ **If set:** Verify format is correct
- ❌ **If missing:** Add it now:
  ```
  DATABASE_URL=postgresql://postgres.vuanulvyqkfefmjcikfk:HOEqEZsZeycL9PRE@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  ```

### Step 3: Check Other Required Variables

**Also verify these are set:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Common Issues

### Issue: DATABASE_URL Not Applied

**Symptom:** Variable set but backend still fails

**Fix:**

1. Verify variable is saved (check Variables tab)
2. **Redeploy after setting variables** (important!)
3. Check logs to confirm variable is being read

### Issue: Database Connection Timeout

**Symptom:** `CANNOT CONNECT TO DATABASE` error

**Fix:**

1. Verify Supabase database is running
2. Check connection string uses port **6543** (Connection Pooling)
3. Verify password is correct
4. Check Supabase firewall/network settings

### Issue: Backend Crashes Immediately

**Symptom:** No startup logs, just healthcheck failures

**Fix:**

1. Check if backend process is starting
2. Look for `process.exit(1)` calls in logs
3. Verify all required env vars are set

---

## Debugging Steps

### 1. Check Startup Logs

**Look for:**

- `📦 [Startup] Connecting to Database...`
- `✅ [Startup] Database Connected Successfully`
- `✅ Server running on http://0.0.0.0:${PORT}`

**If you see these:** Backend started, but healthcheck path might be wrong  
**If you don't see these:** Backend crashed before starting

### 2. Test Health Endpoint Manually

**After deployment, try:**

```bash
curl https://zyeutev5-production.up.railway.app/api/health
curl https://zyeutev5-production.up.railway.app/ready
```

**If these work:** Healthcheck configuration issue  
**If these fail:** Backend not running

### 3. Verify Environment Variables

**Run locally to verify:**

```bash
npm run verify:railway-vars
```

This shows what variables should be set in Railway.

---

## Next Steps

1. **Check Railway logs** - Find exact startup error
2. **Verify DATABASE_URL** - Is it set? Is format correct?
3. **Redeploy** - After fixing variables
4. **Test endpoints** - Once deployed

---

**The logs will tell us exactly why the backend isn't starting. Check the Logs tab in Railway Dashboard!** 🔍
