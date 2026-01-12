# 🚀 Vercel Environment Setup Guide

To resolve 500 errors and enable the Hybrid Auth system, you must configure these variables in Vercel.

## 1. Critical Backend Variables (Required for Login)

| Variable                    | Description                                 | Where to find it                                                            |
| --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`              | Connection string to Postgres               | Supabase > Project Settings > Database > Connection Pooling (Use port 6543) |
| `SESSION_SECRET`            | String used to sign session cookies         | Generate a random string (e.g. `openssl rand -hex 32`)                      |
| `VITE_SUPABASE_URL`         | Your project URL                            | Supabase > Project Settings > API                                           |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** key for backend JWT verification | Supabase > Project Settings > API (Do not expose to client!)                |

## 2. Feature Variables

| Variable            | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `STRIPE_SECRET_KEY` | Secret key (`sk_live_...` or `sk_test_...`) for payments |
| `FAL_API_KEY`       | Key for AI Image/Video generation (Flux/Kling)           |
| `DEEPSEEK_API_KEY`  | Key for Ti-Guy Chat intelligence                         |
| `PEXELS_API_KEY`    | Key for Pexels photo/video collections API               |

## 3. Migration Guide

**Current Status:** Hybrid Mode.
The backend now accepts both standard Cookies (Legacy) and JWT Bearer Tokens (Modern).

**How to switch Frontend to JWT:**
Update your API calls to include the token:

```javascript
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

fetch("/api/some-endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Next Steps for You:

1. **Copy/Paste** these files into your codebase.
2. **Add `SUPABASE_SERVICE_ROLE_KEY`** to your Vercel Environment Variables (this is critical for the new `server/supabase-auth.ts` to work).
3. **Deploy**.
