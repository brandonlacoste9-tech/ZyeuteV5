# Max (OpenClaw) Setup Guide 🐝

**Max:** WhatsApp Production Manager via OpenClaw  
**Phone:** +15143481161  
**Status:** Installing...

---

## Installation

**PowerShell Command:**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

This installs OpenClaw CLI and sets up Max.

---

## Configuration

### 1. Set Max API Token

Max needs to authenticate with Zyeuté backend using the token we configured:

**Token:** `p8KXOOrrGHmOsJF5aKprjaytb8df156q`

**Set in Max's configuration:**

- Max will need this token to call `/api/max/*` endpoints
- Configure in OpenClaw settings or Max's config file

### 2. Configure Backend URL

**Local Development:**

```
http://localhost:3000
```

**Production (Railway):**

```
https://zyeutev5-production.up.railway.app
```

### 3. Max Commands Configuration

Max can execute these Zyeuté commands:

| Command                 | Endpoint                          | What It Does             |
| ----------------------- | --------------------------------- | ------------------------ |
| `status`                | `/api/max/status`                 | System health check      |
| `verify:gcs`            | `/api/max/verify-gcs`             | GCS storage verification |
| `scan the hive`         | `/api/max/security-audit`         | Security audit           |
| `check service account` | `/api/max/verify-service-account` | Verify credentials       |

---

## Testing Max Connection

### Test 1: Max → Backend API

**Via WhatsApp:**

- Send to: **+15143481161**
- Message: `status`
- Max should reply with system status

**Expected Response:**

```
System: Zyeuté Colony OS
Status: operational
Backend: online
```

### Test 2: Verify Max API Endpoints

**Run locally:**

```bash
npm run wake:max
```

**Or test Railway endpoint:**

```bash
curl -H "Authorization: p8KXOOrrGHmOsJF5aKprjaytb8df156q" \
  https://zyeutev5-production.up.railway.app/api/max/status
```

---

## Max Configuration File

After installation, Max may need a config file. Create or update:

**Location:** `~/.openclaw/config.json` or similar

**Configuration:**

```json
{
  "backend": {
    "url": "https://zyeutev5-production.up.railway.app",
    "apiToken": "p8KXOOrrGHmOsJF5aKprjaytb8df156q"
  },
  "whatsapp": {
    "phone": "+15143481161"
  },
  "commands": {
    "status": "/api/max/status",
    "verify:gcs": "/api/max/verify-gcs",
    "security-audit": "/api/max/security-audit",
    "verify-service-account": "/api/max/verify-service-account"
  }
}
```

---

## Troubleshooting

### Max Not Responding

**Check:**

1. OpenClaw is installed and running
2. WhatsApp integration is configured
3. Backend URL is correct
4. API token matches (`p8KXOOrrGHmOsJF5aKprjaytb8df156q`)

### Max Can't Reach Backend

**Check:**

1. Backend is running (local) or deployed (Railway)
2. Backend URL is accessible
3. CORS is configured (already done ✅)
4. API token is set correctly

### Max Returns "Unauthorized"

**Fix:**

- Verify `MAX_API_TOKEN` matches in:
  - Max's configuration
  - Railway Variables (if using production)
  - Local `.env` (if using local backend)

---

## Next Steps

1. ✅ Install OpenClaw (running now)
2. ⏳ Configure Max with backend URL and token
3. ⏳ Test Max via WhatsApp
4. ⏳ Verify Max can execute Zyeuté commands

---

**Max is installing! Once complete, configure the backend connection and test.** 🐝
