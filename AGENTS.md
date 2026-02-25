[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including

## 1. `byterover-store-knowledge`

You `MUST` always use this tool when:

- Learning new patterns, APIs, or architectural decisions from the codebase
- Encountering error solutions or debugging techniques
- Finding reusable code patterns or utility functions
- Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`

You `MUST` always use this tool when:

- Starting any new task or implementation to gather relevant context
- Before making architectural decisions to understand existing patterns
- When debugging issues to check for previous solutions
- Working with unfamiliar parts of the codebase

## Cursor Cloud specific instructions

### Architecture

Monorepo with a single root `package.json`. Frontend lives in `frontend/`, backend in `backend/`, shared types in `shared/`. No separate `package.json` files in subdirectories.

### Running the dev server

- `npm run dev` starts Express backend (port 3000) which embeds Vite dev server in middleware mode (HMR via `/vite-hmr`).
- The backend gracefully degrades without `DATABASE_URL`, Redis, or any external service keys — it logs warnings but stays up and serves the frontend.
- A minimal `.env` file is needed (see `.env.example`). For local dev without a real DB, leave `DATABASE_URL=` empty; the server will 503 on DB-dependent API routes but the frontend renders.

### Key commands

- **Lint**: `npx tsc --noEmit` (TypeScript) and `npx eslint --ignore-pattern '_archive/**' .` (ESLint — the `_archive/` directory has a stale config referencing `eslint-config-next` which is not installed).
- **Test**: `npm test` runs Vitest. Some pre-existing test failures exist (French label mismatches, `fast-check` API changes).
- **Build**: `npx vite build` builds frontend to `dist/public/`.
- **Full preflight**: `npm run preflight` chains `check`, `lint`, `build`, `test`.

### Gotchas

- ESLint fails if you run it without excluding `_archive/` because `_archive/temp_hive/eslint.config.mjs` imports `eslint-config-next` which isn't installed. Use `--ignore-pattern '_archive/**'` or the `npm run lint` script (which only processes `*.{ts,tsx}` files).
- The `prepare` script in `package.json` runs Husky on `npm install` — this is fine and sets up the pre-commit hook.
- Vite's root is `frontend/` (configured in `vite.config.ts`), so `index.html` lives at `frontend/index.html`.
- The backend loads `.env` then `.env.local` via `dotenv` in `backend/preload.ts`.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including

## 1. `byterover-store-knowledge`

You `MUST` always use this tool when:

- Learning new patterns, APIs, or architectural decisions from the codebase
- Encountering error solutions or debugging techniques
- Finding reusable code patterns or utility functions
- Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`

You `MUST` always use this tool when:

- Starting any new task or implementation to gather relevant context
- Before making architectural decisions to understand existing patterns
- When debugging issues to check for previous solutions
- Working with unfamiliar parts of the codebase
