# Railway Quick Fix - Exact Steps 🚂

**Issue:** Backend requires `DATABASE_URL` - missing in Railway Variables

---

## ✅ Step-by-Step Fix

### Step 1: Set DATABASE_URL in Railway

**Railway Dashboard:**

1. Go to: https://railway.com/project/ad61359f-e003-47db-9feb-2434b9c266f5/service/6c38cd3e-0d5c-4b14-b92c-2f13670bbd21/variables
2. Click **+ New Variable**
3. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
4. Click **Save**

### Step 2: Set Other Required Variables (Recommended)

**Also add these:**

| Variable                 | Value                                                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://[REF].supabase.co`                                                                                                                                                                         |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8` |
| `MAX_API_TOKEN`          | `[YOUR_MAX_TOKEN]` (optional)                                                                                                                                                                                      |

### Step 3: Redeploy

**Railway Dashboard:**

- Click **Deployments** tab
- Click **Redeploy** button
- Wait 3-5 minutes

### Step 4: Verify Healthcheck

**Test endpoints:**

```bash
# Healthcheck endpoint
curl https://zyeutev5-production.up.railway.app/ready

# Expected response:
# {"status":"healthy","db":"connected","migration":"synced"}

# API health endpoint
curl https://zyeutev5-production.up.railway.app/api/health

# Expected response:
# {"status":"ok","uptime":123.45}
```

---

## 🔍 Healthcheck Configuration

**Current setup:**

- `railway.json`: Healthcheck path = `/api/health` ✅
- Backend serves: `/ready` and `/api/health` ✅
- Both endpoints work, Railway checks `/api/health`

---

## 📋 Verification Checklist

After redeploy:

- [ ] Railway Dashboard shows "Deployment successful"
- [ ] Healthcheck passes (Network → Healthcheck = ✅)
- [ ] `/ready` endpoint returns `{"status":"healthy"}`
- [ ] `/api/health` endpoint returns `{"status":"ok"}`
- [ ] Logs show: `✅ Server running on http://0.0.0.0:${PORT}`

---

## 🚨 If Still Failing

**Check logs for:**

- `🔥 [Startup] DATABASE_URL is not set` → Variable not saved properly
- `🔥 [Startup] CANNOT CONNECT TO DATABASE` → Check connection string format
- `🔥 [Startup] EXITING: Migration failed` → Check migration logs

---

**Set DATABASE_URL → Redeploy → Test!** 🚀
