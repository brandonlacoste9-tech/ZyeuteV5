# Migration to Fly.io - Zyeuté V3

## 🇫🇷 Souveraineté Québécoise First

This deployment prioritizes Québec sovereignty by hosting in **Montréal (YUL)** region.

## Prerequisites

- Fly.io CLI installed: `curl -L https://fly.io/install.sh | sh`
- Fly.io account: `fly auth login`
- Docker installed locally (for testing)

## Deployment Steps

### 1. Initial Setup

```bash
# Navigate to server directory
cd server

# Launch app in Montréal region
fly launch --region yul --name zyeute-api

# Answer prompts:
# - Create Postgres? Yes (or use existing)
# - Create Redis? Yes (or use existing)
```

### 2. Set Environment Variables

```bash
# Copy example file and edit
cp .env.fly.example .env.fly

# Set secrets on Fly.io (never commit these!)
fly secrets set \
  OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE \
  ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE \
  DATABASE_URL=postgres://... \
  REDIS_URL=redis://...
```

### 3. Deploy

```bash
# Deploy from server directory
fly deploy

# Check status
fly status

# View logs
fly logs
```

### 4. Health Check

```bash
# Test health endpoint
curl https://zyeute-api.fly.dev/health

# Expected response:
# {"status":"ok","region":"yul","timestamp":"..."}
```

## Database Setup

```bash
# Connect to Fly Postgres
fly postgres connect -a zyeute-db

# Run migrations (delegate to team)
# npm run migrate
```

## Scaling Configuration

```bash
# Scale to 2 machines for redundancy
fly scale count 2 --region yul

# Configure autoscaling
fly autoscale set min=1 max=5
```

## Monitoring

```bash
# Real-time logs
fly logs

# Metrics dashboard
fly dashboard

# SSH into machine (if needed)
fly ssh console
```

## Rollback

```bash
# List releases
fly releases

# Rollback to previous version
fly releases rollback
```

## Quebec Context Notes

- **Region**: `yul` (Montréal) for data sovereignty
- **Timezone**: America/Montreal (UTC-5/UTC-4)
- **Language**: Default fr-CA for French-Canadian content
- **Latency**: Optimized for Québec users

## What Needs Terminal Access

The following require CLI/terminal and should be delegated:

1. `fly launch` - Initial app creation
2. `fly secrets set` - Setting sensitive env vars
3. `fly deploy` - Actual deployment
4. Database migrations - Running SQL/schema updates
5. `flyctl` commands - All fly CLI operations

## What's Already Done (GitLab)

✅ `server/Dockerfile` - Multi-stage build with Python + TypeScript
✅ `server/.dockerignore` - Optimized build context
✅ `fly.toml` - Montréal region configuration
✅ `server/.env.fly.example` - Environment template
✅ This migration guide
✅ Health check endpoint in `server/index.ts`

## Next Actions

**For Terminal/CLI Team:**

1. Run `fly launch --region yul`
2. Configure secrets with `fly secrets set`
3. Deploy with `fly deploy`
4. Verify health check works
5. Run database migrations if needed

**Vive le Québec libre! 🇫🇷**
