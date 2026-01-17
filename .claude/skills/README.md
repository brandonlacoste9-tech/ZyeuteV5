# Zyeuté Claude Skills

Custom Claude Code skills for managing your Zyeuté application.

## Available Skills

### 🏥 Health & Monitoring

#### `/redis-health` (alias: `/rh`)
Check Redis connection status and health metrics
```bash
/redis-health
```

**Output:**
- Overall system status
- Database connectivity
- Redis connection status & latency
- AI services status
- Troubleshooting tips if issues detected

---

#### `/status`
Comprehensive deployment status check
```bash
/status
```

**Checks:**
- Backend health (Railway)
- Frontend status (Vercel)
- Git repository status
- Recent deployments

---

### 🚀 Deployment

#### `/deploy`
Deploy latest changes to production
```bash
/deploy
```

**Process:**
1. Checks git status
2. Runs tests (if configured)
3. Pushes to remote
4. Triggers auto-deployment on Railway & Vercel

**Auto-deploys to:**
- Railway (backend): ~2-3 minutes
- Vercel (frontend): ~1-2 minutes

---

### 🗑️ Cache Management

#### `/cache-clear` (alias: `/cc`)
Clear Redis moderation cache
```bash
/cache-clear
```

**What it clears:**
- AI moderation results cache
- Cached content hashes

**Note:** Requires admin endpoint implementation for remote clearing.

---

## Setup

### 1. Make skills executable

```bash
chmod +x .claude/skills/*.js
```

### 2. Configure environment

Update URLs in `status.js`:
```javascript
const frontendUrl = 'https://your-app.vercel.app';
```

### 3. (Optional) Create aliases

Add to your shell profile (`.bashrc`, `.zshrc`):
```bash
alias rh='node .claude/skills/redis-health.js'
alias deploy='node .claude/skills/deploy.js'
alias status='node .claude/skills/status.js'
```

---

## Integration with Redis

These skills integrate with your Redis setup:

### Backend Health Check
```
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": {
    "status": "connected",
    "message": "Redis connection healthy",
    "latency": 12
  },
  "ai": { ... }
}
```

### Redis Configuration

Your app supports both Upstash and Google Cloud Memorystore:

**Upstash (Current):**
```bash
REDIS_URL=rediss://default:PASSWORD@xxx.upstash.io:6379
```

**Google Cloud Memorystore (Future):**
```bash
REDIS_URL=redis://:AUTH_STRING@10.x.x.x:6379
```

---

## Extending Skills

### Create a new skill

1. **Create file:** `.claude/skills/my-skill.js`

```javascript
#!/usr/bin/env node

async function mySkill() {
  console.log('🎯 Running my custom skill...');

  // Your logic here

  console.log('✅ Done!');
}

mySkill().catch(console.error);
```

2. **Make executable:**
```bash
chmod +x .claude/skills/my-skill.js
```

3. **Use it:**
```bash
node .claude/skills/my-skill.js
```

---

## Recommended Skill Ideas

**For Zyeuté:**

- `/video-test` - Upload and test video processing
- `/mux-status` - Check Mux integration status
- `/db-migrate` - Run database migrations
- `/env-check` - Verify all environment variables
- `/queue-stats` - Show BullMQ queue statistics
- `/ai-test` - Test Vertex AI/Gemini integration

---

## Troubleshooting

### Skill not working?

1. **Check Node.js:**
   ```bash
   node --version  # Should be v18+
   ```

2. **Check permissions:**
   ```bash
   chmod +x .claude/skills/*.js
   ```

3. **Check environment:**
   ```bash
   echo $BACKEND_URL
   # Should be: https://zyeutev5-production.up.railway.app
   ```

4. **Test directly:**
   ```bash
   node .claude/skills/redis-health.js
   ```

---

## Security Notes

- ⚠️ Never commit API keys or secrets to skill files
- ⚠️ Use environment variables for sensitive data
- ⚠️ Add authentication for admin endpoints
- ✅ Use Railway environment variables for production secrets

---

## Links

- **Redis Setup Guide:** `/docs/REDIS_SETUP.md`
- **Google Cloud Guide:** `/docs/GOOGLE_CLOUD_REDIS_SETUP.md`
- **Railway Dashboard:** https://railway.app
- **Upstash Console:** https://console.upstash.com

---

**TIGUIDOU!** 🚀
