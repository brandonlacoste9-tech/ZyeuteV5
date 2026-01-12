# 🎬 Mux Player Integration Guide

## Current Status

✅ **Mux Player is already installed and partially integrated**

- **Package:** `@mux/mux-player-react@^3.10.2` ✅ Installed
- **Component:** `frontend/src/components/features/MuxVideoPlayer.tsx` ✅ Exists
- **Backend:** Mux routes configured (`backend/routes/mux.ts`) ✅ Working
- **Database:** `mux_playback_id` column exists in schema ✅ Ready

## Current Usage

- **Main Feed (`ContinuousFeed`):** Uses custom `VideoPlayer` component (not Mux Player)
- **VideoCard component:** Uses `MuxVideoPlayer` for Mux videos

## Integration Options

### Option 1: Use Mux Player for Mux Videos Only (Recommended)

Modify `SingleVideoView.tsx` to conditionally use `MuxVideoPlayer` when `post.mux_playback_id` exists:

```typescript
// In SingleVideoView.tsx
{post.type === "video" ? (
  post.mux_playback_id ? (
    <MuxVideoPlayer
      playbackId={post.mux_playback_id}
      poster={post.thumbnail_url}
      autoPlay={isActive}
      muted={isMuted}
      loop
    />
  ) : (
    <VideoPlayer
      src={videoSrc}
      poster={post.thumbnail_url}
      autoPlay={isActive}
      muted={isMuted}
      loop
    />
  )
) : (
  // Image component
)}
```

**Benefits:**

- ✅ Gradual migration - existing videos keep working
- ✅ Mux videos get premium features automatically
- ✅ No breaking changes

### Option 2: Replace All Video Players with Mux Player

Convert all videos to Mux and use `MuxVideoPlayer` exclusively.

**Requirements:**

- Upload all videos through Mux Direct Upload
- Store `mux_playback_id` for all videos
- Migrate existing videos to Mux

**Benefits:**

- ✅ Consistent player experience
- ✅ Built-in analytics
- ✅ Adaptive bitrate streaming

### Option 3: Hybrid Approach (Current + Future)

Keep current setup for now, but ensure new uploads go through Mux.

**Implementation:**

- Frontend uploads use Mux Direct Upload API
- Backend webhook stores `mux_playback_id`
- Future: Migrate feed to use Mux Player when available

## Next Steps

1. **Which approach do you prefer?**
   - Option 1: Gradual migration (recommended)
   - Option 2: Full migration
   - Option 3: Keep current, plan for future

2. **Do you want to integrate Mux Player into the main feed now?**
   - I can help implement Option 1 (conditional rendering)
   - Or set up Option 2 (full migration plan)

3. **Mux API Keys:**
   - Verify `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set in Railway
   - Check Mux dashboard for webhook configuration

## Mux Player Features (Already Available)

When using `MuxVideoPlayer`, you automatically get:

- ✅ Timeline hover previews
- ✅ Mux Data analytics integration
- ✅ Keyboard controls
- ✅ Chromecast support
- ✅ Responsive design
- ✅ Adaptive bitrate streaming
- ✅ Customizable branding

## Testing

To test Mux Player integration:

1. Create a post with a Mux video (has `mux_playback_id`)
2. Verify the `MuxVideoPlayer` component renders
3. Check browser console for Mux analytics events
4. Test playback controls and features

---

**Status:** Ready to integrate - just need to decide on approach!
