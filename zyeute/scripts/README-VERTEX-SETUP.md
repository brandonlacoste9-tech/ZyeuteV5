# Vertex AI Setup Guide

## Quick Start

1. **Download Service Account JSON Key**
   - Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
   - Find: `vertex-express@gen-lang-client-0092649281.iam.gserviceaccount.com`
   - Click → Keys → Add Key → Create new key → JSON
   - Save the file securely (e.g., `zyeute/backend/.keys/vertex-express-key.json`)

2. **Add to `.env` file**
   ```bash
   GOOGLE_CLOUD_PROJECT=gen-lang-client-0092649281
   GOOGLE_CLOUD_REGION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=zyeute/backend/.keys/vertex-express-key.json
   ```

3. **Test the connection**
   ```bash
   npm run test:vertex
   ```

## Verify Setup

Run the test script to verify everything works:

```bash
npm run test:vertex
```

Expected output:
```
🤖 Testing Vertex AI Setup
============================================================
📍 Project: gen-lang-client-0092649281
📍 Region: us-central1

✅ Found credentials file: zyeute/backend/.keys/vertex-express-key.json
🔌 Connecting to Vertex AI...
📝 Testing Gemini 2.0 Flash model...
✅ Vertex AI is working!
```

## Troubleshooting

### Error: "GOOGLE_CLOUD_PROJECT not set"
- Add `GOOGLE_CLOUD_PROJECT=gen-lang-client-0092649281` to `.env`

### Error: "No credentials found"
- Check `GOOGLE_APPLICATION_CREDENTIALS` points to valid JSON file
- Or set `GOOGLE_SERVICE_ACCOUNT_JSON` with the full JSON as a string

### Error: "Vertex AI API not enabled"
- Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
- Click "Enable"

### Error: "Permission denied"
- Check service account has "Vertex AI User" role
- Go to: IAM & Admin → IAM → Find your service account → Edit → Add role

## Security Notes

- ✅ Service account keys are in `.gitignore`
- ✅ Never commit JSON keys to git
- ✅ Keep keys secure (like passwords)

## Next Steps

Once Vertex AI is working:
1. Test video pipeline: `npm run test:video-pipeline`
2. Upload a video to test Smart AI Router
3. Verify AI metadata extraction
