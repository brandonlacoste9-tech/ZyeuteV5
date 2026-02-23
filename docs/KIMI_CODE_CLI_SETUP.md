# TI-GUY Messaging Setup Guide for Kimi Code CLI

## Quick Deploy Checklist

### 1. Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/zyeute

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Redis (for WebSocket)
REDIS_URL=redis://localhost:6379

# Google AI (TI-GUY)
GOOGLE_CLOUD_PROJECT_ID=your-project
DIALOGFLOW_LOCATION=global
DIALOGFLOW_AGENT_ID=your-agent-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Storage (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_BUCKET=zyeute-media

# Slack Alerts (optional)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_ALERT_CHANNEL=#alerts

# Email Alerts (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAILS=admin@zyeute.com

# Frontend
NEXT_PUBLIC_WS_URL=wss://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### 2. Database Setup

Run migrations in order:

```sql
-- 1. Base messaging schema
\i backend/config/messaging-schema.sql

-- 2. Group chat migration
\i backend/config/group-chat-migration.sql
```

### 3. Install Dependencies

```bash
npm install
npm install socket.io @socket.io/redis-adapter redis
npm install @google-cloud/dialogflow-cx @slack/web-api nodemailer
```

### 4. Start Services

```bash
# Terminal 1: Database (if local)
docker run -p 5432:5432 -e POSTGRES_PASSWORD=pass postgres:15

# Terminal 2: Redis (if local)
docker run -p 6379:6379 redis:7-alpine

# Terminal 3: Backend
npm run dev

# Terminal 4: Frontend
npm run dev:frontend
```

### 5. Verify Setup

Test endpoints:
```bash
# Health check
curl http://localhost:3001/health

# Cost dashboard
curl http://localhost:3001/api/admin/tiguy-cost \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Deploy to Production

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod

# Or Railway
railway up
```

## Kimi Code CLI Commands

Use these in Kimi Code CLI:

```
# Check file exists
ReadFile(ZyeuteV5/.env)

# Run migration
Shell(cd ZyeuteV5 && psql $DATABASE_URL -f backend/config/messaging-schema.sql)

# Install deps
Shell(cd ZyeuteV5 && npm install)

# Start dev server
Shell(cd ZyeuteV5 && npm run dev)

# Check logs
Shell(cd ZyeuteV5 && tail -f logs/app.log)
```

## File Structure

```
ZyeuteV5/
├── backend/
│   ├── websocket/gateway.ts          # WebSocket server
│   ├── ai/
│   │   ├── tiguy-dialogflow.ts      # TI-GUY AI
│   │   ├── tiguy-cost-monitor.ts    # $800 cap
│   │   └── genai-cost-monitor.ts    # Combined $1300
│   ├── routes/
│   │   ├── messaging.ts             # Core messaging API
│   │   └── group-chat.ts            # Group management
│   └── config/
│       ├── messaging-schema.sql     # DB schema
│       └── group-chat-migration.sql # Group migration
├── frontend/
│   └── src/
│       ├── components/features/
│       │   ├── ChatZyeute.tsx       # Main chat UI
│       │   ├── ChatControlCenter.tsx # Settings
│       │   └── ChatMediaUploader.tsx # File upload
│       └── hooks/
│           └── useWebSocket.ts      # Real-time hook
└── docs/
    └── MESSAGING_ARCHITECTURE.md    # Full docs
```

## Testing Checklist

- [ ] Create conversation between two users
- [ ] Send text message (instant delivery)
- [ ] Send image/file
- [ ] Record and send voice message
- [ ] Create group chat
- [ ] Add/remove members
- [ ] Mention @ti-guy (AI response)
- [ ] Check typing indicators
- [ ] Verify read receipts
- [ ] Test offline sync (disconnect, reconnect)
- [ ] Check cost dashboard at $800

## Troubleshooting

**WebSocket not connecting:**
- Check REDIS_URL
- Verify JWT_SECRET matches

**TI-GUY not responding:**
- Check GOOGLE_APPLICATION_CREDENTIALS file exists
- Verify Dialogflow agent ID

**Media upload failing:**
- Check SUPABASE_SERVICE_KEY permissions
- Verify bucket exists

**Cost alerts not sending:**
- Check SLACK_BOT_TOKEN
- Verify SMTP credentials
