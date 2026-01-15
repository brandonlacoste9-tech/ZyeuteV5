# 🎥 VIDEO UPLOAD FIX - Mux Credentials Missing

## 🎯 Problem Summary

Video uploads are **implemented and working** in your codebase, but they're failing because **Mux API credentials are missing** from your Railway backend environment variables.

## 🔍 What's Happening

1. **Frontend** (`frontend/src/pages/Upload.tsx:136`): Calls `createMuxUpload()` to get upload URL
2. **API Service** (`frontend/src/services/api.ts:232`): Makes request to `/api/mux/create-upload`
3. **Backend Route** (`backend/routes/mux.ts:33`): Tries to create Mux upload...
4. **❌ FAILS**: Mux client not initialized because credentials are missing

## ✅ THE FIX - Add Mux Credentials to Railway

### Step 1: Get Your Mux Credentials

1. Go to **[Mux Dashboard](https://dashboard.mux.com/)**
2. Sign up or log in
3. Navigate to **Settings → Access Tokens**
4. Click **"Generate new token"**
5. Copy these values:
   - `MUX_TOKEN_ID` (starts with a UUID)
   - `MUX_TOKEN_SECRET` (long alphanumeric string)

### Step 2: Add Credentials to Railway

1. Go to your **Railway project dashboard**
2. Select your **backend service** (the one running Express)
3. Click on the **"Variables"** tab
4. Add these three environment variables:

```env
MUX_TOKEN_ID=your_token_id_here
MUX_TOKEN_SECRET=your_token_secret_here
MUX_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note:** For `MUX_WEBHOOK_SECRET`, you can generate a random 32+ character string for now:
```bash
openssl rand -base64 32
```

### Step 3: Redeploy Your Backend

Railway should automatically redeploy when you add the variables. If not:
1. Click **"Deploy"** manually in Railway dashboard
2. Wait for deployment to complete

### Step 4: Verify It Works

After deployment, check your Railway logs. You should see:
```
✅ Mux client initialized successfully
```

Instead of:
```
❌ MUX CREDENTIALS MISSING! Video uploads will fail.
```

### Step 5: Test Video Upload

1. Go to your app
2. Click **Upload** → **GALERIE**
3. Select a video file
4. Add a caption and click **PUBLIER**
5. You should see: "Vidéo en traitement! Ti-Guy s'en occupe... 🦫"

---

## 🆘 Alternative: Quick Fix Without Mux

If you can't get Mux credentials right now and need video uploads working **IMMEDIATELY**, you can bypass Mux and upload videos directly to Supabase storage.

### Quick Supabase-Only Video Upload

Edit `frontend/src/pages/Upload.tsx` and replace the video upload section (lines 116-162) with:

```tsx
if (isVideo) {
  // TEMPORARY: Direct Supabase upload for videos (bypasses Mux)
  const fileExt = file.name.split(".").pop();
  const fileName = `${generateId()}.${fileExt}`;
  const filePath = `posts/${user.id}/${fileName}`;

  // Upload video to Supabase
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("media")
    .getPublicUrl(filePath);

  mediaUrl = publicUrl;

  // Generate thumbnail from video
  const { generateVideoThumbnail } = await import("../utils/videoThumbnail");
  const thumbDataUrl = await generateVideoThumbnail(file);
  const thumbBlob = dataURIToBlob(thumbDataUrl);

  // Upload thumbnail
  const thumbName = `thumb_${generateId()}.jpg`;
  const thumbPath = `posts/${user.id}/${thumbName}`;
  await supabase.storage.from("media").upload(thumbPath, thumbBlob);

  const { data: { publicUrl: tUrl } } = supabase.storage
    .from("media")
    .getPublicUrl(thumbPath);
  thumbnailUrl = tUrl;
}
```

**This bypasses Mux entirely and uploads videos directly to Supabase.**

⚠️ **Trade-offs:**
- ✅ Videos work immediately
- ❌ No HLS streaming (videos won't load as smoothly)
- ❌ No automatic transcoding
- ❌ Larger file sizes (not optimized)

---

## 🎯 Recommended Solution

**Use Mux** - It's the proper solution for production video hosting:
- Automatic video transcoding
- Adaptive bitrate streaming (HLS)
- Better performance
- Bandwidth optimization
- Free tier available: **500 minutes of video storage free**

Get your credentials and add them to Railway. It takes **5 minutes** and your videos will work perfectly.

---

## 📊 Debugging

If videos still don't work after adding credentials, check:

1. **Railway Logs** (click "Deployments" → latest deployment → "View Logs")
   - Look for: `✅ Mux client initialized successfully`
   - Or error: `❌ MUX CREDENTIALS MISSING!`

2. **Browser Console** (F12 → Console tab)
   - Try uploading a video
   - Look for API errors from `/api/mux/create-upload`

3. **Network Tab** (F12 → Network tab)
   - Upload a video
   - Check the response from `create-upload` endpoint
   - Should return `{ uploadUrl: "...", uploadId: "..." }`

---

## ✨ Improvements Made

I've updated your backend code to provide **clearer error messages** when Mux credentials are missing:

- `backend/routes/mux.ts` now checks if credentials exist before initializing
- Logs exactly which credentials are missing at startup
- Returns helpful error message to frontend if upload fails

---

## 🚀 Next Steps

1. Add Mux credentials to Railway (**5 minutes**)
2. Verify deployment logs show `✅ Mux client initialized`
3. Test video upload
4. Ship it! 🔥

**Questions?** Check the logs and let me know what error you're seeing.
