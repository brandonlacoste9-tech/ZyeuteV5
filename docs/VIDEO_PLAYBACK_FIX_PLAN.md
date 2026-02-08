# Plan: Fix Video Not Playing (Black Screen)

**Goal:** Get videos playing in the feed and single-video view (Mux, Pexels, and direct URLs).  
**Symptom:** Screen stays black; no picture, or "Vidéo non disponible" / "Aucune vidéo".

---

## 1. Diagnose: Where It Breaks

### 1.1 Identify the path in use

| Path | When used | Where to check |
|------|-----------|----------------|
| **Mux** | Post has `mux_playback_id` / `muxPlaybackId` | VideoCard → MuxVideoPlayer; VideoPlayer (when `muxPlaybackId` set) |
| **Native HTML5** | Post has `media_url` (mp4, Pexels, etc.) and no Mux ID | VideoCard / VideoPlayer with `src={post.media_url}` |
| **Pexels** | Feed fallback or Explore; post has `media_url` from Pexels | Same as native; URL like `pexels.com` or CDN |

**Quick checks in browser:**
- **DevTools → Network:** Filter by "media" or "m3u8" / "mp4". Do requests to `stream.mux.com` or video URLs succeed (200) or fail (CORS/blocked)?
- **Console:** Any CSP violations, "Failed to load resource", or Mux/VideoPlayer log lines?
- **React state:** For the visible card, does the post have `mux_playback_id` or only `media_url`? (Log `post` in VideoCard or feed.)

### 1.2 Checklist by source

- [ ] **Mux:** Playback ID present in API response? Webhook ran so DB has `mux_playback_id` + `media_url`?
- [ ] **Pexels / direct URL:** `media_url` valid (opens in new tab)? Same-origin or CORS-friendly for `<video src>`?
- [ ] **Backend:** Feed and post endpoints return `media_url` and `mux_playback_id` (snake_case or camelCase) correctly?

---

## 2. Backend

### 2.1 Mux webhook → playback ID in DB

- **Route:** `POST /api/webhooks/mux`
- **Railway:** Webhook URL must be your public backend (e.g. `https://zyeutev5-production.up.railway.app/api/webhooks/mux` or the URL from `vercel.json` rewrite target). Mux Dashboard → Webhooks → add URL + signing secret.
- **Env:** `MUX_WEBHOOK_SECRET` set in Railway (same as Mux signing secret).
- **Logic:** `backend/routes/mux.ts` on `video.asset.ready` updates post by `mux_asset_id` or `mux_upload_id`, setting `mux_playback_id`, `media_url` (HLS), thumbnail. If webhook never runs or fails, posts stay with only `mux_upload_id` and no playback ID → frontend falls back to native with an empty or invalid `media_url` → black screen.

**Actions:**
1. Confirm webhook URL and secret in Mux Dashboard and Railway.
2. In Railway logs, confirm "Mux webhook received" and "Post … updated with Mux asset info" after an upload.
3. If webhook is missing, fix URL/secret and re-upload a test video (or simulate event from Mux Dashboard).

### 2.2 Feed API returns correct fields

- **Endpoint:** e.g. `GET /api/posts/feed` or explore; response shapes in `frontend/src/services/api.ts` (e.g. `normalizePost`).
- **Fields:** Each post must have `media_url` (or `mediaUrl`) and, for Mux, `mux_playback_id` (or `muxPlaybackId`). Backend must select these from DB and return them (snake_case from DB is normalized to camelCase in api.ts).

**Actions:**
1. Call feed/explore from browser or Postman; inspect one video post: has `media_url`? For Mux uploads, has `mux_playback_id`?
2. If not, fix backend query/response (and any renames) so frontend gets both.

### 2.3 Pexels and direct URLs

- Pexels: Backend uses `PEXELS_API_KEY`; `/api/pexels/curated` (and collection) return video links. Feed uses these as `media_url` for fallback posts. No Mux ID.
- Direct URLs (e.g. Supabase Storage, S3): Must be returned as `media_url` and be reachable (no broken links, correct CORS if played in browser).

**Actions:**
1. Ensure `PEXELS_API_KEY` is set in Railway (see VIDEO_MEDIA_STACK_CHECKLIST.md).
2. For non-Pexels direct URLs, verify URL in DB and that it loads in a new tab.

---

## 3. Frontend

### 3.1 Which component is used?

- **VideoCard (feed):** If `post.muxPlaybackId || post.mux_playback_id` → `MuxVideoPlayer`; else → `VideoPlayer` with `src={post.media_url}`.
- **SingleVideoView:** Uses `VideoPlayer` with both `src` and `muxPlaybackId`; VideoPlayer prefers Mux when `muxPlaybackId` is set.

**Actions:**
1. Add a short-lived `console.log` in VideoCard: `post.type`, `post.mux_playback_id`, `post.media_url` (first 80 chars). Confirm the branch (Mux vs native) and that URLs/IDs are non-empty.
2. If Mux branch but playback ID is empty, fix backend/webhook (see §2.1). If native branch but `media_url` empty, fix feed/API (see §2.2).

### 3.2 Mux player (MuxVideoPlayer + VideoPlayer Mux branch)

- **Libraries:** `@mux/mux-player-react`; player loads HLS from `stream.mux.com`.
- **CSP:** Browser may block requests to `stream.mux.com` if not in `connect-src` (and possibly `media-src`). Current `vercel.json` CSP does not list `stream.mux.com` or `*.mux.com`.

**Actions:**
1. Add to CSP in `vercel.json` (and any other CSP you use):
   - `connect-src`: add `https://stream.mux.com https://*.mux.com https://image.mux.com` (for HLS and thumbnails).
   - If needed for the player itself: `script-src` / `frame-src` per Mux docs (usually not required for embed).
2. Reload app and check Console for CSP errors; confirm Network requests to `stream.mux.com` return 200.

### 3.3 Native HTML5 path (VideoPlayer with `src`)

- **Source:** `post.media_url` (mp4, Pexels CDN, etc.). If empty or invalid, VideoPlayer shows "Aucune vidéo" or black.
- **CORS:** For cross-origin URLs, the server must send `Access-Control-Allow-Origin` (or allow your origin). Pexels/CDNs usually do; custom backends (e.g. Supabase Storage) must be configured.
- **Validation:** `isValidVideoUrl(src)` must return true (see `VideoPlayer.tsx` / shared `validatePostType`). Invalid URL → placeholder, not playback.

**Actions:**
1. Ensure feed passes a non-empty, reachable `media_url` for non-Mux videos.
2. If URL is valid but video still black, check CORS and Network (4xx/5xx). If CORS blocks, fix server or use a same-origin proxy for that URL.

### 3.4 Error states and fallbacks

- **Mux:** `muxError` / `hasError` → "Vidéo non disponible" + Retry. Retry only resets error state; if the problem is bad playback ID or CSP, fix backend/CSP.
- **Native:** No valid URL → "Aucune vidéo". Empty `src` or invalid URL → same.

**Actions:**
1. Don’t rely only on Retry; fix root cause (webhook, API, CSP, CORS).
2. Optional: add a small "Copy debug info" (post id, type, mux_playback_id, media_url) for support.

---

## 3.5. Code Walkthrough: Mux Upload → Playback Flow

### Step 1: User uploads video
**File**: `frontend/src/pages/Upload.tsx`
```tsx
// Creates Mux direct upload
const response = await fetch(`${API_BASE_URL}/api/mux/upload`, {
  method: 'POST',
  body: formData, // Contains video file
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Step 2: Backend creates Mux upload
**File**: `backend/routes/mux.ts` (lines 67-100)
```typescript
muxRouter.post("/upload", upload.single('video'), async (req, res) => {
  // 1. Create direct upload in Mux
  const directUpload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
      mp4_support: 'standard',
    },
  });

  // 2. Upload video to Mux URL
  await axios.put(directUpload.url, req.file.buffer, {
    headers: { 'Content-Type': req.file.mimetype }
  });

  // 3. Create post in DB with mux_upload_id (NOT playback ID yet)
  const post = await storage.createPost({
    user_id: userId,
    type: 'video',
    mux_upload_id: directUpload.id,
    media_url: '', // Empty until webhook runs
    caption,
  });

  res.json({ postId: post.id, uploadId: directUpload.id });
});
```

### Step 3: Mux processes video & sends webhook
Mux transcodes the video and triggers `video.asset.ready` webhook.

### Step 4: Webhook updates database
**File**: `backend/routes/mux.ts` (webhook handler)
```typescript
muxRouter.post("/webhooks/mux", async (req, res) => {
  const event = req.body;

  if (event.type === "video.asset.ready") {
    const asset = event.data;
    const playbackId = asset.playback_ids?.[0]?.id;
    const mediaUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    // Find post by mux_upload_id or mux_asset_id
    await storage.updatePostByMuxAssetId(asset.id, {
      mux_playback_id: playbackId,
      media_url: mediaUrl,
      thumbnail: asset.playback_ids?.[0]?.poster_url,
    });

    console.log(`✅ Post updated with Mux playback ID: ${playbackId}`);
  }

  res.status(200).json({ received: true });
});
```

### Step 5: Feed returns post with playback ID
**File**: `frontend/src/services/api.ts`
```typescript
export async function getFeed() {
  const response = await fetch(`${API_BASE_URL}/api/posts/feed`);
  const posts = await response.json();
  return posts.map(normalizePost); // Converts snake_case to camelCase
}

function normalizePost(post: any): Post {
  return {
    ...post,
    muxPlaybackId: post.mux_playback_id, // ⭐ Key conversion
    mediaUrl: post.media_url,
  };
}
```

### Step 6: VideoCard renders with Mux player
**File**: `VideoCard.tsx` (lines 160-182)
```tsx
{(post as any).muxPlaybackId || (post as any).mux_playback_id ? (
  <Suspense fallback={<div className="w-full h-full bg-black" />}>
    <MuxVideoPlayer
      playbackId={
        (post as any).muxPlaybackId || (post as any).mux_playback_id || ""
      }
      poster={post.thumbnail_url || post.media_url}
      autoPlay={autoPlay}
      muted={muted}
      loop
    />
  </Suspense>
) : (
  <VideoPlayer src={post.media_url} />
)}
```

### Common Breakpoints for Debugging

1. **Webhook not firing**: Check Railway logs for "Mux webhook received"
2. **Empty playback ID**: Query database: `SELECT mux_playback_id FROM posts WHERE id = '...'`
3. **CSP blocking**: Open DevTools Console, look for "refused to connect" errors
4. **Player not loading**: Check Network tab for failed requests to `stream.mux.com`

---

## 4. Environment and URLs

### 4.1 Backend URL

- **Frontend:** `frontend/src/services/api.ts` uses `API_BASE_URL` (e.g. `https://zyeutev5-production.up.railway.app`) when not on localhost.
- **vercel.json:** Rewrites `/api/(.*)` to `https://zyeute-api.railway.app/api/$1`. If those are different backends, feed and webhooks might hit different instances; keep them aligned or use one canonical backend URL everywhere.

**Actions:**
1. Decide canonical backend (e.g. `zyeutev5-production.up.railway.app` or `zyeute-api.railway.app`).
2. Set `API_BASE_URL` (or `VITE_API_URL`) to that URL and point Mux webhook and Vercel rewrite to the same host.

### 4.2 Env vars (recap)

- **Backend (Railway):** `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, `PEXELS_API_KEY`, `DATABASE_URL`.
- **Frontend:** No Mux/Pexels secrets; only backend URL (and any feature flags). See VIDEO_MEDIA_STACK_CHECKLIST.md.

---

## 5. Implementation Order (Suggested)

1. **CSP (quick win):** Add `stream.mux.com` and `*.mux.com` (and `image.mux.com`) to `connect-src` in `vercel.json`. Deploy and test one Mux video.
2. **Verify API shape:** Call feed/explore, confirm `media_url` and `mux_playback_id` on video posts. Fix backend if missing.
3. **Verify Mux webhook:** Check Railway logs and DB: after upload, does the post get `mux_playback_id`? If not, fix webhook URL and `MUX_WEBHOOK_SECRET`, then re-upload.
4. **Frontend branch:** Log in VideoCard which path (Mux vs native) and the IDs/URLs. Fix any empty playback ID or media_url at source.
5. **Native URL and CORS:** For non-Mux videos, ensure `media_url` is set and playable (tab + CORS). Fix storage CORS or proxy if needed.
6. **Optional:** Add a minimal "video debug" panel (post id, type, has mux id, first 50 chars of media_url) behind a flag or dev-only.

---

## 6. Files to Touch (Summary)

| Area | Files |
|------|--------|
| CSP | `vercel.json` (headers → Content-Security-Policy → connect-src, media-src) |
| Feed/API response | Backend route that returns posts (e.g. feed, explore); ensure `mux_playback_id` + `media_url` in response |
| Mux webhook | `backend/routes/mux.ts`; Railway env + Mux Dashboard webhook URL |
| Frontend branch | `frontend/src/components/features/VideoCard.tsx`, `VideoPlayer.tsx`, `SingleVideoView.tsx` |
| API base URL | `frontend/src/services/api.ts` (API_BASE_URL or VITE_API_URL) |
| Normalization | `frontend/src/services/api.ts` (`normalizePost` / response mapping for mux_playback_id, media_url) |

---

## 7. Success Criteria

- [ ] Mux upload → webhook runs → post has `mux_playback_id` in DB and in feed response → MuxVideoPlayer or VideoPlayer (Mux branch) plays without black screen; no CSP errors.
- [ ] Pexels / direct URL posts have valid `media_url` in feed → VideoPlayer (native) plays; no CORS block.
- [ ] No "Aucune vidéo" or "Vidéo non disponible" for posts that have valid Mux ID or media URL.
- [ ] Single video view plays same as in feed for that post.

---

**Last updated:** 2026-02-05
