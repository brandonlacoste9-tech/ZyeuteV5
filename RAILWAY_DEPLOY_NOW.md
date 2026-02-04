# Deploy Max API to Railway - Quick Guide 🚂

**Last Deploy:** 4 hours ago  
**Action:** Deploy Max API changes + Set MAX_API_TOKEN

---

## Quick Steps

### 1. Set MAX_API_TOKEN in Railway Dashboard ⚡ (FASTEST)

1. Go to: https://railway.app/project/ad61359f-e003-47db-9feb-2434b9c266f5
2. Click on **ZyeuteV5** service (backend, not zyeute-db)
3. Click **Variables** tab
4. Click **+ New Variable**
5. Add:
   - **Name:** `MAX_API_TOKEN`
   - **Value:** `p8KXOOrrGHmOsJF5aKprjaytb8df156q`
6. Click **Save**

### 2. Redeploy Backend

1. Still in Railway Dashboard → **ZyeuteV5** service
2. Click **Deployments** tab
3. Click **Redeploy** button (top right)
4. Wait 3-5 minutes

### 3. Verify Max API is Live

```bash
# Test Max API endpoint
curl -H "Authorization: p8KXOOrrGHmOsJF5aKprjaytb8df156q" \
  https://zyeutev5-production.up.railway.app/api/max/status
```

**Expected Response:**

```json
{
  "timestamp": "2026-02-03T...",
  "system": "Zyeuté Colony OS",
  "status": "operational"
}
```

---

## What's Being Deployed

✅ **New Max API Routes:**

- `/api/max/status` - System health check
- `/api/max/verify-gcs` - GCS verification
- `/api/max/security-audit` - Security audit
- `/api/max/verify-service-account` - Credential check
- `/api/max/command` - Generic command handler

✅ **Files Changed:**

- `backend/routes/max-api.ts` (NEW)
- `backend/routes.ts` (updated to include Max routes)

---

## Alternative: Via Railway CLI

If you prefer CLI:

```bash
# 1. Link to backend service (select "ZyeuteV5" when prompted)
railway service link

# 2. Set MAX_API_TOKEN
railway variables set MAX_API_TOKEN=p8KXOOrrGHmOsJF5aKprjaytb8df156q

# 3. Deploy
railway up
```

---

## After Deployment

**Test Max Commands:**

```bash
# Status check
curl -H "Authorization: p8KXOOrrGHmOsJF5aKprjaytb8df156q" \
  https://zyeutev5-production.up.railway.app/api/max/status

# GCS verification
curl -H "Authorization: p8KXOOrrGHmOsJF5aKprjaytb8df156q" \
  https://zyeutev5-production.up.railway.app/api/max/verify-gcs
```

**Or via WhatsApp:**

- Message: **+15143481161**
- Send: `status`
- Max replies with system status

---

**Ready!** Set the token in Railway Dashboard and redeploy. 🚂🐝
