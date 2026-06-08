# Manual Render setup (Phase 0)

Complete these steps in the [Render dashboard](https://dashboard.render.com) for **zyeutev5-1** before relying on production feed + seed.

## 1. Rotate exposed credentials

If any keys were pasted in chat or committed docs, rotate in:

- Supabase (DB password, service role, anon if abused)
- Mux, Apify, Pexels, Redis/Upstash, Stripe, TikAPI

## 2. Required environment variables

See [RENDER_ENV_VARS.md](../RENDER_ENV_VARS.md) for the full template.

Minimum for feed + seed:

```
CRON_SECRET=<generate 32+ random chars>
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
TIKTOK_SCRAPER_API_KEY=...          # Omkar primary (Quebec seed)
TIKTOK_SCRAPER_API_KEY_BACKUP=...   # optional failover
APIFY_API_KEY=...
PEXELS_API_KEY=...
FEED_REPLENISH_ENABLED=true
FEED_OMKAR_CALLS_PER_RUN=2
FEED_MIN_PLAYABLE_POSTS=150
FEED_REPLENISH_TARGET=350
DATABASE_URL=postgresql://...pooler...:5432/postgres
FRONTEND_URL=https://zyeute.com
MUX_WEBHOOK_SECRET=...
WEBHOOK_SECRET=...
```

## 3. GitHub Actions

Add repository secret: `CRON_SECRET` (same value as Render).

## 4. Verify

```bash
curl https://zyeutev5-1.onrender.com/api/health
curl "https://zyeutev5-1.onrender.com/api/feed/infinite?limit=3&type=explore&hive=quebec"
curl -X POST "https://zyeutev5-1.onrender.com/api/seed/providers?limit=5" -H "X-Cron-Secret: YOUR_SECRET"
```

Last command should return 200 (not 401).
