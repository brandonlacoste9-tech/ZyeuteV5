# Local Environment Setup (.env)

**Service Account Key Path:** `c:\Users\north\AppData\Local\Perplexity\Comet\Application\143.2.7499.37654\floguru-6fad5f1c8273.json`

---

## Quick Setup

### 1. Create `.env` File

In your project root (`c:\Users\north\ZyeuteV5`), create a `.env` file (if it doesn't exist).

### 2. Add Service Account Configuration

Add these lines to your `.env` file:

```bash
# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=c:\Users\north\AppData\Local\Perplexity\Comet\Application\143.2.7499.37654\floguru-6fad5f1c8273.json

# Dialogflow CX
DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_AGENT_ID

# Other required vars (copy from .env.example)
VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url
# ... etc
```

### 3. Verify Configuration

```bash
npm run verify:service-account
```

---

## Security Reminders

- ✅ `.env` is in `.gitignore` - safe to have secrets
- ✅ Service Account key file is outside project directory - good
- ❌ Never commit `.env` to git
- ❌ Never commit Service Account JSON files to git

---

## Alternative: Use Relative Path

If you prefer, you can copy the key file to your project (but make sure it's gitignored):

```bash
# Copy key file to project (gitignored location)
mkdir -p .secrets
copy "c:\Users\north\AppData\Local\Perplexity\Comet\Application\143.2.7499.37654\floguru-6fad5f1c8273.json" .secrets\vertex-express-key.json
```

Then in `.env`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=.secrets\vertex-express-key.json
```

**Make sure `.secrets/` is in `.gitignore`!**

---

## Verify File Access

Test that the file is readable:

```bash
# PowerShell
Test-Path "c:\Users\north\AppData\Local\Perplexity\Comet\Application\143.2.7499.37654\floguru-6fad5f1c8273.json"

# Should return: True
```

---

**Once `.env` is configured, run `npm run verify:service-account` to verify everything works!** ✅
