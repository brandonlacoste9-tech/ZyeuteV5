# 🚂 Colony OS - Railway Deployment Guide

**Status:** Ready for Deployment  
**Version:** 2.0.0  
**Last Updated:** January 9, 2026

---

## 📋 Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway
- Environment variables configured in Railway dashboard

---

## 🚀 Deployment Steps

### 1. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `ZyeuteV5`
5. Select **"infrastructure/colony"** as the root directory

### 2. Configure Build Settings

Railway will auto-detect Python, but you can configure:

**Build Command:**
```bash
pip install --no-cache-dir -r requirements.txt
```

**Start Command:**
```bash
python3 core/neurosphere.py
```

**Health Check:**
- Path: `/health`
- Port: `8000`

### 3. Set Environment Variables

In Railway dashboard, add these variables:

#### Required Variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

#### Optional Variables:
- `NEUROSPHERE_PORT` - Default: `8000`
- `FINANCE_BEE_PORT` - Default: `8001`
- `GUARDIAN_BEE_PORT` - Default: `8002`
- `COLONY_ENV` - `production` or `development`

### 4. Deploy

Railway will:
1. Build the Docker container (or use Nixpacks)
2. Install Python dependencies
3. Start the Neurosphere kernel
4. Health check on `/health` endpoint

---

## 🐝 Service Architecture

### Neurosphere (Main Service)
- **Port:** 8000
- **Endpoint:** `/health`
- **Purpose:** Central coordination kernel

### Finance Bee (Separate Service - Optional)
- **Port:** 8001
- **Endpoint:** `/health`
- **Purpose:** Revenue intelligence

### Guardian Bee (Separate Service - Optional)
- **Port:** 8002
- **Endpoint:** `/health`
- **Purpose:** Security monitoring

**Note:** For Railway, you can deploy Neurosphere as the main service. Finance and Guardian Bees can be deployed as separate services if needed, or run within the same container using the docker-compose setup.

---

## 🔍 Verification

After deployment, verify:

```bash
# Check health endpoint
curl https://your-railway-app.railway.app/health

# Expected response:
{
  "status": "healthy",
  "kernel": "Neurosphere",
  "version": "2.0.0",
  "timestamp": "2026-01-09T..."
}
```

---

## 📝 Railway Configuration File

Create `railway.json` in `infrastructure/colony/`:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install --no-cache-dir -r requirements.txt"
  },
  "deploy": {
    "startCommand": "python3 core/neurosphere.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

## 🔗 Integration with Zyeuté V5

Colony OS connects to Zyeuté V5 via:
- **Synapse Bridge** - Socket.io connection
- **Shared Database** - Same Supabase instance
- **API Endpoints** - REST API for task coordination

---

## 🐛 Troubleshooting

### Health Check Failing
- Verify port 8000 is exposed
- Check environment variables are set
- Review Railway logs for startup errors

### Database Connection Issues
- Verify `DATABASE_URL` or `VITE_SUPABASE_URL` is set
- Check Supabase connection pooling settings
- Ensure service role key has proper permissions

### Missing Dependencies
- Railway uses Nixpacks which auto-detects Python
- If issues occur, use Dockerfile instead
- Check `requirements.txt` is in root of `infrastructure/colony/`

---

## 📚 Next Steps

1. ✅ Deploy Neurosphere to Railway
2. ✅ Configure environment variables
3. ✅ Test health endpoint
4. ✅ Connect Zyeuté V5 to Colony OS
5. ⏭️ Deploy Finance Bee (optional)
6. ⏭️ Deploy Guardian Bee (optional)

---

**Ready to deploy!** 🚀
