# Render Deployment Checklist: Neural Link Activation

**Goal:** Deploy backend to Render and activate Neural Link (Socket.IO)  
**Status:** 🟡 Ready to Deploy  
**Estimated Time:** 15-20 minutes

---

## Pre-Deployment Checklist

### ✅ Code Ready

- [x] `render.yaml` configured with all services
- [x] `backend/index.ts` has Socket.IO initialized
- [x] `socket.io` in `package.json` dependencies
- [x] Dialogflow webhook routes created
- [x] Environment variables documented

### ⏳ Required Before Deployment

1. **Get Render Account**
   - Sign up at [render.com](https://render.com)
   - Connect GitHub account

2. **Prepare Environment Variables**
   - Copy values from Railway/production
   - Have Dialogflow CX Agent ID ready (stored securely)

---

## Step-by-Step Deployment

### Step 1: Create Render Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect GitHub repo: `brandonlacoste9-tech/ZyeuteV5`
4. Render will detect `render.yaml` automatically
5. Click **Apply** to create services

**Expected:** Render creates:

- `zyeute-api` web service
- `zyeute-db` PostgreSQL database

---

### Step 2: Configure Environment Variables

In Render Dashboard → `zyeute-api` → **Environment**, add:

#### Required (from Railway/Production)

```bash
# Database (auto-populated from render.yaml)
DATABASE_URL=<auto-populated>

# Supabase
SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_CLOUD_REGION=us-central1
VERTEX_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_JSON=<your-service-account-json>
# OR use file path:
GOOGLE_APPLICATION_CREDENTIALS=<path-to-key>

# Dialogflow CX (Uses Dialogflow CX Credits $813.16)
DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_AGENT_ID

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Node Environment
NODE_ENV=production
PORT=10000

# Colony API URL (for frontend - update after deployment)
VITE_COLONY_API_URL=https://zyeute-api.onrender.com
```

#### Optional AI Services

```bash
DEEPSEEK_API_KEY=<optional>
GROQ_API_KEY=<optional>
OLLAMA_API_KEY=<optional>
```

**⚠️ Security:** Mark sensitive variables (API keys, Agent IDs) as **Secret** in Render if available.

---

### Step 3: Wait for Deployment

1. Render will:
   - Install dependencies (`npm install`)
   - Build backend (`npm run build`)
   - Start service (`npm run start`)
   - Create database

2. **Monitor Logs:**
   - Go to `zyeute-api` → **Logs**
   - Watch for: `✅ Database pool connection established`
   - Watch for: `🔌 Socket.IO Client Connected`
   - Watch for: `[DialogflowBridge] Initialized Dialogflow CX client`

3. **Expected Build Time:** 5-10 minutes

---

### Step 4: Verify Deployment

#### 4.1. Health Check

```bash
curl https://zyeute-api.onrender.com/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

#### 4.2. Socket.IO Test

```bash
# Test Socket.IO endpoint (should return 200)
curl https://zyeute-api.onrender.com/socket.io/
```

#### 4.3. Dialogflow Webhook Test

```bash
curl -X POST https://zyeute-api.onrender.com/api/dialogflow/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "detectIntentResponse": {
      "queryResult": {
        "intent": {"displayName": "greeting"},
        "parameters": {}
      }
    }
  }'
```

---

### Step 5: Enable Neural Link in Frontend

Once Render backend is live:

1. **Get Render Service URL:**
   - Render Dashboard → `zyeute-api` → **Settings**
   - Copy the service URL (e.g., `https://zyeute-api.onrender.com`)

2. **Run Activation Script:**

   ```bash
   tsx scripts/enable-neural-link.ts --render-url=https://zyeute-api.onrender.com
   ```

3. **Set Frontend Environment Variable:**
   - Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add: `VITE_COLONY_API_URL=https://zyeute-api.onrender.com`

4. **Deploy Frontend:**
   - Push changes to GitHub
   - Vercel will auto-deploy

---

### Step 6: Test Neural Link

1. **Open Zyeuté in Production**
2. **Open Browser Console** (F12)
3. **Expected Logs:**

   ```
   ⚜️ Zyeuté: Connected to Colony OS Core.
   🔌 Socket.IO Client Connected: <socket-id>
   ```

4. **Test Socket Events:**
   ```javascript
   // In browser console
   import colonyLink from "./lib/colony-link";
   colonyLink.broadcastPost({ id: "test", content: "Test post" });
   ```

---

## Troubleshooting

### Issue: Build Fails

**Check:**

- Render logs for error messages
- `package.json` has all dependencies
- Build command: `npm install && npm run build`

**Fix:**

- Check Node.js version (should be 20.x or 22.x)
- Verify all env vars are set
- Check for missing dependencies

### Issue: Health Check Returns 500

**Check:**

- Database connection (`DATABASE_URL` correct?)
- Supabase credentials valid?
- Service logs for errors

**Fix:**

- Verify `DATABASE_URL` from Render database
- Check Supabase keys are correct
- Review logs for specific error

### Issue: Socket.IO Not Connecting

**Check:**

- Render service is running (not sleeping)
- `VITE_COLONY_API_URL` is set correctly
- CORS allows your frontend origin

**Fix:**

- Ensure Render service is on paid plan (free tier sleeps)
- Verify CORS config in `backend/index.ts`
- Check browser console for connection errors

### Issue: Dialogflow Webhook Not Working

**Check:**

- `DIALOGFLOW_CX_AGENT_ID` is set correctly
- Service Account JSON is valid
- Webhook URL in Dialogflow CX Console matches Render URL

**Fix:**

- Verify Agent ID format: `projects/.../agents/...`
- Test Agent ID with: `tsx scripts/test-dialogflow-cx-connection.ts`
- Update webhook URL in Dialogflow CX Console

---

## Post-Deployment Verification

### ✅ Success Criteria

- [ ] Render service is healthy (`/health` returns 200)
- [ ] Socket.IO endpoint responds
- [ ] Database connection works
- [ ] Dialogflow webhook responds
- [ ] Frontend connects to Neural Link
- [ ] Browser console shows "Connected to Colony OS Core"
- [ ] Socket events work (test with `broadcastPost`)

---

## Cost Considerations

### Render Pricing

- **Starter Plan:** $7/month (includes database)
- **Free Tier:** Available but services sleep after inactivity
- **Recommendation:** Use Starter plan for Neural Link (always-on WebSocket)

### Credit Usage

- **Dialogflow CX:** Uses credits ($813.16) - no additional cost
- **Vertex AI Search:** Uses credits ($1,367.95) - no additional cost
- **Render Hosting:** ~$7/month (separate from credits)

---

## Next Steps After Deployment

1. **Monitor Usage:**
   - Check Render logs daily
   - Monitor Dialogflow CX credit usage
   - Track Socket.IO connection patterns

2. **Optimize:**
   - Adjust Render instance size if needed
   - Cache frequent queries
   - Optimize Socket.IO event handling

3. **Scale:**
   - Add more Render instances if traffic grows
   - Consider Redis for Socket.IO scaling
   - Monitor database performance

---

**Once all steps are complete, Neural Link will be 🟢 LIVE and handling real-time video swarm across Quebec!** ⚜️
