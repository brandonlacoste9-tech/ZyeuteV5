# 🌍 GLOBAL EXPANSION ROADMAP

**Strategy:** " The Chameleon Core"
**Goal:** Infinite Regions, One Codebase.

---

## 🎭 THE FACE-CHANGING STRATEGY

We do not build 10 apps. We build **1 App** that changes its face.

### 1. The Chameleon Frontend (Web/App)

The application (`apps/web`) is a shapeshifter.
It detects its identity **at runtime** based on the environment or URL.

- **Host Detection:**
  - If user visits `zyeute.com` -> Load **QUEBEC_CONFIG**.
  - If user visits `conexao.br` -> Load **BRAZIL_CONFIG**.
  - If user visits `zarpado.ar` -> Load **ARGENTINA_CONFIG**.
  - If user visits `ritual.mx` -> Load **MEXICO_CONFIG**.

- **Zero-Build Deploy:**
  - We deploy the **SAME** Docker container to all regions.
  - The "Face" is just a JSON configuration loaded on startup.
  - **Benefit:** Fix a bug in the Chat? It is fixed for Mexico, Brazil, and Quebec instantly.

### 2. The Website vs The App

- **They are the same thing.**
- We use **PWA (Progressive Web App)** technology.
- **Mobile:** Users install it as an App icon. It feels native.
- **Desktop:** Users browse it as a high-end Website (`apps/web`).
- **Responsive Design:** The UI adapts to Phone, Tablet, and 4K Desktop automatically.

---

## 🗓️ EXECUTION PHASES

### Phase 1: The Foundation (Completed) ✅

- **Factory Pattern:** Created `AppConfig` schema.
- **Clones:** Generated QC, BR, AR, MX variations.
- **AI Brain:** Connected Python Vision for "Vibes".

### Phase 2: The Cleanup (Next 24h) 🧹

- **Refactor Repo:** Move to `apps/` and `packages/` structure (`CLOUD_ARCHITECTURE.md`).
- **Consolidate:** Remove legacy scripts. Clean `server/ai`.
- **Database:** Add `hive_id` to separate users by region.

### Phase 3: The Deployment (Cloud Ascension) ☁️

- **Containerize:** Create Dockerfiles for Web, API, and Cortex.
- **Deploy Core:** Launch the API and Database to the Cloud.
- **Deploy Faces:** Launch the Frontend to Vercel.

### Phase 4: The Marketing Launch 🚀

- **Quebec:** "Zyeuté - Le Social Premium."
- **Brazil:** "Conexão - O Ritmo do Brasil."
- **Argentina:** "Zarpado - Pasión Digital."
- **Mexico:** "Ritual - El Swarm Azteca."

---

## 🧠 THE BRAIN STRATEGY (Colony OS)

- **One Brain, Many Personalities.**
- The Python Kernel stays centralized.
- It receives requests: `{ image: "...", region: "MX" }`.
- It responds: `{ vibes: 90, caption: "Qué padre!" }`.
- The Brain gets smarter for _everyone_ every day.

**We are building a Global Empire with the engineering team of a startup.**
