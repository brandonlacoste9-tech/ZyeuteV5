# Implementation Plan - The Surgical Strike: Launch-Ready Feed & Simple Uploads

This plan focuses on bypassing the industrial complexity (Mux/BullMQ) to get Zyeuté live immediately with a functional video feed and simple user uploads.

## Objectives

- **Launch-Ready Feed**: Combine a curated local library with the Pexels fallback.
- **Surgical Uploads**: Bypass Mux/Transcoding for direct-to-storage uploads.
- **Stability**: Ensure the backend no longer crashes due to port or schema issues.

## Proposed Changes

### 1. Feed Optimization (`ContinuousFeed.tsx` & `storage.ts`)

- [ ] **Task T1**: Solidify the Pexels fallback. Ensure it handles empty DB states without throwing 500s.
- [ ] **Task T2**: Create a "Golden Seed" script to inject 5-10 curated videos into the `publications` table pointing to stable URLs.

### 2. Surgical Bypass: Simple Uploads (`backend/routes.ts` or `upload.ts`)

- [ ] **Task T3**: Create a new `/api/upload/simple` endpoint.
- [ ] **Task T4**: Implementation: Receive file -> Upload to Supabase `zyeute-videos` bucket -> Create DB record with raw URL -> Return success.
- [ ] **Task T5**: Update the Frontend "Upload" button to use this simple path.

### 3. Verification

- [ ] **Task T6**: Manual verification: Launch server, check feed, perform search, upload one test video.

## Rollback Plan

- The Mux/BullMQ code remains in the project; we are simply routing _around_ it for the launch phase. Reverting is as simple as switching the API endpoint URL in the frontend.
