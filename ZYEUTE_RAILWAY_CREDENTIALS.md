# 🚂 Zyeuté Railway Deployment Credentials

**Status:** Ready to Deploy  
**Date:** January 11, 2026

---

## 🔐 Railway Authentication

**Railway Token:** `5d6980bd-0edb-4008-8211-58cfb5d55216`  
**Project ID:** `ad61359f-e003-47db-9feb-2434b9c266f5`  
**Project Name:** Colony OS  
**Environment:** production

---

## 📋 Quick Deployment Reference

### **When Ready to Deploy:**

**Method 1: GitHub Integration (Easiest)**
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Open project: `ad61359f-e003-47db-9feb-2434b9c266f5`
4. Connect GitHub repo → Auto-deploys

**Method 2: Railway CLI**
1. Authenticate: `railway login` (interactive)
2. Link project: `railway link`
3. Deploy: `railway up`

---

## 🔑 Required Environment Variables

**Auto-set by Railway:**
- `DATABASE_URL` (when PostgreSQL added)
- `DIRECT_DATABASE_URL` (when PostgreSQL added)

**Required (Set manually):**
- `NODE_ENV=production`
- `PORT=8080`
- `DEEPSEEK_API_KEY=<user-provided>`
- `FAL_KEY=<user-provided>`
- `JWT_SECRET=<generate-random>`
- `QUEEN_HMAC_SECRET=<generate-random>`
- `COLONY_NECTAR=<generate-random>`

---

## ✅ Build Status

- ✅ **Build:** Successful
- ✅ **Output:** `dist/index.cjs` (640 KB)
- ✅ **Ready:** Yes

---

## 📝 Deployment Files

- ✅ `railway.json` - Railway configuration
- ✅ `railway-startup.sh` - Startup script with migrations
- ✅ `railway-build.sh` - Build script
- ✅ `deploy-railway.ps1` - Deployment script
- ✅ `DEPLOY_TO_LIVE.md` - Complete deployment guide
- ✅ `DEPLOY_INSTRUCTIONS_FOR_ASSISTANT.md` - Step-by-step guide

---

**🚀 When ready, deploy using GitHub integration for fastest setup!**
