# zyeute-edge

Cloudflare Worker that sits in front of the Render API and caches **public** GETs:

| Path                                        | TTL  |
| ------------------------------------------- | ---- |
| `/api/health`                               | 15s  |
| `/api/cennes/catalog`, `/api/gifts/catalog` | 120s |
| `/api/users/:id`                            | 45s  |
| `/api/users/:id/posts`                      | 30s  |
| `/api/gamification/profile/:id`             | 60s  |

Authenticated requests (`Authorization` header) always bypass the public KV cache.

## Deploy

```bash
cd workers/zyeute-edge
npx wrangler deploy
```

Then point Vercel `/api` rewrites at the workers.dev (or custom) hostname.

## Self-check

```
GET https://zyeute-edge.<subdomain>.workers.dev/__edge/health
GET https://zyeute-edge.<subdomain>.workers.dev/api/health
# Second call should show header: X-Zyeute-Edge: HIT
```
