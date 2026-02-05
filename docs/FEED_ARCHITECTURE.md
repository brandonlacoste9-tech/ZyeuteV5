# TikTok-Style Feed Architecture – Zyeuté

This document describes the preloading, viewability, memory, and virtualization patterns used for the continuous vertical video feed.

---

## 1. Window-Based Preloading

**Principle:** Only the current video and its immediate neighbors should consume buffer and network.

| Position | Role | Behavior |
|----------|------|----------|
| **Active (n)** | Full playback | MSE with 30s buffer window; `preload="auto"` when engaged/tier 2. |
| **Next (n+1)** | Preload for swipe | `preload="auto"` when not fast-scrolling; tier 1/3 partial or full blob so it buffers before visible. |
| **Previous (n-1)** | Backward swipe | Minimal (poster/metadata) or tier 1; kept in cache for instant back-swipe. |
| **Beyond ±1** | Released | `videoCache.evictUrlsNotIn(retainUrls)` on `currentIndex` change (debounced 300ms); blob URLs revoked, chunks dropped. |

**Implementation:** `ContinuousFeed` passes `currentIndex` into row data. Rows use `useVideoActivation(..., priority, predictive)` and `usePrefetchVideo(url, effectivePreloadTier)`. When `currentIndex` or `posts` change, a debounced (300ms) effect builds `retainUrls = [url(n-1), url(n), url(n+1)]` (video posts only) and calls `videoCache.evictUrlsNotIn(retainUrls)`. Debounce avoids evicting during rapid scroll or feed updates and keeps cache coherent.

---

## 2. Viewability and Play Trigger

**Target:** Start playback when the video is **50% visible** (viewAreaCoveragePercentThreshold-style).

- **Hook:** `useVideoActivation` uses `react-intersection-observer` with `threshold: [0, 0.25, 0.5, 0.75, 1.0]` and `rootMargin: "300px 0px 300px 0px"`.
- **Play condition:** `isFocused = visibilityRatio >= 0.5` (constant `VIEWABILITY_PLAY_THRESHOLD = 0.5`). Play when not fast-scrolling and (focused or priority with >30% visible).
- **Preload tier:** Focused/priority get tier 1 or 2; predictive (n±1) get tier 1 or 3 when slow-scrolling. Fast-scrolling sets tier 0 so prefetch aborts.

---

## 3. Memory Management for Infinite Scroll

**Sliding window:**

1. **Nullify / release outside window:** Rows outside ±1 are unmounted by react-window; `usePrefetchVideo` cleanup aborts in-flight fetches. In addition, `videoCache.evictUrlsNotIn(retainUrls)` runs after a 300ms debounce on `currentIndex`/`posts` change so blob URLs and chunk data for URLs not in the retain set are removed and revoked, without evicting during rapid scroll.
2. **Revoke blob URLs:** Done inside `videoWarmCache.remove()` (and thus `evictUrlsNotIn` and `evictOldest`). No long-lived blob URL without a matching revoke.
3. **Clear SourceBuffer / MediaSource refs:** Handled in `VideoPlayer` MSE effect cleanup (`sourceBufferRef.current = null`, `mseRef.current = null`, then revoke blob URL). Detached MediaSource/SourceBuffer can be GC’d.

**Virtualization:** `react-window` `List` with `rowHeight={height}`, `overscanCount={isFast ? 3 : 1}`. Only a small set of rows are mounted; the rest are not in the DOM, which limits the number of `<video>` and MediaSource instances.

---

## 4. Preload Hints and Buffer Targets

- **Next video (n+1):** When `index === currentIndex + 1` and not fast-scrolling, the row uses `preload="auto"` so the next video starts buffering before it becomes active. Active and next rows also get `fetchPriority="high"` on the `<video>` element (Chrome 102+) so the browser prioritizes their requests over thumbnails/analytics.
- **Active video:** MSE path uses a 30s buffer window (remove played content with `SourceBuffer.remove(0, currentTime - 30)` on QuotaExceeded). Initial buffer target: aim for ~5–10 seconds buffered before play (handled by tier 1/2 chunk strategy and `usePrefetchVideo`).
- **Codec:** Prefer H.264 for consistent decode performance across devices; avoid mixing VP9/AV1/H.265 mid-feed to prevent decoder switches and stutter.
- **Fast scroll:** `useScrollVelocity` treats velocity &gt; 2 px/ms (~2000 px/s) as fast; tier 0 and higher overscan reduce blank frames during overshoot.

---

## 5. MSE: Sequence Mode and Remove Timing

**Sequence mode:** `VideoPlayer` sets `sourceBuffer.mode = 'sequence'` when supported so the browser assigns segment timestamps without gaps. This suits:

- Chunked fetch (HTTP range) with variable arrival.
- Concat or transitional content.

Reduces visible stutters during swipes when chunks arrive out of order.

**SourceBuffer.remove() timing:** `remove()` is async. We only call `processQueue()` and `mediaSource.endOfStream()` inside the `updateend` handler (when `sb.updating` is false), so we never append or end the stream while a remove is in progress. Chrome won’t evict SourceBuffer data until the MediaSource is fully closed, so cleanup (refs nulled, blob revoked, `video.load()`) is essential for videos outside the ±1 window.

---

## 6. File / Component Map

| Concern | File / layer |
|--------|-------------------------------|
| Feed container, scroll, currentIndex | `ContinuousFeed.tsx` |
| Row: priority, predictive, preload tier, prefetch | `FeedRow` + `useVideoActivation` + `usePrefetchVideo` |
| Sliding-window eviction | `videoCache.evictUrlsNotIn()` from `ContinuousFeed`, debounced 300ms on currentIndex/posts |
| Viewability 50% | `useVideoActivation.ts` (`VIEWABILITY_PLAY_THRESHOLD = 0.5`) |
| Next-video preload + fetchPriority | FeedRow: n+1 gets `preload="auto"`; `VideoPlayer` uses `fetchPriority={priority ? "high" : "low"}` |
| MSE lifecycle, buffer window, sequence mode | `VideoPlayer.tsx` |
| Blob/chunk cache, evictExcept | `videoWarmCache.ts` |

---

## 7. Memory Profiling Checklist

When validating with Chrome DevTools and stress tests:

1. **Heap snapshots:** Take snapshots at start, after 10 scrolls, after 50 scrolls. Filter for `MediaSource` and `SourceBuffer`—counts should stay bounded (e.g. max ~3 for active ±1).
2. **Blob URL tracking:** Created vs. revoked blob URLs should stay 1:1 after 10+ videos; add telemetry if needed.
3. **Fast-scroll stress:** Scroll through 50 videos in &lt;30s; memory should stabilize (e.g. &lt;500MB on mobile).
4. **Back-scroll:** Scroll forward 10, then back 5; cache hits for n−1 should be high (instant back-swipe).
5. **Cross-browser:** Safari keeps MSE segments longer; Firefox has stricter quota (~100–150MB). Test on iOS Safari and Firefox.

---

## 8. Production Telemetry (Suggested)

- **Cache hit rate:** `(cache hits) / (total video requests)` per session.
- **Buffer starvation:** Count play attempts where `video.readyState < 3`.
- **Eviction efficiency:** Bytes evicted vs. bytes allocated over 10+ videos (should trend toward 1.0).
- **Preload effectiveness:** Time-to-first-frame for n+1 when it becomes active (target &lt;100ms).
- **Thumbnail timeout rate:** Use `onTimeout` in `generateVideoThumbnail` to track how often timeouts occur.

---

## 9. Alternative: Virtuoso

A Virtuoso-based feed (e.g. `VideoFeedContainer` + `VideoFeedItem` with `itemContent`, `endReached`, `overscan={1}`, `increaseViewportBy`) is an alternative to react-window. The same patterns apply: ±1 preload, 50% viewability, debounced eviction, and MSE cleanup for items outside the window.

This architecture layers on top of the MSE foundation (see `MEDIA_STACK_ANALYSIS.md`) to keep a TikTok-style feed smooth and bounded in memory.
