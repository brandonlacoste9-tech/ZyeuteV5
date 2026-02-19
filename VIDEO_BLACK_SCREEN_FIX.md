# Zyeute Video Black Screen - COMPLETE FIX GUIDE

## 🚨 Problem
Users see **black screen** (no video, no error, no "Réessayer" button)

## Root Causes

### 1. Stuck Processing (Database)
Videos uploaded but MUX never finished processing
- Status stuck at `pending` or `processing`
- No `mux_playback_id` assigned
- **Fix:** Reset stuck records, check webhook

### 2. CORS Block (Fixed) ✅
Supabase URLs blocked by browser
- **Fixed:** Added `supabase.co` to `PROXY_DOMAINS`
- Commit: `d3ada02`

### 3. Missing UX (Just Fixed) ✅
No loading state shown while processing
- **Fixed:** Added spinner overlay in `SingleVideoView.tsx`

## 🔧 FIXES TO APPLY

### FIX 1: Database Repair (URGENT)

Go to Railway Dashboard:
1. https://railway.app/dashboard
2. Click ZyeuteV5 project
3. Click PostgreSQL
4. Query tab → Run:

```sql
-- See damage
SELECT processing_status, COUNT(*) 
FROM posts WHERE type = 'video' 
GROUP BY processing_status;

-- Reset stuck videos (run this!)
UPDATE posts 
SET processing_status = 'pending',
    updated_at = NOW()
WHERE type = 'video' 
  AND processing_status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '2 hours'
  AND mux_playback_id IS NULL;
```

### FIX 2: Deploy Frontend UX Fix

```bash
cd /home/north/.openclaw/workspace/ZyeuteV5-fresh
git add frontend/src/components/features/SingleVideoView.tsx
git commit -m "fix: add loading state for processing videos - prevents black screen"
git push origin main
```

### FIX 3: Check MUX Webhook

1. Go to https://dashboard.mux.com/
2. Your account → Webhooks
3. Verify URL: `https://zyeutev5-production.up.railway.app/api/webhooks/mux`
4. Check recent deliveries - any failures?
5. If webhook URL changed, update it

### FIX 4: Test End-to-End

1. Upload a new video
2. Check database: `SELECT processing_status, mux_playback_id FROM posts ORDER BY created_at DESC LIMIT 1;`
3. Wait 2-3 minutes
4. Check if `mux_playback_id` appears
5. Video should play (or show loading spinner)

## 📊 Monitoring

Add health check:
```bash
# Check for stuck videos daily
curl -s https://your-api.com/api/admin/stuck-videos
```

## 🐝 Status

- [x] CORS fix deployed
- [x] Loading UX added  
- [ ] Database reset (needs manual Railway access)
- [ ] MUX webhook verified
- [ ] End-to-end tested

**Need help?** Run: `./skills/zyeute-video-repair/repair-videos.sh`
