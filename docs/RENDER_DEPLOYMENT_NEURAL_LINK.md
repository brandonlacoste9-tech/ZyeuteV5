# Render Deployment Guide: Neural Link Activation

This guide walks you through deploying the Zyeuté backend to **Render** so that **Neural Link** (WebSocket/Socket.IO) can go from **🟡 READY** to **🟢 LIVE**.

---

## Current Status

| Component                  | Status      | Notes                                                         |
| -------------------------- | ----------- | ------------------------------------------------------------- |
| **Backend (Railway)**      | 🟢 Live     | `https://zyeutev5-production.up.railway.app`                  |
| **Neural Link (Frontend)** | 🟡 Disabled | Socket.IO disabled due to backend incompatibility (now fixed) |
| **Render Config**          | ✅ Ready    | `render.yaml` exists but not deployed                         |

---

## Why Render?

- **Socket.IO Support:** Render's web services support WebSocket connections out of the box.
- **Simplified Deployment:** `render.yaml` handles service + database provisioning.
- **Cost-Effective:** Starter plan suitable for Zyeuté's current scale.

---

## Step 1: Deploy Backend to Render

### 1.1. Create Render Account & Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect your GitHub repo (`brandonlacoste9-tech/ZyeuteV5`)
4. Render will detect `render.yaml` and prompt you to deploy

### 1.2. Configure Environment Variables

In Render Dashboard → Your Service → **Environment**, add:

```bash
# Database (auto-linked from render.yaml)
DATABASE_URL=<auto-populated from zyeute-db>

# Supabase
SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_APPLICATION_CREDENTIALS=<path-to-key-or-json>
# OR inline JSON:
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# AI Services (optional)
DEEPSEEK_API_KEY=<optional>
GROQ_API_KEY=<optional>
OLLAMA_API_KEY=<optional>

# Node Environment
NODE_ENV=production
PORT=10000

# Colony API URL (for frontend)
VITE_COLONY_API_URL=https://zyeute-api.onrender.com
```

### 1.3. Verify Build & Start Commands

Render will use `render.yaml`:

- **Build:** `npm install && npm run build`
- **Start:** `npm run start` (runs `node dist/index.cjs`)

**Important:** Ensure `socket.io` is in `package.json` dependencies (it already is ✅).

---

## Step 2: Enable Neural Link in Frontend

Once Render backend is live, update the frontend to connect:

### 2.1. Update `frontend/src/lib/colony-link.ts`

**Current state:** Connection is disabled (line 18).

**Change:**

```typescript
constructor() {
  if (typeof window !== "undefined") {
    this.connect(); // ✅ ENABLE THIS LINE
    // Remove the console.warn about "Backend Incompatibility"
  }
}
```

**Also update `COLONY_API_URL`:**

```typescript
const COLONY_API_URL =
  import.meta.env.VITE_COLONY_API_URL ||
  (import.meta.env.PROD
    ? "https://zyeute-api.onrender.com" // ✅ Change from Railway to Render
    : "http://localhost:10000");
```

### 2.2. Verify Socket.IO Client

Ensure `socket.io-client` is installed in frontend:

```bash
cd frontend
npm list socket.io-client
```

If missing:

```bash
npm install socket.io-client
```

---

## Step 3: Test Neural Link Connection

### 3.1. Deploy Frontend (Vercel)

After enabling Neural Link, push changes and let Vercel deploy.

### 3.2. Browser Console Check

Open Zyeuté in production and check browser console:

**Expected logs:**

```
⚜️ Zyeuté: Connected to Colony OS Core.
🔌 Socket.IO Client Connected: <socket-id>
```

**If errors:**

- `Connection error: ...` → Check Render service logs
- `CORS error` → Verify Render CORS settings in `backend/index.ts` (Socket.IO cors config)
- `404` → Ensure `VITE_COLONY_API_URL` points to Render service URL

---

## Step 4: Render Service Configuration

### 4.1. Enable WebSocket Support

In Render Dashboard → Your Service → **Settings**:

- **Auto-Deploy:** `Yes` (on git push)
- **Health Check Path:** `/health` (or `/api/health`)
- **WebSocket Support:** Enabled by default for web services

### 4.2. Health Check Endpoint

Ensure your backend exposes `/health` or `/api/health`:

```typescript
// backend/index.ts (already exists)
app.get("/health", async (req, res) => {
  // ... health check logic
});
```

---

## Step 5: Migration from Railway (Optional)

If you want to fully migrate from Railway to Render:

1. **Keep Railway running** during Render deployment
2. **Test Render backend** with a staging frontend URL
3. **Switch `VITE_COLONY_API_URL`** in production env vars
4. **Monitor for 24 hours** before shutting down Railway

---

## Troubleshooting

### Issue: Socket.IO connection fails

**Check:**

- Render service logs: `Render Dashboard → Service → Logs`
- Frontend console: Look for CORS or connection errors
- Network tab: Verify WebSocket upgrade request succeeds

**Fix:**

- Ensure `socket.io` is in `package.json` dependencies
- Verify CORS config in `backend/index.ts` allows your frontend origin
- Check Render service is running (not sleeping on free tier)

### Issue: Neural Link connects but events don't work

**Check:**

- Backend Socket.IO event handlers are registered (`io.on("connection", ...)`)
- Frontend emits events correctly (`colonyLink.emit(...)`)
- Render service logs show event reception

---

## Verification Checklist

- [ ] Render service deployed and healthy
- [ ] Environment variables set in Render Dashboard
- [ ] `colony-link.ts` connection enabled
- [ ] `VITE_COLONY_API_URL` points to Render service
- [ ] Frontend deployed to Vercel
- [ ] Browser console shows "Connected to Colony OS Core"
- [ ] Socket.IO events working (test with `colonyLink.broadcastPost(...)`)

---

## Next Steps After Neural Link is Live

1. **Test Social Events:** Broadcast posts, likes, comments via WebSocket
2. **Test AI Requests:** Ti-Guy and JoualBee via `colonyLink.requestTiGuyResponse(...)`
3. **Monitor Render Logs:** Watch for Socket.IO connection patterns
4. **Optimize:** Adjust reconnection logic if needed

---

**Once Neural Link is 🟢 LIVE, your Colony OS "Ignition Sequence" is complete.**
