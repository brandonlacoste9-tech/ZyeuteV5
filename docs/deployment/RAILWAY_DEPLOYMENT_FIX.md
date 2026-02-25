# Railway Deployment Fix - Healthcheck Failing 🔧

**Error:** `1/1 replicas never became healthy!`  
**Healthcheck:** `/api/health` returning "service unavailable"

---

## Immediate Actions

### 1. Check Railway Logs (CRITICAL)

**In Railway Dashboard:**

1. Go to: https://railway.app/project/ad61359f-e003-47db-9feb-2434b9c266f5
2. Click **ZyeuteV5** service (backend)
3. Click **Deployments** → Latest deployment
4. Click **Logs** tab
5. **Look for these errors:**

**Common Errors:**

- ❌ `❌ DATABASE_URL is not set`
- ❌ `❌ Unexpected database pool error`
- ❌ `Error: Cannot find module`
- ❌ `Error: listen EADDRINUSE: address already in use`
- ❌ `SyntaxError: Unexpected token`

**Success Indicators:**

- ✅ `✅ Server running on http://0.0.0.0:${PORT}`
- ✅ `✅ Database pool connection established`
- ✅ `Health check available at http://0.0.0.0:${PORT}/api/health`

---

### 2. Verify Required Environment Variables

**Railway Dashboard → ZyeuteV5 Service → Variables Tab**

**CRITICAL Variables (Backend won't start without these):**

| Variable                 | Status          | Value Example                                 |
| ------------------------ | --------------- | --------------------------------------------- |
| `DATABASE_URL`           | ⚠️ **MUST SET** | `postgresql://postgres:...@...:6543/postgres` |
| `VITE_SUPABASE_URL`      | ⚠️ **MUST SET** | `https://vuanulvyqkfefmjcikfk.supabase.co`    |
| `VITE_SUPABASE_ANON_KEY` | ⚠️ **MUST SET** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`     |

**If `DATABASE_URL` is missing:**

1. Go to Supabase Dashboard
2. Settings → Database → Connection Pooling
3. Copy connection string (use port **6543**)
4. Add to Railway Variables
5. **Redeploy**

---

### 3. Test Health Endpoint

**Run locally:**

```bash
npm run check:railway
```

**Or manually:**

```bash
curl https://zyeutev5-production.up.railway.app/api/health
```

**Expected Response:**

```json
{ "status": "ok", "uptime": 123.45 }
```

**If it fails:**

- Backend is not running
- Check Railway logs for startup errors

---

## Common Fixes

### Fix 1: Database Connection Timeout

**Symptom:** Healthcheck times out, logs show DB connection errors

**Solution:**

1. Verify `DATABASE_URL` uses **port 6543** (Connection Pooling)
2. Check Supabase database is running
3. Increase connection timeout in `backend/storage.ts` if needed

### Fix 2: Missing Environment Variables

**Symptom:** Backend crashes immediately, logs show "DATABASE_URL is not set"

**Solution:**

1. Railway Dashboard → Variables tab
2. Add missing variables
3. **Click Redeploy** (important!)

### Fix 3: Build Errors

**Symptom:** Build completes but `dist/index.cjs` doesn't exist

**Solution:**

1. Check build logs for TypeScript errors
2. Verify `npm run build` completes successfully
3. Check `package.json` scripts are correct

### Fix 4: Port Configuration

**Symptom:** "Port already in use" or healthcheck can't connect

**Solution:**

- Railway sets `PORT` automatically
- Backend should use `process.env.PORT || 3000`
- Backend should listen on `0.0.0.0` (already configured ✅)

---

## Step-by-Step Debugging

### Step 1: Check Logs

```bash
railway logs
```

**Look for:**

- Startup errors
- Database connection errors
- Module not found errors

### Step 2: Verify Variables

```bash
railway variables
```

**Check:**

- `DATABASE_URL` exists
- `VITE_SUPABASE_URL` exists
- `VITE_SUPABASE_ANON_KEY` exists

### Step 3: Test Health Endpoint

```bash
npm run check:railway
```

### Step 4: Redeploy

```bash
railway up
```

**Or in Railway Dashboard:**

- Deployments → Redeploy

---

## Quick Fix Checklist

- [ ] Check Railway logs for errors
- [ ] Verify `DATABASE_URL` is set in Railway Variables
- [ ] Verify `VITE_SUPABASE_URL` is set
- [ ] Verify `VITE_SUPABASE_ANON_KEY` is set
- [ ] Test `/api/health` endpoint
- [ ] Redeploy after fixing variables

---

## If Still Failing

**Check these files:**

1. `railway.json` - Healthcheck path correct?
2. `backend/index.ts` - Server listening on `0.0.0.0`?
3. `backend/routes/health.ts` - Health endpoint exists?
4. `Dockerfile` - Build process correct?

**Get help:**

- Share Railway logs
- Share build logs
- Share environment variables (redact secrets)

---

**Start by checking Railway logs - that will tell you exactly why it's failing!** 🔍
