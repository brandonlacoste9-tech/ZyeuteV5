# 🚀 Deploy Zyeuté to Production - Complete Guide

**Status:** Ready to Deploy  
**Last Updated:** January 11, 2026

This guide will help you get Zyeuté live on Railway, Fly.io, or Vercel.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **1. Code Status**
- [ ] All changes committed to git
- [ ] Tests passing: `npm run test:bounty`
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors: `npm run check`

### **2. Database Ready**
- [ ] Production database provisioned (Railway/Neon/Supabase)
- [ ] Database URL available
- [ ] Migrations ready: `npm run db:push` (test locally first)

### **3. Environment Variables**
- [ ] All secrets documented (see below)
- [ ] API keys obtained
- [ ] Service accounts configured

---

## 🔐 REQUIRED ENVIRONMENT VARIABLES

### **Core Application**
```bash
NODE_ENV=production
PORT=8080  # Or 5000, depending on platform
DATABASE_URL=postgresql://user:pass@host:port/dbname
DIRECT_DATABASE_URL=postgresql://user:pass@host:port/dbname  # For migrations
```

### **Supabase (if using)**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### **AI Services**
```bash
DEEPSEEK_API_KEY=your-deepseek-key
FAL_KEY=your-fal-key
GOOGLE_CLOUD_PROJECT=your-gcp-project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### **Authentication**
```bash
# JWT secret for token signing
JWT_SECRET=your-random-secret-key
```

### **Stripe (for payments)**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **Piasse Economy (New!)**
```bash
QUEEN_HMAC_SECRET=your-hmac-secret-for-guardian-bee
COLONY_NECTAR=your-master-encryption-key  # For wallet encryption
```

### **Guardian Bee (Optional)**
```bash
GUARDIAN_WEBHOOK=https://hooks.zyeute.app/guardian
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR_SECRET
HEALTH_ENDPOINT=http://localhost:8080/health
```

### **Optional Services**
```bash
# Colony OS
COLONY_OS_URL=http://your-colony-os:10000
COLONY_API_KEY=your-colony-key

# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn

# Email
RESEND_API_KEY=re_...
```

---

## 🚂 DEPLOYMENT OPTION 1: RAILWAY (Recommended)

Railway is the easiest option and handles database provisioning automatically.

### **Step 1: Create Railway Project**

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `ZyeuteV5`
5. Railway will auto-detect the `railway.json` config

### **Step 2: Add PostgreSQL Database**

1. In Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Provision a PostgreSQL instance
   - Set `DATABASE_URL` and `DIRECT_DATABASE_URL` environment variables

### **Step 3: Configure Environment Variables**

In Railway dashboard → **Variables** tab, add all required environment variables from above.

**Quick Copy-Paste (fill in values):**
```bash
NODE_ENV=production
PORT=8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
DEEPSEEK_API_KEY=your-key
FAL_KEY=your-key
QUEEN_HMAC_SECRET=your-secret
JWT_SECRET=your-secret
```

### **Step 4: Deploy**

Railway will automatically:
1. Run `railway-build.sh` to build the app
2. Run `railway-startup.sh` to set up the database
3. Start the server with `node dist/index.cjs`

### **Step 5: Verify Deployment**

1. Check logs in Railway dashboard
2. Visit your Railway URL (e.g., `https://zyeute-api.railway.app`)
3. Test health endpoint: `https://zyeute-api.railway.app/api/health`
4. Test metrics: `https://zyeute-api.railway.app/api/metrics`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T...",
  "uptime": 123
}
```

---

## ✈️ DEPLOYMENT OPTION 2: FLY.IO

Fly.io offers global edge deployment with low latency.

### **Step 1: Install Fly CLI**

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

### **Step 2: Login**

```bash
fly auth login
```

### **Step 3: Create App**

```bash
fly launch --name zyeute-api --region yul  # Montreal region
```

This will:
- Create `fly.toml` (already exists, will be updated)
- Create a Fly.io app
- Ask about database (say yes, or use external PostgreSQL)

### **Step 4: Set Secrets**

```bash
# Set environment variables as secrets
fly secrets set NODE_ENV=production
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set DEEPSEEK_API_KEY="your-key"
fly secrets set FAL_KEY="your-key"
# ... etc for all required vars
```

### **Step 5: Deploy**

```bash
fly deploy
```

### **Step 6: Verify**

```bash
# Check status
fly status

# View logs
fly logs

# Open in browser
fly open
```

---

## ▲ DEPLOYMENT OPTION 3: VERCEL

Vercel is great for frontend + serverless API routes.

### **Step 1: Install Vercel CLI**

```bash
npm i -g vercel
```

### **Step 2: Login**

```bash
vercel login
```

### **Step 3: Link Project**

```bash
vercel link
```

### **Step 4: Configure Environment Variables**

In Vercel dashboard → **Settings** → **Environment Variables**, add all required variables.

**Note:** Vercel's `vercel.json` currently proxies API calls to Railway. You'll want to either:
- **Option A:** Deploy backend to Railway, frontend to Vercel (current setup)
- **Option B:** Use Vercel Serverless Functions for API routes

### **Step 5: Deploy**

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## 🗄️ DATABASE MIGRATION (CRITICAL)

**Before going live, run migrations on production database:**

### **Option 1: Using Railway Scripts (Automatic)**

Railway runs `railway-startup.sh` automatically, which includes migrations.

### **Option 2: Manual Migration**

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npm run db:push

# Verify schema
npm run verify:indexes
```

### **Option 3: Using Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npm run db:push
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### **1. Health Check**

```bash
curl https://your-app.railway.app/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123
}
```

### **2. Metrics Endpoint**

```bash
curl https://your-app.railway.app/api/metrics
```

**Expected:** Prometheus-formatted metrics

### **3. API Endpoints**

Test critical endpoints:
```bash
# Wallet
curl https://your-app.railway.app/api/economy/wallet/balance

# Jackpot
curl https://your-app.railway.app/api/economy/jackpot/status

# Bee Trading
curl https://your-app.railway.app/api/economy/bees/listings
```

### **4. Frontend (if deployed separately)**

- [ ] Homepage loads
- [ ] Authentication works
- [ ] API calls succeed
- [ ] No console errors

---

## 🐛 TROUBLESHOOTING

### **Build Fails**

**Error:** `Cannot find module '@rollup/rollup-linux-x64-gnu'`

**Solution:**
- Railway build script handles this automatically
- If manual build: `npm install @rollup/rollup-linux-x64-gnu --force`

---

### **Database Connection Fails**

**Error:** `Connection refused` or `timeout`

**Solutions:**
1. Verify `DATABASE_URL` is set correctly
2. Check database is accessible (not blocked by firewall)
3. Ensure database is provisioned and running
4. For Railway: Database service must be in same project

---

### **Port Conflicts**

**Error:** `Port already in use`

**Solution:**
- Railway/Fly.io automatically set `PORT` env var
- Ensure your code uses `process.env.PORT || 5000`
- Don't hardcode port numbers

---

### **Missing Environment Variables**

**Error:** `process.env.XXX is undefined`

**Solution:**
1. Check all required vars are set in platform dashboard
2. Verify variable names match exactly (case-sensitive)
3. Restart deployment after adding variables

---

## 🔄 UPDATING DEPLOYMENT

### **Railway**
```bash
# Just push to GitHub - Railway auto-deploys
git push origin main
```

### **Fly.io**
```bash
fly deploy
```

### **Vercel**
```bash
vercel --prod
```

---

## 📊 MONITORING

### **Railway**
- View logs in Railway dashboard
- Metrics available in dashboard
- Set up alerts in project settings

### **Fly.io**
```bash
# View logs
fly logs

# Monitor metrics
fly metrics

# SSH into instance
fly ssh console
```

### **Vercel**
- View logs in Vercel dashboard
- Analytics in dashboard
- Error tracking in Vercel dashboard

---

## 🎯 NEXT STEPS

After deployment:

1. **Set up custom domain** (optional)
   - Railway: Project → Settings → Domains
   - Fly.io: `fly certs add yourdomain.com`
   - Vercel: Project → Settings → Domains

2. **Enable HTTPS** (automatic on all platforms)

3. **Set up monitoring**
   - Add Sentry for error tracking
   - Configure Grafana dashboard (if using Prometheus)
   - Set up Guardian Bee (optional)

4. **Test all features**
   - User registration/login
   - Content creation
   - Payments (test mode first!)
   - AI features

5. **Enable Guardian Bee** (optional)
   - Deploy Guardian Bee script
   - Configure webhooks
   - Test self-healing

---

## 🚨 ROLLBACK PLAN

If deployment fails:

### **Railway**
- Go to Deployments tab
- Click "..." on previous deployment
- Select "Redeploy"

### **Fly.io**
```bash
# List releases
fly releases

# Rollback to previous
fly releases rollback <release-number>
```

### **Vercel**
- Go to Deployments tab
- Click "..." on previous deployment
- Select "Promote to Production"

---

## 🎉 SUCCESS!

Your app is live! Share your URL:
- **Railway:** `https://zyeute-api.railway.app`
- **Fly.io:** `https://zyeute-api.fly.dev`
- **Vercel:** `https://zyeute.vercel.app`

**The Meadow is now accessible to the world!** 🐝🔥