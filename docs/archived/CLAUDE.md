# CLAUDE.md - Zyeuté V5 AI Agent Guide

## Project Overview

**Zyeuté V5** is Quebec's premier French social media platform ("Le TikTok du Québec"). The platform emphasizes Quebec culture, French-Canadian language (Joual), and authentic community-focused content.

**Core Identity:**

- **Mission:** Build Quebec's digital sovereignty through a culturally authentic social platform
- **Locale:** `fr-CA` (French Canada) - UI text should reflect Quebec culture
- **Mascot:** Ti-Guy - The helpful AI assistant that uses Quebecois slang
- **Design:** Dark slate theme with gold accents, leather textures, Quebec Blue (#003DA5)

---

## Tech Stack

### Frontend

- **Framework:** React 19 + Vite 7 + TypeScript 5.9
- **Routing:** React Router DOM / Wouter
- **Styling:** Tailwind CSS 4, Radix UI, Framer Motion
- **State:** TanStack Query (React Query), React Context
- **Icons:** Lucide React

### Backend

- **Runtime:** Node.js 20, Express 5
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **Queue/Jobs:** BullMQ + Redis (for video processing)
- **Real-time:** Socket.IO
- **Auth:** Supabase Auth, Google OAuth

### AI/ML ("Trinity System")

- **Ti-Guy (Brain):** AI orchestrator using multi-tier routing
- **Hive Mind Router:** Cost-effective AI routing through:
  - Tier 1: Ollama Cloud + Groq (FREE)
  - Tier 2: Vertex AI / Gemini (GCP credits)
  - Tier 3: DeepSeek (Paid, optional)
- **Media Generation:** FAL.ai (Kling for video, Flux for images)
- **Content Moderation:** Vertex AI Vision

### Testing

- **Unit/Integration:** Vitest
- **E2E:** Playwright
- **Coverage Target:** 75% for critical paths

### Deployment

- **Frontend:** Vercel
- **Backend:** Railway
- **Video Storage:** Google Cloud Storage, Mux
- **CI/CD:** GitHub Actions

---

## Directory Structure

```
ZyeuteV5/
├── frontend/               # React application
│   └── src/
│       ├── App.tsx         # Main entry & routing
│       ├── components/     # UI components (13 subdirectories)
│       ├── contexts/       # React Context providers (Auth, Theme)
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       ├── services/       # API client & external services
│       └── utils/          # Helper functions
├── backend/                # Express server
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API endpoint definitions (77k+ lines)
│   ├── storage.ts          # Database & storage utilities
│   ├── ai/                 # AI/ML modules
│   │   ├── hive-router.ts  # Multi-tier AI routing
│   │   ├── orchestrator.ts # Ti-Guy AI orchestrator
│   │   ├── tiguy-personality.ts
│   │   └── vertex-service.ts
│   ├── workers/            # Background job processors
│   └── services/           # Business logic services
├── shared/                 # Shared code between frontend/backend
│   ├── schema.ts           # Drizzle ORM database schema
│   ├── constants.ts        # Shared constants
│   └── types/              # Shared TypeScript types
├── packages/               # Internal packages
│   └── kernel-node/        # Colony OS (AI swarm architecture)
├── tests/                  # E2E and integration tests
│   ├── comprehensive/      # Full feature tests
│   └── vital-signs/        # Health check tests
├── scripts/                # Utility scripts
│   ├── db-deploy.ts        # Database deployment
│   ├── test-trinity.ts     # Trinity system tests
│   └── verify-gcs-storage.ts
├── migrations/             # Drizzle database migrations
└── .github/                # GitHub workflows and templates
    └── workflows/          # CI/CD pipelines
```

---

## Key Commands

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server (tsx backend/index.ts)
npm run build        # Build for production (Vite + esbuild)
npm start            # Run production server
```

### Testing

```bash
npm test             # Run Vitest tests
npm run test:watch   # Watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run Playwright E2E tests
npm run test:ui      # Interactive Vitest UI
```

### Database

```bash
npm run db:push      # Push schema changes (drizzle-kit push)
npm run db:deploy    # Deploy database migrations
npm run db:seed      # Seed database with test data
npm run migrate      # Run migrations
```

### Quality Checks

```bash
npm run check        # TypeScript type checking
npm run lint         # ESLint + TypeScript checking
npm run format       # Prettier formatting
npm run preflight    # Full quality check (check + lint + build + test)
```

### Video/AI Workers

```bash
npm run worker:video # Start video processing worker
npm run worker       # Start general worker
```

---

## Code Conventions

### TypeScript

- Use **interfaces** over types for extendability
- Avoid enums; use `const` objects or literal unions
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- No `any` types - use proper typing
- Use the `function` keyword for pure functions

### React

- Functional components with hooks only (no class components)
- Use React Context for global state (Auth, Theme)
- Use TanStack Query for server state
- Wrap async components in `React.Suspense` with fallback UI
- Use `lazy()` for non-critical route code-splitting
- Always handle loading and error states - **NO WHITE SCREENS**

### File Naming

- **Directories:** lowercase with dashes (`components/auth-wizard`)
- **Components:** PascalCase (`AuthWizard.tsx`)
- **Utilities:** camelCase (`getUserData.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

### Styling

- Mobile-first responsive design with Tailwind CSS
- Use Radix UI for accessible components
- Use Framer Motion for animations (target 60fps)
- 9:16 portrait format for video content
- Dark mode default with leather overlay design

### API & Data Fetching

- Client must use `apiCall` helper from `frontend/src/services/api.ts`
- Do NOT import `@supabase/supabase-js` directly in UI components
- All `/api/*` routes go through backend Express server

---

## Database Schema

The schema is defined in `shared/schema.ts` using Drizzle ORM. Key tables:

- **users:** User accounts with roles (visitor, citoyen, moderator, founder)
- **publications:** Posts/content with visibility (public, amis, prive)
- **reactions, comments, shares:** Social interactions
- **gifts, transactions:** Virtual economy (karma, cash credits)
- **tournaments:** Competitive events
- **messages, conversations:** Direct messaging

### Quebec-Specific Enums

- **Regions:** montreal, quebec, gatineau, sherbrooke, etc.
- **Gift Types:** comete, feuille_erable, fleur_de_lys, feu, coeur_or
- **Hives:** quebec (fr-CA), brazil (pt-BR), argentina (es-AR), mexico (es-MX)

---

## AI/ML Integration

### Hive Mind Router (`backend/ai/hive-router.ts`)

Routes AI requests through cost-effective providers:

1. **Tier 1 (FREE):** Ollama Cloud, Groq
2. **Tier 2 (Credits):** Vertex AI, Gemini
3. **Tier 3 (Paid):** DeepSeek API

### Ti-Guy Orchestrator (`backend/ai/orchestrator.ts`)

Tools available:

- `searchTrendsTool` - Discover Quebec trends
- `validateDesignTool` - Validate UI for Quebec compliance
- `analyzeContentTool` - Content analysis with cultural scoring

### Browser Automation

Located in `zyeute-browser-automation/` - Python FastAPI service for trend discovery.

---

## Testing Requirements

### Coverage Targets

- **Critical paths (auth, payments):** 75% minimum
- **New features:** Must include tests before merge
- **Bug fixes:** Add regression tests

### Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ComponentName", () => {
  it("should do something specific", () => {
    // Arrange, Act, Assert
  });
});
```

### E2E Tests (Playwright)

- Located in `tests/comprehensive/`
- Covers: auth flows, social features, messaging, media, payments, navigation

---

## Commit & PR Conventions

### Commit Message Format

```
type: brief description

Types: feat, fix, docs, style, refactor, test, chore
```

Examples:

- `feat: Add guest mode browsing`
- `fix: Resolve Stripe.js loading issue`
- `docs: Update installation instructions`

### Pre-commit Hooks

Husky + lint-staged runs automatically:

- TypeScript type checking
- ESLint for code quality
- Prettier for formatting

### Pull Request Requirements

- Link related issues
- Include tests for new features
- Verify in Vercel preview deployment
- Maintain 75%+ coverage for critical paths
- Pass all CI checks

---

## Environment Variables

Key variables (see `.env.example` for full list):

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Payments
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_...

# AI (Multi-tier)
OLLAMA_API_KEY=...      # Tier 1 (FREE)
GROQ_API_KEY=gsk_...    # Tier 1 (FREE)
GEMINI_API_KEY=AIza...  # Tier 2 (Credits)
DEEPSEEK_API_KEY=sk-... # Tier 3 (Paid, optional)

# Video Processing
REDIS_URL=redis://...
GCS_BUCKET_NAME=zyeute-videos
MUX_TOKEN_ID=...
```

---

## Common Tasks

### Adding a New Feature

1. Create branch: `git checkout -b feature/feature-name`
2. Implement with tests
3. Run `npm run preflight` before committing
4. Submit PR with description

### Fixing a Bug

1. Create branch: `git checkout -b fix/bug-description`
2. Add regression test
3. Fix the bug
4. Verify with `npm run test`

### Database Changes

1. Modify `shared/schema.ts`
2. Run `npm run db:push` for development
3. Create migration for production: `drizzle-kit generate`

### Adding API Endpoint

1. Add route in `backend/routes.ts`
2. Create handler function
3. Add TypeScript types
4. Add integration tests

---

## CI/CD Workflows

Located in `.github/workflows/`:

- **ci.yml:** Main CI pipeline (lint, test, build)
- **test.yml:** Test suite execution
- **deploy-production.yml:** Production deployment
- **deploy-staging.yml:** Staging deployment
- **lighthouse.yml:** Performance testing
- **security.yml:** Security scanning
- **validate-quebec-compliance.yml:** Cultural compliance checks
- **db-backup.yml:** Database backups

---

## Quebec-Specific Guidelines

### Language

- Default locale: `fr-CA`
- Use Quebecois terminology:
  - "Jase" instead of "Chat"
  - "Zyeute" instead of "View"
  - "Piasse" for virtual currency
- Ti-Guy uses casual Joual slang (no metaphors)

### Design

- Quebec Blue: `#003DA5`
- Dark slate backgrounds
- Gold accents
- Leather textures
- 9:16 portrait format

### Cultural Scoring

Content is scored for Quebec relevance using the AI orchestrator.

---

## Health Checks

- **Readiness:** `GET /ready` - Checks DB connectivity and schema alignment
- **Telemetry:** `GET /momentum-telemetry` - Feed ranking metrics

---

## Troubleshooting

### White Screen Issues

- Always check for missing error/loading states
- Verify API endpoints are returning data
- Check browser console for errors

### Database Connection

- Verify `DATABASE_URL` is set correctly
- Check Supabase project is running
- Run `npm run check:env` to validate

### Build Failures

- Clear `node_modules` and reinstall
- Check TypeScript errors with `npm run check`
- Verify all imports resolve correctly

---

## Additional Resources

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Full contribution guidelines
- [QUICK_START.md](./QUICK_START.md) - Trinity system setup
- [AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md) - AI agent instructions
- [.cursorrules](./.cursorrules) - Cursor IDE rules
- [.github/README.md](./.github/README.md) - GitHub workflows documentation

---

_This document is the source of truth for AI agents working on Zyeuté V5._
_Made with care for Quebec | Fait avec soin pour le Québec_
