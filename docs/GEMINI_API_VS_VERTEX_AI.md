# Gemini API vs Vertex AI: Credit Usage Guide

**⚠️ CRITICAL:** Your credits are specific to certain services. Using the wrong endpoint won't use your credits.

---

## The Two Different APIs

### 1. Standard Gemini API (AI Studio) ❌ Doesn't Use Your Credits

**Endpoint:**

```
https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent
```

**Uses:**

- Standard Google Cloud billing
- OR separate API key from AI Studio
- **NOT** your GenAI App Builder credits ($1,367.95)
- **NOT** your Dialogflow CX credits ($813.16)

**When to Use:**

- Quick testing
- Development without credits
- Simple API calls

---

### 2. Vertex AI (GCP) ✅ Uses Your Credits

**Endpoint:**

```
https://us-central1-aiplatform.googleapis.com/v1/projects/spatial-garden-483401-g8/locations/us-central1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent
```

**Uses:**

- Your GenAI App Builder credits ($1,367.95) ✅
- Service Account authentication (not API key)
- Project: `spatial-garden-483401-g8`

**When to Use:**

- Production workloads
- When you want to use your credits
- RAG/Grounded Generation

---

## Correct Way to Use Your Credits

### Option 1: Use Vertex AI SDK (Recommended)

```typescript
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: "spatial-garden-483401-g8",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

const result = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [{ text: "Explain how AI works in a few words" }],
    },
  ],
});
```

**This uses your GenAI App Builder credits!** ✅

---

### Option 2: Use Vertex AI REST API (Direct)

```bash
# Get access token from Service Account
ACCESS_TOKEN=$(gcloud auth print-access-token)

curl "https://us-central1-aiplatform.googleapis.com/v1/projects/spatial-garden-483401-g8/locations/us-central1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent" \
  -X POST \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

**This uses your GenAI App Builder credits!** ✅

**Key Differences:**

- Uses `us-central1-aiplatform.googleapis.com` (not `aiplatform.googleapis.com`)
- Includes project ID: `spatial-garden-483401-g8`
- Uses Service Account token (not API key)
- Includes location: `us-central1`

---

## Your Current Setup

### ✅ Already Using Vertex AI (Correct)

Your codebase already uses Vertex AI correctly:

**`backend/ai/vertex-service.ts`:**

```typescript
vertexAI = new VertexAI({
  project: "spatial-garden-483401-g8",
  location: "us-central1",
});
```

**This is correct and uses your credits!** ✅

---

## Testing Your Credits

### Test Vertex AI (Uses Credits)

```bash
# Using your existing test script
tsx scripts/verify-vertex-ai.ts
```

Or create a simple test:

```typescript
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: "spatial-garden-483401-g8",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

const result = await model.generateContent(
  "Explain how AI works in a few words",
);
console.log(result.response.text());
```

**Check billing:** GCP Console → Billing → Credits → GenAI App Builder usage

---

## Summary

| Endpoint                                                       | Uses Credits? | When to Use                   |
| -------------------------------------------------------------- | ------------- | ----------------------------- |
| `aiplatform.googleapis.com` (with API key)                     | ❌ No         | Quick testing, development    |
| `us-central1-aiplatform.googleapis.com` (with Service Account) | ✅ Yes        | Production, use your credits  |
| Vertex AI SDK (`@google-cloud/vertexai`)                       | ✅ Yes        | Recommended for your codebase |

---

## Important Reminders

1. **GenAI App Builder credits** only apply to:
   - Vertex AI Search (Data Store queries)
   - Vertex AI Grounded Generation
   - Vertex AI API calls (not AI Studio)

2. **Dialogflow CX credits** only apply to:
   - Dialogflow CX agents
   - Dialogflow CX audio/text sessions

3. **Standard Gemini API** (AI Studio) uses:
   - Separate API key billing
   - OR standard GCP billing
   - **NOT** your credits

---

**Your codebase is already set up correctly to use Vertex AI and your credits!** ✅
