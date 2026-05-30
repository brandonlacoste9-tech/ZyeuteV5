# Local setup – Zyeuté V5

Get the app running on your machine in a few steps.

## 1. Clone and install

```bash
git clone <repo-url>
cd ZyeuteV5
npm install
```

## 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable         | Where to get it                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Supabase → Project Settings → Database → Connection string (URI). See [SUPABASE_DATABASE_URL.md](./SUPABASE_DATABASE_URL.md). |
| `SESSION_SECRET` | Any long random string (e.g. `openssl rand -hex 32`).                                                                         |

Recommended for auth and uploads:

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key

Check that required vars are set:

```bash
npm run check:env
```

## 3. Run the app

```bash
npm run dev
```

- Backend + Vite dev server start together.
- App: **http://localhost:5173** (or the port Vite prints).
- API health: **http://localhost:3000/api/health**
- Feed health: **http://localhost:3000/api/health/feed**

## 4. Optional

- **Redis** – Used for queues/cache. If not running, the app still starts; some features may be limited.
- **Migrations** – Run automatically on startup. To run manually: `npm run migrate`.

## Troubleshooting

- **"DATABASE_URL is not set"** – Run `npm run check:env` and set missing vars in `.env`.
- **"CANNOT CONNECT TO DATABASE"** – Check `DATABASE_URL` (correct host, password, SSL). For Supabase use the pooler URL (port 6543).
- **Feed empty** – Open `/api/health/feed`; if 503, check DB and logs. The feed falls back to Pexels when the DB returns no posts.
- **CORS errors in production** – Set `CORS_ORIGIN` to your frontend URL (e.g. `https://app.zyeute.com`).

## Production checklist

- Set `CORS_ORIGIN` to your frontend origin.
- Set `NODE_ENV=production`.
- Run `npm run check:env` before deploy; ensure required vars are set in your host (Railway, Vercel, etc.).
- Monitor `/api/health` and `/api/health/feed` for 503s and restart or alert as needed.
