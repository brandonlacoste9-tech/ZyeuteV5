# Deploy Max API to Railway 🚂

**Last Deploy:** 4 hours ago  
**Status:** Ready to deploy Max API changes

---

## Step 1: Set MAX_API_TOKEN in Railway

**Option A: Via Railway Dashboard (Recommended)**

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **backend service** (not zyeute-db)
3. Click **Variables** tab
4. Click **+ New Variable**
5. Add:
   - **Name:** `MAX_API_TOKEN`
   - **Value:** `p8KXOOrrGHmOsJF5aKprjaytb8df156q`
6. Click **Save**

**Option B: Via Railway CLI**

```bash
# Switch to backend service
railway service link
# Select your backend service from list

# Set MAX_API_TOKEN
railway variables set MAX_API_TOKEN=p8KXOOrrGHmOsJF5aKprjaytb8df156q

# Or use the script
npm run deploy:max:railway
```

---

## Step 2: Deploy to Railway

**Via Railway Dashboard:**

1. Railway Dashboard → Your Backend Service
2. Click **Deployments** tab
3. Click **Redeploy** button
4. Wait 3-5 minutes for deployment

**Via Railway CLI:**

```bash
# Make sure you're in the backend service
railway service link

# Deploy latest code
railway up

# Or redeploy existing deployment
railway service redeploy
```

---

## Step 3: Verify Deployment

**Check Railway Logs:**

```bash
railway logs
```

**Look for:**

- ✅ `Server running on port ${PORT}`
- ✅ `Routes loaded`
- ✅ `Max API routes registered`

**Test Max API:**

```bash
# Test locally (pointing to Railway)
MAX_API_URL=https://zyeutev5-production.up.railway.app npm run wake:max
```

**Or test directly:**

```bash
curl -H "Authorization: p8KXOOrrGHmOsJF5aKprjaytb8df156q" \
  https://zyeutev5-production.up.railway.app/api/max/status
```

---

## What's Being Deployed

✅ **Max API Routes** (`backend/routes/max-api.ts`)

- `/api/max/status` - Health check
- `/api/max/verify-gcs` - GCS verification
- `/api/max/security-audit` - Security audit
- `/api/max/verify-service-account` - Credential check
- `/api/max/command` - Generic command handler

✅ **Max API Integration** (`backend/routes.ts`)

- Max routes registered and protected with authentication

---

## Troubleshooting

### "Service not found"

- Make sure you're in the backend service, not `zyeute-db`
- Use `railway service link` to switch services

### "Variable not set"

- Check Railway Dashboard → Variables tab
- Verify `MAX_API_TOKEN` is set in the **backend service** (not database)

### "Max API returns 401"

- Verify `MAX_API_TOKEN` matches between Railway and your requests
- Check token has no extra spaces or quotes

### "Routes not found"

- Verify deployment completed successfully
- Check Railway logs for errors
- Ensure `backend/routes/max-api.ts` is in the deployed code

---

**Ready to deploy!** Set `MAX_API_TOKEN` and redeploy. 🚂🐝
