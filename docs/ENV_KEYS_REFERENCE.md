# Environment keys reference

Copy what you need into **`.env`** in the **project root** (same folder as `package.json`). The app loads only that file via `dotenv/config`.

**If you had keys in another folder before:** put them all in one **`.env`** at the repo root so the backend and Vite can read them. You can keep a backup folder, but the app won’t load from it unless you add a custom loader.

**Templates in this repo:**  
- `.env.example` – full list and comments  
- `.env.production.template` – production  
- `.env.vercel.example` – Vercel  

Copy one to `.env` and fill in your values (never commit `.env` – it’s gitignored).

---

## Core (app runs without these but with limited features)

| Key | Purpose | Where to get it |
|-----|---------|------------------|
| **DATABASE_URL** | PostgreSQL (feed, users, posts) | Supabase: Project → Settings → Database → Connection string (pooler) |
| **VITE_SUPABASE_URL** | Supabase project URL (auth + client) | Supabase → Settings → API → Project URL |
| **VITE_SUPABASE_ANON_KEY** | Supabase anon key (client-safe) | Supabase → Settings → API → anon public |
| **SUPABASE_SERVICE_ROLE_KEY** | Supabase service role (server-only, uploads/auth) | Supabase → Settings → API → service_role (secret) |
| **SESSION_SECRET** | Session encryption (32+ chars) | Generate: `openssl rand -hex 32` |

---

## Video & media

| Key | Purpose | Where to get it |
|-----|---------|------------------|
| **MUX_TOKEN_ID** | Mux API token ID (video upload/playback) | [Mux Dashboard](https://dashboard.mux.com) → Settings → Access Tokens |
| **MUX_TOKEN_SECRET** | Mux API token secret | Same as above |
| **PEXELS_API_KEY** | Pexels API (feed fallback + gallery) | [Pexels API](https://www.pexels.com/api/) |
| **GCS_PROJECT_ID** | Google Cloud Storage project | GCP Console |
| **GCS_BUCKET_NAME** | GCS bucket for uploads | Your bucket name |
| **GCS_KEY_FILE** | Path to GCP service account JSON | Local file path |

---

## AI & Ti-Guy

| Key | Purpose | Where to get it |
|-----|---------|------------------|
| **GEMINI_API_KEY** | Google Gemini (or use Ollama bridge) | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| **DEEPSEEK_API_KEY** | DeepSeek chat (Ti-Guy / swarm) | [DeepSeek](https://platform.deepseek.com) |
| **FAL_KEY** | FAL.ai – Ti-Guy image/video generation | [FAL](https://fal.ai) |
| **OPENWEATHER_API_KEY** | Weather bee (Ti-Guy) | [OpenWeather](https://openweathermap.org/api) |
| **ELEVENLABS_API_KEY** | Voice bee (Ti-Guy) | [ElevenLabs](https://elevenlabs.io) |
| **GROQ_API_KEY** | Groq (optional AI tier) | [Groq Console](https://console.groq.com) |
| **OLLAMA_API_KEY** | Ollama Cloud (optional) | [Ollama](https://ollama.ai) |

---

## Optional services

| Key | Purpose | Where to get it |
|-----|---------|------------------|
| **REDIS_URL** or **REDIS_HOST** | Redis (queues, engagement cache) | e.g. Upstash, Railway, local Redis |
| **RESEND_API_KEY** | Transactional email | [Resend](https://resend.com) |
| **FROM_EMAIL** | Sender for emails | e.g. `Zyeute <noreply@yourdomain.com>` |
| **STRIPE_SECRET_KEY** | Payments | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| **VITE_STRIPE_PUBLISHABLE_KEY** | Stripe client key | Same |
| **STRIPE_WEBHOOK_SECRET** | Stripe webhooks | Stripe → Webhooks |
| **GIFTBIT_API_KEY** | Gift cards (Honest Hive) | Giftbit |
| **MAX_API_TOKEN** | Max (WhatsApp) API auth | Your secret |
| **COLONY_OS_URL** | Colony OS dashboard URL | Your Colony URL |
| **COLONY_API_KEY** | Colony API auth | Your Colony key |

---

## Google Cloud / Vertex (optional)

| Key | Purpose |
|-----|---------|
| **GOOGLE_CLOUD_PROJECT** or **VERTEX_AI_PROJECT_ID** | GCP project ID |
| **GOOGLE_APPLICATION_CREDENTIALS** | Path to service account JSON |
| **GOOGLE_SERVICE_ACCOUNT_JSON** | Or paste JSON (string) |
| **GOOGLE_CLOUD_REGION** / **VERTEX_AI_LOCATION** | e.g. `us-central1` |
| **VERTEX_DATA_STORE_ID** | Discovery Engine data store (optional) |
| **DIALOGFLOW_CX_AGENT_ID** | Dialogflow CX agent (optional) |

---

## Minimal set to “see everything” locally

- **DATABASE_URL** – so feed and app data work  
- **VITE_SUPABASE_URL** + **VITE_SUPABASE_ANON_KEY** + **SUPABASE_SERVICE_ROLE_KEY** – auth and uploads  
- **PEXELS_API_KEY** – video in feed when DB is empty or for gallery  
- **MUX_TOKEN_ID** + **MUX_TOKEN_SECRET** – if you use Mux for upload/playback  
- **SESSION_SECRET** – any 32+ character secret  

Everything else is optional; the app will log warnings and disable those features.

---

## Québec Or symbol (branding)

The header shows the Québec Or symbol (Fleur-de-lis with lion, QUÉBEC OR, maple leaf) when this file exists:

**`frontend/public/quebec-or-symbol.png`**

Copy your symbol image there; it appears next to the Zyeuté logo on larger screens. If the file is missing, the symbol is hidden.
