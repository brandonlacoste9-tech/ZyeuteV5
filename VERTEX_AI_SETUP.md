# 🚀 Vertex AI Setup Guide - Using Your $700 Credits

## ✅ What's Already Configured

You have Vertex AI infrastructure in place:

- ✅ `@google-cloud/discoveryengine` - Discovery Engine for search
- ✅ `@google-cloud/vertexai` - Vertex AI Gemini models (just added)
- ✅ `backend/ai/vertex-bridge.ts` - Discovery Engine integration
- ✅ `backend/ai/vertex-gemini.ts` - Vertex AI Gemini integration (NEW)
- ✅ Services updated to use Vertex AI (with fallback to free API)

## 🔧 Required Environment Variables

Add these to your `.env` file or Railway environment variables:

```bash
# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
VERTEX_AI_PROJECT_ID=your-project-id  # Same as above
VERTEX_AI_LOCATION=us-central1  # or us-east1, europe-west1, etc.

# Discovery Engine (Optional - for search/knowledge base)
VERTEX_DATA_STORE_ID=your-data-store-id
GOOGLE_CLOUD_REGION=global

# Authentication (Choose ONE method)
# Option 1: Service Account Key (Recommended for production)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Option 2: Application Default Credentials (if running on GCP)
# No env var needed - uses default credentials

# Fallback: Free Gemini API (if Vertex AI not configured)
GEMINI_API_KEY=your-free-api-key  # Keep as fallback
```

## 📋 Quick Setup Steps

### 1. Enable Vertex AI API in Google Cloud Console

1. Go to: https://console.cloud.google.com/vertex-ai
2. Select your project
3. Enable: **Vertex AI API**
4. Enable: **Discovery Engine API** (if using search)

### 2. Create Service Account (for Railway/production)

```bash
# Create service account
gcloud iam service-accounts create zyeute-vertex-ai \
  --description="Zyeuté Vertex AI Service Account" \
  --display-name="Zyeuté Vertex AI"

# Grant Vertex AI permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:zyeute-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant Discovery Engine permissions (if using)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:zyeute-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/discoveryengine.viewer"

# Download key
gcloud iam service-accounts keys create vertex-ai-key.json \
  --iam-account=zyeute-vertex-ai@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Upload Service Account Key to Railway

1. Go to Railway dashboard → Your project → Variables
2. Add `GOOGLE_APPLICATION_CREDENTIALS` as a file variable
3. Upload the `vertex-ai-key.json` file
4. Add other env vars:
   - `GOOGLE_CLOUD_PROJECT=your-project-id`
   - `VERTEX_AI_LOCATION=us-central1`

### 4. Test Vertex AI Connection

The code will automatically:

- ✅ Try Vertex AI first (uses your $700 credits)
- ✅ Fallback to free Gemini API if Vertex AI not configured
- ✅ Log which service is being used

## 💰 Cost Optimization with $700 Credits

### What Uses Credits:

- ✅ **Gemini 1.5 Flash** - ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
- ✅ **Gemini 1.5 Pro** - ~$1.25 per 1M input tokens, ~$5.00 per 1M output tokens
- ✅ **Gemini Pro Vision** - ~$0.25 per image
- ✅ **text-embedding-004** - ~$0.0001 per 1K characters
- ✅ **Discovery Engine** - ~$0.10 per 1K queries

### Estimated Usage:

With $700 credits, you can handle:

- **~9M tokens** with Gemini Pro (or ~50M tokens with Flash)
- **~2,800 images** with Gemini Pro Vision
- **~7M characters** of embeddings
- **~7,000 search queries** with Discovery Engine

**Estimated Duration:** 3-6 months depending on usage

## 🎯 What's Now Using Vertex AI

### Services Updated:

1. **Joualizer** (`backend/services/joualizer.ts`)
   - Text transformation to Quebec Joual
   - Uses Vertex AI Gemini Flash

2. **Engagement Service** (`backend/services/engagementService.ts`)
   - Ti-Guy automated comments
   - Uses Vertex AI Gemini Flash

3. **Vertex Bridge** (`backend/ai/vertex-bridge.ts`)
   - Discovery Engine search
   - Knowledge base queries

### How It Works:

```typescript
// Services automatically try Vertex AI first, fallback to free API
import { getVertexGeminiModel } from "../ai/vertex-gemini.js";

const model =
  (await getVertexGeminiModel("gemini-1.5-flash")) ||
  getGeminiModel("gemini-1.5-flash"); // Fallback
```

## 🔍 Monitoring Your Credits

1. **Google Cloud Console:**
   - Go to: https://console.cloud.google.com/billing
   - Select your project
   - View "Cost breakdown" → "Vertex AI"

2. **Set Up Billing Alerts:**
   - Go to: Billing → Budgets & alerts
   - Create budget: $500 (warn at 70% = $350)
   - Create budget: $650 (warn at 90% = $585)

## 🚨 Troubleshooting

### "Vertex AI not available" warnings:

- ✅ This is normal - code falls back to free API
- ✅ Check `GOOGLE_APPLICATION_CREDENTIALS` is set
- ✅ Verify service account has `aiplatform.user` role

### "Discovery Engine not available":

- ✅ This is optional - only needed for search features
- ✅ Set `VERTEX_DATA_STORE_ID` if you want to use it

### Still using free API:

- ✅ Check logs for `[VertexGemini]` messages
- ✅ Verify environment variables are set in Railway
- ✅ Restart Railway service after adding env vars

## 📊 Next Steps

1. **Set up environment variables** in Railway
2. **Deploy and test** - check logs for Vertex AI usage
3. **Monitor credits** - set up billing alerts
4. **Optimize usage** - use Flash for most tasks, Pro only when needed

## 🎉 Benefits of Using Vertex AI

- ✅ **Better rate limits** - No 60 req/min limit
- ✅ **More reliable** - Production-grade infrastructure
- ✅ **Better Quebec French** - Improved understanding
- ✅ **Cost tracking** - Clear billing in GCP console
- ✅ **Scalability** - Ready for production traffic

---

**Your $700 credits will power Zyeuté's AI features for months!** 🚀🇨🇦
