# Clique Mexico Architecture

## Based on ZyeuteV5 Learnings

---

## 1. What Worked in ZyeuteV5 (Keep)

```typescript
// ✅ Multi-tenant hive system
hive_id: 'quebec' | 'brazil' | 'argentina' | 'mexico'

// ✅ Dual currency economy
karma_credits: number  // Engagement points (non-monetary)
cash_credits: number   // Real money (cents)

// ✅ Video processing pipeline
processing_status: 'pending' | 'processing' | 'completed' | 'failed'
mux_playback_id: string  // HLS streaming
hls_url: string          // Direct HLS (backwards compat)

// ✅ Pexels fallback for cold start
/api/pexels/curated -> fallback when DB empty

// ✅ Real-time engagement
useFeedEngagement(visiblePostIds) // Live like/comment counts
```

---

## 2. What Broke in ZyeuteV5 (Fix)

### ❌ Video Player Over-Engineering

```typescript
// BEFORE (ZyeuteV5) - Complex, buggy
VideoPlayer.tsx
  -> HLS.js for ALL videos
  -> MSE for partial chunks
  -> 1000+ lines of code
  -> Black screens on MP4s

// AFTER (Clique Mexico) - Simple, reliable
PlayerRouter
  mux_playback_id ? <MuxVideoPlayer />      // HLS streaming
  hls_url ? <HLSVideoPlayer />              // HLS.js (rare)
  media_url ? <SimpleVideoPlayer />         // Native MP4 (most common)
```

### ❌ Memory Leaks

```typescript
// BEFORE - Videos stayed in DOM forever
<VideoPlayer /> // Never unmounts

// AFTER - Aggressive cleanup
!isActive && !priority ? <Thumbnail /> : <VideoPlayer />
// Unmount when >2 items away
```

### ❌ URL Sniffing

```typescript
// BEFORE - Brittle
if (url.includes('.m3u8')) // Can break

// AFTER - Explicit
if (post.hls_url) // Reliable
```

---

## 3. Mexico-Specific Additions

### Payment Stack (Oxxo + SPEI)

```typescript
// payments/mexico.ts
export const mexicoPayments = {
  oxxo: async (amount: number) => {
    // Generate barcode
    // SMS/WhatsApp delivery
    // 3-day expiry
  },
  spei: async (amount: number) => {
    // CLABE generation
    // Bank transfer
  },
  mercadopago: async (amount: number) => {
    // SDK integration
    // Installments (meses sin intereses)
  },
};
```

### Content Moderation (Mexican Context)

```typescript
// moderation/mexico.ts
const mexicoRules = {
  // Strict: Cartel/Narco content
  prohibited: [
    "narco corridos with violence",
    "cartel recruitment",
    "weapon sales",
  ],

  // Election silence periods
  electoralSilence: {
    enabled: true,
    // From INE (Instituto Nacional Electoral)
    periods: getINECalendar(),
  },

  // Regional sensitivity
  regional: {
    // Respect local conflicts
    avoid: ["gang territorial disputes"],
  },
};
```

### WhatsApp Integration (Critical for MX)

```typescript
// notifications/whatsapp.ts
// 90% of Mexicans use WhatsApp
export const whatsappService = {
  async sendOxxoBarcode(userId: string, barcode: string) {
    await yalo.messages.send({
      to: phone,
      type: "text",
      body: `Tu código para pagar en Oxxo:\n${barcode}`,
      // Rich media with store locator
      buttons: [
        {
          type: "url",
          text: "Ver tiendas cercanas",
          url: "https://clique.mx/oxxo-locator",
        },
      ],
    });
  },
};
```

---

## 4. Database Schema (Optimized)

```typescript
// users table
{
  // Core (from ZyeuteV5)
  id: uuid,
  username: string,
  avatar_url: string,

  // Mexico additions
  curp: string | null,        // Identity verification
  rfc: string | null,         // Tax for creators
  estado: string,             // 32 Mexican states
  ciudad: string,
  colonia: string,            // Neighborhood

  // Verification
  ine_verified: boolean,      // INE card
  phone_verified: boolean,    // SMS required

  // Payments
  preferred_payment: 'oxxo' | 'spei' | 'mercadopago' | 'card',
  clabe_account: string | null,  // For creator payouts

  // Localization
  timezone: 'America/Mexico_City', // Always CST
  content_region: 'cdmx' | 'monterrey' | 'guadalajara' | 'national',

  // Economy (from ZyeuteV5)
  karma_credits: number,
  cash_credits_cents: number,  // In cents (avoid float)

  // Hive
  hive_id: 'mexico'  // Fixed for this deployment
}

// videos table (simplified from ZyeuteV5)
{
  id: uuid,
  user_id: uuid,

  // Video sources (explicit, no URL sniffing)
  mux_playback_id: string | null,  // Mux HLS
  hls_url: string | null,          // Custom HLS (rare)
  media_url: string,               // MP4/WebM (most common)

  // Processing
  status: 'uploading' | 'processing' | 'ready' | 'failed',
  progress: number,  // 0-100

  // Engagement
  views: number,
  likes: number,
  shares: number,

  // Algorithm (from ZyeuteV5)
  momentum_score: number,

  // Regional
  region_tags: string[],  // For local trending

  created_at: timestamp
}
```

---

## 5. Video Pipeline (Streamlined)

```
Upload
  │
  ▼
┌─────────────────┐
│ 1. Validate     │ ◄── Size, format, scan
│    (Node)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Direct to S3 │ ◄── Presigned URL
│    (us-south-1) │     Texas (closest to MX)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Queue Job    │ ◄── BullMQ (Redis)
│    (background) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Mux Ingest   │ ◄── HLS generation
│                 │     (skip FFmpeg complexity)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Thumbnail    │ ◄── Mux webhook
│    + AI Tags    │     (Vertex AI)
└────────┬────────┘
         │
         ▼
    🎉 Ready!
```

**Key simplification:** Use Mux for everything, skip custom FFmpeg.
More expensive but bulletproof.

---

## 6. Feed Algorithm (Momentum Engine)

From ZyeuteV5 - this worked well:

```typescript
function calculateMomentum(video) {
  const hoursSince = hoursSincePosted(video.created_at);

  // Engagement rate
  const engagement =
    (video.likes * 1 + video.comments * 2 + video.shares * 3) /
    Math.max(video.views, 1);

  // Time decay (freshness boost)
  const freshness = Math.pow(0.9, hoursSince);

  // Regional boost (for local trending)
  const regionalBoost = isLocal(video) ? 1.3 : 1.0;

  return engagement * freshness * regionalBoost * 1000;
}
```

---

## 7. File Structure

```
clique-mexico/
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router
│   │   │   ├── (feed)/          # Main feed
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── upload/
│   │   │   └── profile/[user]/
│   │   ├── components/
│   │   │   ├── video/           # Video players
│   │   │   │   ├── PlayerRouter.tsx      # ✅ Smart routing
│   │   │   │   ├── SimplePlayer.tsx      # ✅ Native MP4
│   │   │   │   ├── MuxPlayer.tsx
│   │   │   │   └── HLSPlayer.tsx
│   │   │   ├── feed/
│   │   │   │   ├── FeedContainer.tsx     # ✅ Virtualized
│   │   │   │   └── FeedCard.tsx
│   │   │   └── payments/
│   │   │       ├── OxxoPayment.tsx       # 🇲🇽 Mexico-specific
│   │   │       └── SPEIPayment.tsx
│   │   └── lib/
│   │       ├── payments/
│   │       │   └── mexico.ts
│   │       └── moderation/
│   │           └── mexico.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── videos.ts
│   │   │   ├── feed.ts
│   │   │   └── payments/
│   │   │       └── mexico.ts
│   │   ├── workers/
│   │   │   └── videoProcessor.ts
│   │   └── services/
│   │       ├── mux.ts
│   │       └── whatsapp.ts
│   └── package.json
│
├── shared/
│   └── schema.ts
│
└── docker-compose.yml
```

---

## 8. Deployment

```bash
# 1. Setup
npx create-next-app@latest clique-mexico
cd clique-mexico
npm install drizzle-orm @mux/mux-node bullmq ioredis

# 2. Database (Supabase or Railway PostgreSQL)
npx drizzle-kit generate
npx drizzle-kit migrate

# 3. Deploy
railway login
railway link --project clique-mexico
railway up

# 4. Domain
# clique.mx (buy from GoDaddy MX)
```

---

## 9. Cost Estimate (Mexico)

| Service         | Monthly     | Notes                     |
| --------------- | ----------- | ------------------------- |
| Railway Pro     | $29         | 4GB RAM, 2 services       |
| PostgreSQL      | $15         | Supabase/Railway          |
| Redis           | $0          | Included                  |
| Mux Video       | $500        | 5K uploads, 50TB delivery |
| Cloudflare      | $20         | Pro plan + R2 storage     |
| WhatsApp (Yalo) | $200        | 20K messages              |
| **Total**       | **$764/mo** | ~$13K MXN                 |

Much cheaper than ZyeuteV5 because:

- Simpler architecture (no custom FFmpeg)
- Mux handles everything
- Smaller team (faster iteration)

---

## 10. Launch Checklist

### Week 1: Foundation

- [ ] Database schema
- [ ] Auth (phone + WhatsApp)
- [ ] Video upload (Mux)
- [ ] Simple feed

### Week 2: Mexico Features

- [ ] Oxxo payments
- [ ] WhatsApp notifications
- [ ] INE verification
- [ ] Regional content

### Week 3: Algorithm

- [ ] Momentum scoring
- [ ] For You page
- [ ] Trending (by state)

### Week 4: Polish

- [ ] Content moderation
- [ ] Creator fund
- [ ] Analytics

### Week 5: Launch

- [ ] Influencer seed (CDMX)
- [ ] University tour
- [ ] TikTok crossover

---

## Key Decisions

1. **Skip Pexels fallback?**
   - ZyeuteV5 used it for cold start
   - Mexico: Seed with 100 local videos instead
   - Better content, no dependency

2. **Custom FFmpeg or Mux?**
   - ZyeuteV5: Custom (complex, buggy)
   - Mexico: Mux only (reliable, fast)
   - Worth the extra cost

3. **One player or many?**
   - ZyeuteV5: One complex player
   - Mexico: Router + simple players
   - Easier to maintain

4. **WhatsApp vs SMS?**
   - Mexico: WhatsApp 90% penetration
   - Primary notification channel
   - SMS fallback only

---

Ready to build? 🇲🇽
