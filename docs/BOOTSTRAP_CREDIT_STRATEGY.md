# Bootstrap Credit Strategy (Lean Runway)

Keep the Zyeuté ecosystem agile while revenue is on-deck: local-first where possible, credits reserved for high-value production.

## Core principle

**Compute is currency.** If a task can be done with a regex or a local script, don't send it to the LLM. Save the "brains" for the Joual voice and the in-app experience.

---

## Phase A: Credit moat (Month 1–3)

- **GenAI App Builder (Google):** Use your **$1300 credit** only for high-value production:
  - RAG knowledge base (French help/FAQ).
  - Voice Ti-Guy layer (Joual, user-facing).
  - In-app Ti-Guy copilot (build Ti-Guy for free within this credit).
- **Small Bee protocol:** For coding assistance and simple unit tests, use **local LLMs** (Ollama, Llama 3, Mistral) on your machine. Keeps the $1300 for the app, not dev-time.
- **AGENT_MODE:** When Ollama is running (e.g. port 11434), set `AGENT_MODE=Hybrid` so small tasks use local; heavy tasks (RAG, voice) use GenAI App Builder when needed.

---

## Phase B: Conciseness and token management

- **Prompt caching:** Cache the "Modern Voyageur" / brand identity (e.g. [docs/planning/concise_brand_identity_prompt.md](planning/concise_brand_identity_prompt.md)) so the LLM doesn't re-read the full doc every call. One short system block, reused.
- **Agentic pruning:** Ti-Guy should only activate when explicitly triggered (e.g. FAB, "ask Ti-Guy", or `zyeute-ui-ux` tag). No background polling or always-on context; prevents token drain.

---

## Phase C: Revenue seed (when ready)

- **Noir & Gold marketplace:** Beta access / Founder's Swarm pack before full social launch.
- **Loi 25 Compliance-as-a-Service:** The Compliance Auditor (Quebec wording, design, Loi 25, a11y) can be licensed to other Quebec startups as a B2B product.

---

## Summary

| When              | Use                          | Cost      |
|-------------------|------------------------------|-----------|
| Dev / small tasks | Local Ollama (or similar)    | $0        |
| Production RAG    | GenAI App Builder / Gemini   | $1300 credit |
| Production voice  | GenAI App Builder (Joual)    | $1300 credit |
| UI / styling      | `.shared/ui-ux-pro-max/`     | $0        |

Stay lean until revenue; then expand compute where it pays off.
