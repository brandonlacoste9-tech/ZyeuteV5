# Media Stack: Current State & Implementation Roadmap

**Last updated:** 2025

---

## How the media stack looks now

### Playback layer

| Component | Role | Current state |
|-----------|------|----------------|
| **VideoPlayer** | Native HTML5 + MSE + Mux | ✅ MSE cleanup (refs + blob revoke), readyState checks, `sequence` mode, QuotaExceeded → `SourceBuffer.remove(0, currentTime-30)` + re-queue chunk, play() promise handled, Mux + native error UI + retry, loading timeout cleared on MSE fallback, `fetchPriority` for priority rows. |
| **MuxVideoPlayer** | Mux-only playback | ✅ Error state, onError, retry UI, reset on playbackId change. |
| **SingleVideoView** | Feed item (player + overlay) | ✅ Uses VideoPlayer, audio focus, vision; tap timeout and effect cleanup. |

### Prefetch & cache

| Component | Role | Current state |
|-----------|------|----------------|
| **usePrefetchVideo** | Tiered prefetch (0/1/2/3) | ✅ AbortController on cleanup, no blob creation in hook, adaptive chunk size/concurrency. |
| **videoWarmCache** | Blob + chunk cache | ✅ LRU, blob revoke on eviction, `evictUrlsNotIn(retainUrls)` for ±1 window, `clearConsumedChunks` by playhead. |

### Feed & viewability

| Component | Role | Current state |
|-----------|------|----------------|
| **ContinuousFeed** | Vertical feed | ✅ react-window List, currentIndex, ±1 priority/predictive, **300ms debounced** `evictUrlsNotIn`, n+1 `preload="auto"` when not fast-scrolling. |
| **useVideoActivation** | Play/preload decisions | ✅ 50% viewability threshold, tier by focus/predictive/scroll speed. |
| **useScrollVelocity** | Fast/medium/slow | ✅ Velocity in px/ms, fast > 2 px/ms (~2000 px/s), overscan 3 vs 1. |

### Thumbnails & utilities

| Component | Role | Current state |
|-----------|------|----------------|
| **videoThumbnail** | Upload preview frame | ✅ Timeout (configurable + `onTimeout`), settled flag, full cleanup, reject with Error. |
| **validatePostType** | Photo vs video | ✅ Used to avoid image URLs in video player. |

### Documentation

- **MEDIA_STACK_ANALYSIS.md** – Issues fixed, MSE/thumbnail/Mux, testing, memory profiling.
- **FEED_ARCHITECTURE.md** – Window preload, 50% viewability, debounce eviction, fetchPriority, sequence mode, remove timing, memory checklist, telemetry, Virtuoso alternative.

---

## Gaps and risks (short)

- ~~**Visibility/tab:**~~ **Done.** `usePageVisibility` + feed passes `isPageVisible`; active video pauses when tab hidden.
- ~~**Readiness state:**~~ **Done.** VideoPlayer uses single `readiness: 'idle' | 'loading' | 'ready' | 'error'` state machine.
- ~~**Telemetry:**~~ **Done.** `mediaTelemetry` module + Upload `onTimeout`; cache hit/miss and TTFF wired.
- ~~**Codec:**~~ **Done.** Non-H.264 MSE mimeType logs a warning for decoder-switch awareness.
- **Initial buffer target:** 5–10s “aim” is documented but not explicitly measured or enforced in code (optional future).

---

## What was implemented (from roadmap)

### 1. Tab visibility: pause when hidden ✅

**Why:** Avoids autoplay policy issues and saves battery when the user switches tab.

**What:** In the feed or in a small context, listen to `document.visibilityState` / `visibilitychange`. When hidden: pause active video (or set a “feed paused” flag so the active row pauses). When visible again: resume if the same item is still active.

**Where:** Either in `ContinuousFeed` (set a “feedPaused” in context or state and pass to rows) or in a `usePageVisibility` hook that the active `VideoPlayer` respects (e.g. a prop `pauseWhenHidden` that calls pause/play on the ref).

**Implemented:** `usePageVisibility()` in `hooks/usePageVisibility.ts`; `ContinuousFeed` passes `isPageVisible` in row data; `isActive={shouldPlay && isPageVisible}` so playback stops when tab is hidden.

---

### 2. Media readiness state machine ✅

**Why:** Single source of truth for “loading / ready / error” avoids races between timeouts, retries, and canplay/error events.

**What:** In `VideoPlayer` (native path), replace `isLoading` + `hasError` with a single state, e.g. `readiness: 'idle' | 'loading' | 'ready' | 'error'`. Transitions: loadStart → loading; canPlay → ready; error → error; src change → loading (and clear timeout). Retry button → loading. Use `readiness` to drive loading spinner, error UI, and whether play() is allowed.

**Implemented:** `VideoPlayer` uses `readiness: 'idle' | 'loading' | 'ready' | 'error'`; transitions on loadStart, canPlay, error, timeout, retry. Spinner when `readiness === 'loading'`, error UI when `readiness === 'error'`.

---

### 3. Telemetry hooks ✅

**Why:** Validates preload and eviction; surfaces buffer starvation and thumbnail timeouts in production.

**What:**

- **Thumbnail:** Pass `onTimeout` from the upload flow into `generateVideoThumbnail` and call your analytics (e.g. `analytics?.increment('video_thumbnail_timeout')`).
- **Feed/cache:** Optional small `useMediaTelemetry` hook or module that exposes:
  - `recordCacheHit(url)` / `recordCacheMiss(url)` (called from prefetch or cache layer).
  - `recordBufferStarvation()` (when play() is attempted and `video.readyState < 3`).
  - `recordEviction(url, bytesEvicted)` (inside `videoWarmCache.remove` / `evictUrlsNotIn`, optional).
  - `recordTimeToFirstFrame(url, ms)` (in VideoPlayer, when we already log TTFF).
  Use these to compute cache hit rate, eviction efficiency, and preload effectiveness (TTFF for n+1) as in FEED_ARCHITECTURE.md §8.

**Implemented:** `lib/mediaTelemetry.ts` with `recordThumbnailTimeout`, `recordCacheHit`, `recordCacheMiss`, `recordTimeToFirstFrame`, `recordBufferStarvation`, `recordEviction`. Upload passes `onTimeout: () => mediaTelemetry.recordThumbnailTimeout('upload')`. usePrefetchVideo calls recordCacheHit (blob) / recordCacheMiss (url). VideoPlayer calls recordTimeToFirstFrame in handlePlaying.

---

### 4. Thumbnail timeout at call site ✅

**Why:** See which formats or sizes hit timeouts; tune `seekTime` or timeout per context.

**What:** Where `generateVideoThumbnail(file)` is called (e.g. Upload), pass options: `{ onTimeout: () => analytics.increment('upload_thumbnail_timeout') }` (or your logger/backend). No change to `videoThumbnail` API.

**Implemented:** Upload.tsx calls `generateVideoThumbnail(file, { onTimeout: () => mediaTelemetry.recordThumbnailTimeout('upload') })`.

---

### 5. H.264 codec warning ✅

**Why:** Reduces decoder switches and stutter when all feed videos use the same codec.

**What:** Either (a) backend/ingestion: ensure feed sources are H.264 and document it, or (b) client: when we know the codec (e.g. from MSE mimeType or response), log a warning or send a telemetry event if codec is not H.264, so you can track and eventually enforce at ingest. No hard block in player required initially.

**Implemented:** In VideoPlayer MSE path, when `videoSource.mimeType` is set and does not contain `avc1`, we log a warning for decoder-switch awareness.

---

### 6. Optional: Virtuoso or alternate list (only if needed)

**Why:** react-window is already working with overscan and snap; Virtuoso can simplify “scroll to index” and some APIs.

**What:** Only consider if you hit concrete limitations (e.g. scroll restoration, dynamic heights, or DX). If you do, the same patterns apply: ±1 preload, 50% viewability, debounced eviction, MSE cleanup. See FEED_ARCHITECTURE.md §9.

**Where:** N/A unless you decide to swap the list implementation.

---

## Summary

- **Stack today:** MSE lifecycle and cleanup are solid; feed uses ±1 window, 50% viewability, debounced eviction, fetchPriority, and solid error/retry paths. Tab visibility pause, readiness state machine, telemetry, thumbnail timeout wiring, and H.264 warning are implemented.
- **Optional next:** Initial buffer target (5–10s) measurement; Virtuoso only if list limitations appear.

---

## Best-practices alignment

The media stack is documented as three pillars: **lifecycle-safe**, **observable**, and **production-oriented**. Use this framing in PRs, onboarding, and architecture docs so behavior stays clearly separated from styling (e.g. Tailwind) and the rationale is easy to repeat.

**One-liner for PRs and onboarding:**  
> "This is how we keep the media stack lifecycle-safe, observable, and production-oriented; if a change supports that direction, it's likely in the right lane."

### Lifecycle-safe

- **Tab visibility:** Uses `document.visibilitychange` to pause playback when the tab is hidden, aligning with browser and mobile best practices and avoiding wasteful tabbed-away playback.
- **Readiness state machine:** A single `readiness` state (`'idle' | 'loading' | 'ready' | 'error'`) with well-defined transitions keeps the UI predictable during rapid scroll and background prefetch, avoiding double-play and loading-state glitches.
- **Example:** MSE teardown in `VideoPlayer` (refs nulled, blob revoked, `video.load()` on unmount).

### Observable

- **mediaTelemetry** captures QoE-style metrics: **timeToFirstFrame**, **bufferReady**, **bufferStarvation**, **cacheHit** / **cacheMiss**, **thumbnailTimeout**, and **eviction** (bytes).
- These metrics let you tune the 5–10 s initial buffer (`INITIAL_BUFFER_TARGET_SECONDS`), 30 s MSE window, and cache eviction policy, and quickly detect regressions from decoder or network changes.
- **Example:** `recordTimeToFirstFrame` in `VideoPlayer` `handlePlaying`; `recordBufferReady` in `handleCanPlay`.

### Production-oriented

- **Sliding-window cache** plus debounced `evictUrlsNotIn` keeps memory bounded for long-scroll feeds.
- **Codec warning** on non-`avc1` MIME types prevents mid-scroll decoder switches, which can cause hiccups and extra latency on mobile.
- **fetchPriority** for active/next video prioritizes critical resources without blocking thumbnails or analytics (Fetch Priority API where supported).
- **Example:** `evictUrlsNotIn(retainUrls)` in `ContinuousFeed` on `currentIndex` / `posts` change (debounced 300 ms).

### How these show up in PRs

- **Lifecycle-safe** → Clean teardown, no leaked resources, alignment with app/module lifecycle.
- **Observable** → Explicit logging, metrics, and trace points where relevant.
- **Production-oriented** → Tests, rollout strategy, and rollback plan where appropriate.

The roadmap and What was implemented sections above serve as both a status tracker and the design rationale for these pillars. Presentation-level items (e.g. Tailwind style suggestions) do not affect behavior or performance.

**Initial buffer target:** `INITIAL_BUFFER_TARGET_SECONDS` (e.g. 10) in `lib/constants.ts` documents the target seconds of buffer before play; `mediaTelemetry.recordBufferReady(url, ms)` tracks time-to-buffer-ready so you can tune prefetch and tier strategy.

**Analytics wiring:** Set `window.__zyeute_analytics` with `{ increment(name, opts?), timing(name, ms, label?) }` when you have a backend; see `lib/mediaTelemetry.ts`. All metrics are logged via the telemetry logger regardless.

**Future:** Plot `recordBufferReady` (and TTFF) in a dashboard, then use the feedback loop—`recordBufferReady` → compare to `INITIAL_BUFFER_TARGET_SECONDS` → tune prefetch/tier logic—to drive small, iterative improvements.

---

## Next: TikTok-class quality sequence

Data-driven order to reach or exceed TikTok-style UX without big-bang changes.

### 1. Close the current loop (basics)

- **Dashboard:** Plot `recordBufferReady` and TTFF as percentiles (p50, p90, p99) per segment (network, device, region). Flag when p90 > 5–10 s vs `INITIAL_BUFFER_TARGET_SECONDS`.
- **Tune baseline:** Reduce `INITIAL_BUFFER_TARGET_SECONDS` gradually while watching rebuffer and dropout. Target p50 TTFF ~1–2 s warm-start.

### 2. TikTok-style optimizations (in order)

- **Preload + player reuse:** Prefetch first chunks of next 2–3 videos; reuse/pool `VideoPlayer`/`<video>`/MSE instances instead of destroy/recreate on scroll. Use `recordBufferReady` per video to know when “next” is instant on swipe. *Maps to: pre-load the next N videos and recycle media players to reduce cold-start cost.*
- **Adaptive buffer + ABR:** Network-aware buffering (e.g. reduce target on slow networks but raise minimum buffer before play to limit rebuffer). Optional: multi-bitrate per video and client choice from initial-segment speed + buffer-ready/rebuffer signals. *Maps to: tune buffer depth and bitrate per-video based on network estimates and historical `recordBufferReady`.*
- **Prefetch-ingestion + CDN:** Backend/CDN primes cache for likely-next videos (feed order or ML). Optional: feed response includes next-video URLs + edge TTL so client can preload intelligently. *Maps to: prime the edge with feed-order hints so the first segments are hot when the user scrolls.*
- **UX polish:** First-frame pre-render of next video so swipe never shows blank; loading indicator aligned to `bufferReady` threshold. *Maps to: first-frame pre-rendering + loading that matches the actual buffer to decrease perceived latency.*

### 3. Pragmatic sequence

1. Ship current baseline (done).  
2. Add simple dashboard; tune loop with p90 buffer-ready and TTFF as crown metrics.  
3. Add preload of next video(s) + media-player reuse.  
4. Add network-aware buffer heuristics and optional ABR.  
5. Layer prefetch-ingestion hints and UX micro-tweaks (first-frame, spinners).

Execute in that order so each step is validated by the metrics you already have.

**Execution nudge:** Turn step 2 (dashboard + tune) into an explicit ticket or sprint; treat p50/p90 TTFF and buffer-ready as product-level KPIs, not just engineering metrics.

---

## TikTok UX layer (separate from core stack)

TikTok-style **UX and interaction patterns** live *on top* of the media stack. Add them in a way that keeps core guarantees (lifecycle-safe, observable, production-oriented) unchanged.

**Locale & brand:** This product is the **Quebec French** version; copy, tone, and styles (e.g. fire emojis, CTAs) may differ from other locales. Keep that in mind for Feed UX work—UX layer may change; media-stack contract stays tight.

**Good next-level additions (UX scope only):**

- **Feed controls:** Auto-play / pause on scroll, one-tap mute / unmute, swipe-to-next / swipe-to-previous. Pure UX overlays; no change to player lifecycle or telemetry.
- **Vertical full-screen feed:** 9:16 (or similar), snappy scroll transitions, thumb-safe CTAs. Layout and interaction choices, not video-stack decisions.
- **Prefetch-driven “instant” feel:** Prefetch next N videos + player reuse + loading aligned to `recordBufferReady`. Direct extension of the TikTok-class quality sequence above, not a new foundation.

**Now vs later:**

- **Now:** Keep the media-stack baseline and TikTok-class *quality* sequence focused on video-quality KPIs and architecture.
- **Next:** Implement TikTok-style UX (controls, fullscreen feed, etc.) in a **separate “Feed UX” section or ticket**, so they don’t muddy the media-stack contract.

You can add these UX patterns now (clearly scoped as features) or defer until after the quality loop (dashboard + tune). Either way, keep them strictly separate from core stack guarantees.
