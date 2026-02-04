# Service Account Setup Guide

**Service Account:** `vertex-express@floguru.iam.gserviceaccount.com`  
**Project:** `spatial-garden-483401-g8`

---

## Current Status

Based on verification:

- ✅ Service Account exists
- ⚠️ Roles need verification (permission denied - may need IAM Admin)
- ❌ Credentials not configured locally

---

## Step 1: Verify/Grant Roles

### Option A: If You Have IAM Admin Permissions

Run the grant script:

```powershell
npm run grant:service-account-roles
```

Or manually:

```powershell
gcloud projects add-iam-policy-binding spatial-garden-483401-g8 `
  --member="serviceAccount:vertex-express@floguru.iam.gserviceaccount.com" `
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding spatial-garden-483401-g8 `
  --member="serviceAccount:vertex-express@floguru.iam.gserviceaccount.com" `
  --role="roles/dialogflow.client"
```

### Option B: If You Don't Have IAM Admin Permissions

1. Ask a project owner/admin to grant these roles:
   - `roles/aiplatform.user` (Vertex AI User)
   - `roles/dialogflow.client` (Dialogflow API Client)

2. Or verify manually in GCP Console:
   - Go to [IAM & Admin → IAM](https://console.cloud.google.com/iam-admin/iam)
   - Find: `vertex-express@floguru.iam.gserviceaccount.com`
   - Check if roles are listed

---

## Step 2: Get Service Account Key

1. Go to [GCP Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Find: `vertex-express@floguru.iam.gserviceaccount.com`
3. Click **Keys** tab → **Add Key** → **Create new key** → **JSON**
4. Download the JSON file
5. **Save it securely** (don't commit to git)

---

## Step 3: Configure Credentials Locally

### Option A: Use File Path (Recommended for Local)

1. Save the JSON key file somewhere safe (e.g., `C:\Users\north\.gcp\vertex-express-key.json`)
2. Create `.env` file in project root (if it doesn't exist)
3. Add:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\north\.gcp\vertex-express-key.json
   GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
   GOOGLE_CLOUD_REGION=us-central1
   ```

### Option B: Use Inline JSON (For Cloud Platforms)

1. Open the JSON key file
2. Copy entire contents (one line)
3. In Render/Railway env vars, add:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"floguru",...}
   ```

**⚠️ Security:** Never commit the JSON key to git. `.env` is gitignored.

---

## Step 4: Verify Configuration

```bash
npm run verify:service-account
```

**Expected Output:**

```
✅ Service Account exists
✅ Required roles: ✅ (or ⚠️ if permission denied but roles exist)
✅ Credentials configured: ✅
```

---

## Troubleshooting

### Issue: "Permission denied" when checking roles

**This is OK if:**

- You don't have IAM Admin permissions
- Roles might already be granted
- You can verify manually in GCP Console

**Solution:**

- Check roles manually in GCP Console
- Or ask project admin to verify/grant roles

### Issue: "No credentials configured"

**Solution:**

- Set `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_SERVICE_ACCOUNT_JSON`
- See Step 3 above

### Issue: "Service Account not found"

**Check:**

- Service Account email is correct: `vertex-express@floguru.iam.gserviceaccount.com`
- Project ID is correct: `spatial-garden-483401-g8` or `floguru`
- You have permission to view Service Accounts

**Solution:**

- Verify Service Account exists in GCP Console
- Check project ID matches

---

## Quick Setup Checklist

- [ ] Service Account exists (`vertex-express@floguru.iam.gserviceaccount.com`)
- [ ] Roles granted (or verified manually):
  - [ ] `roles/aiplatform.user`
  - [ ] `roles/dialogflow.client`
- [ ] Service Account key downloaded (JSON file)
- [ ] Credentials configured:
  - [ ] `GOOGLE_APPLICATION_CREDENTIALS` set (file path)
  - [ ] OR `GOOGLE_SERVICE_ACCOUNT_JSON` set (inline JSON)
- [ ] Verification passes: `npm run verify:service-account`

---

**Once all steps are complete, your Service Account is ready to use Vertex AI and Dialogflow CX credits!** ✅
