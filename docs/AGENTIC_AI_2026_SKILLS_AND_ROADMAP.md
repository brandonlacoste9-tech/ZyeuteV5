# Skills, Tools and Agentic AI Roadmap for Zyeute (2026)

Summary of **Cursor skills and tools** for this project and **what to implement** for agentic AI on this French (Quebecois) social media site.

---

## 1. Skills to use

| Skill | Where | When |
|-------|--------|------|
| **antigravity-ecosystem** | Global + `.cursor/skills/antigravity-ecosystem/` | Repo choice; Zyeute paths, Voyageur |
| **ai-engineer** | Global | Ti-Guy, RAG, bees, GenAI App Builder/FAL/DeepSeek |
| **frontend-developer** | Global | React/Vite/Tailwind, 9:16 Voyageur, a11y |
| **prompt-engineer** | Global | Ti-Guy prompts, Joual, Quebec compliance |
| **planning-with-files** | Add `.cursor/skills/planning-with-files/` | Big features, refactors; task_plan.md |
| **zyeute-ui-ux** (optional) | Add `.cursor/skills/zyeute-ui-ux/SKILL.md` | Voyageur + `.shared/ui-ux-pro-max/` |

---

## 2. Tools

- **external/** – Run `scripts/setup-external-tools.ps1` (or .sh) for CopilotKit, awesome-skills, planning-with-files, etc.
- **Browser-use** – E2E / agent browser; `zyeute-browser-automation/` or `external/browser-use`.
- **MCP** (optional) – Supabase or custom backend health/explore.
- **Ti-Guy tools** – `validate_design`, `search_trends`, `analyze_competitor` in pre-commit/CI.

---

## 3. Existing agentic building blocks

- Ti-Guy: orchestrator, bees (moderation, post-composer, voice, video, image, memory-miner, quebec-specialists), cores.
- Frontend: LaZyeute, TiGuy chat, ChatModal, TiGuyInsight, Colony bridge, AIStudio.
- No CopilotKit yet – Ti-Guy is request/response only.

---

## 4. What to implement (2026-style agentic)

### 4.1 In-app agentic copilot (Ti-Guy as agent)

Copilot that *does* things: suggest captions, validate design, search trends, get help. Use **CopilotKit**; expose Ti-Guy + tools (`validate_design`, `search_trends`, `get_help`, `suggest_caption`). French/Joual tone.

### 4.2 RAG for help/FAQ (French)

Users ask in French; agent answers from FAQ, guidelines, Loi 25. GenAI App Builder or other vector store; Ti-Guy or support bee; cite sources. See `docs/VERTEX_AI_SEARCH_DATA_STORE_SETUP.md` if you have Vertex; otherwise use Gemini/App Builder within $1300 credit.

### 4.3 Agentic moderation pipeline

Beyond rules: agent interprets context and Quebec norms; generates short French explanation for flags/takedowns; optional human-in-the-loop.

### 4.4 Creator agents (suggestions + scoring)

Before/after post: suggest caption, hashtags, cultural score, "how to make this more Quebec". Expose bees in Studio and post-composer.

### 4.5 Planning-with-files for big features

For "add copilot" or "RAG help": agent breaks into steps, task_plan.md, findings.md, progress.md. Add planning-with-files skill to repo.

### 4.6 Voice Ti-Guy (accessibility)

Voice layer for navigation/summaries/support. Reuse voice-bee; Quebec French voice (e.g. ElevenLabs); short scripts.

### 4.7 Compliance auditor (Red-Team safe)

On-demand or scheduled check: Quebec compliance, wording, design, Loi 25, a11y. Use Red-Team skills from awesome-skills in controlled way; `validate_design` in CI.

---

## 5. Suggested order

1. Populate `external/`; add planning-with-files skill.
2. In-app copilot (CopilotKit + Ti-Guy tools).
3. RAG help/FAQ (French); plug into copilot get_help.
4. Creator suggestions + cultural score in Studio.
5. Moderation explanations (French).
6. Voice Ti-Guy.
7. Compliance auditor.

---

## 6. Recap

**Skills**: antigravity-ecosystem, ai-engineer, frontend-developer, prompt-engineer; add planning-with-files (and optionally zyeute-ui-ux). **Tools**: external/ script, optional browser-use and MCP. **2026**: In-app copilot with Ti-Guy tools, then RAG help, creator agents, moderation explanations, voice Ti-Guy, compliance auditor; use planning-with-files for each big feature.
