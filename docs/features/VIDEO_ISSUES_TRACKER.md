# 🎬 Zyeuté Video System - Issues Tracker

**Status:** 6+ months of issues - time to fix it for good

---

## 🔴 CRITICAL ISSUES (Blocking/Freezing App)

### 1. Field Name Mismatches (FIXED ✅)

**Problem:** Database returns camelCase (`hlsUrl`) but code checks snake_case (`hls_url`)
**Impact:** Video URLs are undefined, causing empty video players or crashes
**Files Fixed:**

- ✅ `VideoCard.tsx` - line 192, 204
- ✅ `SingleVideoView.tsx` - lines 500-600+
- ✅ `PostSchema` in `common.ts` - normalization added

### 2. MUX URLs Being Proxied (FIXED ✅)

**Problem:** `stream.mux.com` was in ALLOWED_HOSTS, causing MUX HLS to break
**Impact:** MUX videos fail to load (CORS/proxy issues)
**Fix:** Removed MUX from `media-proxy.ts` ALLOWED_HOSTS

### 3. Import Path Aliases Causing Runtime Errors (FIXED ✅)

**Problem:** `@/hooks/useHaptics` fails at runtime in production
**Impact:** App crashes/frozen on load
**Fix:** Changed to relative imports `../hooks/useHaptics`

### 4. Header Component Children Error (FIXED ✅)

**Problem:** Added children to Header which doesn't accept them
**Impact:** React error -> frozen app
**Fix:** Moved buttons outside Header

---

## 🟡 VIDEO PLAYBACK ISSUES (Videos Don't Play)

### 5. Player Selection Logic Broken

**Current Code:**

```tsx
// VideoCard.tsx line 204
return post.hlsUrl ? (
  <VideoPlayer ... />      // HLS.js player
) : (
  <SimpleVideoPlayer ... /> // Native player
);
```

**Problem:**

- HLS URLs go to VideoPlayer (HLS.js) - GOOD
- MP4 URLs go to SimpleVideoPlayer (native) - SHOULD WORK
- But neither player seems to initialize properly

**Need to verify:**

- [ ] VideoPlayer (HLS.js) configuration
- [ ] SimpleVideoPlayer native playback
- [ ] Poster images loading
- [ ] Autoplay policies blocking

### 6. Video Source Construction (PARTIALLY FIXED)

**Current Priority:**

```tsx
const rawVideoUrl =
  post.hlsUrl || post.enhancedUrl || post.mediaUrl || post.originalUrl || "";
```

**Need to verify actual data in DB:**

```sql
-- Run this to see what fields are populated
SELECT
  id,
  hls_url,
  enhanced_url,
  media_url,
  original_url,
  mux_playback_id,
  processing_status
FROM publications
WHERE type = 'video'
LIMIT 5;
```

**Expected behavior:**

1. HLS manifest URL → VideoPlayer with HLS.js
2. MP4 direct URL → SimpleVideoPlayer native
3. MUX playback ID → MuxVideoPlayer

---

## 🟠 PLAYER-SPECIFIC ISSUES

### 7. VideoPlayer (HLS.js Component)

**File:** `frontend/src/components/features/VideoPlayer.tsx`

**Need to check:**

- [ ] HLS.js library properly imported
- [ ] Hls.isSupported() check
- [ ] Manifest loading
- [ ] CORS headers on proxy

### 8. SimpleVideoPlayer (Native)

**File:** `frontend/src/components/video/SimpleVideoPlayer.tsx`

**Need to check:**

- [ ] Video element src binding
- [ ] Poster loading
- [ ] Autoplay/muted attributes
- [ ] Error handling

### 9. MuxVideoPlayer

**File:** `frontend/src/components/video/MuxVideoPlayer.tsx`

**Need to check:**

- [ ] @mux/mux-player-react properly loaded
- [ ] playbackId correct format
- [ ] Thumbnail generation

---

## 🔵 MEDIA PROXY ISSUES

### 10. Proxy Routing

**File:** `backend/routes/media-proxy.ts`

**Current Issues:**

- HLS manifest rewriting - is it working?
- Byte-range requests for seeking
- CORS headers
- Domain allowlist

**Test URLs:**

```
# Should work (proxied)
/api/media-proxy?url=https://assets.mixkit.co/videos/.../preview.mp4

# Should NOT be proxied (direct)
https://stream.mux.com/.../playlist.m3u8
```

---

## 📊 DEBUGGING CHECKLIST

### For Each Video Post, Log:

```tsx
console.log("Video Debug:", {
  postId: post.id,
  type: post.type,
  hlsUrl: post.hlsUrl,
  mediaUrl: post.mediaUrl,
  originalUrl: post.originalUrl,
  muxPlaybackId: post.muxPlaybackId,
  processingStatus: post.processingStatus,
  finalVideoSrc: videoSrc,
  playerType: post.hlsUrl ? "HLS" : post.muxPlaybackId ? "MUX" : "Native",
});
```

### Browser Console Checks:

1. Any 404/403 errors for video URLs?
2. CORS errors?
3. HLS.js errors?
4. React errors/warnings?

### Network Tab Checks:

1. Video file requests returning 200?
2. HLS manifest (.m3u8) loading?
3. Video segments loading?
4. Poster images loading?

---

## 🛠️ NEXT STEPS

### Immediate Actions:

1. [ ] Add comprehensive logging to video components
2. [ ] Test with a known working video URL
3. [ ] Verify database has correct video URLs
4. [ ] Check if videos work locally vs production

### Questions for @kimiclaw:

1. **What type of videos are you uploading?** (MP4 direct, HLS manifest, MUX)
2. **What does the database actually contain?** (Need to query real data)
3. **Do videos work in local development?**
4. **Are there any videos that DO work?** (So we can compare)

---

## 📈 SUCCESS METRICS

When fixed, we should see:

- [ ] Videos load and play
- [ ] Posters display
- [ ] No console errors
- [ ] Smooth playback
- [ ] Seeking works
- [ ] Audio works

---

**Last Updated:** 2026-02-22
**Commits:**

- `c636bee` - VideoCard field fixes
- `124d44a` - SingleVideoView field fixes
- `a49ae10` - Import path fix
- `736f115` - Header fix
