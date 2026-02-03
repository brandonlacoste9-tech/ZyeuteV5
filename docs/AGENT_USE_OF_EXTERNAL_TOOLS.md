# How the agent uses external tools & skills

The following repos are cloned under `external/`. **I (the AI agent) can use them** by reading their files, running their scripts/CLIs when applicable, and applying their patterns in this codebase.

## Layout (after running `scripts/setup-external-tools.ps1` or `.sh`)

| Path                                      | Repo                           | How I use it                                                                                                                                   |
| ----------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `external/browser-use`                    | browser-use                    | Browser automation: read README/docs and Python APIs; run or integrate for E2E/agent-driven browsing.                                          |
| `external/antigravity-awesome-skills`     | antigravity-awesome-skills     | **Skills**: read `skills/**/SKILL.md` and `docs/` for patterns; apply when the task matches (e.g. agent-evaluation, UI/UX, workflow, writing). |
| `external/planning-with-files`            | planning-with-files            | Planning workflows using files: read and apply planning patterns when user asks for plans or file-based workflows.                             |
| `external/antigravity-manager`            | Antigravity-Manager            | Manager/orchestration: read docs and code for Antigravity patterns; use when coordinating agents or tasks.                                     |
| `external/ui-ux-pro-max-skill-external`   | ui-ux-pro-max-skill            | UI/UX skill (upstream): read SKILL.md and rules; use for UI/UX tasks alongside existing `ui-ux-pro-max-skill/` in this repo.                   |
| `external/copilotkit`                     | CopilotKit                     | In-app copilot: read integration docs and examples; use when adding or improving AI chat/copilot in the app.                                   |
| `external/antigravity-workspace-template` | antigravity-workspace-template | Workspace template: read for project layout and conventions; apply when structuring or documenting the workspace.                              |

## When to use what

- **Browser automation / E2E** → `external/browser-use` (APIs, examples, run scripts if needed).
- **Agent skills (evaluation, orchestration, writing, UI, etc.)** → `external/antigravity-awesome-skills/skills/` and `docs/`.
- **Planning with files / task breakdown** → `external/planning-with-files`.
- **Antigravity ecosystem (manager, workspace)** → `external/antigravity-manager`, `external/antigravity-workspace-template`.
- **UI/UX guidance** → `external/ui-ux-pro-max-skill-external` or in-repo `ui-ux-pro-max-skill/`.
- **In-app AI copilot** → `external/copilotkit` (integration patterns, components).

## Incomplete clone

If `external/copilotkit` or `external/antigravity-workspace-template` are missing or partial, run the setup script again:

- **Windows:** `powershell -ExecutionPolicy Bypass -File scripts\setup-external-tools.ps1`
- **Bash:** `bash scripts/setup-external-tools.sh`

Then `git pull` in any existing `external/*` dir to update.
