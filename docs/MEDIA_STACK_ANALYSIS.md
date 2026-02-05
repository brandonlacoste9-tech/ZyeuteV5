# Media Stack Analysis & Fixes – Zyeuté

**Component:** Media playback stack (web: HTML5 video, MSE, Mux)  
**Date:** 2025  
**Scope:** VideoPlayer, MuxVideoPlayer, videoThumbnail, usePrefetchVideo, videoWarmCache

---

## 1. Architecture Summary

| Layer | Implementation | Role |
|-------|----------------|------|
| **Playback** | `VideoPlayer.tsx` | Native HTML5 &lt;video&gt;, MSE (partial-chunk streaming), or Mux Player |
| **Feed item** | `SingleVideoView.tsx` | Wraps VideoPlayer; audio focus, vision, gestures |
| **Prefetch** | `usePrefetchVideo.ts` | Tiered prefetch (poster / partial chunks / full blob); AbortController on cleanup |
| **Cache** | `videoWarmCache.ts` | LRU cache, blob URL creation/revocation, chunk eviction by playhead |
| **Thumbnails** | `videoThumbnail.ts` | Offscreen &lt;video&gt; + canvas; used for upload preview |
| **Mux-only** | `MuxVideoPlayer.tsx` | Mux Player for Mux-backed assets |

**State / lifecycle:** React state + refs in VideoPlayer; native &lt;video&gt; events (canplay, error, ended, timeupdate); MSE `MediaSource` / `SourceBuffer` in refs; loading timeout ref; cache and prefetch use refs and module-level cache.

---

## 2. Identified Issues and Fixes

### 2.1 VideoPlayer.tsx

| # | Location | Issue | Fix |
|---|----------|--------|-----|
| 1 | **MSE effect cleanup** (~250–254) | On teardown (source change/unmount), only `pendingChunksRef` was cleared and blob URL revoked. `mseRef.current` and `sourceBufferRef.current` were left set, keeping references to `MediaSource` and `SourceBuffer` and risking leaks / odd state on next mount. | In the effect cleanup, set `sourceBufferRef.current = null` and `mseRef.current = null` before revoking the URL. |
| 2 | **handleError (MSE fallback)** (~271–276) | When falling back from MSE to raw URL, the loading timeout was not cleared. The 30s timeout could still fire and set `hasError`, overriding the fallback. | In the MSE fallback branch, clear `loadingTimeoutRef.current` (clearTimeout and set ref to null) before calling `setMseUrl(null)`. |
| 3 | **togglePlay** (~412–426) | `videoRef.current.play()` returns a Promise; rejections (e.g. autoplay policy, interruption) were unhandled, causing unhandled rejection warnings/crashes. | Capture the promise and call `.catch()`, log a warning, and set `isPlaying` to false. |
| 4 | **JSX comment** (~683–685) | A line `// eslint-disable-next-line react-hooks/refs` was placed inside JSX, which is invalid and can render as text or confuse tooling. | Removed the stray comment from the JSX. |
| 5 | **Mux path** (~556–602) | Mux Player had no error handling; failures left the user with a broken or blank view and no retry. | Added top-level `muxError` state, `useEffect` to reset it when `muxPlaybackId` changes, Mux `onError` callback setting `muxError`, and an error UI with “Réessayer” that clears `muxError`. |

### 2.2 videoThumbnail.ts

| # | Location | Issue | Fix |
|---|----------|--------|-----|
| 1 | **Error path** (~49–53) | On `video.onerror`, only the object URL was revoked; the &lt;video&gt; element was never removed or unloaded, leaking DOM and associated resources. | Centralized cleanup: revoke URL, clear `video.src` / `video.load()`, and `video.remove()`. Call this from both success and error/timeout paths. |
| 2 | **Reject type** (~51) | `reject(e)` with the raw event object is not a standard Error; callers and logs expect `Error` instances. | Reject with `new Error(message)` (e.g. from `video.error?.message` or a fallback string). |
| 3 | **No timeout** | If `loadedmetadata` / `seeked` never fire (corrupt file, unsupported codec), the Promise never settled and the function hung. | Added a 15s timeout; on expiry run the same cleanup and reject with a clear “timed out” Error. |
| 4 | **Double resolve/reject** | Multiple events could theoretically call resolve/reject more than once. | Introduced a `settled` flag and guard all paths (success, error, timeout) so only the first completion runs cleanup and resolve/reject. |

### 2.3 MuxVideoPlayer.tsx

| # | Location | Issue | Fix |
|---|----------|--------|-----|
| 1 | **No error handling** | Playback failures (network, bad playback ID, etc.) were not handled; no retry or message. | Added `hasError` state, `onError` on Mux Player that sets it, and an error UI with “Réessayer” that resets `hasError`. |
| 2 | **No reset on new video** | When the same component is reused for a new `playbackId`, previous error state could persist. | Added `useEffect(() => setHasError(false), [playbackId])` so error state resets when the video ID changes. |

### 2.4 Other components (verified, no code change required)

- **usePrefetchVideo:** AbortController aborts on cleanup; no blob URLs created in the hook (cache does); no leak found.
- **videoWarmCache:** Eviction revokes blob URLs; `clearConsumedChunks` only drops chunk references; no additional leak found.
- **SingleVideoView:** Uses VideoPlayer and useAudioFocus; tap timeout is cleared in the single-tap path; vision timer cleared in effect cleanup.

---

## 3. Corrected Code References

- **VideoPlayer.tsx:** MSE cleanup (lines ~250–258), handleError MSE branch (~271–280), togglePlay (~318–338), Mux error state and UI (~556–620), removed JSX comment (~691).
- **videoThumbnail.ts:** Full rewrite with cleanup(), settled flag, timeout, and Error-based reject.
- **MuxVideoPlayer.tsx:** Added hasError state, useEffect([playbackId]), error UI, and onError on MuxPlayer.

---

## 4. Architectural Recommendations

1. **Single “media readiness” state for native path**  
   Unify loading / error / canplay into a small state machine (e.g. `idle | loading | ready | error`) to avoid overlapping timeouts and retries.

2. **Centralize blob URL ownership**  
   Document which layer creates and revokes blob URLs (MSE in VideoPlayer, cache in videoWarmCache, thumbnail in videoThumbnail) so no blob is revoked twice or never.

3. **Mux Player API**  
   Confirm `@mux/mux-player-react` supports `onError` (or the underlying element’s `error` event) and map it to the same error/retry UI as the native path for consistency.

4. **Interruptions**  
   Consider listening for `visibilitychange` or document blur to pause or release when the tab is hidden, and re-sync when visible again to avoid policy or resource issues.

5. **Buffer limits (implemented)**  
   On MSE `QuotaExceededError`, we now call `SourceBuffer.remove(start, end)` to clear played content (keep ~30s behind playhead). The failed chunk is re-queued and appended after `updateend`. MediaSource `readyState === 'open'` is validated in `processQueue` and in the `updateend` listener to avoid "SourceBuffer has been removed" errors.

---

## 5. Unit Test Recommendations

1. **VideoPlayer**
   - When `src` changes, loading timeout from the previous source is cleared (mock timers).
   - On unmount, MSE cleanup runs: refs cleared and blob URL revoked (spy on URL.revokeObjectURL and refs).
   - When `handleError` is called with MSE active, loading timeout is cleared and fallback to URL occurs (no second hasError from timeout).
   - `togglePlay` when play() rejects: promise is caught and `isPlaying` becomes false (mock video.play to return rejecting promise).
   - When `muxPlaybackId` is set and Mux fires error, error UI is shown and “Réessayer” clears it.

2. **videoThumbnail**
   - On success: cleanup runs (revoke + video removed), resolve with data URL shape.
   - On video error: cleanup runs, reject with Error instance.
   - On timeout: cleanup runs, reject with Error containing “timed out” (fake timers).
   - After resolve or reject, a second event does not call resolve/reject again (double-settle safe).

3. **MuxVideoPlayer**
   - When `playbackId` changes, `hasError` resets to false.
   - When onError is called, error UI is visible and retry button resets error state.

4. **Integration**
   - Feed scroll: switching from video A to video B clears A’s loading timeout and releases MSE/blob for A (no leak).
   - Cache eviction: evicted entry’s blob URL is revoked (videoWarmCache already does this; test that no other code holds the URL).

---

## 6. Follow-Up Improvements (Applied)

- **SourceBuffer validation**: `processQueue()` and the MSE `updateend` listener now check `mediaSource.readyState === 'open'` before appending or calling `endOfStream()`, avoiding invalid state and "SourceBuffer has been removed" errors. The `updateend` guard also protects against queued events firing after a rapid source change or MediaSource close.
- **SourceBuffer.mode**: We set `sourceBuffer.mode = 'sequence'` when supported, so the browser assigns segment timestamps without gaps (helps with range fetches or concat where discontinuities can occur); fallback to default `'segments'` if unsupported.
- **QuotaExceededError handling**: On quota exceeded, we call `SourceBuffer.remove(0, currentTime - 30)` to free played buffer (keep ~30s behind playhead), then re-queue the failed chunk for the next `updateend`.
- **Video thumbnail timeout**: `generateVideoThumbnail()` now accepts an options object: `seekTime`, `timeoutMs` (configurable), and `onTimeout` callback for production telemetry. The default timeout is exported as `VIDEO_THUMBNAIL_TIMEOUT_MS`.

**Testing (industry best practices):** Rapid mount/unmount to expose double-cleanup bugs; network throttling for timeout/retry; Safari vs Chrome MSE behavior (`MediaSource.isTypeSupported`, buffer eviction).

**Memory profiling targets (Chrome DevTools):**
- Detached `MediaSource` objects (should be GC'd after `video.src` change and blob revoke).
- Blob URLs not revoked via `URL.revokeObjectURL()` (all creation sites have a matching revoke in cleanup).
- `SourceBuffer` references held after the parent `MediaSource` closes (refs are nulled in effect cleanup before revoke).

---

## 7. Summary

- **Lifecycle:** MSE and loading timeout cleanups were completed; Mux and native paths now have explicit error handling and retry.
- **Resources:** Thumbnail and VideoPlayer MSE paths now clear refs and revoke URLs and remove DOM elements where applicable; no intentional blob double-revoke.
- **Robustness:** play() promise handled; timeouts and double-settle guarded in thumbnail; error states and retries added for both Mux and native players.
- **Consistency:** Same “Vidéo non disponible” + “Réessayer” pattern used for native error, Mux (inline), and MuxVideoPlayer.

All changes are backward-compatible and do not alter the public props of the components.
