# Feed seed keys: Vercel vs Render

## CRITICAL

**Vercel env vars do NOT seed production.** All `/api/*` goes to **Render** via [`vercel.json`](../vercel.json).

**`/api/seed/*` requires `X-Cron-Secret`** (or admin JWT). Set `CRON_SECRET` on Render and in GitHub Actions secrets.

## Important

`vercel.json` sends **all** `/api/*` traffic to **Render**:

`https://zyeutev5-1.onrender.com/api/...`

So **PEXELS_API_KEY**, **PIXABAY_API_KEY**, and **APIFY_API_KEY** on **Vercel** are only used if:

- A **Vite** variable (`VITE_*`) is baked into the frontend build, or
- You run a **GitHub Action** / local script with those keys.

They are **not** automatically available to the Render backend.

## Option A — Copy keys to Render (recommended)

In [Render Dashboard](https://dashboard.render.com) → your service → **Environment**:

| Variable                              | Same value as Vercel  |
| ------------------------------------- | --------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`           | ✓                     |
| `VITE_SUPABASE_URL` or `SUPABASE_URL` | ✓                     |
| `PEXELS_API_KEY`                      | ✓                     |
| `PIXABAY_API_KEY`                     | ✓                     |
| `APIFY_API_KEY`                       | ✓                     |
| `CRON_SECRET`                         | Same as GitHub secret |

Redeploy, then:

```bash
curl -X POST "https://zyeutev5-1.onrender.com/api/seed/providers?limit=15" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

Or from the app URL (proxied):

```bash
curl -X POST "https://www.zyeute.com/api/seed/providers?limit=15"
```

## Option B — GitHub Actions (keys stay like Vercel)

1. GitHub repo → **Settings → Secrets and variables → Actions**
2. Add the same keys as in Vercel
3. **Actions → Seed feed (Pixabay + Pexels + Apify) → Run workflow**

This inserts directly into Supabase; Render env not required for seeding.

## Option C — Local

```bash
# .env.local
VITE_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
APIFY_API_KEY=...

npm run seed:providers
```
