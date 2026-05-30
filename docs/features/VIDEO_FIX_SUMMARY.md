# Video Playback Fix Summary

## Problem

Videos were not playing in the app, even though:

- MUX player was configured
- Pexels stock videos were available
- All video components existed

## Root Causes Identified

1. **Overly complex VideoPlayer component** - Used HLS.js and MSE for all videos, including simple MP4s
2. **Media proxy issues** - Pexels videos were being proxied unnecessarily, adding failure points
3. **Complex error handling** - Multiple fallback layers that could mask real issues

## Changes Made

### 1. Created `SimpleVideoPlayer.tsx` (NEW)

**Location:** `frontend/src/components/video/SimpleVideoPlayer.tsx`

A simplified video player that:

- Uses native HTML5 `<video>` element (no HLS.js, no MSE)
- Works directly with MP4/WebM URLs
- Has simple retry logic (2 retries with cache-busting)
- Clean error UI with retry button
- Perfect for Pexels videos and direct uploads

### 2. Updated `SingleVideoView.tsx`

**Location:** `frontend/src/components/features/SingleVideoView.tsx`

Changes:

- Import `SimpleVideoPlayer`
- Route videos based on type:
  - **MUX videos** (`mux_playback_id`): Use `MuxVideoPlayer`
  - **HLS streams** (`.m3u8`): Use `VideoPlayer` (with HLS.js)
  - **MP4/WebM** (Pexels, uploads): Use `SimpleVideoPlayer`

### 3. Updated `VideoCard.tsx`

**Location:** `frontend/src/components/features/VideoCard.tsx`

Changes:

- Import `SimpleVideoPlayer`
- Same routing logic as `SingleVideoView`
- Direct MP4 URLs for Pexels (no proxy)

### 4. Updated `mediaProxy.ts`

**Location:** `frontend/src/utils/mediaProxy.ts`

Changes:

- Removed Pexels domains from proxy list
- Pexels videos now load directly (they have proper CORS headers)
- Still proxies Mixkit and Unsplash (which have hotlink protection)

### 5. Updated `media-proxy.ts` (Backend)

**Location:** `backend/routes/media-proxy.ts`

Changes:

- Better User-Agent header
- Only add Referer header for Mixkit (not Pexels)
- Better error logging

## Video Routing Logic

```
Video Source
    │
    ├── MUX? ──→ MuxVideoPlayer (HLS streaming)
    │
    ├── .m3u8? ──→ VideoPlayer (HLS.js)
    │
    └── MP4/WebM? ──→ SimpleVideoPlayer (Native HTML5)
```

## Testing

### To test Pexels videos:

1. Clear browser cache
2. Open browser console
3. Navigate to feed
4. Look for videos from "Pexels" user
5. Check console for `[SimpleVideoPlayer]` logs

### To test MUX videos:

1. Upload a video through the app
2. Wait for processing (webhook from MUX)
3. Video should play with `MuxVideoPlayer`

### Debug mode:

Add `?debug=1` to URL to see diagnostic overlay.

## Environment Variables

Ensure these are set in your `.env`:

```env
# Pexels (for fallback videos)
PEXELS_API_KEY=your_pexels_key

# MUX (for uploaded videos)
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
```

## Rollback

If issues occur, revert these files:

1. `frontend/src/components/video/SimpleVideoPlayer.tsx` (delete)
2. `frontend/src/components/features/SingleVideoView.tsx`
3. `frontend/src/components/features/VideoCard.tsx`
4. `frontend/src/utils/mediaProxy.ts`
5. `backend/routes/media-proxy.ts`

## Next Steps

1. Deploy changes
2. Monitor browser console for errors
3. Check that Pexels videos load directly (not through proxy)
4. Test video upload flow with MUX
