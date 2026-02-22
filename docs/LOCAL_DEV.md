# Local development setup (ZyeuteV5)

Quick fixes for getting the ZyeuteV5 server running locally.

## Quick Start Checklist

| Step | Command/Action |
|------|----------------|
| 1. Get password | [Supabase → Database](https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/database) |
| 2. Edit .env.local | `code .env.local` → set `DATABASE_URL` with real password |
| 3. Validate | `npm run check:env` |
| 4. Start server | `npm run dev:check` |

**URL-encoding (if password has special characters):**

| Character | URL-encoded |
|-----------|-------------|
| `#` | `%23` |
| `@` | `%40` |
| `%` | `%25` |
| `&` | `%26` |
| `=` | `%3D` |

---

## 1. DATABASE_URL (wrong or missing password)

The backend loads `.env` then **`.env.local`** (override). Use `.env.local` for your real DB password so you don’t commit it.

- Get the password: [Supabase → Project → Settings → Database](https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/database).
- Create or edit **`.env.local`** and set:
  ```bash
  DATABASE_URL=postgresql://postgres.vuanulvyqkfefmjcikfk:YOUR_REAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  ```
- If the password contains special characters, URL-encode them (e.g. `#` → `%23`, `@` → `%40`).

Check that the server will see the right env:
```bash
npm run check:env
```

## 2. LightningCSS missing native module (Windows)

If you see: `Cannot find module '../lightningcss.win32-x64-msvc.node'`:

1. **Install Microsoft Visual C++ Redistributable**  
   [Download (x64)](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170) → run installer, restart if asked.

2. **Clean reinstall**
   - Delete `node_modules` and `package-lock.json`.
   - Run `npm install` again.

3. **Optional:** Rebuild the native addon:
   ```bash
   npm rebuild lightningcss
   ```

4. If it still fails, try **yarn** instead of npm (delete `node_modules` and `package-lock.json`, then `yarn install`).

The repo adds `lightningcss-win32-x64-msvc` as an optional dependency so the Windows binary is installed when you run `npm install` on Windows.

## 3. Starting the server

- **Backend (with env check):**
  ```bash
  npm run dev:check
  ```
  Runs `check:env` then starts the backend. Fails fast if `DATABASE_URL` is missing or still the placeholder.

- **Backend only:**
  ```bash
  npm run dev
  ```
  Uses `tsx backend/index.ts`; reads `.env` then `.env.local`. Listens on `PORT` (default 3000). If you use the Vite dev server, set `PORT=5000` in `.env.local` so the frontend proxy matches.

- **Pre-flight:**  
  `npm run check:env` — validates required env (including `.env.local`) without starting the server.

---

## Troubleshooting

### Database: "Tenant or user not found" (FATAL XX000)

Supabase couldn’t find the project or user. Check:

1. **Project is active** — In [Supabase Dashboard](https://app.supabase.com), confirm the project isn’t paused.
2. **Connection string** — Use the **Connection pooling** string (port **6543**), not the direct connection. User must be `postgres.PROJECT_REF` (e.g. `postgres.vuanulvyqkfefmjcikfk`).
3. **Password** — Copy the database password again from Project → Settings → Database. If the project was recreated, the password changed.
4. **URL-encode** — If the password contains `#`, `@`, `%`, etc., encode them (see table above).

### Redis connection errors (localhost:6379)

The app expects Redis for caching/queues. For local dev you can:

- **Ignore** — Server still starts; features that need Redis will log errors or fall back.
- **Run Redis** — Install and start Redis (e.g. Docker: `docker run -p 6379:6379 redis`) or use a cloud Redis and set `REDIS_URL` in `.env.local`.

### Port 3000 already in use (EADDRINUSE)

Another process (often a previous `npm run dev`) is using port 3000. Free it:

- **PowerShell:** Find PID: `Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess`. Then: `Stop-Process -Id <PID> -Force`.
- **Or:** Close the terminal that’s running the old server, or run the backend on another port: in `.env.local` set `PORT=5000`, then use http://localhost:5000.

### Rollup / Vite: "Cannot find module @rollup/rollup-win32-x64-msvc"

npm sometimes skips optional dependencies on Windows. Try:

1. **Clean reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. The repo adds `@rollup/rollup-win32-x64-msvc` as a **devDependency** so it should install on Windows. If it still fails, try **yarn** instead of npm.
