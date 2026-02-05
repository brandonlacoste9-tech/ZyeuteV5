---
name: antigravity-ecosystem
description: Maps the Zyeuté/Antigravity ecosystem; ZyeuteV5-specific paths and Voyageur. Use when the user asks which repo to use, how to install or reference these tools, or when implementing browser automation, agent skills, planning workflows, UI/UX design, in-app copilots, or workspace setup.
---

# Antigravity Ecosystem Skill (ZyeuteV5)

This skill tells the agent **where to find** and **when to use** the seven core repos, and **how they map to this project**.

## In this project (ZyeuteV5)

- **UI/UX data (Voyageur Luxury):** `.shared/ui-ux-pro-max/` — colors, styles, typography, design data. Design rules: `.cursorrules` §4 (9:16, dark slate, gold, leather, Framer Motion).
- **External repos (optional):** `external/` — populated by `scripts/setup-external-tools.ps1` (Windows) or `scripts/setup-external-tools.sh`. If `external/` is missing, use the table below and clone URLs from [reference.md](reference.md).
- **Session rule:** `.cursor/rules/antigravity-session.mdc` — references `external/` for awesome-skills, Manager, ui-ux-pro-max, CopilotKit, planning-with-files, workspace-template. When `external/` exists, prefer those paths.

## When to use which repo

| User intent | Use this | Where it lives / how to get it |
|-------------|----------|--------------------------------|
| **Browser automation** | **browser-use** | `https://github.com/browser-use/browser-use` — Python, `uv add browser-use`. In-repo: `zyeute-browser-automation/`. |
| **Agent skills catalog** (600+ skills) | **antigravity-awesome-skills** | Clone to `external/antigravity-awesome-skills` (run setup script) or `~/.cursor/skills/`; see CATALOG.md, docs/BUNDLES.md. |
| **Planning with files** (task_plan.md, findings.md) | **planning-with-files** | Clone to `external/planning-with-files` or `.cursor/skills/planning-with-files`. |
| **Account manager & API proxy** | **Antigravity-Manager** | `https://github.com/lbjlaq/Antigravity-Manager` — Tauri, Docker/Homebrew/Releases. |
| **UI/UX design (Voyageur, design systems)** | **ui-ux-pro-max-skill** | In-repo: `.shared/ui-ux-pro-max/` (data). Upstream: `external/ui-ux-pro-max-skill-external` or `uipro init --ai cursor`. Use with `.cursorrules` §4. |
| **In-app copilot / agent UI** | **CopilotKit** | `https://github.com/CopilotKit/CopilotKit` — `npx copilotkit@latest init`; see docs. |
| **Workspace template** | **antigravity-workspace-template** | Clone to `external/antigravity-workspace-template`; `.cursorrules`, MCP, tools. |

## Quick decision flow

1. **"Which repo for X?"** → Table above. In ZyeuteV5, UI data is in `.shared/ui-ux-pro-max/`; run setup script for `external/` if you need full skill repos.
2. **Voyageur / 9:16 / dark slate / gold:** Use `.cursorrules` §4 and `.shared/ui-ux-pro-max/`; for full design-system generation see upstream ui-ux-pro-max-skill.
3. **Red-Team / security:** Use Red-Team skills from antigravity-awesome-skills (in `external/` or global) in a safe, controlled way only.
4. **Mad Ass / strict architecture:** Follow Antigravity Manager rules when user asks; see `external/antigravity-manager` if present.

## Installation (one-liners)

- **browser-use:** `uv add browser-use` then `uvx browser-use install`.
- **antigravity-awesome-skills:** `npx antigravity-awesome-skills --cursor` or clone into `external/antigravity-awesome-skills` via `scripts/setup-external-tools.ps1`.
- **planning-with-files:** Copy from repo into `.cursor/skills/planning-with-files` or `external/planning-with-files`.
- **ui-ux-pro-max:** In-repo data in `.shared/ui-ux-pro-max/`; full skill: `npm install -g uipro-cli` then `uipro init --ai cursor`.
- **CopilotKit:** `npx copilotkit@latest init`.
- **Populate external/ in ZyeuteV5:** `scripts/setup-external-tools.ps1` (Windows) or `scripts/setup-external-tools.sh`.

## Additional resources

- Full repo list and clone URLs: [reference.md](reference.md)
- Project rules: `.cursorrules` §6 (external tools), `.cursor/rules/antigravity-session.mdc`
