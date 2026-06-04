# Video Playback Fix — June 4, 2026

## The Problem

Videos on the feed page (`/feed`) would show **"Signal Interrompu / Mux playback failed"** 
on first visit. The videos worked fine after clicking "RÉESSAYER" (retry) or after navigating 
away and coming back.

## Root Cause: Browser Autoplay Policy

All modern browsers (Chrome, Safari, Firefox) **block autoplay of unmuted video** unless the 
user has already interacted with the page (clicked, tapped, etc.). 

The feed was starting with `isMuted = false`, meaning the MuxPlayer tried to autoplay an 
unmuted video → browser blocked it → Mux threw an error → error UI shown.

## The Fix (Commits `0598b8e` and `0b6d37e`)

### 1. Start Muted (LaZyeute.tsx, line ~330)
```typescript
// BEFORE (broken):
const [isMuted] = useState(false);

// AFTER (fixed):
const [isMuted, setIsMuted] = useState(true);
```
Browsers ALWAYS allow muted autoplay. This is what TikTok, Instagram Reels, and YouTube 
Shorts all do.

### 2. Tap-to-Unmute Banner (LaZyeute.tsx, line ~1283)
A gold pulsing banner "Appuie pour le son 🔊" appears at the top of the feed when muted.
Tapping it (or tapping anywhere on the video) unmutes. This is the equivalent of TikTok's 
volume icon in the top-left corner.

### 3. Single Tap = Unmute → Play/Pause (LaZyeute.tsx, handleVideoTap)
- First tap: unmutes the video
- Subsequent taps: toggle play/pause
- Double-tap: still fires the "fire" reaction (unchanged)

### 4. Graceful Autoplay Error Handling (MuxVideoPlayer.tsx, handleError)
If the browser blocks autoplay, instead of showing the error UI, the player silently retries 
with `video.muted = true`. The "Signal Interrompu" error only shows for actual playback 
failures (network errors, corrupt video, etc.).

### 5. TikTok-Style Progress Bar (LaZyeute.tsx, line ~885)
Thin gold gradient bar at the bottom of each video showing playback position.
Uses `onTimeUpdate` callback from MuxVideoPlayer.

### 6. 2-Video DOM Limit (LaZyeute.tsx, line ~782)
Only the current and next video are real `<video>` elements. All other slides show poster 
images. This saves GPU/memory/bandwidth (TikTok uses the same pattern).

## If Videos Break Again — Checklist

1. **"Signal Interrompu" on first load?**
   → Check that `isMuted` starts as `true` in LaZyeute.tsx
   → Check that MuxVideoPlayer.handleError still has the autoplay retry logic

2. **Videos don't autoplay at all?**
   → Check that `isPlaying` starts as `true` in LaZyeute.tsx
   → Check that `autoPlay={index === currentIndex && isPlaying}` is passed to MuxVideoPlayer
   → Verify Mux playback IDs are valid (check Mux dashboard)

3. **Videos freeze mid-play?**
   → MuxVideoPlayer has freeze detection (checks if currentTime stops advancing)
   → Check network/CDN — Mux streams via HLS, needs stable connection

4. **Sound doesn't work after tapping?**
   → Check that `handleVideoTap` calls `setIsMuted(false)` when `isMuted` is true
   → Check that `muted={isMuted}` is passed to MuxVideoPlayer

5. **Progress bar missing?**
   → Check that `onTimeUpdate` callback is wired from MuxVideoPlayer to LaZyeute
   → The bar only shows on `index === currentIndex` and `post.type === "video"`

## Key Files

- `frontend/src/pages/LaZyeute.tsx` — Main feed page with scroll, tap, and state logic
- `frontend/src/components/video/MuxVideoPlayer.tsx` — Mux HLS player wrapper
- `frontend/src/components/features/VideoPlayer.tsx` — Fallback native video player (non-Mux)

## Why My Browser Tool Showed It Working

The automated browser tool clicked through the page before reaching /feed, which counted as 
a "user interaction" — satisfying the autoplay policy. A real user navigating directly to 
zyeute.com/feed had zero interactions, so autoplay was blocked.
