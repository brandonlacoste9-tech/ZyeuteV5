# Dialogflow CX Agent ID Configuration

**Agent ID:** `AQ.Ab8RN6JXQGPlRh_wZvOyiRAWgsgC3XIVpUfILZkPUy_-RrUlNg`  
**Project:** `spatial-garden-483401-g8`  
**Location:** `us-central1`

---

## Full Agent Path

The complete Agent ID path for API calls:

```
projects/spatial-garden-483401-g8/locations/us-central1/agents/AQ.Ab8RN6JXQGPlRh_wZvOyiRAWgsgC3XIVpUfILZkPUy_-RrUlNg
```

---

## Environment Variable Setup

### For Backend (Render/Railway)

Add to your environment variables:

```bash
# Replace YOUR_AGENT_ID with your actual Agent ID from Dialogflow CX Console
DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_AGENT_ID
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_CLOUD_REGION=us-central1
```

### For Local Development (.env)

**⚠️ IMPORTANT:** Create a `.env` file (not committed to git) with:

```bash
# Replace YOUR_AGENT_ID with your actual Agent ID
DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_AGENT_ID
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_CLOUD_REGION=us-central1
```

---

## Test Connection

Once the environment variable is set, test the connection:

```bash
tsx scripts/test-dialogflow-cx-connection.ts
```

Or with explicit Agent ID:

```bash
tsx scripts/test-dialogflow-cx-connection.ts --agent-id=AQ.Ab8RN6JXQGPlRh_wZvOyiRAWgsgC3XIVpUfILZkPUy_-RrUlNg
```

---

## Webhook URL

Configure this webhook URL in Dialogflow CX Console:

```
https://zyeute-api.onrender.com/api/dialogflow/webhook
```

(Replace with your actual backend URL if different)

---

## Verification

After setting the env var, verify:

1. **Backend logs** should show:

   ```
   [DialogflowBridge] Initialized Dialogflow CX client for agent: YOUR_AGENT_ID
   ```

2. **Test endpoint** should work:
   ```bash
   curl -X POST http://localhost:10000/api/dialogflow/tiguy \
     -H "Content-Type: application/json" \
     -d '{"message": "Bonjour Ti-Guy", "userId": "test-123"}'
   ```

---

**Agent ID configured! Ti-Guy voice is ready to use Dialogflow CX credits.** 🎤
