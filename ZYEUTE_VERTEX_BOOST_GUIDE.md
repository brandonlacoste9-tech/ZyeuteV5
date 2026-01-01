# 🔥 Zyeuté Vertex Boost Guide 🚀⚜️

Complete guide to populate Zyeuté feed with Quebec content and verify Vertex AI integration.

## ✅ Quick Start

```bash
# 1. Verify Vertex AI configuration
npm run verify:vertex

# 2. Run seed migration (requires DATABASE_URL from Railway)
npm run db:seed

# 3. Deploy to Railway and Vercel
npm run deploy
```

---

## 📋 Phase 1: Push Seed Data to Database

The seed migration (`migrations/0012_seed_initial_data.sql`) contains 15 Quebec-themed posts ready to populate your feed.

### Option A: Run Migration Script (Recommended)

```bash
npm run db:seed
```

This script will:
- ✅ Check database connection
- ✅ Verify users exist (required for posts)
- ✅ Execute the migration
- ✅ Verify posts were inserted
- ✅ Show sample posts

### Option B: Manual SQL Execution

If you prefer to run the migration manually:

1. **Get your database connection string from Railway:**
   - Go to Railway Dashboard → Your Project → Database
   - Copy the `DATABASE_URL` or `DIRECT_DATABASE_URL`

2. **Set it locally (for testing):**
   ```bash
   # Add to .env file
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

3. **Run the migration:**
   ```bash
   npm run db:seed
   ```

### Option C: Run via Railway CLI or SQL Editor

You can also run the migration directly in Railway:

1. **Via Railway Dashboard:**
   - Go to Railway → Your Database → Data
   - Open SQL Editor
   - Copy contents of `migrations/0012_seed_initial_data.sql`
   - Paste and execute

2. **Via psql:**
   ```bash
   # If you have Railway CLI installed
   railway connect postgres
   
   # Then paste the SQL from migrations/0012_seed_initial_data.sql
   ```

### ⚠️ Prerequisites

**You must have at least one user in the `user_profiles` table before running the seed migration!**

If you get "No users found" error:
1. Go to https://www.zyeute.com/signup
2. Create a test user account
3. Run `npm run db:seed` again

---

## 📋 Phase 2: Verify Vertex AI Configuration

### Check Configuration

```bash
npm run verify:vertex
```

This script checks:
- ✅ Environment variables (`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, etc.)
- ✅ Required packages (`@google-cloud/vertexai`, `@google-cloud/speech`, `@google-cloud/vision`)
- ✅ Configuration status

### Required Environment Variables

Set these in your Railway/Vercel environment:

```bash
# Google Cloud Project
GOOGLE_CLOUD_PROJECT_ID=unique-spirit-482300-s4
GOOGLE_CLOUD_REGION=us-central1

# Service Account Credentials (JSON string)
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# OR use a file path (for local development)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Verify Packages

The following packages should be in `package.json` (they already are!):
- ✅ `@google-cloud/vertexai` (^1.10.0)
- ✅ `@google-cloud/speech` (^6.7.0)
- ✅ `@google-cloud/vision` (^4.3.2)

If verification shows "NOT INSTALLED", this is normal for local development. They'll be installed on Railway during deployment.

### Configuration Files

Vertex AI is configured in:
- `backend/ai/vertex-service.ts` - Main Vertex AI service
- `backend/ai/vertex-gemini.ts` - Gemini model wrapper

Both files use environment variables and have fallbacks if Vertex AI isn't configured.

---

## 📋 Phase 3: Test Vertex AI Post Generation (Optional)

If you want to generate AI-powered posts using Vertex AI instead of manual seed data:

### Create AI Post Generation Script

```typescript
// scripts/generate-ai-posts.ts
import { vertexService } from '../backend/ai/vertex-service.js';
import { storage } from '../backend/storage.js';

async function generateAIPosts() {
  const topics = [
    "Poutine traditionnel de Montréal",
    "Match de hockey au Centre Bell",
    "Festival de Jazz de Montréal",
    "Vieux-Québec en hiver",
    "Cabane à sucre au printemps"
  ];

  for (const topic of topics) {
    try {
      const response = await vertexService.generateContent({
        mode: "content",
        message: `Écris un post engageant sur: ${topic}. Style: québécois authentique, 2-3 phrases avec hashtags.`,
        language: "fr"
      });

      // Create post using storage service
      // (You'll need to get a user_id from your database)
      console.log(`✅ Generated AI post: ${topic}`);
      console.log(`   Content: ${response.content.substring(0, 100)}...`);
    } catch (error) {
      console.error(`❌ Failed to generate post for ${topic}:`, error);
    }
  }
}

generateAIPosts()
  .then(() => console.log('🎉 All AI posts generated!'))
  .catch(console.error);
```

**Note:** This is optional. The manual seed data is already perfect for getting started!

---

## 📋 Phase 4: Verify Results

### Check Database

```bash
# If you have DATABASE_URL set locally
psql $DATABASE_URL -c "SELECT COUNT(*) FROM publications WHERE hive_id = 'quebec';"

# Should return: 15 (or more if you run it multiple times)
```

### Check Feed API

```bash
# If your backend is running locally
curl http://localhost:3000/api/feed | jq '.posts | length'

# Or check the live API
curl https://zyeute-api.railway.app/api/feed | jq '.posts | length'
```

### Check Frontend

1. Open browser to: https://www.zyeute.com/feed
2. You should see 15 Quebec-themed posts
3. Posts should have images, hashtags, and realistic engagement metrics

---

## 📋 Phase 5: Deploy to Railway

### Automatic Deployment

```bash
npm run deploy
```

This script will:
1. ✅ Check git status
2. ✅ Push to GitHub (if needed)
3. ✅ Trigger Railway deployment (via GitHub webhook)
4. ✅ Trigger Vercel deployment (via CLI if available)

### Manual Deployment

```bash
# Commit and push
git add .
git commit -m "feat: Add Quebec seed data and verify Vertex AI integration"
git push origin main

# Railway will auto-deploy from GitHub push
# Vercel will deploy via GitHub Actions (if secrets configured)
```

### Verify Deployment

After deployment, check:

1. **Railway Dashboard:**
   - https://railway.app/dashboard
   - Check deployment logs
   - Verify database migration ran

2. **Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Check deployment status
   - Verify build succeeded

3. **GitHub Actions:**
   - https://github.com/brandonlacoste9-tech/ZyeuteV5/actions
   - Check "Deploy to Production" workflow

---

## 🔥 Bonus: Enhanced Vertex AI Features

### Option A: Enable AI Post Composition for Users

The Studio API endpoint `/api/studio/compose-post` can be upgraded to use Vertex AI:

1. Edit `backend/routes.ts`
2. Find the `/api/studio/compose-post` endpoint
3. Replace DeepSeek with Vertex AI:
   ```typescript
   import { vertexService } from './ai/vertex-service.js';
   
   const aiContent = await vertexService.generateContent({
     mode: "content",
     message: prompt,
     language: "fr"
   });
   ```

### Option B: Ti-Guy AI Comments (Already Using Vertex AI!)

Ti-Guy automated comments already use Vertex AI! Verify it's working:

- Check `backend/services/engagementService.ts`
- Look for `vertexService` usage
- Ti-Guy comments should appear on posts automatically

---

## 🚨 Troubleshooting

### Migration Fails: "No users found"

**Solution:** Create a user account first
1. Go to https://www.zyeute.com/signup
2. Create a test account
3. Run `npm run db:seed` again

### Migration Fails: "DATABASE_URL not found"

**Solution:** Set database connection
1. Get `DATABASE_URL` from Railway dashboard
2. Add to `.env` file: `DATABASE_URL=postgresql://...`
3. Or run migration directly in Railway SQL Editor

### Vertex AI: "NOT INSTALLED"

**This is normal!** The packages are in `package.json` and will be installed on Railway during deployment. Local development doesn't require them unless you're testing Vertex AI features.

### Vertex AI: "Not configured"

**Solution:** Set environment variables in Railway
1. Go to Railway Dashboard → Your Service → Variables
2. Add:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
   - `GOOGLE_CLOUD_REGION` (optional, defaults to us-central1)

### Feed Still Empty After Migration

**Check:**
1. Verify posts exist: `SELECT COUNT(*) FROM publications WHERE hive_id = 'quebec';`
2. Check feed endpoint: `curl https://zyeute-api.railway.app/api/feed`
3. Check browser console for API errors
4. Verify feed query in `backend/storage.ts` (function `getFeedPosts`)

---

## 📊 Success Metrics

After completing these steps, you should have:

✅ **15 Quebec posts** visible at www.zyeute.com/feed  
✅ **Vertex AI** configured (if credentials provided)  
✅ **Ti-Guy AI comments** working on posts (if Vertex AI configured)  
✅ **Railway deployment** successful  
✅ **Feed fully functional** with Quebec content  

---

## 🦫⚜️ Quick Command Reference

```bash
# Verify Vertex AI config
npm run verify:vertex

# Run seed migration
npm run db:seed

# Deploy to Railway and Vercel
npm run deploy

# Check all at once
npm run verify:vertex && npm run db:seed && npm run deploy
```

---

**Let's go, tabarnak!** 🇨🇦🔥
