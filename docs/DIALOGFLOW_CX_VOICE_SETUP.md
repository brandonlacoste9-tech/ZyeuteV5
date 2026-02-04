# Dialogflow CX Voice Setup (Dialogflow CX Credits)

**Credit Balance:** $813.16 (Dialogflow CX)  
**Purpose:** Voice commands, customer support bots, and Joual language processing  
**Result:** Users can talk to Zyeuté app (e.g., _"Zyeuté, montre-moi les dernières vidéos de Montréal"_)

---

## Why Dialogflow CX?

- **Uses Dialogflow CX Credits:** Audio sessions are covered by your $813.16 balance
- **Voice-First Experience:** Users can navigate Zyeuté with voice commands
- **Joual Support:** Dialogflow CX handles Quebec French and Joual slang better than standard NLU
- **Multi-Channel:** Works across WhatsApp (Max), in-app voice, and phone lines

---

## Step 1: Create Dialogflow CX Agent

### 1.1. Navigate to Dialogflow CX

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **`spatial-garden-483401-g8`**
3. Navigate to **Dialogflow CX** (or search "Dialogflow" in console)
4. Click **Create Agent**

### 1.2. Configure Agent

**Basic Settings:**

- **Agent Name:** `Zyeuté Voice Assistant`
- **Default Language:** **French (Canada)** - Critical for Joual support
- **Time Zone:** `America/Montreal`
- **Location:** `us-central1`

**Advanced:**

- **Speech Settings:** Enable **Enhanced Speech Models** (better Joual recognition)
- **Audio Settings:** Use **Audio Sessions** (covered by your credits)

### 1.3. Get Agent ID

After creation, note the **Agent ID** (e.g., `projects/spatial-garden-483401-g8/locations/us-central1/agents/zyeute-voice-123456`).

---

## Step 2: Create Intents for Zyeuté Commands

### 2.1. Core Navigation Intents

**Intent: `show_feed`**

- **Training Phrases:**
  - `Montre-moi le feed`
  - `Ouvre le feed`
  - `Affiche les vidéos`
  - `Feed s'il te plaît`
- **Response:** Navigate to `/feed` route

**Intent: `show_profile`**

- **Training Phrases:**
  - `Montre mon profil`
  - `Ouvre mon compte`
  - `Profil`
- **Response:** Navigate to `/profile` route

**Intent: `search_content`**

- **Training Phrases:**
  - `Cherche [query]`
  - `Trouve [query]`
  - `Recherche [query]`
- **Parameters:** `query` (required, entity type: `@sys.any`)
- **Response:** Call search API with `query`

### 2.2. Joual-Specific Intents

**Intent: `quebec_slang_greeting`**

- **Training Phrases:**
  - `Salut là`
  - `Allô`
  - `Comment ça va?`
  - `Ça va ben?`
- **Response:** Friendly Quebec greeting

**Intent: `show_montreal_videos`**

- **Training Phrases:**
  - `Montre-moi les vidéos de Montréal`
  - `Vidéos de Mtl`
  - `Contenu montréalais`
- **Response:** Filter feed by location (Montreal)

### 2.3. Advanced: Max Integration Intent

**Intent: `max_command`**

- **Training Phrases:**
  - `Max, vérifie le statut`
  - `Max, vérifie GCS`
  - `Max, status du backend`
- **Response:** Call Max API endpoint (see `docs/MAX_WHATSAPP_INTEGRATION.md`)

---

## Step 3: Configure Fulfillment (Webhook)

### 3.1. Create Webhook Endpoint

In your backend (`backend/routes.ts`), add:

```typescript
// POST /api/dialogflow/webhook
app.post("/api/dialogflow/webhook", async (req, res) => {
  const { intent, parameters, session } = req.body;

  // Handle different intents
  switch (intent) {
    case "show_feed":
      return res.json({
        fulfillmentResponse: {
          messages: [
            {
              text: { text: ["Navigating to feed..."] },
            },
          ],
          // Custom payload for frontend navigation
          payload: { action: "navigate", route: "/feed" },
        },
      });

    case "search_content":
      const query = parameters.query;
      // Call your search API
      const results = await searchPosts(query);
      return res.json({
        fulfillmentResponse: {
          messages: [
            {
              text: {
                text: [`Found ${results.length} results for "${query}"`],
              },
            },
          ],
          payload: { action: "search", query, results },
        },
      });

    default:
      return res.json({
        fulfillmentResponse: {
          messages: [
            {
              text: { text: ["Désolé, je n'ai pas compris."] },
            },
          ],
        },
      });
  }
});
```

### 3.2. Configure Webhook in Dialogflow CX

1. In Dialogflow CX Console → **Agent** → **Webhooks**
2. Click **Create Webhook**
3. **Name:** `Zyeuté Backend Webhook`
4. **URL:** `https://zyeute-api.onrender.com/api/dialogflow/webhook`
   - **Note:** Replace with your actual backend URL (Render or Railway)
5. **Authentication:** Use **Service Account** (same as Vertex AI)
6. **Enable for Intents:**
   - Check **Enable webhook** for each intent that needs video search:
     - `search_videos`
     - `show_montreal_videos`
     - `show_feed`
     - `show_profile`

**The webhook handler (`backend/routes/dialogflow-webhook.ts`) is already created and handles:**

- Video search by query/location
- Navigation commands
- Montreal-specific content filtering
- Ti-Guy voice responses with video results

---

## Step 4: Install Dialogflow CX SDK

### 4.1. Install Package

```bash
npm install @google-cloud/dialogflow-cx
```

**Note:** This package is required for `DialogflowBridge` to work.

---

## Step 5: Configure Backend

### 5.1. Set Environment Variables

In Render/Railway env vars, add:

```bash
# Dialogflow CX (Uses Dialogflow CX Credits $813.16)
DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_AGENT_ID
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_CLOUD_REGION=us-central1
```

### 5.2. DialogflowBridge is Ready

The `backend/ai/dialogflow-bridge.ts` file is already created and integrated. Routes are available at:

- `POST /api/dialogflow/tiguy` - Ti-Guy voice responses
- `POST /api/dialogflow/detect-intent` - Generic intent detection

### 5.3. Test Connection

Run the test script:

```bash
tsx scripts/test-dialogflow-cx-connection.ts --agent-id=YOUR_AGENT_ID
```

---

## Step 6: Integrate with Frontend

### 4.2. Create Voice Component

Create `frontend/src/components/VoiceAssistant.tsx`:

```typescript
import { useEffect, useState } from "react";
import { SessionsClient } from "@google-cloud/dialogflow-cx";

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = async () => {
    // Initialize Dialogflow CX session
    // Stream audio to Dialogflow
    // Handle responses
  };

  return (
    <button onClick={startListening}>
      {isListening ? "🎤 Listening..." : "🎤 Start Voice"}
    </button>
  );
}
```

### 6.2. Handle Navigation from Dialogflow

When Dialogflow returns `payload.action === "navigate"`, use React Router:

```typescript
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

// In Dialogflow response handler:
if (payload.action === "navigate") {
  navigate(payload.route);
}
```

---

## Step 5: Test Voice Commands

### 7.1. Test in Dialogflow Console

1. Go to **Dialogflow CX Console** → **Test Agent**
2. Use **Text Input** or **Audio Input**
3. Try: `Montre-moi le feed`
4. Verify response and webhook call

### 5.2. Test in Zyeuté App

1. Open Zyeuté app
2. Click voice button
3. Say: `"Zyeuté, montre-moi les vidéos de Montréal"`
4. Verify navigation to filtered feed

---

## Step 8: Monitor Credit Usage

### 6.1. Check Dialogflow CX Credits

1. Go to **Google Cloud Console → Billing**
2. Select project: `spatial-garden-483401-g8`
3. View **Credits** section
4. Look for **Dialogflow CX** usage

**Expected Usage:**

- **Audio Sessions:** ~$0.01-0.05 per session (covered by credits)
- **Text Sessions:** ~$0.001-0.01 per session
- **Agent Training:** Free

### 8.2. Optimize Costs

- **Cache Responses:** Cache common queries in Redis
- **Batch Sessions:** Group related commands
- **Text Fallback:** Offer text input as alternative to voice

---

## Troubleshooting

### Issue: Joual not recognized

**Check:**

- Agent language is set to **French (Canada)**, not **French (France)**
- Enhanced Speech Models are enabled
- Training phrases include Joual examples

**Fix:**

- Add more Joual training phrases
- Enable **Speech Adaptation** in Dialogflow settings

### Issue: Webhook not called

**Check:**

- Webhook URL is correct and accessible
- Service Account has **Dialogflow API User** role
- Fulfillment is enabled for the intent

**Fix:**

- Test webhook URL with `curl`:
  ```bash
  curl -X POST https://zyeute-api.onrender.com/api/dialogflow/webhook \
    -H "Content-Type: application/json" \
    -d '{"intent":"show_feed"}'
  ```

### Issue: Credits not being used

**Check:**

- You're using **Dialogflow CX**, not **Dialogflow ES** (standard)
- Audio sessions are enabled
- Agent is in correct project (`spatial-garden-483401-g8`)

**Fix:**

- Ensure you're using `@google-cloud/dialogflow-cx` SDK, not `@google-cloud/dialogflow`

---

## Success Criteria

✅ **Dialogflow CX Agent created** with French (Canada) language  
✅ **Intents configured** for core Zyeuté commands  
✅ **Webhook connected** to backend  
✅ **Voice component** integrated in frontend  
✅ **Dialogflow CX credits** showing usage in billing dashboard

---

## Next Steps

Once Dialogflow CX is live:

1. **Test Voice Commands:** Try all navigation intents
2. **Add More Intents:** Expand to cover all Zyeuté features
3. **Integrate with Max:** Connect Max (WhatsApp) to Dialogflow CX for voice commands
4. **Monitor Usage:** Track credit burn rate weekly

**With $813.16 in Dialogflow CX credits, you can handle thousands of voice sessions without cost.**
