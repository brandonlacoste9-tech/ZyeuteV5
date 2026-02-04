# Service Account Key ID Reference

**Key ID:** `6fad5f1c82734ae6e88d97d2a5ba2bfb7302684e`  
**Service Account:** `vertex-express@floguru.iam.gserviceaccount.com`

---

## What is a Key ID?

The `private_key_id` is a **public identifier** for a Service Account key. It's:

- ✅ **Safe to document** (not sensitive)
- ✅ Used to identify which key is being used
- ✅ Visible in GCP Console → Service Accounts → Keys
- ❌ **NOT** the private key itself (that's the `private_key` field)

---

## Security Status

**This Key ID is safe:**

- It's a public identifier, not a secret
- It cannot be used to authenticate
- It's visible in GCP Console

**What IS sensitive:**

- `private_key` field (the actual private key)
- Full Service Account JSON file
- These should NEVER be committed to git

---

## Using This Key ID

If you have the Service Account JSON file with this key ID:

1. **Verify it matches:**
   - Open your Service Account JSON file
   - Check `private_key_id` field matches: `6fad5f1c82734ae6e88d97d2a5ba2bfb7302684e`

2. **Configure credentials:**

   ```bash
   # In .env file (gitignored)
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/vertex-express-key.json
   ```

3. **Verify configuration:**
   ```bash
   npm run verify:service-account
   ```

---

## If You Need a New Key

If this key is compromised or you need to rotate:

1. **Delete old key:**
   - GCP Console → Service Accounts → `vertex-express@floguru.iam.gserviceaccount.com`
   - Keys tab → Find key with ID `6fad5f1c82734ae6e88d97d2a5ba2bfb7302684e`
   - Delete it

2. **Create new key:**
   - Keys tab → Add Key → Create new key → JSON
   - Download new JSON file
   - Update `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_SERVICE_ACCOUNT_JSON`

3. **Update everywhere:**
   - Local `.env` file
   - Render/Railway environment variables
   - Any other places using this key

---

## Verification

To verify this key ID is from your Service Account:

```bash
# Check if key exists (requires IAM Admin permissions)
gcloud iam service-accounts keys list \
  --iam-account=vertex-express@floguru.iam.gserviceaccount.com \
  --project=spatial-garden-483401-g8
```

**Expected:** Key ID `6fad5f1c82734ae6e88d97d2a5ba2bfb7302684e` should appear in the list.

---

**Key ID documented. This is safe to keep in documentation.** ✅
