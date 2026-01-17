# Zyeuté Claude Skills - Quick Start

## 🚀 Available Commands

### Health & Monitoring

```bash
# Check Redis health + system status
node .claude/skills/redis-health.js

# Check full deployment status (Railway + Vercel + Git)
node .claude/skills/status.js
```

### Deployment

```bash
# Deploy to production
node .claude/skills/deploy.js

# Clear Redis cache
node .claude/skills/cache-clear.js
```

---

## 📋 What Each Skill Does

### `/redis-health`
```
🔍 Checking Redis health...

📊 Health Check Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Status: ✅ HEALTHY
Database: ✅ connected
Redis: ✅ CONNECTED
  ⚡ Latency: 12ms
  💬 Message: Redis connection healthy
AI Services: ✅ healthy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🕐 Timestamp: 2026-01-17T09:00:00.000Z
```

### `/status`
```
📊 Checking deployment status...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  BACKEND (Railway)
   Status: ✅ Online (234ms)
   Health: ✅ Healthy
   Database: ✅ connected
   Redis: ✅ Connected
   Redis Latency: 12ms
   URL: https://zyeutev5-production.up.railway.app

🌐 FRONTEND (Vercel)
   Status: ✅ Online (123ms)
   URL: https://zyeute.vercel.app

📝 GIT STATUS
   Branch: claude/add-redis-integration-J702B
   Changes: ✅ Clean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick commands:
   /redis-health  - Detailed Redis status
   /deploy        - Deploy latest changes
   /logs          - View Railway logs
```

### `/deploy`
```
🚀 Starting deployment to production...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶️  Checking git status...
✅ Checking git status completed

📦 Build verification...
   Backend: TypeScript compilation check
   Frontend: Vite build (handled by Vercel)

🔍 Current branch:
▶️  Show current branch...
claude/add-redis-integration-J702B
✅ Show current branch completed

📤 Pushing to remote...
▶️  Push commits...
✅ Push commits completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Code pushed successfully!

📋 Next steps:
   1. Railway will auto-deploy backend (~2-3 min)
   2. Vercel will auto-deploy frontend (~1-2 min)
   3. Check status: /status

🔗 Links:
   Railway: https://railway.app/project/zyeutev5-production
   Vercel: https://vercel.com/dashboard
   Backend: https://zyeutev5-production.up.railway.app/api/health
```

---

## ⚙️ Setup (Optional Aliases)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Zyeuté Skills
alias rh='cd ~/ZyeuteV5 && node .claude/skills/redis-health.js'
alias status='cd ~/ZyeuteV5 && node .claude/skills/status.js'
alias deploy='cd ~/ZyeuteV5 && node .claude/skills/deploy.js'
alias cc='cd ~/ZyeuteV5 && node .claude/skills/cache-clear.js'
```

Then use them from anywhere:
```bash
rh        # Check Redis health
status    # Check deployment status
deploy    # Deploy to production
cc        # Clear cache
```

---

## 🔧 Troubleshooting

### Skill not working?

1. **Make sure you're in the project directory:**
   ```bash
   cd ~/ZyeuteV5
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be v18+
   ```

3. **Make skills executable:**
   ```bash
   chmod +x .claude/skills/*.js
   ```

4. **Test directly:**
   ```bash
   node .claude/skills/redis-health.js
   ```

### Can't reach backend?

- Check if Railway backend is deployed
- Verify URL: https://zyeutev5-production.up.railway.app/api/health
- Check Railway dashboard for deployment status

---

## 📖 Full Documentation

See `.claude/skills/README.md` for:
- Detailed skill documentation
- Integration with Redis
- Creating custom skills
- Security best practices

---

## 🎯 What We Built

**Redis Integration:**
- ✅ Centralized Redis client (`backend/redis.ts`)
- ✅ REDIS_URL parsing support
- ✅ Health monitoring endpoint (`/api/health`)
- ✅ Graceful degradation
- ✅ Google Cloud Memorystore support
- ✅ Upstash support

**Claude Skills:**
- ✅ `/redis-health` - Real-time Redis monitoring
- ✅ `/status` - Comprehensive deployment status
- ✅ `/deploy` - Automated deployment workflow
- ✅ `/cache-clear` - Cache management utility

**Documentation:**
- ✅ `docs/REDIS_SETUP.md` - General Redis guide
- ✅ `docs/GOOGLE_CLOUD_REDIS_SETUP.md` - GCP Memorystore guide
- ✅ `.claude/skills/README.md` - Skills documentation
- ✅ `.claude/QUICK_START.md` - This file

---

## 🚀 Next Steps

1. **Set up Redis:**
   - Option A: Upstash (5 min, free) - Quick fix
   - Option B: Railway Redis ($5/month)
   - Option C: Google Cloud Memorystore (free with credits)

2. **Deploy changes:**
   ```bash
   node .claude/skills/deploy.js
   ```

3. **Verify setup:**
   ```bash
   node .claude/skills/redis-health.js
   ```

4. **Test your app:**
   - Upload a video
   - Check if freeze is fixed
   - Monitor with `/redis-health`

---

**TIGUIDOU!** 🚀🐝⚜️

Your Zyeuté app now has:
- Production-ready Redis integration
- Automated health monitoring
- Streamlined deployment workflow
- Better observability
