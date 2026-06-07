# Render Environment Variables — Template

Set these in the Render dashboard for **zyeutev5-1** (production API behind Vercel).

**Never commit live secrets.** Copy values from Supabase/Mux/Apify dashboards only.

## Required

| Variable                    | Notes                                                  |
| --------------------------- | ------------------------------------------------------ |
| `NODE_ENV`                  | `production`                                           |
| `PORT`                      | `10000`                                                |
| `DATABASE_URL`              | Supabase session pooler, **port 5432** (see AGENTS.md) |
| `VITE_SUPABASE_URL`         | `https://vuanulvyqkfefmjcikfk.supabase.co`             |
| `SUPABASE_URL`              | Same as above                                          |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API                         |
| `VITE_SUPABASE_ANON_KEY`    | From Supabase → Settings → API                         |
| `SESSION_SECRET`            | Random 32+ chars                                       |
| `CRON_SECRET`               | Random secret for `/api/seed/*` and GitHub cron        |
| `FRONTEND_URL`              | `https://zyeute.com`                                   |

## Feed seeding (Render — not Vercel)

| Variable                  | Notes              |
| ------------------------- | ------------------ |
| `APIFY_API_KEY`           | TikTok bulk import |
| `PEXELS_API_KEY`          | Stock filler       |
| `PIXABAY_API_KEY`         | Optional           |
| `FEED_REPLENISH_ENABLED`  | `true`             |
| `FEED_MIN_PLAYABLE_POSTS` | `150`              |
| `FEED_REPLENISH_TARGET`   | `350`              |
| `FEED_REPLENISH_BATCH`    | `50`               |

## Video (Mux)

| Variable             | Notes                      |
| -------------------- | -------------------------- |
| `MUX_TOKEN_ID`       | Mux dashboard              |
| `MUX_TOKEN_SECRET`   | Mux dashboard              |
| `MUX_WEBHOOK_SECRET` | Mux webhook signing secret |

## Optional

| Variable          | Notes                         |
| ----------------- | ----------------------------- |
| `REDIS_URL`       | Upstash if using Redis        |
| `TIKAPI_KEY`      | Optional; often rate-limited  |
| `WEBHOOK_SECRET`  | HLS worker cache invalidation |
| `HIVE_SECRET_KEY` | Colony / n8n events           |

See also [docs/SEED_KEYS_VERCEL_AND_RENDER.md](docs/SEED_KEYS_VERCEL_AND_RENDER.md).
