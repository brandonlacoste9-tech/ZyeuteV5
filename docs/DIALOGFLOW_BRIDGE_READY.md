# DialogflowBridge Ready ✅

**Status:** 🟢 Code Complete  
**Credits:** Uses Dialogflow CX credits ($813.16)  
**Next Step:** Install package and configure Agent ID

---

## What's Been Created

### 1. DialogflowBridge Service

**`backend/ai/dialogflow-bridge.ts`**

- `detectIntent()` - Detect intent from text/audio
- `streamAudio()` - Stream audio for real-time voice
- `getTiGuyVoiceResponse()` - Ti-Guy voice responses via Dialogflow CX

### 2. Backend Routes

**`backend/routes/dialogflow-tiguy.ts`**

- `POST /api/dialogflow/tiguy` - Ti-Guy voice endpoint
- `POST /api/dialogflow/detect-intent` - Generic intent detection

### 3. Test Script

**`scripts/test-dialogflow-cx-connection.ts`**

- Tests Dialogflow CX API connection
- Verifies credit usage
- Tests Quebec French/Joual support

---

## Installation Steps

### 1. Install Package

```bash
npm install @google-cloud/dialogflow-cx
```

### 2. Create Dialogflow CX Agent

Follow `docs/DIALOGFLOW_CX_VOICE_SETUP.md` → Step 1-2 to create agent and intents.

### 3. Set Environment Variable

```bash
DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_AGENT_ID
```

### 4. Test Connection

```bash
tsx scripts/test-dialogflow-cx-connection.ts --agent-id=YOUR_AGENT_ID
```

---

## Usage Examples

### Ti-Guy Voice Response

```typescript
import { DialogflowBridge } from "./ai/dialogflow-bridge.js";

const result = await DialogflowBridge.getTiGuyVoiceResponse(
  userId,
  "Montre-moi le feed",
  { context: "user_on_homepage" },
);

// result.response - Ti-Guy's response text
// result.intent - Detected intent (e.g., "show_feed")
// result.action - Navigation payload (e.g., { action: "navigate", route: "/feed" })
```

### Generic Intent Detection

```typescript
const result = await DialogflowBridge.detectIntent(
  "session-123",
  { text: "Salut là, comment ça va?" },
  "fr-CA",
);
```

---

## Credit Usage

**Important:** This uses **Dialogflow CX credits ($813.16)**, NOT standard Gemini API credits.

- **Text Sessions:** ~$0.001-0.01 per session
- **Audio Sessions:** ~$0.01-0.05 per session
- **With $813.16:** Thousands of voice sessions over 12+ months

---

## Integration Points

### Frontend Voice Component

Call the backend endpoint:

```typescript
const response = await fetch("/api/dialogflow/tiguy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Montre-moi le feed",
    userId: currentUser.id,
    context: { currentRoute: "/home" },
  }),
});

const data = await response.json();
// data.response - Ti-Guy's voice response
// data.action - Navigation action if applicable
```

### Max (WhatsApp) Integration

Max can call Dialogflow CX via backend:

```typescript
// In Max's command handler
const result = await DialogflowBridge.getTiGuyVoiceResponse(
  maxUserId,
  userMessage,
  { source: "whatsapp" },
);
```

---

## Next Steps

1. ✅ **Code Complete** - DialogflowBridge is ready
2. ⏳ **Install Package** - `npm install @google-cloud/dialogflow-cx`
3. ⏳ **Create Agent** - Follow `docs/DIALOGFLOW_CX_VOICE_SETUP.md`
4. ⏳ **Set Env Var** - `DIALOGFLOW_CX_AGENT_ID`
5. ⏳ **Test** - Run `tsx scripts/test-dialogflow-cx-connection.ts`

---

**Once Agent ID is configured, Ti-Guy voice is ready to use Dialogflow CX credits!** 🎤
