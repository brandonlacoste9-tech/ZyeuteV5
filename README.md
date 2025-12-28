# Zyeuté V5 - Le Réseau Social du Québec ⚜️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)](https://vitejs.dev/)

> **"Branché sur le monde, enraciné ici."**

Zyeuté V5 is the evolution of Quebec's digital sovereignty. It combines a modern, high-performance social feed with the advanced **Colony OS** AI swarm architecture, tailored specifically for the Francophone community.

---

## 🚀 Quick Start for AI Agents & Developers

**AI Agents:** Please read **[AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md)** first. This contains your "Core Directive".

### Installation

```bash
# Clone the repository
git clone https://github.com/brandonlacoste9-tech/ZyeuteV5.git
cd ZyeuteV5

# Install dependencies (Monorepo)
npm install

# Start Development Server
npm run dev
```

The app will start at `http://localhost:3000`.

---

## 🌟 Key Features

### 1. Social Core (Le Feed)

- **High-Fidelity Video:** 4K/60fps support with smart adaptive streaming.
- **Stories:** Ephemeral content with rich creative tools.
- **Live Streaming:** Real-time broadcast capabilities.
- **Gamification:** "Ti-Points" and Achievements system.

### 2. Colony OS (The AI Brain) 🧠

- **Swarm Intelligence:** A network of specialized AI "Bees" (Research, Code, Audit) that maintain and evolve the platform.
- **Ti-Guy Assistant:** The user-facing persona of the swarm, speaking authentic Quebec French.
- **Auto-Healing:** The platform can detect and patch its own errors.

### 3. Creator Economy

- **Virtual Gifts:** Direct monetization for creators.
- **Marketplace:** Buy/Sell digital assets.

---

## 🛠 Tech Stack

- **Frontend:** React 18, Tailwind CSS, Framer Motion.
- **Backend:** Node.js, Express, BullMQ (Redis Queues).
- **Database:** PostgreSQL (Supabase).
- **Architecture:** Monorepo with `client`, `server`, and `packages`.

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Workflow

```bash
# Fork and clone the repository
git clone https://github.com/{YOUR_USERNAME}/ZyeuteV5.git
cd ZyeuteV5

# Install dependencies (sets up pre-commit hooks automatically)
npm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm run check    # TypeScript check
npm run lint     # Linting
npm run test     # Run tests
npm run build    # Build verification

# Commit (pre-commit hooks will run automatically)
git add .
git commit -m "feat: your feature description"

# Push and create Pull Request
git push origin feature/your-feature-name
```

### Pre-commit Checks

This project uses Husky and lint-staged to ensure code quality:
- ✅ TypeScript type checking
- ✅ ESLint for code standards
- ✅ Prettier for consistent formatting

### Vercel Deployment & Preview

- **Production:** Automatically deployed from `main` branch
- **Preview Deployments:** Created automatically for every PR
- **Contributors:** Must test preview deployments before requesting review

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment information.

---

## 📦 Deployment

### Vercel (Recommended)

Zyeuté V5 is optimized for Vercel deployment with automated preview deployments for PRs.

**Environment Variables Required:**
See `.env.vercel.example` for the complete list. Key variables include:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`

**Deployment Configuration:**
- Build caching enabled for faster deployments
- Preview deployments mandatory for all PRs
- Automatic deployment from `main` branch to production

**Quick Deploy:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/brandonlacoste9-tech/ZyeuteV5)

---

_Verified & Deployed by Antigravity Agents._
