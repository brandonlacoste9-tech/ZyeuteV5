# 🚀 Deploy Zyeuté to Railway - Quick Start

## ⚡ Fastest Method: GitHub Integration (Recommended)

**This is the easiest way - no CLI authentication needed!**

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Connect Railway to GitHub

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your **Zyeuté repository**
5. Railway will auto-detect `railway.json` and start deploying!

### Step 3: Add PostgreSQL Database

In Railway dashboard:
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` and `DIRECT_DATABASE_URL`

### Step 4: Set Environment Variables

In Railway dashboard → **Variables** tab, add:

**Required:**
```bash
NODE_ENV=production
PORT=8080
DEEPSEEK_API_KEY=your-key
FAL_KEY=your-key
JWT_SECRET=<generate-random-secret>
QUEEN_HMAC_SECRET=<generate-random-secret>
COLONY_NECTAR=<generate-random-secret>
```

**Generate secrets (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 5: Verify Deployment

1. Check Railway dashboard for deployment status
2. Get your URL: Railway will show it in the dashboard
3. Test: `https://your-app.railway.app/api/health`

---

## 🔧 Alternative: Railway CLI Method

If you prefer using CLI:

### Step 1: Authenticate (Interactive)

**You must run this manually in your terminal:**
```powershell
railway login
```

This opens your browser for authentication.

**Your Railway Token:** `21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c`

### Step 2: Run Deployment Script

After authentication:
```powershell
.\deploy-railway.ps1
```

### Step 3: Set API Keys & Deploy

```powershell
railway variables set DEEPSEEK_API_KEY="your-key"
railway variables set FAL_KEY="your-key"
railway variables set JWT_SECRET="your-secret"
railway variables set QUEEN_HMAC_SECRET="your-secret"
railway variables set COLONY_NECTAR="your-secret"

railway up
```

---

## ✅ What Happens During Deployment

Railway automatically:
1. ✅ Runs `railway-build.sh` to build your app
2. ✅ Runs `railway-startup.sh` to set up database
3. ✅ Starts server with `node dist/index.cjs`
4. ✅ Health checks on `/api/health`

---

## 🎯 Next Steps After Deployment

1. **Get your URL:**
   - Railway dashboard → Your service → Settings → Domains
   - Or run: `railway domain`

2. **Update Vercel (if using frontend):**
   - Update `vercel.json` with your Railway URL
   - Redeploy Vercel

3. **Test endpoints:**
   ```bash
   curl https://your-app.railway.app/api/health
   curl https://your-app.railway.app/api/metrics
   ```

4. **Monitor:**
   - View logs: Railway dashboard → Deployments → Logs
   - Check metrics: `/api/metrics` endpoint

---

## 🚨 Troubleshooting

**Deployment fails:**
- Check Railway logs in dashboard
- Verify `npm run build` works locally
- Check all environment variables are set

**Database connection fails:**
- Ensure PostgreSQL service is added
- Verify `DATABASE_URL` is set automatically
- Check database is running (Railway dashboard)

**API not responding:**
- Check Railway service is running
- Verify PORT is set to 8080
- Check health endpoint: `/api/health`

---

## 📞 Need Help?

1. Check Railway logs: Dashboard → Deployments → Logs
2. Verify build locally: `npm run build`
3. Check environment variables are all set
4. Review `DEPLOY_TO_LIVE.md` for detailed guide

---

**🚀 Recommended: Use GitHub integration method - it's the fastest!**
