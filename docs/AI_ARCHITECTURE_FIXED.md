# 🤖 Zyeuté AI Architecture - FIXED

## ✅ Correct Credit Allocation

| Service               | Credits       | Used By             | Protected By      |
| --------------------- | ------------- | ------------------- | ----------------- |
| **Dialogflow CX**     | $813.16       | TI-GUY chat & voice | ✅ Credit Manager |
| **GenAI App Builder** | $1,367.95     | Image analysis      | ✅ Credit Manager |
| **Vertex AI**         | $0 (no trial) | Fallback only       | ⚠️ Minimal use    |

---

## 🎯 API Endpoints & Credit Usage

### TI-GUY Conversational AI (Dialogflow CX - $813.16)

| Endpoint                        | Method        | Credits | Cutoff At |
| ------------------------------- | ------------- | ------- | --------- |
| `POST /api/tiguy/chat`          | Dialogflow CX | $813.16 | $10.00    |
| `POST /api/tiguy/detect-intent` | Dialogflow CX | $813.16 | $10.00    |
| `POST /api/tiguy/trends`        | Dialogflow CX | $813.16 | $10.00    |
| `POST /api/dialogflow/tiguy`    | Dialogflow CX | $813.16 | $10.00    |
| `GET /api/tiguy/health`         | Status check  | Free    | -         |
| `GET /api/tiguy/credits`        | Credit info   | Free    | -         |

**Fallback when credits depleted:**

- Returns Quebec-themed rule-based responses
- Message: "Désolé, les crédits AI sont épuisés! Réessaie plus tard. 🦫"

---

### Image Analysis (GenAI App Builder - $1,367.95)

| Endpoint                        | Method        | Credits   | Cutoff At |
| ------------------------------- | ------------- | --------- | --------- |
| `POST /api/ai/analyze-image`    | GenAI Builder | $1,367.95 | $10.00    |
| `POST /api/ai/analyze-media`    | GenAI Builder | $1,367.95 | $10.00    |
| `POST /api/genai/analyze-image` | GenAI Builder | $1,367.95 | $10.00    |
| `POST /api/genai/generate-tags` | GenAI Builder | $1,367.95 | $10.00    |
| `GET /api/genai/health`         | Status check  | Free      | -         |

**Fallback when credits depleted:**

- Returns default captions: "Ben coudonc, c'est cool! 🦫"
- HTTP 503 with friendly error message

---

## 🛡️ Credit Protection Mechanism

### How It Works

1. **Request Check**: Every AI request checks credit balance first
2. **Middleware Block**: If credits < $10.00, request is blocked
3. **Usage Tracking**: Each request deducts estimated cost
4. **Warning Alerts**: Alert when credits < $100.00
5. **Fallback Mode**: Graceful degradation when credits depleted

### Credit Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Request   │────▶│  Credit Check    │────▶│  Process Request│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐         ┌─────▼─────┐
              │Credits OK │         │Depleted   │
              └─────┬─────┘         └─────┬─────┘
                    │                     │
              ┌─────▼─────┐         ┌─────▼─────┐
              │Continue   │         │Return 503 │
              │Deduct $   │         │+Fallback  │
              └───────────┘         └───────────┘
```

### Estimated Costs

| Request Type          | Estimated Cost | Per 1000 Requests |
| --------------------- | -------------- | ----------------- |
| Dialogflow CX Text    | $0.002         | ~$2.00            |
| Dialogflow CX Audio   | $0.006         | ~$6.00            |
| GenAI Image Analysis  | $0.005         | ~$5.00            |
| GenAI Text Generation | $0.001         | ~$1.00            |

---

## 📊 Credit Monitoring

### Check Credit Status

```bash
# TI-GUY credits (Dialogflow CX)
GET /api/tiguy/credits

# GenAI credits
GET /api/genai/health

# All credits (admin only)
GET /api/tiguy/credits
Authorization: Bearer <admin-token>
```

### Response Format

```json
{
  "status": "ok",
  "credits": [
    {
      "service": "dialogflow-cx",
      "initial": 813.16,
      "used": 45.2,
      "remaining": 767.96,
      "percentRemaining": "94.4",
      "status": "HEALTHY",
      "cutoffAt": 10.0
    },
    {
      "service": "genai-app-builder",
      "initial": 1367.95,
      "used": 123.5,
      "remaining": 1244.45,
      "percentRemaining": "91.0",
      "status": "HEALTHY",
      "cutoffAt": 10.0
    }
  ]
}
```

---

## 🚨 When Credits Run Out

### TI-GUY Chat

```json
{
  "error": "AI Service Unavailable",
  "message": "🛑 dialogflow-cx credits depleted. Remaining: $9.50. Please add credits to continue using AI features.",
  "fallback": {
    "message": "Désolé, les crédits AI sont épuisés! Réessaie plus tard. 🦫",
    "suggestion": "Contact support to add more credits."
  }
}
```

### Image Analysis

```json
{
  "error": "AI Service Unavailable",
  "message": "🛑 genai-app-builder credits depleted. Remaining: $8.00. Please add credits to continue using AI features.",
  "credits": [...],
  "fallback": {
    "caption": "Ben coudonc, c'est cool! 🦫",
    "tags": ["quebec"],
    "vibe_category": "chill"
  }
}
```

---

## 🔧 Files Created/Modified

### New Files

- `backend/ai/credit-manager.ts` - Credit tracking & cutoff
- `backend/ai/tiguy-service.ts` - TI-GUY Dialogflow CX integration
- `backend/routes/tiguy-routes.ts` - TI-GUY routes with credit protection

### Modified Files

- `backend/routes.ts` - Registered new TI-GUY routes
- `backend/routes/ai.routes.ts` - Added credit middleware
- `backend/routes/genai-builder.routes.ts` - Added credit middleware

---

## 💡 Best Practices

1. **Monitor `/api/tiguy/credits`** regularly
2. **Set up alerts** when credits drop below $100
3. **Test fallback mode** before credits run out
4. **Top up credits** proactively, not reactively
5. **Use GenAI App Builder** for images (more credits available)
6. **Use Dialogflow CX** for chat (better conversation management)

---

## 📞 Support

If credits are depleted:

1. Check status: `GET /api/tiguy/credits`
2. Contact Google Cloud support for credit top-up
3. Temporarily disable AI features in frontend
4. Monitor fallback responses for user experience
