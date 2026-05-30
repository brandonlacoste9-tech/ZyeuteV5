# 🔍 Diagnose "Video Not Available" Issue

## Quick Checks

### 1. Check Your Browser Console (F12 → Console)

Look for these specific errors:

- `GET [video-url] 404` → Video file doesn't exist
- `GET [video-url] 403` → Access denied / hotlink blocked
- `Mux playback failed` → Mux playback ID invalid
- `Failed to fetch` → Network/CORS issue

### 2. Check Database (Run in Railway PostgreSQL)

```sql
-- Check for videos with missing URLs
SELECT
    id,
    type,
    processing_status,
    mux_playback_id,
    media_url,
    created_at
FROM posts
WHERE type = 'video'
ORDER BY created_at DESC
LIMIT 20;

-- Count problematic videos
SELECT
    'no_media_url' as issue,
    COUNT(*)
FROM posts
WHERE type = 'video' AND (media_url IS NULL OR media_url = '')
UNION ALL
SELECT
    'stuck_processing' as issue,
    COUNT(*)
FROM posts
WHERE type = 'video'
    AND processing_status IN ('pending', 'processing')
    AND mux_playback_id IS NULL
    AND created_at < NOW() - INTERVAL '2 hours';
```

### 3. Check Environment Variables

In Railway/Vercel, verify these are set:

```
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret
PEXELS_API_KEY=your_pexels_api_key
```

### 4. Test Video Upload Flow

1. Upload a NEW video
2. Check browser Network tab for `/api/mux/create-upload`
3. Check if upload URL is returned
4. Check Railway logs for webhook events

## Common Fixes

### Fix 1: Reset Stuck Videos

```sql
UPDATE posts
SET processing_status = 'failed', updated_at = NOW()
WHERE type = 'video'
  AND processing_status IN ('pending', 'processing')
  AND mux_playback_id IS NULL
  AND created_at < NOW() - INTERVAL '2 hours';
```

### Fix 2: Delete Orphaned Videos (no URL, no mux)

```sql
-- First, see what would be deleted
SELECT id, created_at FROM posts
WHERE type = 'video'
  AND mux_playback_id IS NULL
  AND (media_url IS NULL OR media_url = '');

-- Then delete them
DELETE FROM posts
WHERE type = 'video'
  AND mux_playback_id IS NULL
  AND (media_url IS NULL OR media_url = '');
```

### Fix 3: Verify Mux Webhook URL

In Mux Dashboard (https://dashboard.mux.com):

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/mux/webhooks`
3. Enable events: `video.asset.ready`, `video.asset.errored`

## Test Commands

```bash
# Test Mux upload endpoint
curl -X POST https://your-domain.com/api/mux/create-upload \
  -H "Content-Type: application/json" \
  -d '{"cors_origin": "https://your-frontend.com"}'

# Test media proxy (if using external videos)
curl -I "https://your-domain.com/api/media-proxy?url=https://assets.mixkit.co/videos/..."
```

## If Nothing Works

1. Check Railway logs for backend errors
2. Redeploy with `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` set
3. Clear browser cache and try again
