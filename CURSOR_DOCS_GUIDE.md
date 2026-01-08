# Cursor @Docs Indexing Guide

This guide lists all recommended documentation URLs to add to Cursor's @Docs feature. This ensures Cursor has access to the latest library documentation, preventing hallucination of deprecated syntax.

## How to Add Documentation

1. Type `@Docs` in Cursor chat
2. Select "Add new doc"
3. Paste the URL from the list below
4. Click "Index"

---

## 🎯 **Critical Backend Libraries** (Add These First)

### **TypeScript/Node.js Core**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **Drizzle ORM** | `https://orm.drizzle.team/docs/overview` | ⭐⭐⭐⭐⭐ | Main database ORM - syntax changes frequently |
| **Express.js** | `https://expressjs.com/en/api.html` | ⭐⭐⭐⭐⭐ | Backend framework - always evolving |
| **Socket.io** | `https://socket.io/docs/v4/` | ⭐⭐⭐⭐⭐ | Synapse Bridge communication |
| **BullMQ** | `https://docs.bullmq.io/` | ⭐⭐⭐⭐ | Job queue for video processing |
| **Zod** | `https://zod.dev/` | ⭐⭐⭐⭐ | Runtime validation schema |
| **pg (node-postgres)** | `https://node-postgres.com/` | ⭐⭐⭐ | Direct PostgreSQL client |

### **AI & ML Services**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **Google Cloud Vertex AI** | `https://cloud.google.com/vertex-ai/docs` | ⭐⭐⭐⭐⭐ | Main AI service - API changes frequently |
| **@google-cloud/vertexai** | `https://cloud.google.com/nodejs/docs/reference/aiplatform/latest` | ⭐⭐⭐⭐⭐ | TypeScript SDK for Vertex AI |
| **DeepSeek API** | `https://platform.deepseek.com/api-docs/` | ⭐⭐⭐⭐ | Fallback AI service |
| **@fal-ai/client** | `https://fal.ai/docs` | ⭐⭐⭐ | FAL AI image generation |

### **Python Bridge Services**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **FastAPI** | `https://fastapi.tiangolo.com/` | ⭐⭐⭐⭐⭐ | Python bridge service framework |
| **Uvicorn** | `https://www.uvicorn.org/` | ⭐⭐⭐ | ASGI server for FastAPI |
| **Pydantic** | `https://docs.pydantic.dev/` | ⭐⭐⭐⭐ | Data validation for Python bridge |
| **Windows-Use** | `https://github.com/CursorTouch/Windows-Use` | ⭐⭐⭐⭐⭐ | Custom automation library - add repo README |
| **psutil** | `https://psutil.readthedocs.io/` | ⭐⭐⭐ | System monitoring in Python bridge |

---

## 🎨 **Frontend Libraries**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **React** | `https://react.dev/` | ⭐⭐⭐⭐⭐ | Core frontend framework |
| **TanStack Query** | `https://tanstack.com/query/latest` | ⭐⭐⭐⭐⭐ | Server state management - frequent updates |
| **React Router** | `https://reactrouter.com/` | ⭐⭐⭐⭐ | Client-side routing |
| **Tailwind CSS** | `https://tailwindcss.com/docs` | ⭐⭐⭐⭐⭐ | Styling - syntax changes |
| **ShadCN UI** | `https://ui.shadcn.com/` | ⭐⭐⭐⭐⭐ | Component library - frequently updated |
| **Framer Motion** | `https://www.framer.com/motion/` | ⭐⭐⭐ | Animation library for vertical feed |
| **lucide-react** | `https://lucide.dev/guide/packages/lucide-react` | ⭐⭐⭐ | Icon library |

---

## 🗄️ **Database & Storage**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **Supabase** | `https://supabase.com/docs` | ⭐⭐⭐⭐⭐ | Database, auth, storage - constantly evolving |
| **Supabase JavaScript Client** | `https://supabase.com/docs/reference/javascript` | ⭐⭐⭐⭐⭐ | TypeScript SDK syntax |
| **Supabase Storage** | `https://supabase.com/docs/guides/storage` | ⭐⭐⭐⭐ | Video/image upload patterns |

---

## 🔧 **Infrastructure & Tools**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **Vite** | `https://vite.dev/guide/` | ⭐⭐⭐⭐ | Build tool - config changes |
| **TypeScript** | `https://www.typescriptlang.org/docs/` | ⭐⭐⭐⭐⭐ | Language reference |
| **Node.js** | `https://nodejs.org/docs/latest/api/` | ⭐⭐⭐⭐ | Runtime API reference |
| **Redis** | `https://redis.io/docs/` | ⭐⭐⭐ | BullMQ dependency |

---

## 🧪 **Testing & Development**

| Library | Documentation URL | Priority | Why |
|---------|-------------------|----------|-----|
| **Vitest** | `https://vitest.dev/` | ⭐⭐⭐ | Testing framework |
| **Playwright** | `https://playwright.dev/` | ⭐⭐⭐ | E2E testing (if used) |

---

## 🚀 **Quick Add Script**

For convenience, here's a formatted list you can copy-paste one at a time:

### Backend Priority (Add These First)
```
https://orm.drizzle.team/docs/overview
https://expressjs.com/en/api.html
https://socket.io/docs/v4/
https://cloud.google.com/vertex-ai/docs
https://cloud.google.com/nodejs/docs/reference/aiplatform/latest
https://fastapi.tiangolo.com/
https://supabase.com/docs
https://supabase.com/docs/reference/javascript
```

### Frontend Priority
```
https://react.dev/
https://tanstack.com/query/latest
https://tailwindcss.com/docs
https://ui.shadcn.com/
https://reactrouter.com/
```

### Python Bridge
```
https://fastapi.tiangolo.com/
https://docs.pydantic.dev/
https://www.uvicorn.org/
```

---

## 📋 **Recommended Order of Addition**

1. **First**: Drizzle ORM, Express, Supabase (core backend)
2. **Second**: Vertex AI, Socket.io (critical integrations)
3. **Third**: TanStack Query, React, Tailwind (frontend foundation)
4. **Fourth**: FastAPI, Pydantic (Python bridge)
5. **Fifth**: Remaining libraries as needed

---

## 🔍 **How to Verify @Docs Are Working**

After adding docs, test by asking Cursor:
- "Using @Drizzle ORM, show me the transaction syntax"
- "What's the latest FastAPI response model pattern?"
- "Using @Supabase, what's the correct way to enable RLS?"

If Cursor provides up-to-date syntax matching the official docs, @Docs is working correctly!

---

## 💡 **Pro Tips**

1. **Index main docs, not sub-pages**: Index `https://orm.drizzle.team/docs/overview` instead of specific pages
2. **Update periodically**: Re-index docs quarterly to catch new releases
3. **Prioritize actively developed libraries**: Focus on Drizzle, TanStack Query, Supabase first
4. **Add custom repos**: For Windows-Use, index the GitHub repo's README.md URL directly

---

## 🔗 **Windows-Use Custom Documentation**

Since Windows-Use is a custom library, add:
- GitHub README: `https://github.com/CursorTouch/Windows-Use/blob/main/README.md`
- Or clone the repo locally and reference it in Cursor settings

---

**Last Updated**: 2024-01-XX
**Total Libraries**: 25+
**Estimated Indexing Time**: 10-15 minutes
