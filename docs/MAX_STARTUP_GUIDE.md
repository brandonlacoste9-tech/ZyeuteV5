# Max Startup Guide 🐝

**Quick Reference:** Start backend → Wake Max → Test commands

---

## Step-by-Step Instructions

### 1. Start Backend Server

**In Terminal 1:**

```bash
npm run dev
```

**What to look for:**

```
✓ Server running on port 10000
✓ Database connected
✓ Routes loaded
```

**⏱️ Wait for:** "Server running on port 10000"

---

### 2. Wake Max

**In Terminal 2 (NEW terminal window):**

```bash
npm run wake:max
```

**Expected Success Output:**

```
🐝 Waking up Max...
✅ Max is AWAKE and responding!

📊 System Status:
   System: Zyeuté Colony OS
   Status: operational
   Timestamp: 2026-02-03T...

🔧 Components:
   🟢 backend: online
   🟡 database: unknown
   🟡 gcs: unknown
   🟡 vertexAI: unknown
   🟡 dialogflowCX: unknown

💬 Max is ready for commands!
   Send WhatsApp message to: +15143481161
   Try: 'status', 'verify:gcs', 'scan the hive'
```

---

### 3. Test Max Commands

**Via API (Terminal 2):**

```bash
# Status check
npm run test:max -- --endpoint=status

# GCS verification
npm run test:max -- --endpoint=verify-gcs

# Security audit
npm run test:max -- --endpoint=security-audit

# Service account check
npm run test:max -- --endpoint=verify-service-account

# Test all endpoints
npm run test:max -- --endpoint=all
```

**Via WhatsApp:**

- Open WhatsApp
- Message: **+15143481161**
- Send: `status`
- Max replies with system status

---

## Troubleshooting

### Backend Won't Start?

**Check:**

- `.env` file exists and has required variables
- Port 3000 (or PORT env var) is not in use: `netstat -ano | findstr ":3000"`
- Database connection is configured

**Common Errors:**

- `Port already in use` → Kill process on port 3000 or change PORT env var
- `Database connection failed` → Check `DATABASE_URL` in `.env`
- `Missing environment variables` → Run `npm run check:env`

---

### Max Still Not Responding?

**Check:**

1. Backend is running (see Step 1)
2. `MAX_API_TOKEN` is set in `.env`
3. Token matches: `p8KXOOrrGHmOsJF5aKprjaytb8df156q`
4. Backend restarted after adding token

**Test Connection:**

```bash
# Check readiness
npm run check:max

# Test direct API call (adjust port if PORT env var is set)
curl -H "Authorization: p8KXOOrrGHmOsJF5aKprjaytb8df156q" http://localhost:3000/api/max/status
```

---

### "Unauthorized" Error?

**Fix:**

1. Verify `MAX_API_TOKEN` in `.env` matches token used in requests
2. Restart backend after changing token
3. Check token has no extra spaces or quotes

---

## Quick Commands Reference

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start backend server         |
| `npm run wake:max`  | Wake Max and test connection |
| `npm run check:max` | Check Max readiness          |
| `npm run test:max`  | Test Max API endpoints       |

---

## Max Commands (WhatsApp)

| Message                 | Action              |
| ----------------------- | ------------------- |
| `status`                | System health check |
| `verify:gcs`            | Verify GCS storage  |
| `scan the hive`         | Run security audit  |
| `check service account` | Verify credentials  |

---

**Status:** Token configured ✅  
**Next:** Start backend (`npm run dev`) then wake Max! 🐝
