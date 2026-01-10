# 🚀 Zyeuté Deployment Instructions for Assistant

**Status:** ✅ **BUILD SUCCESSFUL - READY TO DEPLOY**  
**Build Output:** `dist/index.cjs` (640 KB)  
**Railway Token:** `21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c`

---

## ⚡ FASTEST METHOD: GitHub Integration

### Step 1: Verify Code is Ready
```bash
# Check build status (already done - ✅ successful)
# File exists: dist/index.cjs (640 KB)
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Ready for Railway production deployment"
git push origin main
```

### Step 3: Deploy via Railway Dashboard

1. **Go to Railway:**
   - Visit: https://railway.app
   - Login with Railway account

2. **Create New Project:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose repository: **ZyeuteV5** (or your repo name)
   - Railway will auto-detect `railway.json` ✅

3. **Add PostgreSQL Database:**
   - In Railway dashboard → Click **"+ New"**
   - Select **"Database"** → **"Add PostgreSQL"**
   - Railway automatically sets:
     - `DATABASE_URL`
     - `DIRECT_DATABASE_URL`

4. **Set Environment Variables:**
   - Railway dashboard → **Variables** tab
   - Click **"+ New Variable"** for each:

   **Required Variables:**
   ```
   NODE_ENV = production
   PORT = 8080
   DEEPSEEK_API_KEY = <get from user>
   FAL_KEY = <get from user>
   JWT_SECRET = <generate random secret>
   QUEEN_HMAC_SECRET = <generate random secret>
   COLONY_NECTAR = <generate random secret>
   ```

   **Generate Secrets (PowerShell):**
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

5. **Railway Auto-Deploys:**
   - Railway detects `railway.json`
   - Runs `railway-build.sh` automatically
   - Runs `railway-startup.sh` (database migrations)
   - Starts server: `node dist/index.cjs`

### Step 4: Get Deployment URL

- Railway dashboard → Your service → **Settings** → **Domains**
- Or Railway will show URL in deployment logs
- Example: `https://zyeute-api.railway.app`

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://your-app.railway.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":123}

# Test metrics endpoint
curl https://your-app.railway.app/api/metrics

# Expected: Prometheus-formatted metrics
```

---

## 🔧 Alternative: Railway CLI Method

**Note:** Requires interactive authentication (user must run manually)

### Step 1: User Authentication
User must run this in their terminal:
```powershell
railway login
```
This opens browser for authentication.

**Railway Token (for reference):** `21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c`

### Step 2: Run Deployment Script
```powershell
.\deploy-railway.ps1
```

### Step 3: Set Variables & Deploy
```powershell
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set DEEPSEEK_API_KEY="<user-provided>"
railway variables set FAL_KEY="<user-provided>"
railway variables set JWT_SECRET="<generated-secret>"
railway variables set QUEEN_HMAC_SECRET="<generated-secret>"
railway variables set COLONY_NECTAR="<generated-secret>"

railway up
```

---

## 📋 Environment Variables Checklist

**Auto-Set by Railway:**
- [x] `DATABASE_URL` (when PostgreSQL added)
- [x] `DIRECT_DATABASE_URL` (when PostgreSQL added)

**Required (Set Manually):**
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `DEEPSEEK_API_KEY` (get from user)
- [ ] `FAL_KEY` (get from user)
- [ ] `JWT_SECRET` (generate)
- [ ] `QUEEN_HMAC_SECRET` (generate)
- [ ] `COLONY_NECTAR` (generate)

**Optional:**
- [ ] `VITE_SUPABASE_URL` (if using Supabase)
- [ ] `STRIPE_SECRET_KEY` (if using payments)
- [ ] `GOOGLE_CLOUD_PROJECT` (if using Vertex AI)

---

## ✅ Pre-Deployment Verification

**Already Completed:**
- [x] Build successful: `npm run build` ✅
- [x] Output file: `dist/index.cjs` (640 KB) ✅
- [x] TypeScript compiled ✅
- [x] Schema exports fixed ✅
- [x] Railway config ready: `railway.json` ✅
- [x] Startup script ready: `railway-startup.sh` ✅

---

## 🚨 Troubleshooting

**If deployment fails:**

1. **Check Railway Logs:**
   - Railway dashboard → Deployments → Logs
   - Look for error messages

2. **Common Issues:**
   - **Build fails:** Check if all dependencies installed
   - **Database connection fails:** Verify `DATABASE_URL` is set
   - **Port conflicts:** Ensure `PORT=8080` is set
   - **Missing variables:** Check all required vars are set

3. **Verify Locally:**
   ```bash
   npm run build  # Should succeed
   npm run start  # Test locally first
   ```

---

## 📞 After Deployment

1. **Get Railway URL:**
   - Railway dashboard → Settings → Domains
   - Or: `railway domain` (if using CLI)

2. **Update Vercel (if using frontend):**
   - Update `vercel.json` with Railway URL:
   ```json
   {
     "rewrites": [{
       "source": "/api/(.*)",
       "destination": "https://YOUR-RAILWAY-URL.railway.app/api/$1"
     }]
   }
   ```
   - Redeploy Vercel

3. **Test Endpoints:**
   ```bash
   curl https://your-app.railway.app/api/health
   curl https://your-app.railway.app/api/metrics
   curl https://your-app.railway.app/api/economy/jackpot/status
   ```

---

## 🎯 Summary

**Recommended Method:** GitHub Integration (fastest, easiest)

**Steps:**
1. ✅ Code is ready (build successful)
2. Push to GitHub
3. Connect Railway to repo
4. Add PostgreSQL
5. Set environment variables
6. Railway auto-deploys!

**Estimated Time:** 10-15 minutes

---

**🚀 Ready to deploy! Use GitHub integration for the fastest setup.**
