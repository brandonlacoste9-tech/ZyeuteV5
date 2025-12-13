# Zyeuté - Quebec Social Media Platform

> "L'app sociale du Québec, Fait au Québec pour le Québec"
> Domain: zyeute.com

## Overview

Zyeuté is a premium Quebec-focused social media platform featuring a unique leather UI design with gold accents, embodying Quebec heritage aesthetics. The mascot is Ti-Guy, a stylized beaver representing Quebec culture.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication with bcrypt
- **AI Features**: FAL AI (Flux image generation, Kling video generation)

## Key Features

### Core Social Features
- Posts (photos/videos) with captions, hashtags, and Quebec regions
- Stories (24-hour ephemeral content)
- Fire reactions (unique to Zyeuté - replaces likes)
- Comments and replies
- User following system
- Notifications
- **La Zyeute**: TikTok-style vertical swipe feed (/zyeute)

### V3 Swarm AI Architecture
Multi-brain DeepSeek V3 system with specialized roles:

- **V3-CORE**: Orchestrator/Director - routes intents to appropriate models
- **V3-FEED**: Feed engine - generates content cards for vertical feed
- **V3-TI-GUY**: Joual persona - authentic Québécois voice for all UI text
- **V3-MOD**: Moderation - safety & brand fit checking
- **V3-MEM**: Memory - lightweight user preference tracking

### AI Studio (/ai-studio)
- **Flux AI**: Text-to-image generation with multiple aspect ratios
- **Kling Video**: Image-to-video animation
- **FAL Presets**: flux-2-flex, auraflow, flux-schnell, flux-realism

### Design Theme
- Premium leather texture backgrounds (dark pebbled leather)
- Gold accents and gradients
- Gold ring avatar frames
- Stitching effects on UI elements
- Quebec heritage styling

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `FAL_API_KEY` - FAL AI for Flux/Kling generation
- `STRIPE_SECRET_KEY` - Stripe payments (premium subscriptions)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe frontend key
- `DEEPSEEK_API_KEY` - Ti-Guy AI assistant
- `SESSION_SECRET` - Required in production (fails fast if not set)

## Security Features

### Session Security
- PostgreSQL-backed session store for persistence
- Secure cookies (httpOnly, sameSite=strict, secure in production)
- Fail-fast if SESSION_SECRET not set in production

### Rate Limiting
- Auth endpoints: 5 requests/minute per IP
- AI endpoints: 100 requests/15 minutes per IP
- General API: 60 requests/15 minutes per IP
- Trust proxy enabled for accurate IP detection

### V3 Swarm Resilience
- DeepSeek API calls with 30s timeout
- Exponential backoff retry (3 attempts: 1s, 2s, 4s)
- Moderation loop capped at 3 attempts with fallback content

### Database Optimization
- Indexes on posts.userId, posts.createdAt
- Indexes on follows.followerId, follows.followingId

## Demo Credentials

- Email: demo@zyeute.ca
- Password: demo123

## API Routes

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Posts
- GET /api/feed
- POST /api/posts
- GET /api/posts/:id
- DELETE /api/posts/:id

### Reactions
- POST /api/posts/:id/fire
- DELETE /api/posts/:id/fire

### Comments
- GET /api/posts/:id/comments
- POST /api/posts/:id/comments

### Users
- GET /api/users/:id
- PATCH /api/users/me
- POST /api/users/:id/follow
- DELETE /api/users/:id/follow

### Stories
- GET /api/stories
- POST /api/stories
- POST /api/stories/:id/view

### AI
- POST /api/ai/generate-image (Flux)
- POST /api/ai/generate-video (Kling)
- POST /api/ai/tiguy-chat (V3-TI-GUY)

### V3 Swarm
- POST /api/v3/flow (orchestrated AI actions)
- POST /api/v3/feed-item (generate AI feed content)
- POST /api/v3/microcopy (generate UI text in Ti-Guy voice)
- GET /api/v3/fal-presets (available FAL model presets)

### Email Automation
- GET /api/email/pending (view queued emails)
- POST /api/email/process-queue (process pending emails)
- POST /api/email/preview (generate email preview with AI)
- POST /api/email/trigger-onboarding (manually trigger onboarding)
- DELETE /api/email/cancel (cancel pending emails)

### Virtual Gifts (Stripe)
- GET /api/gifts/catalog (get gift catalog)
- POST /api/gifts/create-payment-intent (create Stripe PaymentIntent)
- POST /api/gifts/confirm (confirm gift after payment)
- GET /api/posts/:id/gifts (get gifts for a post)
- GET /api/users/me/gifts (get user's received gifts)

## Email Automation System

### Email Types
1. **Welcome Email**: Sent immediately on signup, introduces Ti-Guy and Zyeuté
2. **Onboarding Day 1**: Ti-Guy Studio introduction (24h after signup)
3. **Onboarding Day 3**: Fire reactions explanation (3 days after signup)
4. **Onboarding Day 7**: Premium soft pitch (7 days after signup)
5. **Weekly Digest**: Activity summary + content suggestions (Sundays)
6. **Upgrade Prompt**: Triggered when AI usage reaches 70% of free tier
7. **Re-engagement**: Sent after 7 days of inactivity

### Architecture
- `server/email-automation.ts` - Queue management, scheduling logic
- `server/email-templates.tsx` - React Email templates with Ti-Guy joual voice
- `server/resend-client.ts` - Resend API integration (via Replit connector)
- React Email for clean, responsive HTML templates
- In-memory queue (production should use database)

### Email Voice Guidelines
- Same joual-forward, inclusive voice as UI copy
- Ti-Guy personality throughout
- Warm and encouraging tone
- No gendered assumptions

## Project Structure

```
client/src/
  pages/       - React page components
  components/  - Reusable UI components
  services/    - API client functions
  lib/         - Utilities and helpers
  contexts/    - React contexts

server/
  routes.ts           - API route handlers
  storage.ts          - Database operations
  index.ts            - Express server setup
  v3-swarm.ts         - V3 multi-brain AI architecture
  email-automation.ts - Email queue and scheduling
  email-templates.tsx - React Email templates (Ti-Guy joual voice)
  resend-client.ts    - Resend integration for email delivery

shared/
  schema.ts    - Drizzle ORM schema & types
```

## User Preferences

### Voice & Tone
- **Joual-forward**: Informal Québécois French (e.g., "Embarque" instead of "Inscris-toi")
- **Inclusive**: Non-gendered language, women-forward but welcoming to all
- **Playful**: Ti-Guy mascot personality shines through loading messages and microcopy

### Design System
- Use centralized copy system at `lib/copy.ts` for all UI text
- Apply micro-interaction utilities: `.hover-lift`, `.press-effect`, `.hover-glow`
- Use branded `Spinner` and skeleton loaders for loading states
- Gold accents with `.spinner-gold` for inline spinners

## Recent Changes

- 2024-12-12: Created centralized copy system (lib/copy.ts) with joual-forward, inclusive voice
- 2024-12-12: Added comprehensive micro-interactions CSS (hover-lift, press-effect, hover-glow, animations)
- 2024-12-12: Built branded Spinner component with skeleton loaders (FeedSkeleton, ProfileSkeleton)
- 2024-12-12: Implemented first-time user onboarding flow with 4 steps and Studio handoff
- 2024-12-12: Updated Login and Feed pages with joual copy and micro-interactions
- 2024-12-12: Fixed ProtectedRoute to properly validate user object in auth response
- 2024-12-12: Fixed Login page redirect logic for unauthenticated users
- 2024-12-12: Added 23 demo posts with varied hashtags (#Poutine, #QC, #MTL, #QuebecCity) and regions
- 2024-12-12: Implemented V3 Swarm AI architecture with DeepSeek
- 2024-12-12: Added La Zyeute TikTok-style vertical swipe feed
- 2024-12-12: French-first language settings with hidden English toggle
- 2024-12-12: Added AI Studio with Flux image and Kling video generation
- 2024-12-12: Migrated from mock data to full PostgreSQL backend
- 2024-12-12: Implemented session-based authentication
- 2024-12-12: Integrated Resend for email delivery via Replit connector
- 2024-12-12: Created React Email templates with Ti-Guy joual voice (welcome, onboarding, digest, re-engagement)
- 2024-12-12: Added email webhook handler for tracking events
- 2024-12-12: Fixed StoryViewer video/photo type detection (uses `type` field from Story interface)
- 2024-12-12: Enhanced VideoPlayer with proper loading states, URL validation, error handling with retry button
- 2024-12-12: Verified fal.ai Kling video generation integration working with FAL_API_KEY
- 2024-12-12: Added Virtual Gifts monetization system with Stripe integration
- 2024-12-12: Created gifts table with Quebec-themed gift types (Comète, Feuille d'érable, Fleur de Lys, Feu, Coeur d'or)
- 2024-12-12: Added Gift button 🎁 to VideoCard with gift count display
- 2024-12-12: Built GiftModal with Stripe Elements payment flow
- 2024-12-12: Gift notifications sent to recipients on purchase
