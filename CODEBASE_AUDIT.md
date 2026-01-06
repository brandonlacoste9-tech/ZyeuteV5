# Zyeute Codebase Audit Report

## 1. Executive Summary
The Zyeute codebase is a monorepo-style project consisting of a Node.js/Express backend and a React/Vite frontend. 

**Key Findings:**
- **Architecture**: Solid split between `backend` (Express) and `frontend` (Vite).
- **Dead Code**: A legacy `client/` directory exists and causes confusion.
- **Type Duplication**: Significant duplication between `shared/types.ts` and `frontend/src/schemas/common.ts`, leading to "compatibility hacks" for snake_case vs camelCase.
- **Testing**: Root-level tests in `src/__tests__` are importing from the dead `client/` directory.

## 2. Structural Map

### Major Modules
- **Backend** (`/backend`)
  - **Core**: `index.ts` (Entry), `routes.ts` (Router), `storage.ts` (Data Access).
  - **AI Engine**: `/backend/ai/` (Vertex AI, Python Bridge, Bees).
  - **Workers**: `/backend/workers/` (Video processing).
- **Frontend** (`/frontend`)
  - **Tech Stack**: Vite, React, Tailwind, ShadCN.
  - **State**: React Query, Context API.
- **Shared** (`/shared`)
  - Contains database schema (`schema.ts`) and TypeScript types (`types.ts`).
- **External/Auxiliary**
  - **Colony Kernel** (`/colony-kernel`): Python-based AI agent swarm (decoupled).
  - **Temp Hive** (`/temp_hive`): A separate Next.js project (status: experimental/proto).

## 3. Detailed Findings

### 🔴 Critical Cleanup (Dead Code)
1.  **`/client` Directory**: 
    - Contains 4 files (`HiveTap.tsx`, `ArcadeLobby.tsx`, etc.).
    - **Status**: Unused. Replaced by `frontend/`.
    - **Impact**: Confuses developers and breaks tests that import from it.
    - **Recommendation**: **DELETE**.

2.  **Root Tests (`/src/__tests__`)**:
    - Files like `integration/loginFlow.test.tsx` import from `client/src`.
    - **Status**: Broken/Legacy.
    - **Recommendation**: Migrate valid tests to `frontend/src/__tests__` and delete the folder.

### 🟡 Duplicate Logic & Technical Debt
1.  **Type Definitions & Casing Hell**:
    - **Problem**: Database uses `snake_case` (e.g., `user_id`). Frontend uses `camelCase` (e.g., `userId`).
    - **Current Fix**: `frontend/src/schemas/common.ts` manually handles both with lines like `userId: val.user_id || val.userId`.
    - **Recommendation**: implement a transformation layer (Zod or Drizzle) at the API boundary to strictly output camelCase to the frontend, removing the need for "Compat" fields in types.

2.  **Schema Duplication**:
    - `shared/types.ts` defines interfaces.
    - `frontend/src/schemas/common.ts` defines Zod schemas.
    - **Recommendation**: Move Zod schemas to `shared/` and infer TypeScript types from them. This ensures runtime validation matches compile-time types.

3.  **Inconsistent File Organization**:
    - `backend/api/debug.ts` exists but most routes are in `backend/routes/`.
    - `backend/temp.txt` is present.
    - **Recommendation**: Move `debug.ts` to `backend/routes/debug.ts` and delete temporary files.

### ⚪ Unconnected/Experimental
1.  **`temp_hive`**:
    - A full Next.js application nested in the repo.
    - **Recommendation**: Clarify purpose. If it's a separate app, move to a `packages/` or `apps/` directory if using a workspace manager (e.g., pnpm workspaces, Turborepo), or delete if abandoned.

## 4. Action Plan

### Step 1: Immediate Cleanup
- [ ] Delete `/client` directory.
- [ ] Delete `/backend/temp.txt`.
- [ ] Move `/backend/api/debug.ts` to `/backend/routes/debug.ts`.

### Step 2: Fix Tests
- [ ] Audit `src/__tests__`. Move valid tests to `frontend/src/__tests__`.
- [ ] Delete `src/__tests__`.

### Step 3: Architecture Refactor
- [ ] Move `frontend/src/schemas` to `shared/schemas`.
- [ ] Update imports in Backend and Frontend to use shared schemas.
- [ ] Implement consistent casing transformation.

