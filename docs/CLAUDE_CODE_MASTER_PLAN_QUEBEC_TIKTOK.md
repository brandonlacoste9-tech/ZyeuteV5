# Claude Code Master Plan — French Quebec TikTok-Style Takeover

**One brief to rule them all.** Use this as the single source of truth for turning Zyeuté into a **Québec French, TikTok-style** social video app.

**Repo:** `brandonlacoste9-tech/ZyeuteV5`  
**URL:** https://github.com/brandonlacoste9-tech/ZyeuteV5  
**Branch:** `main`

---

## 1. Mission

- **Language:** 100% user-facing text in **français québécois** (casual, « tu », no English, no international French).
- **Product:** TikTok-style vertical video feed: follow, fire (like), comment, share, save; clear emojis; right-side or bottom action strip; Québec Or branding on video screens.
- **Quality:** Videos play (no black screen); copy comes from the single UI copy doc; new features use the same tone and asset set.

---

## 2. Golden rules

| Rule | Meaning |
|------|--------|
| **Quebec French only** | Every new label, button, toast, error, placeholder is in Québec French. Use **`docs/UI_COPY_QUEBEC_FRENCH.md`** for strings and the mini style guide. |
| **No English in UI** | "Share", "Follow", "Save" → **Partager**, **Suivre**, **Enregistrer**. |
| **Tone** | « Tu », familier, concis. Deux mots max quand possible. Accents corrects (É, À, etc.). |
| **Emblem** | Québec Or (fleur-de-lys + lion + « QUÉBEC OR ») is the visual signature: header top-right + top-right of **video screen** (feed card + single-video view). Asset: `/quebec-emblem.png` (in `frontend/public/`). |

---

## 2.5. Architecture Overview

### Tech Stack
- **Frontend**: React 18 + Vite 6 + TypeScript 5
- **Routing**: React Router v7
- **Styling**: Tailwind CSS 4 + Custom Leather/Gold Theme
- **Video**: Mux streaming (@mux/mux-player-react) + Pexels fallback + HTML5 native
- **State**: React hooks + custom hooks (usePresence, useHaptics, useVideoVision)
- **i18n**: Custom translation system with 4 locales (fr-CA, pt-BR, es-AR, es-MX)
- **Backend**: Express + Node 20 + PostgreSQL (Supabase)
- **Deploy**: Vercel (frontend) + Railway (backend)

### Key Directories
```
frontend/src/
├── components/
│   ├── features/         # VideoCard, SingleVideoView, MuxVideoPlayer
│   ├── ui/               # Reusable UI components
│   └── auth/             # Authentication components
├── hooks/                # useVideoAutoPlay, usePresence, useHaptics
├── i18n/                 # Translation system (index.ts)
├── pages/                # Route pages (Feed, Explore, Profile, Upload)
├── services/             # api.ts, auth.ts
└── config/               # factory.ts (AppConfig)

backend/
├── routes/               # mux.ts, pexels.ts, etc.
├── services/             # pexels-service.ts
└── ai/                   # Ti-Guy agent, bees
```

### Design System Colors
```css
/* From index.css */
--color-gold-500: #FFBF00;      /* Primary gold accent */
--color-leather-700: #655955;    /* Card backgrounds */
--color-leather-950: #0d0c0b;    /* Main background */

/* From tailwind.config.ts */
zyeute-blue: #003399;            /* Quebec Blue */
zyeute-snow: #F8F9FA;            /* Snow White */
zyeute-alert: #DC3545;           /* Alert Red */
zyeute-hydro: #FFCC00;           /* Hydro Yellow */
```

**Key CSS Classes**:
- `.leather-card` - Premium card with stitched border
- `.stitched` - Decorative stitching effect
- `text-gold-500`, `bg-leather-950`, `border-gold-500/30` - Color utilities

---

## 3. UI copy — single source

**File:** **`docs/UI_COPY_QUEBEC_FRENCH.md`**

- Buttons: Suivre, Ne plus suivre, Abonné·e(s), Feux, Commenter, Partager, Enregistrer, Ajouter.
- Labels: Commentaires, Écris un commentaire…, Envoyer, Vues, Abonnés, Abonnements, Profil, Paramètres.
- Toasts: Vidéo enregistrée, Partage lancé, Tu suis {username}, Tu ne suis plus {username}, Commentaire publié, Impossible de se connecter. Vérifie ta connexion, etc.
- Errors: Vidéo non disponible, Les commentaires n’ont pas pu être chargés, Connecte-toi pour interagir, Cette action n’est pas permise.
- Variables: `{username}`, `{count}`, `{duration}`, `{timeAgo}`.
- Style: tu only, no English, accents, pluralisation (Feux vs 1 feu / 2 feux), punctuation for full sentences.

**Do not invent new strings.** Add any new key to that doc (or your i18n file that mirrors it), then use it in code.

---

## 4. TikTok-style feature checklist

Implement or refine in this order. Every new UI string must come from or be added to **`docs/UI_COPY_QUEBEC_FRENCH.md`**.

### 4.1 Emojis

- [ ] **Feux (like):** Use fire emoji (🔥) alongside or instead of the flame icon where it fits (e.g. VideoCard action bar, tooltip).
- [ ] **Follow / Add / Share:** Standardise small emoji or icon set (e.g. ➕ or bookmark for add, share icon) so actions are recognisable at a glance.

### 4.2 Follow

- [ ] **Follow creator** from card or profile: button **Suivre** / **Abonné·e(s)** (or **Ne plus suivre**), state from API.
- [ ] Wire to backend (follow/unfollow endpoint); if missing, implement or stub.
- [ ] Show follow state on VideoCard (author row or right-side strip). Toasts: **Tu suis {username}** / **Tu ne suis plus {username}**.

### 4.3 Add (save / favorite)

- [ ] **Enregistrer** or **Ajouter** on card: save/favorite post. Wire to existing save API or add endpoint.
- [ ] Toast: **Vidéo enregistrée**. Error: **Impossible d'enregistrer la vidéo**.

### 4.4 Share

- [ ] **Partager** already on VideoCard. Ensure Web Share API when available, else copy-link; shared URL must open the post.
- [ ] Toast: **Partage lancé**.

### 4.5 Comment

- [ ] **Commenter** / **Commentaires** with count. Placeholder: **Écris un commentaire…**, submit: **Envoyer**.
- [ ] Toasts: **Commentaire publié**; error: **Le commentaire n'a pas pu être envoyé**. Error: **Les commentaires n'ont pas pu être chargés**.

### 4.6 Action strip layout

- [ ] Full set visible: **Suivre** (creator) + **Feux** (with count) + **Commentaires** (with count) + **Partager** + **Enregistrer** (or **Ajouter**).
- [ ] Prefer right-side vertical strip on video (TikTok-style) or keep/refine current bottom actions bar so all five are clear and ordered.

### 4.7 Extra (if discussed with product)

- [ ] Double-tap to fire (already present in SingleVideoView: showFireAnimation).
- [ ] Haptics on fire/share/save.
- [ ] Notifications for « feux » (likes): see `NotificationSettings.tsx` (« Recevoir des notifications pour les feux (likes) »).

### 4.8 Swipe left → AI Agent (whole new window)

- [ ] **Swipe left** from the feed opens a **full-screen Agent view** (recommended: new route `/agent` or `/ti-guy`). See **`docs/SWIPE_LEFT_AI_AGENT_DESIGN.md`** for full design and **Agent Screen IA** (§7–9).
- [ ] Agent view: **StreamView** (not ChatView) with cell types **MessageCell**, **ActionCardCell**, **ContextHeaderCell** so it scales to tools/memory without redesign. Header (Zone A) and Input (Zone C) owned by the route; Canvas (Zone B) is the stream. Zero state: context-aware (e.g. chip from feed: « Tu veux que je fasse X avec ça? »).
- [ ] Context passing: feed can pass `feedContext` to `/agent` (e.g. `navigate('/agent', { state: { feedContext } })`) for contextual first cell and actions.
- [ ] Copy: **Agent** / **Ti-Guy**, **Retour**, **Écris un message…**; all Québec French. Return: swipe right or **Retour** → feed.

---

## 4.9. Implementation Patterns

### Pattern 1: Mux Video vs Native Video Branching

**Location**: `VideoCard.tsx` (lines 160-182)

```tsx
{post.type === "video" ? (
  (post as any).muxPlaybackId || (post as any).mux_playback_id ? (
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
    <VideoPlayer
      src={post.media_url}
      poster={post.thumbnail_url || post.media_url}
      autoPlay={autoPlay}
      muted={muted}
      loop
      priority={priority}
    />
  )
) : (
  // Photo rendering...
)}
```

**Key Logic**: Check if `post.muxPlaybackId` or `post.mux_playback_id` exists. If yes → use `MuxVideoPlayer` for HLS streaming. If no → use native `VideoPlayer` with `post.media_url`.

### Pattern 2: Using the Translation System

**Location**: `frontend/src/i18n/index.ts`

```tsx
import { useTranslation } from '@/i18n';

function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <button>{t('btn_follow')}</button>              {/* "Suivre" */}
      <button>{t('action.share')}</button>           {/* "Partager" */}
      <p>{t('nav.feed')}</p>                         {/* "Fil d'actualité" */}
    </div>
  );
}
```

**Adding new translations**: Edit `frontend/src/i18n/index.ts` TRANSLATIONS object:
```typescript
const TRANSLATIONS: Record<string, Record<string, string>> = {
  "fr-CA": {
    "btn_save": "Enregistrer",
    "toast_video_saved": "Vidéo enregistrée",
    // ...
  },
};
```

### Pattern 3: Quebec Emblem Placement

**Location**: `VideoCard.tsx` (lines 218-228)

```tsx
{/* Québec Or emblem — top right of video screen, small */}
{post.type === "video" && (
  <img
    src="/quebec-emblem.png"
    alt="Québec Or"
    className="absolute top-2 right-2 h-6 w-auto object-contain opacity-80 z-10 pointer-events-none"
    width={24}
    height={24}
    loading="lazy"
  />
)}
```

**Rules**:
- Only show on videos (`post.type === "video"`)
- Top-right absolute positioning
- Small size (`h-6` = 24px)
- 80% opacity for subtle branding
- `pointer-events-none` so clicks pass through
- Asset location: `frontend/public/quebec-emblem.png`

### Pattern 4: Action Button with Fire (Like)

**Location**: `VideoCard.tsx` (lines 85-89)

```tsx
const [isLiked, setIsLiked] = React.useState(false);

const handleFire = (e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent card click when clicking fire button
  setIsLiked(!isLiked);
  onFireToggle?.(post.id, fireCount);
};

// In JSX:
<button
  onClick={handleFire}
  className={cn(
    "flex flex-col items-center gap-1",
    isLiked
      ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(255,100,0,0.5)] animate-pulse"
      : "text-white/80 hover:text-gold-500"
  )}
>
  <FireIcon className="h-7 w-7" />
  <span className="text-xs">{fireCount}</span>
</button>
```

**Key Features**:
- `e.stopPropagation()` prevents navigating to video when clicking button
- Animated pulse + orange glow when liked
- Count display from real-time or props
- Optional callback `onFireToggle` for API integration

---

## 5. Branding — Québec Or emblem

- **Asset:** `/quebec-emblem.png` (gold fleur-de-lys, lion, « QUÉBEC OR »). Lives in `frontend/public/quebec-emblem.png`.
- **Placement (done):**
  - **Header:** top-right of app header (`Header.tsx`), small (`h-7`).
  - **Video screen (feed):** top-right of each video card (`VideoCard.tsx`), small (`h-6`), only when `post.type === "video"`.
  - **Video screen (full-screen):** top-right of single-video view (`SingleVideoView.tsx`), small (`h-7`).
- **Optional:** Use same asset in profile, about, or splash if desired; keep size small so it never dominates.

---

## 6. Video playback (no black screen)

- **Plan:** **`docs/VIDEO_PLAYBACK_FIX_PLAN.md`** (diagnose → backend webhook/API → frontend branch/CSP → native URLs).
- **Quick checks:** Feed returns `media_url` and `mux_playback_id`; Mux webhook URL + secret in Railway; CSP allows `stream.mux.com` (done in `vercel.json`); `PEXELS_API_KEY` set on backend.
- **Components:** `VideoCard.tsx`, `VideoPlayer.tsx`, `MuxVideoPlayer.tsx`, `SingleVideoView.tsx`; API: `frontend/src/services/api.ts` (normalizePost, feed).

---

## 7. Implementation order (suggested)

1. **Video first** — Fix playback (follow VIDEO_PLAYBACK_FIX_PLAN) so every video has a chance to play.
2. **Copy pass** — Replace any remaining English or international French with strings from **`docs/UI_COPY_QUEBEC_FRENCH.md`**; add missing keys to that doc.
3. **TikTok actions** — Follow (§4): emojis, then Follow, then Add (save), then Share/Comment polish, then strip layout.
4. **Emblem** — Already on header + video screens; add elsewhere only if needed.
5. **Notifications / haptics / double-tap** — Per product decisions; use same UI copy doc for any new text.

---

## 8. Key files

| Purpose | File(s) |
|--------|--------|
| UI copy (strings + style) | `docs/UI_COPY_QUEBEC_FRENCH.md` |
| Video playback plan | `docs/VIDEO_PLAYBACK_FIX_PLAN.md` |
| Full handover (deploy, agents, what’s done) | `docs/HANDOVER_VIDEO_AND_DEPLOY.md` |
| Feed video card (actions, emblem) | `frontend/src/components/features/VideoCard.tsx` |
| Single-video view (emblem, overlays) | `frontend/src/components/features/SingleVideoView.tsx` |
| Header (emblem) | `frontend/src/components/Header.tsx` |
| Players | `frontend/src/components/features/VideoPlayer.tsx`, `MuxVideoPlayer.tsx` |
| API / feed shape | `frontend/src/services/api.ts` |
| Notifications (feux) | `frontend/src/pages/settings/NotificationSettings.tsx` |
| Swipe left → AI Agent (design) | `docs/SWIPE_LEFT_AI_AGENT_DESIGN.md` |
| Ti-Guy / chat | `frontend/src/components/ChatButton.tsx`, `ChatModal.tsx`; `TiGuySwarmAdapter.ts` |

---

## 9. Success criteria

- [ ] All user-facing text in the app is Québec French (no English; no international French).
- [ ] Every new or touched string exists in or is added to **`docs/UI_COPY_QUEBEC_FRENCH.md`** and follows the style guide.
- [ ] TikTok set visible and working: **Suivre**, **Feux** (with 🔥 where appropriate), **Commentaires**, **Partager**, **Enregistrer** (or **Ajouter**), with correct toasts/errors.
- [ ] Québec Or emblem appears on header and on video screens (feed + full-screen), small and top-right.
- [ ] Videos play (Mux + native/Pexels); no black screen when data and config are correct (per VIDEO_PLAYBACK_FIX_PLAN).

---

**Give this doc to Claude Code.** Start with §1–3, then §4 (TikTok checklist), then §6 (video) and §7 (order). Use §8 as the file index and §9 as the definition of done.

**Last updated:** 2026-02-05
