# Colony OS "Ignition Sequence" Checklist

**Status:** 🟡 Ready for Launch  
**Goal:** Turn Neural Link from **🟡 READY** to **🟢 LIVE** and verify all Colony OS components are operational.

---

## Pre-Flight Status

| System                     | Status          | Action Required                                                 |
| -------------------------- | --------------- | --------------------------------------------------------------- |
| **GCS Security**           | 🟢 Verified     | GitHub Actions confirming `fast-xml-parser` patch               |
| **Vertex AI Credits**      | 🟢 Active       | $2,181.11 total ($1,367.95 App Builder + $813.16 Dialogflow CX) |
| **Vertex AI Search**       | ⚪ Not Setup    | Create Data Store to index codebase (uses App Builder credits)  |
| **Dialogflow CX**          | ⚪ Not Setup    | Create agent for voice commands (uses Dialogflow CX credits)    |
| **Antigravity Skills**     | 🟢 Loaded       | `.cursor/rules/antigravity-session.mdc` active                  |
| **Neural Link (Frontend)** | 🟡 Disabled     | Enable after Render backend deployment                          |
| **Backend (Railway)**      | 🟢 Live         | `https://zyeutev5-production.up.railway.app`                    |
| **Backend (Render)**       | ⚪ Not Deployed | Deploy to enable Neural Link                                    |
| **Max (WhatsApp)**         | 🟢 Listening    | External agent ready for commands                               |

---

## Ignition Sequence Steps

### Step 1: Deploy Backend to Render ✅

**Goal:** Get Socket.IO-enabled backend running on Render.

**Actions:**

Follow the complete guide: **`docs/RENDER_DEPLOYMENT_CHECKLIST.md`**

**Quick Steps:**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Blueprint**
3. Connect GitHub repo → Render detects `render.yaml`
4. Set environment variables (see checklist)
5. Wait for deployment (~5-10 minutes)
6. Verify deployment: `npm run verify:render`

**Verification:**

```bash
# Automated check
npm run verify:render

# Or manual
curl https://zyeute-api.onrender.com/health
# Expected: {"status":"ok","database":"connected",...}
```

---

### Step 2: Enable Neural Link in Frontend ✅

**Goal:** Activate WebSocket connection from frontend to Render backend.

**Actions:**

1. Run activation script:
   ```bash
   tsx scripts/enable-neural-link.ts --render-url=https://zyeute-api.onrender.com
   ```
2. Or manually edit `frontend/src/lib/colony-link.ts`:
   - Enable `this.connect()` (line 18)
   - Update `COLONY_API_URL` to Render URL
3. Set `VITE_COLONY_API_URL` in Vercel env vars
4. Deploy frontend to Vercel

**Verification:**

- Open Zyeuté in production
- Browser console should show: `⚜️ Zyeuté: Connected to Colony OS Core.`

---

### Step 3: Test Neural Link Events ✅

**Goal:** Verify Socket.IO events are working.

**Test Commands (in browser console):**

```javascript
import colonyLink from "./lib/colony-link";

// Test connection
colonyLink.isConnected(); // Should return true

// Test social event
colonyLink.broadcastPost({
  id: "test-123",
  content: "Test post from Neural Link",
  userId: "test-user",
});

// Test AI request
colonyLink.requestTiGuyResponse("Bonjour! Comment ça va?", {});
```

**Expected:** No errors in console; backend logs show events received.

---

### Step 4: Test Max (WhatsApp) Integration ✅

**Goal:** Verify Max can execute Zyeuté commands via WhatsApp.

**Test Message to Max:**

```
verify:gcs check for spatial-garden-483401-g8
```

**Expected Flow:**

1. Max receives WhatsApp message
2. Max's server calls `/api/admin/verify-gcs` (if endpoint exists)
3. Backend runs `npm run verify:gcs`
4. Max replies with status

**Note:** Max integration requires backend API endpoint (see `docs/MAX_WHATSAPP_INTEGRATION.md`).

---

### Step 5: Test Ti-Guy in Cursor ✅

**Goal:** Verify Antigravity skills are loaded and Vertex credits are active.

**Test Prompt in Cursor Composer (`Ctrl + I`):**

```
Check the Neural Link integration status. Are we ready to connect to the Render backend?
```

**Expected:** Ti-Guy should:

- Access `external/antigravity-manager` for architectural rules
- Check `frontend/src/lib/colony-link.ts` status
- Report on WebSocket client readiness

---

### Step 6: Test Multimodal UI/UX (Voyageur Luxury) ✅

**Goal:** Verify Gemini 1.5 Pro multimodal capabilities with Vertex credits.

**Test:**

1. Drag a reference image (Louis Vuitton, leather texture, Quebec landscape) into Cursor chat
2. Prompt:
   ```
   Using UI-UX Pro Max and the Voyageur Luxury rules, extract the premium aesthetics from this image and apply them to the Zyeuté feed layout.
   ```

**Expected:** Cursor uses Vertex credits to analyze image and generate Tailwind config matching Voyageur Luxury aesthetic.

---

### Step 7: Create Vertex AI Search Data Store ✅

**Goal:** Index Zyeuté codebase and Antigravity skills for RAG (uses GenAI App Builder credits).

**Actions:**

1. Follow `docs/VERTEX_AI_SEARCH_DATA_STORE_SETUP.md`
2. Create Data Store in GCP Console
3. Run indexing script:
   ```bash
   tsx scripts/index-codebase-to-vertex-search.ts
   ```
4. Set `VERTEX_DATA_STORE_ID` in backend env vars
5. Test RAG: `VertexBridge.searchMemory("How does feed pagination work?")`

**Verification:**

- Data Store shows indexed documents in GCP Console
- `VertexBridge.searchMemory()` returns results from your codebase
- GenAI App Builder credits showing usage in billing dashboard

---

### Step 8: Setup Dialogflow CX Voice Assistant ✅

**Goal:** Enable voice commands for Zyeuté app (uses Dialogflow CX credits).

**Actions:**

1. Follow `docs/DIALOGFLOW_CX_VOICE_SETUP.md`
2. Create Dialogflow CX agent with French (Canada) language
3. Create intents for core commands (show_feed, search_content, etc.)
4. Configure webhook to backend
5. Integrate voice component in frontend

**Verification:**

- Test agent in Dialogflow Console
- Voice commands work in Zyeuté app
- Dialogflow CX credits showing usage in billing dashboard

---

## Final Status Dashboard

After completing all steps:

| System               | Target Status      | Verification                      |
| -------------------- | ------------------ | --------------------------------- |
| **GCS Security**     | 🟢 Shields Up      | GitHub Actions green              |
| **Vertex AI**        | 🟢 Burning Credits | Check GCP billing dashboard       |
| **Neural Link**      | 🟢 LIVE            | Browser console shows "Connected" |
| **Backend (Render)** | 🟢 Healthy         | `/health` returns 200             |
| **Max (WhatsApp)**   | 🟢 Operational     | Commands execute successfully     |
| **Ti-Guy (Cursor)**  | 🟢 Loaded          | Antigravity skills accessible     |
| **Voyageur UI**      | 🟢 Refined         | Multimodal design working         |

---

## Troubleshooting

### Neural Link won't connect

**Check:**

- Render service is running (not sleeping)
- `VITE_COLONY_API_URL` is set correctly
- CORS allows your frontend origin
- Socket.IO is installed in backend (`package.json`)

**Fix:**

- See `docs/RENDER_DEPLOYMENT_NEURAL_LINK.md` troubleshooting section

### Max commands not working

**Check:**

- Max API endpoint exists in backend
- `MAX_API_TOKEN` is set in Render env vars
- Max's server can reach Render backend

**Fix:**

- See `docs/MAX_WHATSAPP_INTEGRATION.md` for setup steps

### Vertex credits not being used

**Check:**

- Cursor Settings → Models → Google → Vertex AI is ON
- Service Account JSON is configured
- Gemini 1.5 Pro is selected

**Fix:**

- See `docs/CURSOR_VERTEX_AI_SETUP.md`

---

## Success Criteria

✅ **All systems 🟢 GREEN**  
✅ **Neural Link connected and events working**  
✅ **Max can execute commands via WhatsApp**  
✅ **Ti-Guy uses Antigravity skills in Cursor**  
✅ **Vertex credits are being consumed**  
✅ **Voyageur Luxury UI refined via multimodal**

---

**Once all steps are complete, the Colony OS "Ignition Sequence" is successful. You're operating a Self-Sustaining Digital Enterprise.** 🚀
