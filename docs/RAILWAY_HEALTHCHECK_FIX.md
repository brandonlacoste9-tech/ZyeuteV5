# Railway Healthcheck Fix 🔧

**Issue:** Healthcheck failing - `/api/health` returns "service unavailable"

**Error:** `1/1 replicas never became healthy!`

---

## Root Cause Analysis

The healthcheck is configured correctly (`/api/health`), but the backend may be:

1. **Not starting** - Server not listening on PORT
2. **Database connection failing** - Health check requires DB connection
3. **Crashing on startup** - Error during initialization
4. **Port mismatch** - Backend not listening on Railway's PORT

---

## Step 1: Check Railway Logs

**In Railway Dashboard:**

1. Go to your backend service
2. Click **Deployments** → Latest deployment
3. Click **Logs** tab
4. Look for:
   - ❌ `❌ Database pool connection error`
   - ❌ `❌ Unexpected database pool error`
   - ❌ `Error: Cannot find module`
   - ❌ `Port already in use`
   - ✅ `✅ Server running on port ${PORT}`
   - ✅ `✅ Database pool connection established`

---

## Step 2: Verify Environment Variables

**Required Variables in Railway:**

| Variable                 | Status       | Notes                               |
| ------------------------ | ------------ | ----------------------------------- |
| `DATABASE_URL`           | ⚠️ **CHECK** | Must be set for healthcheck to pass |
| `VITE_SUPABASE_URL`      | ⚠️ **CHECK** | Required for JWT verification       |
| `VITE_SUPABASE_ANON_KEY` | ⚠️ **CHECK** | Required for auth                   |
| `PORT`                   | ✅ Auto-set  | Railway sets this automatically     |

**Check in Railway Dashboard:**

- Variables tab → Verify `DATABASE_URL` is set
- If missing → Add it and redeploy

---

## Step 3: Fix Healthcheck Path (If Needed)

**Current Configuration:**

- `railway.json`: `healthcheckPath: "/api/health"`
- Backend route: `/api/health` (via `backend/routes/health.ts`)

**If healthcheck still fails, try:**

**Option A: Use `/ready` endpoint (simpler, no DB check)**

Update `railway.json`:

```json
{
  "deploy": {
    "healthcheckPath": "/ready",
    "healthcheckTimeout": 120
  }
}
```

**Option B: Make `/api/health` simpler (no DB dependency)**

The `/api/health` route may be checking database connectivity. If DB is slow to connect, healthcheck times out.

---

## Step 4: Check Backend Startup Script

**Current Start Command:**

```json
"startCommand": "node dist/index.cjs"
```

**Verify:**

- `dist/index.cjs` exists after build
- Build completed successfully
- No errors in build logs

---

## Step 5: Test Health Endpoint Locally

**Before deploying, test locally:**

```bash
# Start backend locally
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","message":"Zyeuté Live"}
```

**If local test fails:**

- Check backend logs for errors
- Verify database connection
- Check environment variables

---

## Quick Fix: Simplify Healthcheck

**If database connection is slow:**

1. **Update `backend/routes/health.ts`** to return immediately:

```typescript
router.get("/", async (_req, res) => {
  // Simple health check - no DB dependency
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Zyeuté Live",
  });
});
```

2. **Redeploy to Railway**

---

## Common Issues & Solutions

### Issue: "Database connection timeout"

**Solution:**

- Check `DATABASE_URL` is correct
- Verify database is accessible from Railway
- Use Supabase connection pooling (port 6543)

### Issue: "Module not found"

**Solution:**

- Verify `npm run build` completed successfully
- Check `dist/index.cjs` exists
- Ensure all dependencies are in `package.json`

### Issue: "Port already in use"

**Solution:**

- Railway sets `PORT` automatically
- Backend should use `process.env.PORT || 3000`
- Verify backend listens on `0.0.0.0`, not `localhost`

### Issue: "Healthcheck timeout"

**Solution:**

- Increase `healthcheckTimeout` in `railway.json`
- Simplify healthcheck endpoint (remove DB check)
- Check backend startup time in logs

---

## Debugging Steps

1. **Check Railway Logs:**

   ```bash
   railway logs
   ```

2. **Test Health Endpoint:**

   ```bash
   curl https://zyeutev5-production.up.railway.app/api/health
   ```

3. **Verify Build:**
   - Check build logs for errors
   - Verify `dist/index.cjs` exists

4. **Check Environment Variables:**
   ```bash
   railway variables
   ```

---

## Next Steps

1. ✅ Check Railway logs for startup errors
2. ✅ Verify `DATABASE_URL` is set
3. ✅ Test `/api/health` endpoint locally
4. ✅ Simplify healthcheck if DB is slow
5. ✅ Redeploy after fixes

---

**Check Railway logs first to see why the backend isn't starting!** 🔍
