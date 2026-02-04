# Wake Up Max 🐝

**Max:** WhatsApp Production Manager  
**Phone:** +15143481161  
**Status:** 🟢 Listening

---

## Quick Test: Wake Max Up

### Option 1: Quick Wake-Up Script (Easiest)

1. **Start Backend:**

   ```bash
   npm run dev
   ```

2. **Set MAX_API_TOKEN** (in `.env`):

   ```bash
   MAX_API_TOKEN=your-secret-token-here
   ```

3. **Wake Max:**
   ```bash
   npm run wake:max
   ```

**Expected Output:**

```
🐝 Waking up Max...
✅ Max is AWAKE and responding!
📊 System Status:
   System: Zyeuté Colony OS
   Status: operational
```

---

### Option 2: Test Max API Endpoints

1. **Start Backend:**

   ```bash
   npm run dev
   ```

2. **Set MAX_API_TOKEN** (in `.env`):

   ```bash
   MAX_API_TOKEN=your-secret-token-here
   ```

3. **Test Max API:**
   ```bash
   tsx scripts/test-max-api.ts --endpoint=status --token=your-secret-token-here
   ```

**Expected Response:**

```json
{
  "timestamp": "2026-02-03T...",
  "system": "Zyeuté Colony OS",
  "status": "operational",
  "components": {
    "backend": "online",
    ...
  }
}
```

---

### Option 2: Send WhatsApp Message to Max

**Send to:** +15143481161

**Test Messages:**

- `status` - Check system status
- `verify:gcs` - Run GCS verification
- `scan the hive` - Run security audit
- `check service account` - Verify Service Account config

**Expected:** Max replies with command results

---

## Max API Endpoints

### 1. Status Check

```
GET /api/max/status
```

**Max Command:** `status` or `health`

**Response:**

```json
{
  "status": "operational",
  "components": {
    "backend": "online",
    "database": "online",
    ...
  }
}
```

---

### 2. GCS Verification

```
GET /api/max/verify-gcs
```

**Max Command:** `verify:gcs` or `check gcs`

**Response:**

```json
{
  "status": "success",
  "command": "verify:gcs",
  "output": "🔍 Verifying @google-cloud/storage...\n✅ SDK loaded successfully..."
}
```

---

### 3. Security Audit

```
GET /api/max/security-audit
```

**Max Command:** `scan the hive` or `security audit`

**Response:**

```json
{
  "status": "success",
  "command": "security-audit",
  "output": "🔒 Verifying secrets security...\n✅ All files are secure!",
  "hasIssues": false
}
```

---

### 4. Service Account Verification

```
GET /api/max/verify-service-account
```

**Max Command:** `check service account` or `verify credentials`

**Response:**

```json
{
  "status": "success",
  "command": "verify-service-account",
  "output": "🔒 Verifying Service Account Configuration...\n✅ Service Account is configured correctly!"
}
```

---

### 5. Generic Command Handler

```
POST /api/max/command
Body: { "command": "verify:gcs", "args": {} }
```

**Max Command:** Any supported command

---

## Authentication

All Max API endpoints require authentication:

**Header:**

```
Authorization: YOUR_MAX_API_TOKEN
```

**Or:**

```
X-Max-API-Token: YOUR_MAX_API_TOKEN
```

**Set Token:**

- Backend: `MAX_API_TOKEN` environment variable
- Test: `--token=YOUR_TOKEN` flag or `MAX_API_TOKEN` in `.env`

---

## Testing All Endpoints

```bash
tsx scripts/test-max-api.ts --endpoint=all --token=YOUR_TOKEN
```

This tests:

- `/api/max/status`
- `/api/max/verify-gcs`
- `/api/max/security-audit`
- `/api/max/verify-service-account`

---

## Max Commands Reference

| WhatsApp Message        | Endpoint                          | Action                   |
| ----------------------- | --------------------------------- | ------------------------ |
| `status`                | `/api/max/status`                 | System health check      |
| `verify:gcs`            | `/api/max/verify-gcs`             | GCS storage verification |
| `scan the hive`         | `/api/max/security-audit`         | Security audit           |
| `check service account` | `/api/max/verify-service-account` | Verify credentials       |
| `help`                  | -                                 | List available commands  |

---

## Troubleshooting

### Issue: "Unauthorized" (401)

**Check:**

- `MAX_API_TOKEN` is set in backend env vars
- Token matches between Max's server and backend
- Authorization header is sent correctly

**Fix:**

- Set `MAX_API_TOKEN` in `.env` (local) or Render/Railway (production)
- Verify token matches Max's server configuration

### Issue: "Max API not configured" (503)

**Check:**

- `MAX_API_TOKEN` is not set in backend

**Fix:**

- Set `MAX_API_TOKEN` environment variable

### Issue: Max Not Responding on WhatsApp

**Check:**

- Max's server is running
- WhatsApp integration is configured
- Phone number is correct: +15143481161

**Fix:**

- Verify Max's server is online
- Check WhatsApp Business API configuration
- Test with a simple message first

---

## Next Steps

1. **Set MAX_API_TOKEN:**

   ```bash
   # In .env
   MAX_API_TOKEN=your-secret-token-here
   ```

2. **Start Backend:**

   ```bash
   npm run dev
   ```

3. **Test Max API:**

   ```bash
   tsx scripts/test-max-api.ts --endpoint=status
   ```

4. **Send WhatsApp Message:**
   - Open WhatsApp
   - Message: +15143481161
   - Send: `status`
   - Wait for Max's response

---

**Max is ready to wake up! Test the API endpoints or send him a WhatsApp message.** 📱🐝
