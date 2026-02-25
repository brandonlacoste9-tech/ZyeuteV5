# 🔧 Railway Database Connection Fix

## Problem

Your Railway deployment shows this error:

```
🔥 [Startup] CANNOT CONNECT TO DATABASE:
error: password authentication failed for user "postgres"
```

## Quick Fix

### Step 1: Get Correct DATABASE_URL from Railway

1. Go to https://railway.app/dashboard
2. Click on your **PostgreSQL** service (not the backend)
3. Go to **"Connect"** tab
4. Copy the **"Database URL"** - it looks like:
   ```
   postgresql://postgres:PASSWORD@roundhouse.proxy.rlwy.net:12345/railway
   ```

### Step 2: Set the Variable

**Option A: Railway Dashboard (Easiest)**

1. Click your **zyeute-backend** service
2. Go to **"Variables"** tab
3. Add/Edit `DATABASE_URL`
4. Paste the URL from Step 1
5. Click **Deploy**

**Option B: Railway CLI**

```bash
railway login
railway service zyeute-backend
railway variables set DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"
railway up
```

### Step 3: Verify

Check the health endpoint after redeploy:

```
https://zyeute-backend.up.railway.app/api/health
```

Should return: `{"status":"healthy"}`

---

## Common Issues

| Error                            | Fix                                                         |
| -------------------------------- | ----------------------------------------------------------- |
| `password authentication failed` | Wrong password in DATABASE_URL - get fresh URL from Railway |
| `connection refused`             | Wrong host/port - verify from Railway Connect tab           |
| `database does not exist`        | Use `/railway` at end of URL                                |
| `SSL required`                   | Add `?sslmode=require` to end of URL                        |

---

## Emergency: Reset Database

If nothing works, create a fresh database:

1. Railway Dashboard → PostgreSQL service → **Settings**
2. Click **"Reset Database"** (⚠️ deletes all data!)
3. Get new DATABASE_URL from Connect tab
4. Update in backend service variables
5. Re-inject videos: `npx tsx scripts/inject-pexels-videos.ts`
