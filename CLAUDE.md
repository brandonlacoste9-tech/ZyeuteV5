# CLAUDE.md - AI Assistant Guide for Zyeuté V5

## Project Overview

**Zyeuté V5** is "Le TikTok du Québec" - a Quebec-first social media platform with AI-powered content discovery, real-time messaging, and creator economy features. The platform enforces Quebec cultural identity through its "Trinity" system architecture.

### Trinity System Architecture

- **The Brain (Ti-Guy)**: AI orchestrator enforcing Quebec culture and language
- **The Hands**: Python browser automation for real-time trend discovery
- **The Soul**: Quebec Blue design system and Joual language enforcement

## Directory Structure

```
/home/user/ZyeuteV5/
├── frontend/              # React 19 + Vite frontend
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page-level components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utility functions
│       ├── services/      # API client services
│       ├── contexts/      # React Context providers
│       ├── schemas/       # Zod validation schemas
│       ├── i18n/          # Internationalization (Quebec French)
│       └── config/        # App configuration
├── backend/               # Express.js + Node.js backend
│   ├── ai/                # AI orchestration (Ti-Guy, Vertex, DeepSeek)
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── workers/           # Background job processors (BullMQ)
│   ├── ti-guy/            # Quebec-first AI enforcement
│   └── colony/            # Hive economy implementation
├── shared/                # Shared code between frontend/backend
│   └── schema.ts          # Drizzle ORM database schema (source of truth)
├── migrations/            # Drizzle database migrations
├── scripts/               # Utility and deployment scripts
├── tests/                 # Playwright E2E tests
│   ├── vital-signs/       # Core health checks
│   └── comprehensive/     # Feature test suites (01-08)
├── zyeute-browser-automation/  # Python browser service (The Hands)
└── docs/                  # Project documentation
```

## Technology Stack

### Frontend
- **React 19.2.4** with TypeScript 5.9.3
- **Vite 7.3.1** for bundling and dev server
- **Tailwind CSS 4.1.14** for styling
- **React Query 5.90** for data fetching
- **React Router 7.13** for routing
- **Radix UI** for accessible components
- **Zod 4.3** for validation
- **Socket.IO Client** for real-time features

### Backend
- **Express.js 5.2.1** with TypeScript
- **PostgreSQL 15+** with **Drizzle ORM 0.45**
- **BullMQ 5.67** for job queues (Redis-backed)
- **Socket.IO 4.8** for real-time communication
- **Supabase** for auth and database hosting

### AI/ML Integration
- **Google Vertex AI** / **Gemini 2.0** - Primary AI
- **DeepSeek V3** - Cost-effective alternative ($0.14/1M tokens)
- **Groq SDK** - Speed-optimized inference
- **pgvector** - Vector embeddings for recommendations

### Media Processing
- **Mux** - Video hosting and streaming
- **FFmpeg** (fluent-ffmpeg) - Video transcoding
- **Sharp** - Image processing
- **Pexels API** - Stock media

## Path Aliases

Defined in `tsconfig.json`:
```typescript
"@/*"       → "./frontend/src/*"
"@shared/*" → "./shared/*"
```

Also in `vite.config.ts`:
```typescript
"@"       → frontend/src
"@shared" → shared
"@assets" → attached_assets
```

## Key Commands

### Development
```bash
npm run dev              # Start Express backend + React frontend
npm run worker           # Start BullMQ background job processor
npm run check            # TypeScript type checking
npm run lint             # ESLint + TypeScript validation
npm run format           # Prettier formatting
```

### Database
```bash
npm run db:push          # Push schema changes to database
npm run migrate          # Run database migrations
npm run db:seed          # Populate with seed data
npm run db:backup        # Backup database
```

### Testing
```bash
npm run test             # Unit tests (Vitest)
npm run test:e2e         # All E2E tests (Playwright)
npm run test:vitals      # Core health checks
npm run test:comprehensive  # Full feature suite
npm run test:coverage    # Coverage report
```

### Building
```bash
npm run build            # Full build (Vite + esbuild backend)
npm run build:vercel     # Frontend only (for Vercel)
npm run preflight        # check + lint + build + test
```

## Database Schema

The schema is defined in `shared/schema.ts` using Drizzle ORM.

### Key Enums
```typescript
visibility: "public" | "amis" | "prive"
region: "montreal" | "quebec" | "gatineau" | "sherbrooke" | ...
user_role: "visitor" | "citoyen" | "moderator" | "founder" | "banned"
hive_id: "quebec" | "brazil" | "argentina" | "mexico"
credit_type: "karma" | "cash" | "legendary"
gift_type: "comete" | "feuille_erable" | "fleur_de_lys" | "feu" | "coeur_or"
```

### Core Tables
- `user_profiles` - Users with Quebec economy fields (karma_credits, cash_credits, bee_alias)
- `publications` - Posts with quebec_score and visibility
- `comments` - Discussion threads
- `reactions` - Engagement (likes, shares)
- `messages` - Direct messaging
- `transactions` - Hive economy operations
- `gifts` - Virtual gift system
- `tournaments` - Competitive events
- `colonies` - Group/community structures

### Custom Types
- `geometry(MultiPolygon, 4326)` - Geographic boundaries
- `vector(768)` - pgvector embeddings for AI/ML

## API Routes Structure

Backend routes in `backend/routes/`:

| Route File | Purpose |
|------------|---------|
| `ai.routes.ts` | AI endpoint orchestration |
| `tiguy.ts`, `tiguy-actions.ts` | Ti-Guy AI assistant |
| `hive.ts` | Hive economy transactions |
| `mux.ts` | Video upload and streaming |
| `moderation.ts` | Content moderation |
| `admin.ts` | Admin dashboard APIs |
| `studio.ts` | Creator studio features |
| `pexels.ts` | Stock media integration |
| `presence.ts` | Real-time user presence |
| `health.ts` | Health check endpoints |

## Quebec-Specific Conventions

### Language
- Primary language: **Quebec French (Joual)**
- All user-facing text must support French translations
- Ti-Guy AI enforces Quebec cultural compliance

### Design System ("The Soul")
- **Quebec Blue**: `#003399` primary color
- Gold accents for premium features
- Beaver emoji branding throughout

### Economy Terms
- **Karma** - Non-monetary reputation points
- **Piasses/Huards** - Virtual currency (cents)
- **Legendary Badges** - NFT-like Quebec heritage items

### Regional Targeting
Supported regions: Montreal, Quebec City, Gatineau, Sherbrooke, Trois-Rivières, Saguenay, Lévis, Terrebonne, Laval, Gaspésie

## AI Integration

### Ti-Guy Orchestrator (`backend/ai/orchestrator.ts`)
Central AI orchestration with tools for:
- Trend discovery (`searchTrendsTool`)
- Design validation (`validateDesignTool`)
- Quebec culture enforcement

### AI Model Priority
1. **DeepSeek V3** - Best cost/quality ($0.14/1M input tokens)
2. **Gemini 2.0 Flash** - Free tier, very fast
3. **Vertex AI** - Enterprise features
4. **Groq** - Speed-optimized

### Browser Automation (`zyeute-browser-automation/`)
Python FastAPI service for real-time trend scraping:
```bash
cd zyeute-browser-automation
uvicorn zyeute_automation_api:app --reload  # Port 8000
```

## Environment Variables

Key variables (see `.env.example` for full list):
```
DATABASE_URL              # PostgreSQL connection string
DIRECT_DATABASE_URL       # Direct connection (bypassing pooler)
SUPABASE_URL             # Supabase project URL
SUPABASE_ANON_KEY        # Supabase anonymous key
DEEPSEEK_API_KEY         # DeepSeek AI API key
GOOGLE_API_KEY           # Google/Gemini API key
MUX_TOKEN_ID             # Mux video API credentials
MUX_TOKEN_SECRET
STRIPE_SECRET_KEY        # Stripe payment processing
RESEND_API_KEY           # Email service
REDIS_URL                # Redis for BullMQ
```

## Testing Strategy

### E2E Test Suites (`tests/comprehensive/`)
1. `01-auth-flows.spec.ts` - Authentication
2. `02-social-features.spec.ts` - Social interactions
3. `03-messaging.spec.ts` - Real-time messaging
4. `04-media-content.spec.ts` - Video/image handling
5. `05-ai-features.spec.ts` - AI features
6. `06-payments.spec.ts` - Payment processing
7. `07-navigation.spec.ts` - Navigation flows
8. `08-accessibility.spec.ts` - A11y compliance

### Unit Tests
Located alongside source files or in `src/__tests__/`
Using Vitest with React Testing Library

## Deployment

### Platforms Supported
- **Vercel** - Frontend deployment (vercel.json)
- **Railway** - Full-stack deployment (railway.json)
- **Fly.io** - Container deployment (fly.toml)
- **Render** - Alternative hosting (render.yaml)

### Docker
```bash
docker-compose up  # Starts: zyeute-app (3000), zyeute-hands (8000), redis (6379)
```

### Build Output
- Frontend: `dist/public/` (Vite build)
- Backend: `dist/index.cjs` (esbuild bundle)

## Code Conventions

### TypeScript
- Strict mode enabled
- Use Zod schemas for runtime validation
- Prefer type inference where clear

### React Components
- Functional components with hooks
- Use React Query for server state
- Radix UI for accessible primitives

### Backend
- Express async error handling (`express-async-errors`)
- Rate limiting with `express-rate-limit`
- Drizzle ORM for database operations

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Routes: `kebab-case.ts`

## Important Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database schema (source of truth) |
| `backend/index.ts` | Express server entry point |
| `frontend/src/App.tsx` | React app entry |
| `vite.config.ts` | Vite configuration |
| `drizzle.config.ts` | ORM configuration |
| `playwright.config.ts` | E2E test configuration |
| `.env.example` | Environment template |
| `package.json` | Dependencies and scripts |

## Common Tasks

### Adding a New API Endpoint
1. Create route file in `backend/routes/`
2. Register in `backend/index.ts`
3. Add types if needed in `shared/`

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Update navigation if needed

### Database Schema Changes
1. Modify `shared/schema.ts`
2. Run `npm run db:push` or create migration
3. Update related Zod schemas if needed

### Adding AI Features
1. Use Ti-Guy orchestrator (`backend/ai/orchestrator.ts`)
2. Prefer DeepSeek for cost efficiency
3. Ensure Quebec cultural compliance

## Security Notes

- Supabase handles authentication (OAuth, email/password)
- WebAuthn biometric support available
- Content moderation with AI + manual review
- Rate limiting on all public endpoints
- CORS configured for production domains
- XSS protection via DOMPurify

## Troubleshooting

### Common Issues

**Database connection fails:**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Try `DIRECT_DATABASE_URL` for migrations

**Build fails with type errors:**
- Run `npm run check` to see all errors
- Check `tsconfig.json` paths

**Tests failing:**
- Run `npm run test:vitals` first for quick diagnostics
- Check if backend is running for E2E tests

**AI features not working:**
- Verify API keys in `.env`
- Check `backend/ai/` for specific service logs

## Resources

- [README.md](./README.md) - Quick start guide
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- [backend/ai/README.md](./backend/ai/README.md) - Ti-Guy documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
