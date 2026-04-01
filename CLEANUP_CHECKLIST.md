# ZyeuteV5 Cleanup Checklist

Quick scan for things to clean up (optional; hand off to your other Cursor or do when convenient).

---

## 1. Root-level debug / test artifacts (low)

These look like one-off scripts or outputs that got committed. Consider moving to `scripts/` or adding to `.gitignore` and deleting from repo:

| File                                                         | Suggestion                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `debug-feed-query.js`                                        | Move to `scripts/` or add `debug-*.js` to `.gitignore`                   |
| `dump-videos.js`                                             | Same; or `scripts/dump-videos.js`                                        |
| `videos-dump.json`                                           | Add to `.gitignore` (e.g. `*-dump.json`), remove from repo if not needed |
| `check_output.txt`                                           | Add to `.gitignore` (e.g. `*_output.txt`), remove from repo              |
| `test_output.txt`                                            | Same                                                                     |
| `test_db.ts`, `test_clean_db.ts`, `test_direct_db.ts` (root) | Move to `scripts/` or `test/` if they’re runnable scripts                |

---

## 2. TODOs / temporary comments (tracking only)

Worth tracking; no urgency unless you’re touching those areas:

- **backend/index.ts** – Migrations and schema healing are “TEMPORARILY DISABLED”. Re-enable when migrations are fixed or document why they stay off.
- **backend/websocket/gateway.ts** – “Dependency missing in package.json” for `@socket.io/redis-adapter`. Add the dep or remove the comment once fixed.
- **backend/routes.ts** – “TODO: Invalidate Redis feed cache when cache is implemented”.
- **backend/routes/messaging.ts** – TODO presigned URL, TODO admin role check.
- **backend/routes/hive.ts** – TODO admin auth check.
- **backend/ai/swarm-bridge.ts** – TODO read from env.
- **frontend** – TODOs in TiGuyMessaging (wire DMs), ChatZyeute (block), ChatInput (voice), types/guards (expand guards/Zod).
- **frontend/src/test/e2e/loginFlow.e2e.test.ts** – Many “Phase 2” TODOs; either implement or collapse into one tracked ticket.

---

## 3. Console logging (optional polish)

- **Frontend:** ~30+ files with `console.log`/`warn`/`debug`. Consider a small `lib/logger.ts` (or use existing one) and replace ad-hoc logs in user-facing paths so production stays clean.
- **Backend:** Many files log; fine for dev. For production, consider routing through a logger (you have `backend/utils/logger.ts`) and trimming noisy `console.log` in hot paths.

---

## 4. Duplicate / odd paths (verify)

- **backend/backend/index.ts** – There is a nested `backend/backend/`. Confirm it’s intentional (e.g. a script or alternate entry). If it’s legacy, consider removing or moving to `scripts/`.

---

## 5. Test focus / skips

- No `describe.only` / `it.only` / `fit` found; nothing to clean there.

---

## 6. Suggested .gitignore additions (optional)

```gitignore
# Debug/dump artifacts (if you remove them from repo)
debug-*.js
dump-*.js
*-dump.json
*_output.txt
test_output.txt
check_output.txt
```

---

**Summary:** No major structural problems. Highest-value cleanups: (1) root-level debug/test artifacts and .gitignore, (2) document or fix the disabled migrations and gateway Redis adapter, (3) optional logger pass for frontend. The rest can be done gradually.
