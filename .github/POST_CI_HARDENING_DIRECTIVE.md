# ⭐ Post‑CI Hardening Directive

**Objective:**  
Consolidate stability, deployment reliability, and code quality after CI improvements.  
These tasks are prioritized for maximum production-readiness and developer confidence.

---

## 1. Vercel Build Optimization & Performance

- [ ] Ensure build output and caching are configured correctly.
- [ ] Reduce cold‑start latency for serverless functions.
- [ ] Clean up noisy or misleading build logs.
- [ ] Verify deploy region selection (`iad1` or `yul1`) for lowest latency.
- [ ] Audit all environment variables for consistency across preview and production.
- [ ] Guarantee preview deployments per PR (mandatory for review).

*Outcome: Locked‑in deployment reliability.*

---

## 2. Supabase Database & Index Hygiene

- [ ] Add missing indexes on high‑traffic columns (`created_at`, `user_id`, `video_id`).
- [ ] Review Row-Level Security (RLS) policies for feed, profiles, and interactions.
- [ ] Optimize queries backing the feed and profile pages.
- [ ] Make session restoration logic 100% consistent, both client and server.
- [ ] Add error-handling paths for expired or invalid sessions.

*Outcome: Stable backend and improved feed performance.*

---

## 3. TypeScript Strictness & Safety Upgrades

- [ ] Enable TypeScript `strict` mode (or as close as possible).
- [ ] Remove all remaining `any` types.
- [ ] Add missing interfaces for feed items, user profiles, and video metadata.
- [ ] Strengthen generics in Swarm Adapter and tiGuyAgent modules.
- [ ] Add type guards for all API responses.
- [ ] Ensure every custom hook follows the Rules of Hooks.

*Outcome: Fewer runtime bugs and faster team velocity.*

---

## 4. Additional Quality & Reliability Tasks (Optional, High-Impact)

- [ ] Add pre-commit hooks (lint, format, typecheck mandatory).
- [ ] Add PR and issue templates for contributor clarity.
- [ ] Add CONTRIBUTING.md and CHANGELOG.md files.
- [ ] Improve error boundaries in the React app.
- [ ] Add lazy loading for heavy/rare components.
- [ ] Optimize `VideoCard` and feed components to reduce unnecessary re-renders.

*Outcome: Production‑grade polish and maximum reliability.*

---

**Instructions:**
- Use this checklist for triage, project board, or tracking issue.
- Break major points into subtasks/issues if needed.
- All PRs: include test plan + risk notes.  
- Tag: `hardening`, `performance`, `quality`.
- Document exceptions in PRs or linked issues.
- Raise blockers/risk areas early for review.

_Last updated: 2025-12-28_  
_Maintainer: @brandonlacoste9-tech_