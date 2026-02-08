# task_plan_COPI_001 – Ti-Guy In-App Copilot (Phase 1)

**Project:** Ti-Guy In-App Copilot (Phase 1)  
**Aesthetic:** Modern Voyageur / Noir & Gold  
**Status:** Initializing

## 1. Objective

Establish a lightweight, Joual-speaking AI assistant within the Zyeuté UI that handles basic navigation, design validation, and "Modern Voyageur" brand coaching.

## 2. Immediate Task List

- [ ] **Environment Sync:** Verify `external/copilotkit` is linked and the local dev environment recognizes the `zyeute-ui-ux` skill.
- [ ] **Context Injection:** Create a "Concise Brand Identity" prompt (max 500 tokens) for Ti-Guy to prevent expensive context-window bloat. See [concise_brand_identity_prompt.md](concise_brand_identity_prompt.md).
- [ ] **Tool Integration:**
  - Connect `validate_design` to the frontend preview.
  - Setup `get_help` tool to query local Markdown docs first (Local RAG) before hitting Vertex AI.
- [ ] **Bootstrap UI:** Implement a minimal "Gold Glow" floating action button (FAB) for Ti-Guy.

## 3. Resource Management (Bootstrap Mode)

| Resource   | Strategy                                              | Cost     |
|-----------|--------------------------------------------------------|----------|
| **Logic** | Run via local Ollama/Llama 3 for dev testing.          | $0       |
| **Styling** | Use existing `.shared/ui-ux-pro-max/` CSS variables. | $0       |
| **Credits** | Save Vertex AI credits for final "Joual" voice tuning. | Reserved |

## 4. Technical Guardrails

- **No Drift:** Ti-Guy must only suggest UI changes that align with "Leather and Gold" aesthetics.
- **Loi 25:** Ensure the copilot does not store personally identifiable information (PII) in chat logs during this phase.
