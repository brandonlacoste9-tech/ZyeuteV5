# External Tools & Skills – Reference

All listed repos are cloned under `external/` and **the agent is configured to use them** (see `.cursorrules` §6 and `docs/AGENT_USE_OF_EXTERNAL_TOOLS.md`).

| Repo                                                                                          | Local path                                | Purpose                                              |
| --------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| [browser-use](https://github.com/browser-use/browser-use)                                     | `external/browser-use`                    | Browser automation (E2E, agent-driven browsing).     |
| [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)           | `external/antigravity-awesome-skills`     | Skills: agent evaluation, UI/UX, writing, workflows. |
| [planning-with-files](https://github.com/OthmanAdi/planning-with-files)                       | `external/planning-with-files`            | Planning workflows using files.                      |
| [Antigravity-Manager](https://github.com/lbjlaq/Antigravity-Manager)                          | `external/antigravity-manager`            | Manager/orchestration for Antigravity.               |
| [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)                | `external/ui-ux-pro-max-skill-external`   | UI/UX Pro Max skill (upstream).                      |
| [CopilotKit](https://github.com/CopilotKit/CopilotKit)                                        | `external/copilotkit`                     | Copilot framework for in-app AI assistants.          |
| [antigravity-workspace-template](https://github.com/study8677/antigravity-workspace-template) | `external/antigravity-workspace-template` | Workspace template.                                  |

## One-time setup

Run once to clone all repos (or to add any that are missing):

- **Windows:** `powershell -ExecutionPolicy Bypass -File scripts\setup-external-tools.ps1`
- **Bash:** `bash scripts/setup-external-tools.sh`

To update an existing clone: `cd external/<dir> && git pull`.
