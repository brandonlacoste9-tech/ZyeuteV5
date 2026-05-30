# Max (WhatsApp) Integration Guide

**Max** is your Production Manager agent running on WhatsApp (+15143481161). This doc explains how Max can interact with Zyeuté infrastructure.

---

## Current Status

| Component            | Status       | Notes                             |
| -------------------- | ------------ | --------------------------------- |
| **Max (WhatsApp)**   | 🟢 Listening | External agent (not in this repo) |
| **GCS Verification** | ✅ Available | `npm run verify:gcs` script ready |

---

## How Max Can Execute Zyeuté Commands

Max is an **external agent** (likely via WhatsApp Business API, Twilio, or similar). To have Max run Zyeuté commands, you need:

1. **Max → Server Bridge:** Max receives WhatsApp messages and forwards them to your backend/API
2. **Backend Command Handler:** Your backend exposes endpoints that Max can call
3. **Execution Context:** Max's server has access to your repo or can call your backend APIs

---

## Example: Max Running `verify:gcs`

### Option 1: Via Backend API Endpoint

**Create endpoint in `backend/routes.ts`:**

```typescript
// GET /api/admin/verify-gcs
app.get("/api/admin/verify-gcs", async (req, res) => {
  // Verify admin/auth token from Max's server
  const authToken = req.headers.authorization;
  if (authToken !== process.env.MAX_API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Run GCS verification
  const { exec } = require("child_process");
  exec("npm run verify:gcs", (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ status: "success", output: stdout });
  });
});
```

**Max's server would call:**

```bash
curl -H "Authorization: YOUR_MAX_API_TOKEN" \
  https://zyeute-api.onrender.com/api/admin/verify-gcs
```

### Option 2: Direct Script Execution (if Max has repo access)

If Max's server has access to the Zyeuté repo:

```bash
cd /path/to/ZyeuteV5
npm run verify:gcs
```

Then parse output and send to WhatsApp via Max's integration.

---

## WhatsApp Message Flow

```
User (WhatsApp) → Max (WhatsApp Bot)
                ↓
         Max's Server (receives message)
                ↓
    Parses: "verify:gcs check for spatial-garden-483401-g8"
                ↓
    Calls: GET /api/admin/verify-gcs
                ↓
    Backend runs: npm run verify:gcs
                ↓
    Returns: { status: "success", output: "..." }
                ↓
    Max formats response → WhatsApp reply
```

---

## Example Max Commands for Zyeuté

| Command           | WhatsApp Message | Backend Action                             |
| ----------------- | ---------------- | ------------------------------------------ |
| **GCS Check**     | `verify:gcs`     | Run `npm run verify:gcs`                   |
| **Health Check**  | `status`         | GET `/health`                              |
| **Vertex AI**     | `check vertex`   | GET `/api/health` (includes Vertex status) |
| **Deploy Status** | `deploy status`  | Check Render/Railway deployment status     |

---

## Security Considerations

1. **API Token:** Use `MAX_API_TOKEN` env var for Max's server authentication
2. **Rate Limiting:** Limit Max's API calls to prevent abuse
3. **Command Whitelist:** Only allow specific commands (don't allow arbitrary shell execution)
4. **Logging:** Log all Max-initiated actions for audit trail

---

## Setup Steps (for Max Integration)

1. **Create Max API endpoint** in `backend/routes.ts` (see example above)
2. **Set `MAX_API_TOKEN`** in Render/Railway env vars
3. **Configure Max's server** to call your backend API
4. **Test:** Send WhatsApp message to Max → verify backend receives request

---

## Testing Max Integration Locally

```bash
# 1. Start backend
npm run dev

# 2. Test Max endpoint (simulating Max's server)
curl -H "Authorization: YOUR_MAX_API_TOKEN" \
  http://localhost:10000/api/admin/verify-gcs

# 3. Expected response:
# {
#   "status": "success",
#   "output": "🔍 Verifying @google-cloud/storage...\n✅ SDK loaded successfully..."
# }
```

---

**Note:** Max integration is **external** to this repo. This doc provides the blueprint for connecting Max to Zyeuté's backend APIs. The actual WhatsApp bot setup (Twilio, WhatsApp Business API, etc.) is handled separately.
