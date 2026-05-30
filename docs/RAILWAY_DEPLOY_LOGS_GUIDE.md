# Railway Deploy Logs Guide 🔍

**Goal:** Diagnose why Railway healthcheck is failing after successful build

---

## Critical: Deploy Logs vs Build Logs

**Build Logs** = Docker image creation (✅ working)  
**Deploy Logs** = Runtime startup errors (❌ failing)

---

## Step 1: Access Deploy Logs

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **ZyeutéV5** project
3. Click on the **service** (not the build)
4. Click **"Deploy Logs"** tab (NOT "Build Logs")
5. Look for errors starting with:
   - `🔥 [Startup] EXITING:`
   - `Error:`
   - `Failed to connect`
   - `process.exit(1)`

---

## Step 2: Check for Critical Errors

### Error Pattern 1: Missing DATABASE_URL

```
🔥 [Startup] EXITING: DATABASE_URL is required
```

**Fix:** Set `DATABASE_URL` in Railway Variables

### Error Pattern 2: Database Connection Failed

```
🔥 [Startup] EXITING: Failed to connect to database
Error: connect ECONNREFUSED
```

**Fix:** Check `DATABASE_URL` format and credentials

### Error Pattern 3: Migration Failed

```
🔥 [Startup] EXITING: Migration failed
```

**Fix:** Check database permissions and migration scripts

### Error Pattern 4: Port Binding Issue

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:** Railway sets `PORT` automatically - ensure backend uses `process.env.PORT`

---

## Step 3: Verify Environment Variables

Run locally to check what Railway needs:

```bash
npm run verify:railway-vars
```

**Required Variables:**

- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `VITE_SUPABASE_URL` - Supabase project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- ⚠️ `MAX_API_TOKEN` - Optional (for Max API)

---

## Step 4: Set Railway Variables

### Option A: Railway Dashboard

1. Go to Railway Dashboard → Your Service
2. Click **"Variables"** tab
3. Add/Update:
   ```
   DATABASE_URL=postgresql://postgres.vuanulvyqkfefmjcikfk:HOEqEZsZeycL9PRE@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Option B: Railway CLI

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set VITE_SUPABASE_URL="https://..."
railway variables set VITE_SUPABASE_ANON_KEY="eyJ..."
```

---

## Step 5: Check Startup Sequence

The backend should:

1. ✅ Load environment variables
2. ✅ Connect to database
3. ✅ Run migrations
4. ✅ Start Express server on `PORT`
5. ✅ Respond to `/api/health` and `/ready`

**If any step fails, you'll see `🔥 [Startup] EXITING:` in Deploy Logs**

---

## Step 6: Test Healthcheck Manually

After deployment, test:

```bash
# Replace with your Railway URL
curl https://zyeute-api.railway.app/api/health
curl https://zyeute-api.railway.app/ready
```

**Expected Response:**

```json
{ "status": "ok", "timestamp": "..." }
```

---

## Common Issues & Solutions

### Issue: Healthcheck timeout

**Cause:** Backend not starting or crashing immediately  
**Solution:** Check Deploy Logs for `EXITING:` messages

### Issue: Database connection timeout

**Cause:** Wrong `DATABASE_URL` or network issue  
**Solution:** Verify connection string, check Supabase dashboard

### Issue: Port already in use

**Cause:** Backend hardcoded to port 3000  
**Solution:** Ensure backend uses `process.env.PORT || 3000`

### Issue: Missing environment variables

**Cause:** Variables not set in Railway  
**Solution:** Set all required variables in Railway Dashboard

---

## Next Steps

1. **Share Deploy Logs** - Copy/paste the error messages
2. **Confirm DATABASE_URL** - Is it set in Railway Variables?
3. **Check Railway Postgres** - Are you using Railway's internal Postgres or Supabase?

Once I see the Deploy Logs, I can pinpoint the exact issue! 🔧
