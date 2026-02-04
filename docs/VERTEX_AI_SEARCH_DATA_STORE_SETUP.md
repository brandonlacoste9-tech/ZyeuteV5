# Vertex AI Search Data Store Setup (GenAI App Builder Credits)

**Credit Balance:** $1,367.95 (GenAI App Builder)  
**Purpose:** Index your entire Zyeuté codebase and Antigravity skills for RAG (Retrieval-Augmented Generation)  
**Result:** Max, Ti-Guy, and other agents query your private data store instead of hallucinating

---

## Why Vertex AI Search?

- **Uses GenAI App Builder Credits:** Standard Gemini API calls don't use these credits. You **must** use Vertex AI Search/Grounded Generation.
- **RAG (Retrieval-Augmented Generation):** Agents can query your codebase, docs, and skills before generating responses.
- **No Hallucination:** Answers are grounded in your actual Zyeuté architecture and Antigravity patterns.
- **Quebec Market:** Index Joual patterns, Quebec cultural references, and Zyeuté-specific logic.

---

## Step 1: Create Data Store in Google Cloud Console

### 1.1. Navigate to Vertex AI Search

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **`spatial-garden-483401-g8`**
3. Navigate to **Vertex AI Search** (or search "Discovery Engine" in the console)
4. Click **Create Data Store**

### 1.2. Configure Data Store

**Basic Settings:**

- **Name:** `zyeute-knowledge-base`
- **Display Name:** `Zyeuté Knowledge Base`
- **Data Store Type:** **Unstructured** (for code/docs)
- **Location:** `us-central1` (or your preferred region)

**Content Config:**

- **Ingestion Method:** **Cloud Storage** (recommended) or **API**
- **Storage Bucket:** Create or select a GCS bucket (e.g., `zyeute-knowledge-ingestion`)

**Advanced:**

- **Schema:** Leave default (auto-detected)
- **Indexing:** Enable **Semantic Search** (uses GenAI App Builder credits)

### 1.3. Get Data Store ID

After creation, note the **Data Store ID** (e.g., `zyeute-knowledge-base-1234567890`). You'll need this for `VERTEX_DATA_STORE_ID`.

---

## Step 2: Index Your Codebase

### 2.1. Prepare Files for Ingestion

Your codebase needs to be uploaded to GCS in a format Vertex AI Search can ingest:

**Supported Formats:**

- **Markdown** (`.md`) - Perfect for docs, READMEs, SKILL.md files
- **Text** (`.txt`)
- **PDF** (`.pdf`)
- **HTML** (`.html`)

**Recommended Structure:**

```
zyeute-knowledge-ingestion/
├── codebase/
│   ├── backend/
│   │   ├── routes.ts.md
│   │   ├── ai/
│   │   │   ├── vertex-service.ts.md
│   │   │   └── hive-router.ts.md
│   ├── frontend/
│   │   └── components/
│   └── docs/
│       ├── COLONY_IGNITION_SEQUENCE.md
│       └── CURSOR_VERTEX_AI_SETUP.md
├── antigravity-skills/
│   ├── external/antigravity-awesome-skills/skills/
│   │   ├── red-team-tactics/SKILL.md
│   │   └── ui-ux-pro-max/SKILL.md
│   └── external/antigravity-manager/docs/
└── quebec-context/
    ├── QUEBEC_STYLE_GUIDE.md
    └── joual-patterns.md
```

### 2.2. Use Indexing Script

Run the provided script to convert your codebase to markdown and upload to GCS:

```bash
tsx scripts/index-codebase-to-vertex-search.ts
```

This script will:

1. Convert `.ts`, `.tsx`, `.js` files to markdown with syntax highlighting
2. Upload to GCS bucket configured for your Data Store
3. Trigger Vertex AI Search ingestion

---

## Step 3: Configure Backend

### 3.1. Set Environment Variables

In Render/Railway env vars, add:

```bash
# Vertex AI Search (Data Store)
VERTEX_DATA_STORE_ID=zyeute-knowledge-base-1234567890
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_CLOUD_REGION=us-central1
```

### 3.2. Verify Vertex Bridge

The `backend/ai/vertex-bridge.ts` file already has the search logic. Ensure it's initialized:

```typescript
// backend/ai/vertex-bridge.ts
const DATA_STORE_ID =
  process.env.VERTEX_DATA_STORE_ID || "zyeute-knowledge-base";
```

---

## Step 4: Use RAG in Your Agents

### 4.1. Ti-Guy with RAG

Update Ti-Guy to query Data Store before generating responses:

```typescript
// backend/routes/tiguy.ts
import { VertexBridge } from "../ai/vertex-bridge.js";

// Before generating response:
const context = await VertexBridge.searchMemory(userMessage);
// Use context.results to ground the response
```

### 4.2. Max (WhatsApp) with RAG

When Max receives a question, query Data Store first:

```typescript
// Example: "What is the Voyageur Luxury design system?"
const searchResults = await VertexBridge.searchMemory(
  "Voyageur Luxury design system",
);
// Max replies with exact matches from your codebase
```

### 4.3. Cursor Composer with RAG

When you ask Cursor about Zyeuté architecture, it can query your Data Store via Vertex AI Search API.

---

## Step 5: Monitor Credit Usage

### 5.1. Check GenAI App Builder Credits

1. Go to **Google Cloud Console → Billing**
2. Select project: `spatial-garden-483401-g8`
3. View **Credits** section
4. Look for **GenAI App Builder** usage

**Expected Usage:**

- **Data Store Creation:** Free (one-time)
- **Indexing:** ~$0.01-0.10 per 1,000 documents
- **Search Queries:** ~$0.001-0.01 per query (semantic search)

### 5.2. Optimize Costs

- **Batch Indexing:** Upload files in batches, not one-by-one
- **Incremental Updates:** Only re-index changed files
- **Query Caching:** Cache frequent queries in Redis

---

## Troubleshooting

### Issue: Data Store not found

**Check:**

- `VERTEX_DATA_STORE_ID` is set correctly
- Data Store exists in correct project (`spatial-garden-483401-g8`)
- Service Account has **Discovery Engine Admin** role

**Fix:**

```bash
# Verify Data Store ID
gcloud discovery-engine data-stores list --project=spatial-garden-483401-g8
```

### Issue: Credits not being used

**Check:**

- You're using **Vertex AI Search API**, not standard Gemini API
- Data Store has **Semantic Search** enabled
- Queries go through `VertexBridge.searchMemory()`, not direct Gemini calls

**Fix:**

- Ensure all agent queries use `VertexBridge.searchMemory()` first
- Don't use `@google/generative-ai` directly (that uses different credits)

### Issue: Search returns no results

**Check:**

- Files are uploaded to GCS bucket
- Ingestion completed (check Data Store status in console)
- Query matches indexed content

**Fix:**

- Wait 5-10 minutes after upload for indexing to complete
- Check Data Store **Documents** tab to see indexed files

---

## Success Criteria

✅ **Data Store created** in GCP Console  
✅ **Codebase indexed** (check Data Store → Documents)  
✅ **`VERTEX_DATA_STORE_ID`** set in backend env vars  
✅ **`VertexBridge.searchMemory()`** returns results  
✅ **GenAI App Builder credits** showing usage in billing dashboard

---

## Next Steps

Once Data Store is live:

1. **Test RAG:** Ask Ti-Guy a Zyeuté-specific question (e.g., "How does the feed pagination work?")
2. **Index Antigravity Skills:** Run indexing script on `external/antigravity-awesome-skills/`
3. **Monitor Usage:** Check billing dashboard weekly to track credit burn rate

**With $1,367.95 in GenAI App Builder credits, you can index and query your entire Hive for months without cost.**
