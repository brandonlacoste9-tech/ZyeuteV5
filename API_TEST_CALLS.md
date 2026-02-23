# 🧪 API Test Calls for Zyeuté

## Production URLs

**Vercel Frontend:** https://zyeute.vercel.app
**Railway Backend:** https://zyeutev5-production.up.railway.app

---

## Test 1: Health Check

```bash
curl -X GET "https://zyeutev5-production.up.railway.app/api/health"
```

**Expected:** `{"status": "ok"}`

---

## Test 2: Media Proxy (Pexels Video)

Test if the media proxy works for Pexels videos:

```bash
# This is a sample Pexels video URL - test if proxy works
curl -X GET "https://zyeutev5-production.up.railway.app/api/media-proxy?url=https%3A%2F%2Fvideos.pexels.com%2Fvideo-files%2F856973%2F856973-hd_1920_1080_30fps.mp4" \
  -H "Accept: video/mp4" \
  -I
```

**Expected:** HTTP 200 with content-type: video/mp4

---

## Test 3: Get Posts (Feed)

```bash
curl -X GET "https://zyeutev5-production.up.railway.app/api/posts?limit=5" \
  -H "Content-Type: application/json"
```

**Expected:** JSON array of posts with video URLs

---

## Test 4: TI-GUY Chat

```bash
curl -X POST "https://zyeutev5-production.up.railway.app/api/tiguy/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Salut TI-GUY!"}'
```

**Expected:** JSON response with TI-GUY's reply

---

## Test 5: Video Posts Only

```bash
curl -X GET "https://zyeutev5-production.up.railway.app/api/posts?type=video&limit=3" \
  -H "Content-Type: application/json" | jq '.posts[] | {id, type, hlsUrl, mediaUrl, originalUrl}'
```

**Expected:** Video posts with their URL fields populated

---

## Test 6: Check Media Proxy Allowlist

Test a Mixkit URL (should be proxied):
```bash
curl -X GET "https://zyeutev5-production.up.railway.app/api/media-proxy?url=https%3A%2F%2Fassets.mixkit.co%2Fvideos%2Fpreview%2Fmixkit-ink-swirling-in-water-191-large.mp4" \
  -I
```

Test a MUX URL (should NOT be proxied - blocked):
```bash
curl -X GET "https://zyeutev5-production.up.railway.app/api/media-proxy?url=https%3A%2F%2Fstream.mux.com%2Ftest.m3u8" \
  -I
```

**Expected:** 
- Mixkit: 200 OK (allowed)
- MUX: 403 Forbidden (blocked - correct behavior)

---

## Test 7: HLS Manifest Proxy

If you have an HLS manifest URL:
```bash
curl -X GET "https://zyeutev5-production.up.railway.app/api/media-proxy?url=YOUR_HLS_URL_HERE" \
  -H "Accept: application/vnd.apple.mpegurl"
```

---

## Test 8: Direct Video Access

Try to access a video directly (bypassing proxy):
```bash
curl -X GET "https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_30fps.mp4" \
  -I \
  -H "Origin: https://zyeute.vercel.app"
```

**Expected:** Check for CORS headers (Access-Control-Allow-Origin)

---

## Quick Browser Tests

Open these in your browser's network tab:

1. **Check feed:** https://zyeutev5-production.up.railway.app/api/posts?limit=5
2. **Check health:** https://zyeutev5-production.up.railway.app/api/health
3. **Check TI-GUY:** https://zyeutev5-production.up.railway.app/api/tiguy/status

---

## What to Look For

| Issue | Symptom |
|-------|---------|
| API Down | 502/503 errors |
| CORS Blocked | No `Access-Control-Allow-Origin` header |
| Proxy Blocked | 403 Forbidden |
| Video Not Found | 404 or empty video fields |
| Rate Limited | 429 Too Many Requests |

---

## Next Steps

Run these tests and share:
1. Which endpoints respond?
2. What errors do you see?
3. Do video URLs come back in the posts API?
4. Does the media proxy return video data?
