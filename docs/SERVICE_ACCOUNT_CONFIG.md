# Service Account Configuration

**Service Account:** `vertex-express@floguru.iam.gserviceaccount.com`  
**Project:** `spatial-garden-483401-g8` (or `floguru` if different)  
**Purpose:** Vertex AI, Dialogflow CX, GCS access for Zyeuté

---

## ⚠️ Security: Never Commit Service Account Keys

**CRITICAL:** The Service Account email is public information, but the **private key JSON file** must never be committed to git.

---

## Required Roles

This Service Account should have the following roles:

### 1. Vertex AI Access

- **Vertex AI User** (`roles/aiplatform.user`)
  - Required for: Gemini API calls, Vertex AI Search, Grounded Generation
  - Uses: GenAI App Builder credits ($1,367.95)

### 2. Dialogflow CX Access

- **Dialogflow API Client** (`roles/dialogflow.client`)
  - Required for: Dialogflow CX agent interactions
  - Uses: Dialogflow CX credits ($813.16)

### 3. GCS Access (Optional)

- **Storage Object Viewer** (`roles/storage.objectViewer`)
  - Required for: Reading from GCS buckets (if using GCS for data)
- **Storage Object Creator** (`roles/storage.objectCreator`)
  - Required for: Writing to GCS buckets (if uploading files)

---

## Configuration

### Environment Variables

**Production (Render/Railway):**

```bash
# Option 1: Inline JSON (recommended for cloud platforms)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"floguru","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"vertex-express@floguru.iam.gserviceaccount.com",...}

# Option 2: File path (if you upload the JSON file)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/vertex-express-key.json
```

**Local Development (.env):**

```bash
# Option 1: File path (recommended for local)
GOOGLE_APPLICATION_CREDENTIALS=./vertex-express-key.json

# Option 2: Inline JSON
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## Verification

### Check Service Account Permissions

```bash
# List roles for the service account
gcloud projects get-iam-policy spatial-garden-483401-g8 \
  --flatten="bindings[].members" \
  --filter="bindings.members:vertex-express@floguru.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

**Expected Roles:**

- `roles/aiplatform.user` (Vertex AI User)
- `roles/dialogflow.client` (Dialogflow API Client)
- `roles/storage.objectViewer` (optional, for GCS)

### Test Service Account Access

```bash
# Test Vertex AI access
tsx scripts/test-vertex-ai-direct.ts

# Test Dialogflow CX access
tsx scripts/test-dialogflow-cx-connection.ts

# Test GCS access
npm run verify:gcs
```

---

## Usage in Code

Your codebase automatically uses this Service Account when configured:

**`backend/ai/vertex-service.ts`:**

```typescript
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  vertexAIConfig.googleAuthOptions = { credentials };
  // Uses vertex-express@floguru.iam.gserviceaccount.com
}
```

**`backend/ai/dialogflow-bridge.ts`:**

```typescript
// Uses same Service Account for Dialogflow CX
const client = new SessionsClient({
  apiEndpoint: `${LOCATION}-dialogflow.googleapis.com`,
});
```

---

## Security Checklist

- [ ] Service Account JSON file is **NOT** committed to git
- [ ] `.env` file is in `.gitignore`
- [ ] Service Account JSON is stored securely:
  - Production: Render/Railway environment variables (encrypted)
  - Local: `.env` file (gitignored)
- [ ] Service Account has **minimum required roles** only
- [ ] Service Account key is rotated periodically (every 90 days recommended)

---

## Getting the Service Account Key

If you need to download a new key:

1. Go to [GCP Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Find: `vertex-express@floguru.iam.gserviceaccount.com`
3. Click **Keys** tab → **Add Key** → **Create new key** → **JSON**
4. **Save securely** (don't commit to git)
5. Update environment variables with new key

---

## Troubleshooting

### Issue: "Permission denied" errors

**Check:**

- Service Account has required roles
- Key is valid and not expired
- Project ID matches (`spatial-garden-483401-g8` or `floguru`)

**Fix:**

````bash
**Option 1: Use Automated Script (Recommended)**

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\grant-service-account-roles.ps1
````

**Linux/Mac (Bash):**

```bash
bash scripts/grant-service-account-roles.sh
```

**Option 2: Manual gcloud Commands**

```bash
# Grant Vertex AI User role
gcloud projects add-iam-policy-binding spatial-garden-483401-g8 \
  --member="serviceAccount:vertex-express@floguru.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant Dialogflow API Client role
gcloud projects add-iam-policy-binding spatial-garden-483401-g8 \
  --member="serviceAccount:vertex-express@floguru.iam.gserviceaccount.com" \
  --role="roles/dialogflow.client"
```

**Verify:**

```bash
npm run verify:service-account
```

### Issue: Credits not being used

**Check:**

- Service Account is in correct project (`spatial-garden-483401-g8`)
- Using Vertex AI endpoints (not AI Studio)
- Billing account is linked to project

**Fix:**

- Verify project ID in environment variables
- Check billing dashboard for credit application

---

**Service Account configured! Ready to use Vertex AI and Dialogflow CX credits.** ✅
