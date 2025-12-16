# Copilot Agent Instructions for Zyeuté V3 / Kryptotrac-xx

## 🏗️ Architecture & Major Components
- **Monorepo**: Contains Zyeuté (social/crypto app), Kryptotrac-xx (Next.js crypto tracker), and Colony OS (Python microservices).
- **Frontend**: React 18 + TypeScript (Vite), custom UI in `client/src/components` and `Kryptotrac-xx/components`.
- **Backend**: Node.js/Express (`server/`), Next.js API routes (`Kryptotrac-xx/app/api/`), Python microservices (`infrastructure/colony/bees/`).
- **Database**: Supabase (PostgreSQL, RLS), configured in `.env` and `Kryptotrac-xx/lib/supabase/`.
- **Payments**: Stripe integration in both JS and Python services.
- **AI/Agents**: Byterover MCP tools for knowledge storage/retrieval. Kryptotrac-xx uses Google Gemini API for AI assistant.

## 🚦 Critical Developer Workflows
- **Install**: `npm install` (root or Kryptotrac-xx), `pnpm install` (Kryptotrac-xx)
- **Dev Server**: `npm run dev` (Zyeuté), `pnpm dev` (Kryptotrac-xx)
- **Tests**: `npm test`, `npm run test:unit`, `npm run test:e2e`, `pnpm test` (Kryptotrac-xx)
- **Coverage**: `npm run test:coverage` (HTML report)
- **CI/CD**: GitHub Actions in `.github/workflows/` (test, security, Lighthouse, deploy)
- **Python Services**: `python3 -m venv venv && pip install -r requirements.txt` in `infrastructure/colony/`; run bees with `python3 bees/finance_bee.py`
- **Docker**: `docker-compose up -d` in `infrastructure/colony/` for all bees

## 🧩 Project Conventions & Patterns
- **Knowledge Management**: Always use `byterover-store-knowledge` after learning new patterns or completing tasks. Use `byterover-retrieve-knowledge` before starting new work or debugging.
- **Environment**: Use `.env` for Node/JS, `.env.colony` for Python bees, `.env.local` for Kryptotrac-xx. Never commit secrets.
- **Testing**: E2E tests in `test/e2e/` (Zyeuté) and `Kryptotrac-xx/tests/`. Use Vitest + React Testing Library. Python: `pytest` in `infrastructure/colony/bees/tests/`.
- **Accessibility**: Follow checklists in `BUTTON_A11Y_AUDIT.md` for all UI changes.
- **API**: JS: `/api/*` routes; Python bees: `/webhook`, `/scan`, `/health` endpoints.
- **Docs**: See `README.md`, `AUTH_AUDIT_LOG.md`, `MEDIA_TEST_PLAYBOOK.md`, `CONTRIBUTING.md` for standards and guides.

## 🔗 Key Files & Directories
- `client/src/components/`, `Kryptotrac-xx/components/` — UI components
- `server/`, `Kryptotrac-xx/app/api/` — backend/API logic
- `infrastructure/colony/bees/` — Python microservices (bees)
- `test/`, `Kryptotrac-xx/tests/` — test suites
- `.github/workflows/` — CI/CD configs
- `AUTH_AUDIT_LOG.md`, `BUTTON_A11Y_AUDIT.md`, `MEDIA_TEST_PLAYBOOK.md` — audit/playbooks

## 🛠️ Integration & Cross-Component Patterns
- **Supabase**: Used for auth and DB in both JS and Python. RLS policies enforced.
- **Stripe**: Payment logic in both Node/Express and Python bees. Webhooks handled in `/api/stripe/webhook` and `bees/finance_bee.py`.
- **AI/Agents**: Byterover MCP tools are mandatory for agentic workflows. Kryptotrac-xx uses Google Gemini for BB assistant.
- **Colony OS**: Microservices communicate via HTTP endpoints. Health checks: `python3 monitoring/check-health.py`.

## ⚡ Examples
- Add a new React component: place in `client/src/components/ui/` or `Kryptotrac-xx/components/ui/`.
- Add a new bee (Python microservice): create in `infrastructure/colony/bees/`, update `docker-compose.yml`.
- Add a new test: place in `test/` or `Kryptotrac-xx/tests/`, use Vitest or pytest as appropriate.

## 🚫 Anti-Patterns
- Do **not** bypass Byterover MCP knowledge tools for agentic work.
- Do **not** hardcode secrets; always use environment variables.
- Do **not** mix legacy Express session logic with Supabase auth (see `AUTH_AUDIT_LOG.md`).

---
For more, see `README.md`, `AGENTS.md`, and audit docs. When in doubt, retrieve knowledge before coding!
