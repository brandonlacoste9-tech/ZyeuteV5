# Zyeuté Credits "War Chest" Summary

**Total Credits:** $2,181.11  
**Project:** `spatial-garden-483401-g8`  
**Expiration:** January/February 2027

---

## Credit Breakdown

| Credit Type           | Balance       | Purpose                                     | Setup Guide                                 |
| --------------------- | ------------- | ------------------------------------------- | ------------------------------------------- |
| **GenAI App Builder** | **$1,367.95** | Vertex AI Search (RAG), Grounded Generation | `docs/VERTEX_AI_SEARCH_DATA_STORE_SETUP.md` |
| **Dialogflow CX**     | **$813.16**   | Voice commands, audio sessions, Joual NLU   | `docs/DIALOGFLOW_CX_VOICE_SETUP.md`         |

---

## Critical Rule: Use the Right Credits

⚠️ **IMPORTANT:** These credits are **specific** to certain services:

- **GenAI App Builder credits** do **NOT** apply to:
  - Standard Gemini API calls (AI Studio)
  - Direct Vertex AI Gemini API calls
  - **They ONLY apply to:**
    - Vertex AI Search (Data Store queries)
    - Grounded Generation (RAG with your data)
    - GenAI App Builder features

- **Dialogflow CX credits** do **NOT** apply to:
  - Dialogflow ES (standard edition)
  - Other Google Cloud services
  - **They ONLY apply to:**
    - Dialogflow CX agents
    - Audio sessions
    - Text sessions in Dialogflow CX

---

## How to Use Each Credit Type

### GenAI App Builder ($1,367.95)

**Best Use Cases:**

1. **RAG (Retrieval-Augmented Generation):** Index your codebase → Query before generating
2. **Grounded Generation:** Generate responses based on your Zyeuté data
3. **Agent Memory:** Max and Ti-Guy query your private knowledge base

**Setup:**

1. Create Vertex AI Search Data Store
2. Index codebase: `tsx scripts/index-codebase-to-vertex-search.ts`
3. Use `VertexBridge.searchMemory()` in agents

**Expected Burn Rate:**

- Indexing: ~$0.01-0.10 per 1,000 documents (one-time)
- Queries: ~$0.001-0.01 per search
- **With $1,367.95:** Millions of queries over 1+ year

---

### Dialogflow CX ($813.16)

**Best Use Cases:**

1. **Voice Navigation:** "Zyeuté, montre-moi le feed"
2. **Joual Support:** Understand Quebec French slang
3. **Multi-Channel:** WhatsApp (Max), in-app, phone lines

**Setup:**

1. Create Dialogflow CX agent (French Canada)
2. Create intents for Zyeuté commands
3. Configure webhook to backend
4. Integrate voice component in frontend

**Expected Burn Rate:**

- Audio sessions: ~$0.01-0.05 per session
- Text sessions: ~$0.001-0.01 per session
- **With $813.16:** Thousands of voice sessions over 1+ year

---

## Monitoring Credit Usage

### Check Credits in GCP Console

1. Go to [Google Cloud Console → Billing](https://console.cloud.google.com/billing)
2. Select project: `spatial-garden-483401-g8`
3. View **Credits** section
4. Look for:
   - **GenAI App Builder** usage
   - **Dialogflow CX** usage

### Expected Usage Patterns

**GenAI App Builder:**

- Spike during initial indexing (one-time)
- Steady query usage as agents use RAG
- Should last 12+ months at current usage

**Dialogflow CX:**

- Steady session usage as users adopt voice
- Spikes during feature launches
- Should last 12+ months at current usage

---

## Optimization Tips

### GenAI App Builder

- **Batch Indexing:** Upload files in batches, not one-by-one
- **Incremental Updates:** Only re-index changed files
- **Query Caching:** Cache frequent queries in Redis
- **Selective Indexing:** Don't index `node_modules` or build artifacts

### Dialogflow CX

- **Cache Responses:** Cache common queries in Redis
- **Text Fallback:** Offer text input as alternative to voice
- **Batch Sessions:** Group related commands
- **Intent Optimization:** Consolidate similar intents

---

## Troubleshooting

### Credits Not Being Used

**Check:**

- You're using the **correct service** (Vertex AI Search, not Gemini API)
- Agent is in correct project (`spatial-garden-483401-g8`)
- Service Account has proper roles

**Fix:**

- Verify service usage in GCP Console → APIs & Services
- Check billing dashboard for credit application

### Credits Expiring Soon

**Check:**

- Expiration date in billing dashboard
- Current usage rate
- Projected burn rate

**Fix:**

- Increase usage before expiration
- Migrate to paid tier if credits run out
- Request additional credits from Google Cloud support

---

## Success Metrics

✅ **GenAI App Builder:** Data Store created, codebase indexed, RAG queries working  
✅ **Dialogflow CX:** Agent created, voice commands working, Joual support enabled  
✅ **Credit Usage:** Both credits showing usage in billing dashboard  
✅ **Cost:** $0 spent (all covered by credits)

---

**With $2,181.11 in credits and proper setup, you're operating a high-performance AI-powered social platform at zero cost for 12+ months.**
