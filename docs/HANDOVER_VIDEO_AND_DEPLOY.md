# Handover: What We Did, What’s Done, What We Have, What We Need

**For:** Claude Code (or anyone picking up the video playback + deploy work)  
**Last updated:** 2026-02-05

---

## 0. Quick Start: Your First 5 Minutes

### When taking over this project, do this FIRST:

**1. Read these 4 docs in order** (30 min):
- This file (HANDOVER_VIDEO_AND_DEPLOY.md) - context
- CLAUDE_CODE_MASTER_PLAN_QUEBEC_TIKTOK.md - mission
- UI_COPY_QUEBEC_FRENCH.md - language rules
- VIDEO_PLAYBACK_FIX_PLAN.md - technical details

**2. Verify deployment health** (5 min):
```bash
# Frontend (should return 200)
curl https://zyeutev5.vercel.app

# Backend health (should return {"status":"healthy"})
curl https://zyeutev5-production.up.railway.app/api/health

# Check Mux webhook (Railway logs)
railway logs --service backend | grep "Mux webhook"
```

**3. Check critical files exist** (2 min):
```bash
cd ZyeuteV5-5

# Quebec emblem
ls frontend/public/quebec-emblem.png  # Should exist, ~250KB

# i18n system
cat frontend/src/i18n/index.ts | head -20

# Video components
ls frontend/src/components/features/VideoCard.tsx
ls frontend/src/components/features/MuxVideoPlayer.tsx
```

**4. Identify current blocker** (10 min):
- Open app: https://zyeutev5.vercel.app
- Go to Feed page
- Do videos play? If not, follow VIDEO_PLAYBACK_FIX_PLAN.md §3.5
- Are strings in Quebec French? If not, audit with UI_COPY_QUEBEC_FRENCH.md §6

---

## 0.5. What to tell Claude (or any agent)

**Repo:**  
- **GitHub:** `brandonlacoste9-tech/ZyeuteV5`  
- **URL:** https://github.com/brandonlacoste9-tech/ZyeuteV5  
- **Branch:** `main`

**Starting point:**  
- **Master plan (Quebec French + TikTok-style):** **`docs/CLAUDE_CODE_MASTER_PLAN_QUEBEC_TIKTOK.md`** — single brief for language, UI copy, TikTok features, emblem, video, and implementation order.  
- Full context and deploy/agents: **`docs/HANDOVER_VIDEO_AND_DEPLOY.md`** (this file).  
- Video black-screen fix: **`docs/VIDEO_PLAYBACK_FIX_PLAN.md`**.

**Language — Quebec French:**  
- All user-facing text (UI labels, buttons, messages, placeholders, errors) must be in **Québec French** (français québécois), not English or international French.  
- **Copy reference:** Use **`docs/UI_COPY_QUEBEC_FRENCH.md`** for ready-to-use strings (buttons, labels, toasts, errors), variables (`{username}`, `{count}`), and the mini style guide (tu, accents, no English, etc.). Match existing app tone (e.g. “Feux”, “Suivre”, “Vérifie ta connexion”, “Vidéo non disponible”).

**Agent teams (this repo):** See **§1. Agent teams** below.

---

## 1. Agent teams

This repo is set up for multi-agent and copilot workflows. Use these when assigning work or when an agent needs to know how the project is run.

### GitHub issue templates (agent assignments)

Create issues from: **GitHub → Issues → New issue → choose template.**

| Template | Purpose | Labels |
|----------|---------|--------|
| **AGENT 1 – SWE Live Audit** | Live audit & root cause (e.g. login page) | agent-task, audit |
| **AGENT 2 – Code Security & Quality** | Security & quality scan (auth, sanitization, CSP) | agent-task, security |
| **AGENT 3 – CI/CD Pipeline & Testing** | Automated tests, GitHub Actions, coverage | agent-task, ci-cd, testing |
| **AGENT 4 – Issue Triage & Planning** | Organize issues, dependencies, prioritization | agent-task, triage |

- **Templates:** `.github/ISSUE_TEMPLATE/agent_swe_audit.yml`, `agent_code_analysis.yml`, `agent_cicd.yml`, `agent_issues_triage.yml`
- **Quick start:** `AGENT_QUICK_START.md` – create 4 issues, agents work ~15h, then review/merge.

### AGENTS.md (Byterover MCP)

- **File:** `AGENTS.md` (repo root)
- **Role:** Instructions for agents using the **Byterover MCP** server:
  - **byterover-store-knowledge:** Use after learning patterns, fixing errors, or completing significant work.
  - **byterover-retrieve-knowledge:** Use at task start, before architecture decisions, when debugging, or in unfamiliar areas.
- If the agent has Byterover MCP, it should follow these rules.

### Copilot / AI instructions

- **.github/copilot-instructions.md** – Copilot instructions (Byterover store/retrieve).
- **.github/copilot-instructions.new.md** – Newer/alternate copilot content (e.g. Docker, bees).
- **.cursorrules** / **.cursor/rules/** – Cursor rules (e.g. Antigravity session, Zyeuté context).

### Triage and project board

- **Triage:** `.github/TRIAGE_WORKFLOW.md`, `TRIAGE_QUICKSTART.md`, `TRIAGE_SYSTEM_SUMMARY.md` – how issues are triaged and prioritized.
- **Labels:** `.github/LABELS.md` – label definitions.
- **Board:** `.github/PROJECT_BOARD.md` – project board and workflow.
- **Issue config:** `.github/ISSUE_TEMPLATE/config.yml` – contact links (Discussions, Docs, Deployment, Triage, Labels).

### Other agent-related files

- **Audit / security templates:** `.github/ISSUE_TEMPLATE/audit_*.yml` (e.g. audit_bug_triaged.yml, audit_security.yml, audit_test_coverage.yml).
- **CI/CD:** `.github/CI_CD_QUICK_START.md`, workflows in `.github/workflows/` (ci, test, deploy-production, deploy-staging, docker-publish, etc.).

---

## 2. What we have done before

### Docker & Railway (this session)

- **Docker login:** User logged into Docker Hub as `brandontech` (PAT used once; not stored in repo).
- **Docker Hub CI:** Added `.github/workflows/docker-publish.yml` to build and push `brandontech/zyeute-backend` and `brandontech/zyeute-colony-worker` on push to `main` (when backend/Dockerfiles change) or manual run. Uses GitHub secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
- **Railway + Docker:** Set `railway.json` to use `backend/Dockerfile` (`dockerfilePath: "backend/Dockerfile"`). Removed `startCommand` so the image CMD runs. Documented in `docs/RAILWAY_DOCKER.md`.
- **Railway build fixes:**
  - **COPY backend/package.json:** Railway sometimes uses `backend/` as build context, so `COPY backend/package.json` failed. Changed to `COPY --from=build /app/backend/package.json ./` in `backend/Dockerfile`.
  - **npm ci ERESOLVE:** express-async-errors@3.1.1 expects Express 4; project uses Express 5. Added `npm ci --legacy-peer-deps` in the Dockerfile deps stage so the build passes.
- **Backend Dockerfile healthcheck:** Updated to hit `/api/health` and use `process.env.PORT` so it works with Railway.

### Video & media stack (earlier + this session)

- **Mux + Pexels** were already integrated (upload flow, webhook, feed fallback, MuxVideoPlayer, VideoPlayer). User reported “screen still black” and wanted a plan.
- **Docs added:** `docs/VIDEO_MEDIA_STACK_CHECKLIST.md` (env vars, flows, common breakages), `docs/VIDEO_PLAYBACK_FIX_PLAN.md` (diagnosis, backend/frontend/CSP, implementation order, success criteria).
- **.env.example:** Added `PEXELS_API_KEY` so it’s not missed on Railway.
- **CSP for Mux:** In `vercel.json`, added to CSP `connect-src`: `https://stream.mux.com`, `https://*.mux.com`, `https://image.mux.com` so Mux HLS and thumbnails aren’t blocked.

### CI/docs

- **.github/CI_CD_QUICK_START.md:** Documented Docker Hub secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) and when the Docker workflow runs.

---

## 3. What’s done now

| Area | Status |
|------|--------|
| Docker Hub login | Done (user did it; token not in repo). |
| Docker Build & Push workflow | Done; uses secrets; pushes to `brandontech/zyeute-*`. |
| Railway Dockerfile config | Done; `railway.json` points at `backend/Dockerfile`. |
| Railway Docker build | Fixed (package.json from build stage; npm ci --legacy-peer-deps). |
| Backend healthcheck in image | Done; `/api/health` + PORT. |
| PEXELS_API_KEY in .env.example | Done. |
| VIDEO_MEDIA_STACK_CHECKLIST | Done. |
| VIDEO_PLAYBACK_FIX_PLAN | Done. |
| CSP for Mux (stream.mux.com etc.) | Done in `vercel.json`. |
| RAILWAY_DOCKER.md | Done. |

**Not done (video still not playing):** Root cause of black screen not fully fixed. Plan and CSP are in place; webhook, API shape, and frontend branch/URLs may still need verification and fixes.

---

## 4. What we have

### Repo / config

- **Backend Dockerfile:** `backend/Dockerfile` (multi-stage; Node 20 Alpine; Python for colony; healthcheck `/api/health`).
- **Railway:** `railway.json` at repo root with `builder: DOCKERFILE`, `dockerfilePath: backend/Dockerfile`, `healthcheckPath: /api/health`.
- **Vercel:** `vercel.json` with API rewrite to `https://zyeute-api.railway.app/api/$1` and CSP header including Mux domains.
- **Frontend API base URL:** In `frontend/src/services/api.ts`, `API_BASE_URL` is `https://zyeutev5-production.up.railway.app` when not localhost. Note: different from vercel rewrite target `zyeute-api.railway.app`; may need to align.

### Video/media code

- **Mux:** `backend/routes/mux.ts` (create-upload, webhook), `frontend` Upload flow (createMuxUpload, UpChunk), `MuxVideoPlayer.tsx`, `VideoPlayer.tsx` (Mux branch when `muxPlaybackId` set).
- **Pexels:** `backend/services/pexels-service.ts`, `backend/routes/pexels.ts`, `frontend` getPexelsCurated / getPexelsCollection, `ContinuousFeed.tsx` fallback.
- **Feed video branch:** `VideoCard.tsx`: if `muxPlaybackId` or `mux_playback_id` → MuxVideoPlayer; else → VideoPlayer with `post.media_url`. SingleVideoView uses VideoPlayer with both `src` and `muxPlaybackId`.

### Docs

- `docs/VIDEO_PLAYBACK_FIX_PLAN.md` – Plan to fix black screen (diagnose, backend, frontend, CSP, order of work).
- `docs/VIDEO_MEDIA_STACK_CHECKLIST.md` – Env vars, Mux/Pexels flows, common breakages.
- `docs/RAILWAY_DOCKER.md` – Railway + Docker (current setup, optional “deploy from image”).
- `docs/HANDOVER_VIDEO_AND_DEPLOY.md` – This file.
- `MUX_INTEGRATION_STATUS.md` – Mux integration checklist (pre-existing).

### Env / secrets (reference)

- **Backend (Railway):** `DATABASE_URL`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, `PEXELS_API_KEY`, plus any other existing vars.
- **GitHub Actions:** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (for Docker Build & Push).
- **Mux Dashboard:** Webhook URL = backend base + `/api/webhooks/mux`; signing secret = same as `MUX_WEBHOOK_SECRET`.

---

## 5. What we need

### Video playback (black screen)

1. **Confirm path and data**
   - In browser: for a video card, does the post have `mux_playback_id` or only `media_url`?
   - Feed/explore API response: does each video post include `media_url` and (for Mux) `mux_playback_id`?
   - Console/Network: any CSP errors? Failed requests to `stream.mux.com` or video URLs?

2. **Mux webhook**
   - Mux Dashboard: webhook URL points at the same backend the app uses (e.g. `zyeutev5-production.up.railway.app` or `zyeute-api.railway.app`).
   - Railway: `MUX_WEBHOOK_SECRET` set and matches Mux.
   - Railway logs: after an upload, see “Mux webhook received” and “Post … updated with Mux asset info”. If not, fix URL/secret and re-test.

3. **Backend URL consistency**
   - Decide canonical backend host. Update either:
     - `frontend/src/services/api.ts` (`API_BASE_URL` or `VITE_API_URL`), or
     - `vercel.json` rewrite and Mux webhook URL
   so feed, upload, and webhook all hit the same backend.

4. **Native / Pexels**
   - Ensure `PEXELS_API_KEY` is set in Railway (and in local `.env` for dev).
   - For non-Mux videos, ensure `media_url` is non-empty and reachable (and CORS allows playback if cross-origin).

5. **Optional**
   - Short debug log in VideoCard (e.g. post type, mux_playback_id, first 50 chars of media_url) to confirm which branch runs and what data the player gets.

### TikTok-style social features (Claude Code brief)

**Language:** All new UI text (buttons, labels, tooltips, toasts) must be in **Québec French**. Use the strings and style guide in **`docs/UI_COPY_QUEBEC_FRENCH.md`** (e.g. Suivre / Abonné·e(s), Ajouter / Enregistrer, Partager, Feux, Commentaires; toasts like “Vidéo enregistrée”, “Tu suis {username}”). Do not add English or international French strings.

**Goal:** Bring the feed and video cards in line with TikTok-style UX: clear emojis (e.g. fire for like), follow, add (save), share, and any other TikTok-like features previously discussed.

**Scope for Claude:**

1. **Emojis**
   - Use **fire emoji** for the “fire” (like) action where it makes sense (e.g. label, tooltip, or alongside the flame icon in `VideoCard`).
   - Add or standardise emojis for **follow**, **add/save**, and **share** (e.g. ➕ or bookmark for add, share icon or emoji) so actions are recognisable at a glance.

2. **Follow**
   - **Follow creator** from the card or profile: button + state (Following / Suivre), and wire to backend (follow/unfollow API if it exists; otherwise implement or stub).
   - Show follow state on `VideoCard` (e.g. “Follow” on the author row or right-side strip).

3. **Add (save / favorite)**
   - **Add to saved** or “Add” (save/favorite) action: button on card, optional collection/playlist later.
   - Wire to existing save/favorite API if present (e.g. Saved page, `post.saved`); otherwise add endpoint + UI.

4. **Share**
   - **Share** is already on `VideoCard` (actions bar). Ensure it opens native share when available (Web Share API) or copy-link fallback, and that the shared URL is correct (e.g. deep link to post).

5. **Full TikTok-style set**
   - **Right-side vertical action strip** on video (follow creator, fire, comment, share, save) if not already there; otherwise keep/refine the current actions bar so it clearly includes: follow + fire + comment + share + add/save.
   - Keep or add counts next to fire, comment, etc., and fire emoji for the like action.

6. **Previously discussed**
   - Implement any **other TikTok-like features** already agreed (e.g. double-tap to fire, haptics, notifications for “feux”/likes). If not documented in this repo, confirm with the product owner.

**Where to look:** `frontend/src/components/features/VideoCard.tsx` (actions bar: fire, comment, share; add follow + add/save and emojis), `ContinuousFeed.tsx` (how cards get callbacks), profile/follow APIs in `frontend/src/services/api.ts` and backend routes. Notifications for “feux” are referenced in `NotificationSettings.tsx` (“Recevoir des notifications pour les feux (likes)”).

---

### Deploy / ops (optional follow-ups)

- **Railway:** Confirm service “Root Directory” is repo root (not `backend/`) so Docker build context is correct. Redeploy after any Dockerfile/railway.json change.
- **Docker Hub:** If images are private, add Docker Hub credentials in Railway for “Deploy from Docker Image” (see `docs/RAILWAY_DOCKER.md`).
- **Dependabot:** GitHub reported 17 vulnerabilities on default branch; consider addressing when convenient.

---

## 6. Quick reference: key files

| Purpose | File(s) |
|--------|--------|
| Video playback fix plan | `docs/VIDEO_PLAYBACK_FIX_PLAN.md` |
| Media stack / env | `docs/VIDEO_MEDIA_STACK_CHECKLIST.md` |
| Feed video branch | `frontend/src/components/features/VideoCard.tsx` |
| Players | `frontend/src/components/features/VideoPlayer.tsx`, `MuxVideoPlayer.tsx` |
| API shape / feed | `frontend/src/services/api.ts` (normalizePost, feed calls) |
| Mux backend | `backend/routes/mux.ts` |
| Pexels backend | `backend/services/pexels-service.ts`, `backend/routes/pexels.ts` |
| CSP | `vercel.json` (headers → Content-Security-Policy) |
| Backend URL | `frontend/src/services/api.ts` (API_BASE_URL) |
| Railway Docker | `railway.json`, `backend/Dockerfile`, `docs/RAILWAY_DOCKER.md` |
| TikTok-style actions (fire, follow, add, share) | `frontend/src/components/features/VideoCard.tsx`, feed callbacks in `ContinuousFeed.tsx` |
| Follow / profile APIs | `frontend/src/services/api.ts`, backend routes (follow, profile) |
| Notifications (feux/likes) | `frontend/src/pages/settings/NotificationSettings.tsx` |
| UI copy — Québec French (strings, toasts, style guide) | `docs/UI_COPY_QUEBEC_FRENCH.md` |
| **Master plan — Quebec French TikTok-style takeover** | **`docs/CLAUDE_CODE_MASTER_PLAN_QUEBEC_TIKTOK.md`** |

---

## 7. Common Debugging Scenarios

### Scenario 1: Videos Show Black Screen

**Symptoms**:
- VideoCard renders but video area is black
- No error in console
- Network tab shows no video requests

**Diagnosis**:
```bash
# In browser console on /feed page:
# Check if post has playback ID
console.log(posts[0].muxPlaybackId, posts[0].media_url)
```

**Solutions**:
- **If playback ID is null**: Webhook didn't fire or failed
  - Check Railway logs: `railway logs --service backend | grep Mux`
  - Verify webhook URL in Mux dashboard matches Railway URL
  - Check `MUX_WEBHOOK_SECRET` in Railway matches Mux signing secret

- **If playback ID exists but video doesn't load**: CSP blocking
  - Open DevTools Console
  - Look for "refused to connect to stream.mux.com"
  - Fix: Update CSP in `vercel.json` (already done as of 2026-02-05)

- **If media_url is null**: Post was created before webhook ran
  - Delete and re-upload video
  - OR manually update post in Supabase with playback ID from Mux dashboard

### Scenario 2: Strings Are in English

**Symptoms**:
- Buttons say "Loading...", "Submit", "Delete"
- Should say "Ça charge...", "Envoyer", "Sacrer ça aux vidanges"

**Diagnosis**:
```bash
# Search for hardcoded English strings
grep -r "Loading\.\.\." frontend/src/components/
grep -r "Submit" frontend/src/components/
```

**Solutions**:
1. Add missing string to `frontend/src/i18n/index.ts`:
```typescript
"fr-CA": {
  "btn_submit": "Envoyer",
  "loading": "Ça charge...",
}
```

2. Replace hardcoded string in component:
```tsx
// Before:
<button>Submit</button>

// After:
import { useTranslation } from '@/i18n';
const { t } = useTranslation();
<button>{t('btn_submit')}</button>
```

3. Document in `docs/UI_COPY_QUEBEC_FRENCH.md`

### Scenario 3: Quebec Emblem Not Showing

**Symptoms**:
- Header or video cards don't show fleur-de-lys emblem
- 404 error for `/quebec-emblem.png`

**Diagnosis**:
```bash
# Check if asset exists
ls frontend/public/quebec-emblem.png

# Check if asset is being copied to dist
ls frontend/dist/quebec-emblem.png  # After build
```

**Solutions**:
- **If file doesn't exist**: Asset was deleted
  - Restore from git: `git checkout HEAD -- frontend/public/quebec-emblem.png`
  - Or download new emblem and place in `frontend/public/`

- **If file exists but not in dist**: Vite config issue
  - Check `vite.config.ts` publicDir setting
  - Rebuild: `cd frontend && npm run build`

- **If file in dist but not loading**: Path issue in component
  - Update image src to `/quebec-emblem.png` (absolute path from public root)
  - Example in VideoCard (lines 218-228):
  ```tsx
  <img
    src="/quebec-emblem.png"
    alt="Quebec Or"
    className="absolute top-2 right-2 h-6 w-auto"
  />
  ```

### Scenario 4: Railway Deployment Failing

**Symptoms**:
- Push to main doesn't trigger deploy
- Railway shows "Build Failed" or "Crashed"

**Diagnosis**:
```bash
# Check Railway logs
railway logs --service backend

# Common errors:
# - "npm ERR! ERESOLVE" → Dependency conflict
# - "Error: Cannot find module" → Missing dependency
# - "HealthCheck timeout" → App not responding on PORT
```

**Solutions**:
- **ERESOLVE dependency error**:
  - Fix in `backend/Dockerfile`: Use `npm ci --legacy-peer-deps`
  - Already implemented as of 2026-02-05

- **Missing module**:
  - Add to `backend/package.json` dependencies
  - Rebuild Docker image

- **HealthCheck timeout**:
  - Verify backend listens on `process.env.PORT` (Railway assigns this)
  - Check healthcheck endpoint responds: `curl [railway-url]/api/health`
  - Increase timeout in `railway.json`:
  ```json
  {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
  ```

---

**Summary:** This handover includes the repo to use, agent teams (§1), what was done (§2–3), what we have (§4), and what we need (§5–6). Docker/Railway build is fixed and documented; video stack is documented and CSP for Mux is updated. **What’s left:** (1) Execute the video playback plan until playback works. (2) **TikTok-style social features:** fire emoji for like, follow + add (save) + share (and full action strip), plus any other TikTok-like features previously discussed—see §5 “TikTok-style social features (Claude Code brief)”.
