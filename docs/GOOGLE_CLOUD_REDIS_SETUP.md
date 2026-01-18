# Google Cloud Memorystore for Redis Setup Guide

## Overview

This guide will help you set up **Google Cloud Memorystore for Redis** for your Zyeuté application. Memorystore is Google's fully managed Redis service that provides:

- ✅ **Enterprise-grade reliability** with 99.9% SLA
- ✅ **Automatic failover** and high availability
- ✅ **Low latency** within the same region
- ✅ **Seamless integration** with your existing GCP infrastructure
- ✅ **Use your existing GCP credits** ($1,778 remaining from Vertex AI setup)

---

## Prerequisites

- Google Cloud Project (you already have one for Vertex AI)
- `gcloud` CLI installed (optional, but recommended)
- Billing enabled on your GCP project

---

## Step 1: Create Memorystore Redis Instance

### Option A: Using Google Cloud Console (Easiest)

1. **Navigate to Memorystore**
   - Go to https://console.cloud.google.com/memorystore/redis/instances
   - Select your project (the one with Vertex AI)

2. **Create Instance**
   - Click **"CREATE INSTANCE"**
   - Configure as follows:

   ```
   Instance ID:        zyeute-redis
   Display name:       Zyeuté Redis Cache
   Tier:               Basic (for development/staging)
                       OR Standard (for production with high availability)
   Region:             us-central1 (same as your Vertex AI)
   Zone:               us-central1-a (or any zone)
   Redis version:      Redis 7.0 (latest)
   Capacity:           1 GB (adjust based on needs)
   Network:            default (or your custom VPC)
   ```

3. **Configure Authentication**
   - **Auth mode**: AUTH enabled (recommended)
   - Note: You'll get a password after creation

4. **Click "CREATE"**
   - Wait 3-5 minutes for provisioning
   - Instance will show "Ready" when complete

### Option B: Using gcloud CLI (Faster)

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create Redis instance (Basic tier)
gcloud redis instances create zyeute-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=basic \
  --auth-enabled

# For production with high availability (Standard tier)
gcloud redis instances create zyeute-redis-prod \
  --size=5 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=standard \
  --replica-count=1 \
  --auth-enabled
```

---

## Step 2: Get Connection Details

### Using Cloud Console

1. Go to **Memorystore > Redis > Instances**
2. Click on your instance (`zyeute-redis`)
3. Note the following details:

```
Primary Endpoint:    10.x.x.x (internal IP)
Port:                6379
Auth String:         Click "Show Auth String" to reveal password
Connection Name:     projects/YOUR_PROJECT/locations/us-central1/instances/zyeute-redis
```

### Using gcloud CLI

```bash
# Get instance details
gcloud redis instances describe zyeute-redis --region=us-central1

# Get just the host IP
gcloud redis instances describe zyeute-redis \
  --region=us-central1 \
  --format='get(host)'

# Get the auth string (password)
gcloud redis instances get-auth-string zyeute-redis \
  --region=us-central1
```

---

## Step 3: Configure Environment Variables

You have **two options** for configuring Redis connection:

### Option A: Using REDIS_URL (Recommended for Cloud)

```bash
# Format: redis://[username]:[password]@[host]:[port]
# For Memorystore (no username, just password):
REDIS_URL=redis://:YOUR_AUTH_STRING@10.x.x.x:6379

# Example:
REDIS_URL=redis://:AbCdEfGh123456@10.128.0.3:6379
```

### Option B: Using Individual Variables

```bash
REDIS_HOST=10.x.x.x          # Internal IP from Memorystore
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_AUTH_STRING
REDIS_USERNAME=              # Leave empty for Memorystore
REDIS_TLS=false              # Memorystore uses VPC, no TLS needed
```

---

## Step 4: Deploy to Railway

### If Your Backend is on Railway

**Important:** Memorystore instances have **private IPs** that are only accessible within the same GCP VPC. To connect from Railway, you need:

#### Solution 1: Use Cloud Run Instead (Recommended)

Deploy your backend to **Google Cloud Run** (same VPC as Memorystore):

```bash
# Build and deploy to Cloud Run
gcloud run deploy zyeute-backend \
  --source=./backend \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="REDIS_URL=redis://:AUTH_STRING@10.x.x.x:6379" \
  --vpc-connector=YOUR_VPC_CONNECTOR
```

#### Solution 2: Use Memorystore with Serverless VPC Access

1. Create VPC Access Connector:
```bash
gcloud compute networks vpc-access connectors create zyeute-connector \
  --network=default \
  --region=us-central1 \
  --range=10.8.0.0/28
```

2. Update Cloud Run service:
```bash
gcloud run services update zyeute-backend \
  --vpc-connector=zyeute-connector \
  --region=us-central1
```

#### Solution 3: Use Redis Labs or Upstash Instead

If you want to keep Railway backend, use a **public Redis service**:
- **Upstash** (serverless, globally distributed)
- **Redis Labs** (managed Redis with public endpoints)

---

## Step 5: Set Environment Variables in Your Deployment

### For Railway

1. Go to your Railway project
2. Click on your backend service
3. Go to "Variables" tab
4. Add:
   ```
   REDIS_URL=redis://:YOUR_AUTH_STRING@10.x.x.x:6379
   ```
   **OR** individual variables
5. Redeploy

### For Google Cloud Run

```bash
gcloud run services update zyeute-backend \
  --set-env-vars="REDIS_URL=redis://:AUTH_STRING@10.x.x.x:6379" \
  --region=us-central1
```

### For Vercel (Frontend doesn't need Redis)

No action needed - Redis is backend-only.

---

## Step 6: Verify Connection

### Check Health Endpoint

```bash
curl https://your-backend-url.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": {
    "status": "connected",
    "message": "Redis connection healthy",
    "latency": 2
  }
}
```

### Check Backend Logs

Look for these messages:

```
[Redis] Using REDIS_URL for configuration
[Redis] Initializing connection to 10.x.x.x:6379
[Redis] ✅ Connection established
[Redis] ✅ Client ready to receive commands
```

### Test Redis Manually (from Cloud Shell)

```bash
# Install redis-cli
sudo apt-get install redis-tools

# Test connection
redis-cli -h 10.x.x.x -p 6379 -a YOUR_AUTH_STRING ping
# Expected: PONG

# Set a test value
redis-cli -h 10.x.x.x -p 6379 -a YOUR_AUTH_STRING SET test "hello from memorystore"

# Get the value
redis-cli -h 10.x.x.x -p 6379 -a YOUR_AUTH_STRING GET test
# Expected: "hello from memorystore"
```

---

## Cost Estimation

### Memorystore Pricing (as of 2024)

| Tier | Capacity | Monthly Cost | Recommended For |
|------|----------|--------------|-----------------|
| Basic 1GB | 1 GB | ~$35/month | Development, Staging |
| Basic 5GB | 5 GB | ~$175/month | Small Production |
| Standard 5GB | 5 GB + HA | ~$350/month | Production (High Availability) |

**With your $1,778 in GCP credits:**
- Basic 1GB: **50 months free**
- Basic 5GB: **10 months free**
- Standard 5GB: **5 months free**

### Free Tier Alternative: Upstash

If you want to preserve GCP credits:
- **Upstash Free Tier**: 10,000 commands/day
- **Upstash Pro**: $0.20 per 100K commands
- **Public endpoint** (works with Railway)

```bash
# Upstash configuration
REDIS_URL=rediss://default:YOUR_PASSWORD@xxx.upstash.io:6379
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Google Cloud VPC                      │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Cloud Run       │────────>│  Memorystore     │     │
│  │  (Backend)       │  VPC    │  Redis 7.0       │     │
│  │  Port: 8080      │ Access  │  10.x.x.x:6379   │     │
│  └──────────────────┘         └──────────────────┘     │
│         │                                                │
└─────────┼────────────────────────────────────────────────┘
          │
          │ HTTPS
          ▼
┌──────────────────┐
│  Vercel          │
│  (Frontend)      │
│  HTTPS           │
└──────────────────┘
```

---

## Troubleshooting

### Error: "Connection refused" or "ECONNREFUSED"

**Problem:** Backend can't reach Memorystore

**Solutions:**
1. Verify you're using the correct **internal IP** (10.x.x.x)
2. Check if backend is in the same **VPC network** as Memorystore
3. Verify **firewall rules** allow Redis port 6379
4. If on Railway: Switch to Cloud Run or use Upstash

### Error: "NOAUTH Authentication required"

**Problem:** Auth string (password) not provided

**Solution:**
```bash
# Get the auth string
gcloud redis instances get-auth-string zyeute-redis --region=us-central1

# Update REDIS_URL
REDIS_URL=redis://:YOUR_AUTH_STRING@10.x.x.x:6379
```

### Error: "invalid DB Index"

**Problem:** Using `/0` or other DB index in URL

**Solution:**
```bash
# Memorystore only supports DB 0, remove the `/0` from URL
# Wrong:
REDIS_URL=redis://:password@host:6379/0

# Correct:
REDIS_URL=redis://:password@host:6379
```

### Health Check Shows "not_configured"

**Problem:** Environment variables not set

**Solution:**
```bash
# Verify env vars are set
echo $REDIS_URL
# OR
echo $REDIS_HOST

# Check backend logs
gcloud run logs read zyeute-backend --region=us-central1 --limit=50
```

---

## Security Best Practices

1. **Enable AUTH** - Always use password authentication
2. **Use Private IPs** - Never expose Redis to public internet
3. **VPC Peering** - Keep Redis in same VPC as backend
4. **Rotate passwords** - Change auth string every 90 days
5. **Monitor access** - Enable Cloud Logging for audit trails
6. **Network policies** - Restrict access to specific services

```bash
# Rotate auth string (updates password)
gcloud redis instances update zyeute-redis \
  --region=us-central1 \
  --update-auth
```

---

## Monitoring & Alerts

### Enable Cloud Monitoring

1. Go to **Cloud Monitoring** in GCP Console
2. Create dashboard for Redis metrics:
   - CPU utilization
   - Memory usage
   - Connected clients
   - Operations per second

### Set Up Alerts

```bash
# Alert when memory usage > 80%
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Redis High Memory" \
  --condition-display-name="Memory > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s
```

---

## Scaling & Performance

### Increase Capacity

```bash
# Scale from 1GB to 5GB
gcloud redis instances update zyeute-redis \
  --size=5 \
  --region=us-central1
```

### Enable High Availability (Upgrade to Standard)

```bash
# Cannot directly upgrade from Basic to Standard
# Need to create new Standard instance and migrate data
gcloud redis instances create zyeute-redis-ha \
  --size=5 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=standard \
  --replica-count=1
```

---

## Migration Path

If you're currently using local Redis or another provider:

### Export Data from Old Redis

```bash
# Backup current Redis data
redis-cli --rdb /tmp/redis-backup.rdb

# OR export as JSON
redis-cli --scan | while read key; do
  echo "$key = $(redis-cli get $key)"
done > redis-backup.json
```

### Import to Memorystore

```bash
# Use redis-cli to import
cat redis-backup.json | while IFS='=' read key value; do
  redis-cli -h 10.x.x.x -p 6379 -a YOUR_AUTH_STRING SET "$key" "$value"
done
```

---

## Alternative: Upstash for Railway Backend

If you want to keep Railway backend (easier than VPC setup):

### Upstash Setup

1. **Create account** at https://console.upstash.com
2. **Create Redis database**
   - Name: `zyeute-cache`
   - Region: `us-east-1` (closest to Railway)
   - Type: Regional (cheaper) or Global (faster worldwide)
3. **Get connection details**
   - Endpoint: `xxx.upstash.io`
   - Port: `6379`
   - Password: (shown in dashboard)
4. **Set environment variable in Railway**:
   ```bash
   REDIS_URL=rediss://default:YOUR_PASSWORD@xxx.upstash.io:6379
   ```
   **Note:** Use `rediss://` (with double 's') for TLS!

5. **Verify**:
   ```bash
   curl https://your-railway-backend.app/api/health
   # Should show "redis": { "status": "connected" }
   ```

---

## Summary

**For Google Cloud Stack (Recommended):**
- Deploy backend to **Cloud Run**
- Use **Memorystore for Redis**
- Connect via **VPC** (same network)
- Use your **$1,778 GCP credits**

**For Railway Backend:**
- Use **Upstash** (public Redis)
- Connect via `REDIS_URL` with TLS
- Free tier: 10K commands/day

**Configuration:**
```bash
# Google Cloud Memorystore (internal VPC)
REDIS_URL=redis://:AUTH_STRING@10.x.x.x:6379

# Upstash (public endpoint)
REDIS_URL=rediss://default:PASSWORD@xxx.upstash.io:6379
```

**Next Steps:**
1. Create Memorystore instance (3-5 minutes)
2. Get connection details
3. Set `REDIS_URL` in Railway/Cloud Run
4. Deploy and verify via `/api/health`
5. Monitor with Cloud Logging

TIGUIDOU! 🚀
