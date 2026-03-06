# 🎬 Video Debugging Guide

## Common Video Issues & Fixes

### 1. Black Screen / Video Won't Play

**Check:**

```javascript
// Open browser console and check:
1. Network tab - Is video URL returning 200?
2. Console errors - CORS? 403? 404?
3. Video format - Is it MP4? HLS? WebM?
```

**Enable Debug Mode:**

```
https://zyeute.com/feed?debug=1
```

This shows diagnostic overlay on each video.

---

### 2. Video Player Selection Logic

| Source Type       | Player Used          | Notes                            |
| ----------------- | -------------------- | -------------------------------- |
| `mux_playback_id` | MuxVideoPlayer       | Best quality, adaptive streaming |
| `hls_url`         | VideoPlayer (HLS.js) | For HLS streams                  |
| `media_url` (MP4) | TikTokVideoPlayer    | Native HTML5 with optimizations  |
| Processing        | Loading spinner      | Shows "Amélioration en cours..." |
| No source         | Error state          | "Vidéo non disponible"           |

---

### 3. Quick Fixes

**If video won't load:**

1. Check if URL is accessible (open in new tab)
2. Check CORS headers on the video server
3. Try media proxy: `/api/media-proxy?url=VIDEO_URL`

**If video plays but no sound:**

- Tap video to unmute (TikTok-style)
- Check browser autoplay policies

**If video stutters:**

- Check internet connection
- Video is probably too high bitrate
- Check `TikTokVideoPlayer` buffer progress

---

### 4. Database Check

```sql
-- Check video posts
SELECT
  id,
  type,
  media_url,
  mux_playback_id,
  processing_status,
  hls_url
FROM publications
WHERE type = 'video'
LIMIT 10;
```

---

### 5. Test Video URLs

```bash
# Test if video is accessible
curl -I "VIDEO_URL_HERE"

# Should return:
# HTTP/2 200
# content-type: video/mp4
# access-control-allow-origin: *
```

---

### 6. Known Issues

| Issue            | Cause                      | Fix                     |
| ---------------- | -------------------------- | ----------------------- |
| 403 Forbidden    | CORS or signed URL expired | Use media proxy         |
| Black screen     | Video codec not supported  | Convert to H.264        |
| No thumbnail     | Missing poster image       | Add thumbnailUrl        |
| Infinite loading | Processing stuck           | Check processing_status |

---

## 🔧 Debug Commands

```javascript
// In browser console:

// Check all video elements
Array.from(document.querySelectorAll("video")).map((v) => ({
  src: v.src,
  readyState: v.readyState,
  error: v.error,
  networkState: v.networkState,
}));

// Check if video can play
const video = document.querySelector("video");
console.log("Can play:", video.canPlayType("video/mp4"));
console.log("Error:", video.error);
```

---

## 📱 Mobile-Specific

- iOS Safari: Requires `playsInline` attribute ✓
- Android Chrome: Should work with native player
- Autoplay: Blocked until user interaction
