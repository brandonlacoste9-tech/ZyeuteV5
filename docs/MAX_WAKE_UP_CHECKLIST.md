# Max Wake-Up Checklist ✅

**Token:** `p8KXOOrrGHmOsJF5aKprjaytb8df156q` ✅ **ADDED**

---

## Step 1: Start Backend ✅

**In Terminal 1:**

```bash
npm run dev
```

**Wait for:**

```
Server running on port 10000
```

---

## Step 2: Wake Max ✅

**In Terminal 2 (new terminal):**

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

## Step 3: Test Max Commands

**Via API:**

```bash
# Status check
npm run test:max -- --endpoint=status

# GCS verification
npm run test:max -- --endpoint=verify-gcs

# Security audit
npm run test:max -- --endpoint=security-audit

# Test all endpoints
npm run test:max -- --endpoint=all
```

**Via WhatsApp:**

- Send to: **+15143481161**
- Message: `status`
- Max replies with system status

---

## Troubleshooting

### Backend Not Starting?

- Check `.env` has all required variables
- Verify port 10000 is not in use: `netstat -ano | findstr ":10000"`
- Check backend logs for errors

### Max Still Not Responding?

- Verify `MAX_API_TOKEN` matches in `.env` and backend
- Restart backend after adding token
- Check backend logs for authentication errors

### Connection Refused?

- Backend must be running before testing Max
- Verify backend URL: `http://localhost:10000`
- Check firewall isn't blocking port 10000

---

**Status:** Token configured ✅  
**Next:** Start backend and wake Max! 🐝
