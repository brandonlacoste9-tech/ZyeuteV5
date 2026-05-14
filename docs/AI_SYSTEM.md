# Zyeuté AI Ecosystem Standards

This document centralizes the configuration standards for the various AI tools used in the Zyeuté project.

## 🤖 AI Tools & Configs

The project currently uses several AI assistants and automation tools. To maintain consistency, follow these standards:

### 1. Cursor (`.cursor/`)
- **Rules**: Located in `.cursor/rules/`.
- **Primary Rule**: `antigravity-session.mdc` - Defines the session context and personality.
- **Skills**: Ecosystem-specific skills are in `.cursor/skills/`.

### 2. Claude (`.claude/`)
- **Skills**: Project-specific skills (deploy, cache-clear, etc.) are in `.claude/skills/`.
- **Quick Start**: `.claude/QUICK_START.md`.

### 3. Gemini (`.gemini/`)
- **System Prompt**: `.gemini/system.md`.

### 4. Genkit (`.genkit/`)
- Used for Firebase/Google Cloud AI integration.

### 5. Custom Rules (`.clinerules/`)
- Standard rules for CLI-based agents.

---

## 🛠 Unified Prompting Standards

When prompting any AI agent in this repository, keep the following "Quebec-First" principles in mind:

1. **Language**: Prefer French (Quebec) for UI strings and user-facing content. Use "Joual" sparingly but effectively for authenticity.
2. **Branding**: Use the "Antique Gold" (`#C9A227`) and "Rich Leather" (`#1A0F0A`) palette.
3. **Icons**: Use the Fleur-de-lys (⚜️) and Bee (🐝) emblems where appropriate.
4. **Data Security**: Never hardcode secrets. Always use `process.env`.
5. **Performance**: Prioritize Vite/Rollup optimizations and efficient database queries (Drizzle).

---

## 🔄 Consolidation Strategy

To avoid fragmentation:
- **Centralize Knowledge**: Store core architecture details in `docs/` and link to them from tool-specific configs.
- **Shared Skills**: When possible, implement logic as standalone scripts in `scripts/` that can be called by any AI tool (Claude, Cursor, etc.).
- **Consistent Context**: Ensure all `.cursorrules`, `.clinerules`, and `.gemini/system.md` share the same high-level project definition.
