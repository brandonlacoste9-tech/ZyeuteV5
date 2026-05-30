# 🤖 Zyeuté AI Credits Allocation Guide

## 💰 Available Credit Pools

| Service               | Credits       | Purpose                                           | Status    |
| --------------------- | ------------- | ------------------------------------------------- | --------- |
| **GenAI App Builder** | **$1,367.95** | Image analysis, content generation, multimodal AI | ✅ Active |
| **Dialogflow CX**     | **$813.16**   | TI-GUY conversational dialogue, chatbot           | ✅ Active |

---

## 🎯 Credit Usage by Feature

### TI-GUY Dialogue (Dialogflow CX - $813.16)

Uses Dialogflow CX credits for conversational AI:

| Endpoint                             | Service              | Credits             |
| ------------------------------------ | -------------------- | ------------------- |
| `POST /api/dialogflow/session`       | Dialogflow CX        | $813.16 pool        |
| `POST /api/dialogflow/detect-intent` | Dialogflow CX        | $813.16 pool        |
| `POST /api/tiguy/chat`               | Vertex AI (fallback) | If Dialogflow fails |

**SKUs Used:**

- Text session for Dialogflow CX agents
- Audio session for voice interactions
- Text query operations

---

### Image Analysis (GenAI App Builder - $1,367.95)

Uses GenAI App Builder credits for image understanding:

| Endpoint                        | Service           | Credits        |
| ------------------------------- | ----------------- | -------------- |
| `POST /api/ai/analyze-media`    | GenAI App Builder | $1,367.95 pool |
| `POST /api/ai/analyze-image`    | GenAI App Builder | $1,367.95 pool |
| `POST /api/genai/analyze-image` | GenAI App Builder | $1,367.95 pool |

**Models Used:**

- `gemini-2.0-flash-exp` (multimodal understanding)

---

## 🔌 API Endpoints

### GenAI App Builder Endpoints

```bash
# Analyze image (uses $1,367.95 credits)
POST /api/ai/analyze-image
POST /api/ai/analyze-media
POST /api/genai/analyze-image
Body: { "imageUrl": "https://...", "location": "Montreal" }

# Generate tags
POST /api/genai/generate-tags
Body: { "content": "post text", "imageUrl": "https://..." }

# Health check
GET /api/genai/health
```

### Dialogflow CX Endpoints (TI-GUY)

```bash
# TI-GUY dialogue (uses $813.16 credits)
POST /api/dialogflow/session
POST /api/dialogflow/detect-intent
Body: { "text": "Salut TI-GUY!", "sessionId": "..." }
```

---

## 🛡️ Fallback Strategy

If GenAI App Builder fails:

1. Falls back to Vertex AI (if configured)
2. Falls back to local/default responses

If Dialogflow CX fails:

1. Falls back to TI-GUY actions using Vertex AI
2. Falls back to rule-based responses

---

## 📊 Monitoring

Check credit status:

```bash
curl https://your-api.com/api/genai/health
curl https://your-api.com/api/health
```

Response includes:

- Service status
- Available credits
- Feature flags

---

## 🔧 Environment Variables

```bash
# GenAI App Builder
GOOGLE_CLOUD_PROJECT=gen-lang-client-0092649281
GENAI_LOCATION=us-central1

# Dialogflow CX
DIALOGFLOW_CX_AGENT_ID=your-agent-id
DIALOGFLOW_CX_LOCATION=us-central1

# Shared
GOOGLE_SERVICE_ACCOUNT_JSON={...}
```

---

## 💡 Best Practices

1. **Use Dialogflow CX** for conversational features (chat, voice)
2. **Use GenAI App Builder** for image/video analysis
3. **Monitor usage** via `/api/genai/health` endpoint
4. **Set up alerts** when credits drop below $100

---

## 📝 Notes

- Credits are **independent** - using GenAI App Builder doesn't affect Dialogflow CX credits
- Both use the same Google Cloud project but different services
- GenAI App Builder has **more credits** ($1,367 vs $813) - prioritize for image-heavy features
