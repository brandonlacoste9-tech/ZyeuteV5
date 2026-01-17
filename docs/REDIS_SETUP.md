# Redis Integration Guide

## Overview

Zyeuté uses Redis for:
1. **BullMQ Job Queues** - Video enhancement, analytics, blockchain sync, memory mining, privacy auditing
2. **Moderation Cache** - SHA256-based caching of AI moderation results (24h TTL)
3. **Session Storage** - (Future feature)

Redis is **optional** - the application gracefully degrades when Redis is unavailable:
- Queued jobs run synchronously instead
- Moderation cache is skipped (direct API calls)
- Performance may be slower but functionality remains intact

## Quick Start

**Note:** You can configure Redis using either:
- **REDIS_URL** (single connection string) - Recommended for cloud providers
- **Individual env vars** (REDIS_HOST, REDIS_PORT, etc.) - More flexible

All examples below show both formats where applicable.

### Option 1: Railway (Recommended for Production)

1. **Add Redis Plugin** in your Railway project dashboard
2. **Copy the connection details** from Railway Redis plugin
3. **Set environment variables** in Railway:

**Using REDIS_URL (Recommended):**
```bash
REDIS_URL=redis://default:YOUR_PASSWORD@redis.railway.internal:6379
```

**Or using individual variables:**
```bash
REDIS_HOST=redis.railway.internal  # Or the hostname from Railway
REDIS_PORT=6379
REDIS_PASSWORD=<your-railway-redis-password>
REDIS_USERNAME=default  # Railway uses 'default' user
REDIS_TLS=false  # Railway internal network doesn't need TLS
```

### Option 2: Upstash (Serverless Redis)

1. **Create free Upstash Redis database** at https://upstash.com
2. **Get connection details** from Upstash dashboard
3. **Set environment variables**:

**Using REDIS_URL (Recommended):**
```bash
# Note: Use 'rediss://' (double 's') for TLS!
REDIS_URL=rediss://default:YOUR_PASSWORD@xxx.upstash.io:6379
```

**Or using individual variables:**
```bash
REDIS_HOST=<your-upstash-host>.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=<your-upstash-password>
REDIS_USERNAME=default
REDIS_TLS=true  # Upstash REQUIRES TLS
```

### Option 3: Google Cloud Memorystore (For GCP Users)

**Perfect if you're already using Google Cloud for Vertex AI!**

1. **Create Memorystore Redis instance** (see [detailed guide](GOOGLE_CLOUD_REDIS_SETUP.md))
2. **Get internal IP** from GCP Console
3. **Set environment variables**:

**Using REDIS_URL (Recommended):**
```bash
# Format: redis://[username]:[password]@host:port
# Memorystore has no username, just auth string
REDIS_URL=redis://:YOUR_AUTH_STRING@10.x.x.x:6379
```

**Or using individual variables:**
```bash
REDIS_HOST=10.x.x.x  # Internal IP from Memorystore
REDIS_PORT=6379
REDIS_PASSWORD=<auth-string-from-memorystore>
REDIS_USERNAME=  # Leave empty
REDIS_TLS=false  # VPC internal network
```

**Note:** Memorystore uses private IPs. Your backend must be in the same GCP VPC (Cloud Run recommended).

**Full setup guide:** [Google Cloud Redis Setup](GOOGLE_CLOUD_REDIS_SETUP.md)

### Option 4: Local Development (Docker)

1. **Start Redis container**:

```bash
docker-compose up -d redis
```

2. **Set environment variables** in `.env`:

**Using REDIS_URL:**
```bash
REDIS_URL=redis://localhost:6379
```

**Or using individual variables:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_TLS=false
```

### Option 5: Skip Redis (Development/Testing)

Simply **don't set `REDIS_HOST`** - the app will run in degraded mode with warnings:

```
[Redis] Not configured (REDIS_HOST not set) - Running in degraded mode
⚠️ REDIS_HOST not defined. Video queue disabled.
```

## Architecture

### Centralized Redis Client (`backend/redis.ts`)

All Redis connections go through a singleton client with:
- **Automatic reconnection** with exponential backoff
- **Health monitoring** exposed via `/api/health`
- **Graceful degradation** when unavailable
- **Connection pooling** for BullMQ queues

### Services Using Redis

| Service | File | Purpose |
|---------|------|---------|
| **Moderation Cache** | `backend/ai/moderation-cache.ts` | Cache AI moderation results (SHA256 key) |
| **Video Queue** | `backend/queue.ts` | BullMQ queue for video enhancement jobs |
| **Analytics Queue** | `backend/queue.ts` | BullMQ queue for analytics processing |
| **Blockchain Queue** | `backend/queue.ts` | BullMQ queue for KryptoTrac sync |
| **Memory Queue** | `backend/queue.ts` | BullMQ queue for memory mining |
| **Privacy Queue** | `backend/queue.ts` | BullMQ queue for Loi 25 auditing |

## Health Monitoring

### Check Redis Status

Visit `/api/health` endpoint to see Redis connection status:

```json
{
  "status": "healthy",
  "database": "connected",
  "ai": { ... },
  "redis": {
    "status": "connected",
    "message": "Redis connection healthy",
    "latency": 12
  }
}
```

**Possible Redis Statuses:**

- `connected` - Redis is working properly
- `disconnected` - Redis configured but connection failed
- `not_configured` - Redis not set up (graceful degradation)

### Backend Logs

Watch for Redis connection events:

```bash
# Successful connection
[Redis] Initializing connection to localhost:6379
[Redis] ✅ Connection established
[Redis] ✅ Client ready to receive commands

# Connection errors (will auto-retry)
[Redis] ❌ Connection error: ECONNREFUSED
[Redis] Retry attempt 1, waiting 50ms

# Graceful degradation
[Redis] Not configured (REDIS_HOST not set) - Running in cache-free mode
```

## Troubleshooting

### Error: "All promises were rejected"

**Problem:** Redis connection is failing (wrong host/port/password)

**Solution:**
1. Check Railway/Upstash dashboard for correct credentials
2. Verify `REDIS_HOST` is reachable from your backend
3. Check if TLS is required (`REDIS_TLS=true` for Upstash)

### Error: "MetadataLookupWarning"

**Problem:** DNS resolution failing for Redis hostname

**Solution:**
1. For Railway: Use internal hostname (`redis.railway.internal`)
2. For Upstash: Use full hostname (`xxx.upstash.io`)
3. Check network connectivity

### Error: "NOAUTH Authentication required"

**Problem:** Redis requires password but `REDIS_PASSWORD` not set

**Solution:**
1. Get password from Railway/Upstash dashboard
2. Set `REDIS_PASSWORD` environment variable

### Error: "WRONGPASS invalid username-password pair"

**Problem:** Incorrect Redis credentials

**Solution:**
1. Verify `REDIS_USERNAME` and `REDIS_PASSWORD` are correct
2. For Railway: username is usually `default`
3. For Upstash: check dashboard for correct credentials

### Queue Jobs Not Processing

**Problem:** Jobs are being added but not executing

**Solution:**
1. Check if worker is running (`backend/worker.ts`)
2. Verify Redis connection in worker logs
3. Check queue health: `getVideoQueue().getJobCounts()`

## Environment Variables Reference

```bash
# Required (if using Redis)
REDIS_HOST=localhost              # Redis server hostname
REDIS_PORT=6379                   # Redis server port (default: 6379)

# Optional (required for managed Redis services)
REDIS_PASSWORD=                   # Redis password (leave empty for local)
REDIS_USERNAME=                   # Redis username (usually 'default')
REDIS_TLS=false                   # Enable TLS (true for Upstash, false for Railway internal)
```

## Performance Optimization

### Moderation Cache Hit Rate

Check cache effectiveness:

```bash
# Watch logs for cache hits
grep "Cache hit" backend.log | wc -l

# Expected: 30-50% hit rate for repeat content
```

### Queue Processing Times

Monitor job latency:

```bash
# Check queue metrics
curl http://localhost:5000/api/admin/queue/stats
```

## Migration from Individual Redis Clients

If you have old code using individual Redis clients:

**Before:**
```typescript
import Redis from 'ioredis';
const redis = new Redis({ host: process.env.REDIS_HOST });
```

**After:**
```typescript
import { getRedisClient } from './redis.js';
const redis = getRedisClient();  // Centralized singleton
```

Benefits:
- Single connection pool (better performance)
- Centralized health monitoring
- Consistent error handling
- Graceful degradation

## Railway Deployment Checklist

- [ ] Add Redis plugin to Railway project
- [ ] Set `REDIS_HOST` to internal hostname
- [ ] Set `REDIS_PASSWORD` from plugin credentials
- [ ] Set `REDIS_USERNAME=default`
- [ ] Set `REDIS_TLS=false` (internal network)
- [ ] Deploy and check `/api/health` endpoint
- [ ] Verify "redis: connected" in health response
- [ ] Check logs for "✅ Connection established"

## Cost Optimization

**Railway Redis Plugin:**
- Free tier: 100MB storage
- Cost: $5/month for 1GB (recommended)
- Auto-scaling available

**Upstash:**
- Free tier: 10,000 commands/day
- Cost: $0.20 per 100K commands
- Serverless pricing (pay per use)

**Local Docker:**
- Free (development only)
- Memory usage: ~50MB
- No persistence by default

## Security Best Practices

1. **Never commit Redis credentials** to version control
2. **Use TLS** for external Redis connections (Upstash)
3. **Use internal networks** when possible (Railway)
4. **Rotate passwords** regularly
5. **Limit Redis access** to backend services only
6. **Monitor connection logs** for suspicious activity

## Next Steps

- Set up Redis monitoring with `ioredis-insights`
- Configure Redis persistence (RDB/AOF)
- Implement cache warming strategies
- Add Redis Sentinel for high availability
- Set up Redis Cluster for horizontal scaling

## Support

If you encounter issues:
1. Check `/api/health` endpoint
2. Review backend logs for Redis errors
3. Verify environment variables in Railway/Vercel
4. Test Redis connection: `redis-cli -h <host> -p <port> ping`
