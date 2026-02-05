# Video & Media Stack Checklist (Mux + Pexels)

Quick reference to get (or re-verify) the video and media stack after changes.

---

## 1. Environment variables

**Backend (Railway / local `.env`):**

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `MUX_TOKEN_ID` | Mux API (upload + playback) | [Mux Dashboard](https://dashboard.mux.com) → Settings → Access Tokens |
| `MUX_TOKEN_SECRET` | Mux API | Same as above |
| `MUX_WEBHOOK_SECRET` | Verify Mux webhook payloads | Mux Dashboard → Webhooks → Signing secret |
| `PEXELS_API_KEY` | Pexels curated/collection videos | [Pexels API](https://www.pexels.com/api/) |

If any of these are missing:

- **Mux:** Uploads will fail; backend logs: `MUX CREDENTIALS MISSING`.
- **Pexels:** Feed fallback and Pexels gallery will fail; backend logs: `PEXELS_API_KEY is missing`. Set `PEXELS_API_KEY` in Railway (and in local `.env` for dev).

---

## 2. Flow summary

**Mux (user uploads):**

1. Frontend calls `POST /api/mux/create-upload` → backend returns `uploadUrl` + `uploadId`.
2. Frontend uploads file to that URL with `@mux/upchunk`.
3. Post is created with `mux_upload_id`.
4. Mux processes video and sends webhook to `POST /api/webhooks/mux`.
5. Backend updates post with `mux_playback_id`, thumbnail, `mediaUrl` (HLS).
6. Feed uses `MuxVideoPlayer` / `VideoPlayer` with `muxPlaybackId` for playback.

**Pexels (stock content):**

1. Feed (or empty DB) calls `GET /api/pexels/curated` (or collection).
2. Backend uses `PEXELS_API_KEY` to call Pexels API; returns videos to frontend.
3. `ContinuousFeed` maps Pexels items to post shape and shows them (e.g. fallback when DB is empty or API fails).

---

## 3. Things that often break after changes

- **Backend URL mismatch**  
  Frontend `api.ts` uses `API_BASE_URL`: on non-localhost it’s hardcoded to `https://zyeutev5-production.up.railway.app`. If your backend URL changed (e.g. new Railway service), update that constant or switch to `VITE_API_URL` and set it in Vercel/Railway.

- **Pexels not set on Railway**  
  Feed fallback and Pexels gallery need `PEXELS_API_KEY` on the backend. If you only added it to `.env` locally, add it in Railway → Service → Variables.

- **Mux webhook URL**  
  In Mux Dashboard, webhook URL must be your public backend base + `/api/webhooks/mux` (e.g. `https://zyeutev5-production.up.railway.app/api/webhooks/mux`). Use HTTPS.

- **CSP / network**  
  `vercel.json` already allows `*.pexels.com`, `api.pexels.com`, and Mux domains. If you add new media domains, add them to `connect-src` / `media-src` / `img-src` as needed.

- **Rate limiting**  
  Pexels routes are excluded from the general API rate limiter in `backend/routes.ts`. If you added a global limiter that runs before the Pexels mount, ensure `/api/pexels` is still skipped (e.g. by path).

---

## 4. Quick test

1. **Pexels:** Open app → Explore or feed (with empty or failing DB). You should see Pexels content, or at least no “Impossible de charger” due to Pexels if backend returns 200 + empty.
2. **Mux:** Upload a short video. Check Network tab: `create-upload` then request to `uploadUrl`. After processing, post should play with Mux player (playback ID in DB).
3. **Backend logs:** On startup you should see `Mux client initialized successfully` when Mux env vars are set, and the Pexels warning only when `PEXELS_API_KEY` is missing.

---

## 5. Related files

- **Mux:** `backend/routes/mux.ts`, `frontend/src/pages/Upload.tsx`, `frontend/src/components/features/MuxVideoPlayer.tsx`, `VideoPlayer.tsx` (Mux branch).
- **Pexels:** `backend/services/pexels-service.ts`, `backend/routes/pexels.ts`, `frontend/src/services/api.ts` (`getPexelsCurated`, `getPexelsCollection`), `frontend/src/components/features/ContinuousFeed.tsx` (fallback).
- **Config:** `.env.example` (Mux + PEXELS_API_KEY), `vercel.json` (CSP), `MUX_INTEGRATION_STATUS.md`.

---

**Last updated:** 2026-02-05
