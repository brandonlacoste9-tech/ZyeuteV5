# Fix Video Black Screens - Quick Guide

## Problem

Videos in your feed are showing black screens because the video URL fields in the database are empty.

## Solution

### Step 1: Get Your Supabase Anon Key

1. Go to: https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/api
2. Copy the "anon" key (it's safe to use publicly)

### Step 2: Update Your .env File

Create or update your `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here_from_step_1
```

### Step 3: Run the Fix Script

```bash
npx tsx scripts/fix-video-black-screens.ts
```

This script will:

- ✅ Diagnose which videos have missing URLs
- ✅ Populate them with working Pexels video URLs
- ✅ Add thumbnails and metadata
- ✅ Set processing_status to "completed"

### Step 4: Verify the Fix

1. Refresh your browser
2. Check the feed - videos should now play!

## What the Script Does

The script assigns free Pexels videos to your posts. These are high-quality, royalty-free videos that will play immediately.

### Video URL Priority (How VideoCard Works)

Your VideoCard component looks for video URLs in this order:

1. `mux_playback_id` → Uses MuxVideoPlayer
2. `hls_url` → Uses VideoPlayer (HLS.js)
3. `enhanced_url` → Uses SimpleVideoPlayer
4. `media_url` → Uses SimpleVideoPlayer ✅ (This is what we populate)
5. `original_url` → Uses SimpleVideoPlayer

If ALL are empty → Black screen ❌

## Alternative: Manual Fix via Supabase Dashboard

If you prefer to fix manually:

1. Go to: https://app.supabase.com/project/vuanulvyqkfefmjcikfk/editor
2. Open the `publications` table
3. Find video posts (type = 'video')
4. For each video, set:
   - `media_url` = A valid video URL (e.g., from Pexels)
   - `thumbnail_url` = A valid image URL
   - `processing_status` = 'completed'
   - `duration` = Video duration in seconds
   - `aspect_ratio` = '16:9' or '9:16'

## Sample Pexels Video URLs

Use these free, working video URLs:

```
https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4
https://videos.pexels.com/video-files/2491284/2491284-uhd_2560_1440_30fps.mp4
https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_24fps.mp4
```

## Troubleshooting

### Script says "Missing Supabase configuration"

- Make sure your `.env` file exists in the project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Videos still show black screens after fix

1. Check browser console for errors (F12)
2. Verify the video URLs are accessible (paste in browser)
3. Check for CORS issues
4. Run the diagnostic script: `npx tsx scripts/diagnose-video-urls-supabase.ts`

### Need to use MUX instead of Pexels?

If you want to use MUX for video hosting:

1. Get MUX credentials from https://dashboard.mux.com
2. Upload videos to MUX
3. Set `mux_playback_id` in the database
4. The VideoCard will automatically use MuxVideoPlayer

## Next Steps

After fixing the black screens, you may want to:

1. **Add your own videos**: Upload to MUX or use direct URLs
2. **Implement video upload**: Create an upload flow for users
3. **Set up video processing**: Use MUX or Cloudflare Stream for HLS
4. **Add video validation**: Ensure uploaded videos are valid

## Need Help?

If you're still having issues:

1. Run the diagnostic: `npx tsx scripts/diagnose-video-urls-supabase.ts`
2. Check the browser console (F12) for errors
3. Verify your Supabase credentials are correct
4. Make sure the video URLs are publicly accessible
