# Quick Start: Wake Up Max 🐝

**Max Phone:** +15143481161  
**Status:** Ready to wake up!

---

## Step 1: Set MAX_API_TOKEN

Add to your `.env` file:

```bash
MAX_API_TOKEN=your-secret-token-here
```

**Generate a secure token:**

```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use a password generator
```

---

## Step 2: Start Backend

```bash
npm run dev
```

Wait for: `Server running on port 10000`

---

## Step 3: Wake Max

**In a new terminal:**

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

## Step 4: Test Max Commands

**Via API:**

```bash
npm run test:max -- --endpoint=verify-gcs
```

**Via WhatsApp:**

- Send to: **+15143481161**
- Message: `status`
- Max replies with system status

---

## Troubleshooting

### "Unauthorized" Error

- Check `MAX_API_TOKEN` is set in `.env`
- Restart backend after adding token

### "Cannot reach Max"

- Is backend running? (`npm run dev`)
- Check backend is on port 10000
- Verify `MAX_API_URL` matches backend URL

### Max Not Responding on WhatsApp

- Max's server needs to be configured separately
- Verify WhatsApp integration is active
- Check phone number: +15143481161

---

**Max is ready! Set the token and wake him up.** 🐝⚡
