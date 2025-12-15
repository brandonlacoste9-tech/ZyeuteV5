# 🏷️ Issue Labels for Zyeuté V3

This document defines the standardized labels used for issue tracking and audit triage in the Zyeuté V3 repository.

## 📊 Label Categories

### Priority Labels (Audit Triage System)

| Label | Color | Description | SLA |
|-------|-------|-------------|-----|
| `critical` | `#B60205` 🔴 | Production broken, revenue blocked, security critical | 24 hours |
| `high` | `#D93F0B` 🟠 | Major feature broken, significant user impact | 3-5 days |
| `medium` | `#FBCA04` 🟡 | Feature partially broken, moderate impact | 1-2 weeks |
| `low` | `#0E8A16` 🟢 | Minor issues, cosmetic, nice-to-have | 3-4 weeks |

### Effort Estimation Labels

| Label | Color | Description |
|-------|-------|-------------|
| `effort/1h` | `#C2E0C6` | Quick fixes, 30min - 1 hour |
| `effort/2-4h` | `#BFD4F2` | Small changes, 1-4 hours |
| `effort/4-8h` | `#D4C5F9` | Medium complexity, 4-8 hours |
| `effort/8h+` | `#F9C5D5` | Complex, 8+ hours |

### Type Labels

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#D73A4A` | Something isn't working |
| `feature` | `#A2EEEF` | New feature or enhancement |
| `security` | `#D93F0B` | Security vulnerability |
| `refactor` | `#5319E7` | Code improvement, no functionality change |
| `enhancement` | `#84B6EB` | Improvement to existing feature |
| `documentation` | `#0075CA` | Documentation improvements |
| `testing` | `#1D76DB` | Test coverage, test infrastructure |

### Status Labels

| Label | Color | Description |
|-------|-------|-------------|
| `backlog` | `#EDEDED` | Identified but not yet prioritized |
| `ready` | `#C2E0C6` | Prioritized and ready to work |
| `in-progress` | `#FBCA04` | Currently being developed |
| `review` | `#D4C5F9` | In code review or testing |
| `blocked` | `#B60205` | Cannot proceed due to dependencies |
| `needs-triage` | `#FEF2C0` | Needs review and prioritization |
| `wontfix` | `#FFFFFF` | Won't be fixed/implemented |

### Audit Labels

| Label | Color | Description |
|-------|-------|-------------|
| `audit` | `#5319E7` | From audit findings (Issues #1-3) |
| `triaged` | `#1D76DB` | Fully analyzed and prioritized |
| `test-coverage` | `#0E8A16` | Test coverage gaps |

### Component Labels

| Label | Color | Description |
|-------|-------|-------------|
| `auth` | `#FEF2C0` | Authentication / Authorization |
| `ui` | `#BFD4F2` | User Interface |
| `api` | `#C5DEF5` | Backend API |
| `database` | `#D4C5F9` | Database / Supabase |
| `payment` | `#F9C5D5` | Stripe / Payment processing |
| `performance` | `#E99695` | Performance optimization |
| `mobile` | `#FFA07A` | Mobile-specific issues |

### Special Labels

| Label | Color | Description |
|-------|-------|-------------|
| `blocker` | `#B60205` | Blocks other issues from progressing |
| `breaking-change` | `#D93F0B` | Breaking change requiring migration |
| `good first issue` | `#7057FF` | Good for newcomers |
| `help wanted` | `#008672` | Extra attention needed |
| `duplicate` | `#CFD3D7` | Duplicate of another issue |

## Creating Labels via GitHub CLI

To create these labels in your repository, you can use the GitHub CLI:

```bash
# Type labels
gh label create "bug" --description "Something isn't working correctly" --color "d73a4a"
gh label create "feature" --description "New feature or functionality request" --color "0e8a16"
gh label create "enhancement" --description "Improvement to existing feature" --color "a2eeef"
gh label create "documentation" --description "Improvements or additions to documentation" --color "0075ca"

# Priority labels
gh label create "critical" --description "Critical issue requiring immediate attention" --color "b60205"
gh label create "high" --description "High priority issue" --color "d93f0b"
gh label create "medium" --description "Medium priority issue" --color "fbca04"
gh label create "low" --description "Low priority issue" --color "0e8a16"

# Status labels
gh label create "in progress" --description "Currently being worked on" --color "d4c5f9"
gh label create "blocked" --description "Blocked by another issue or external dependency" --color "e99695"
gh label create "fixed" --description "Issue has been fixed and is awaiting verification" --color "5cb85c"
gh label create "wontfix" --description "This will not be worked on" --color "ffffff"
gh label create "needs-triage" --description "Needs review and prioritization" --color "fef2c0"
gh label create "help wanted" --description "Community contributions welcome" --color "008672"
gh label create "good first issue" --description "Good for newcomers" --color "7057ff"
```

## Label Usage Guidelines

### When Creating Issues

1. **Always add a type label** (`bug`, `feature`, `enhancement`, etc.)
2. **Add a priority label** if known (`critical`, `high`, `medium`, `low`)
3. **Use status labels** as work progresses (`in progress`, `blocked`, `fixed`)

### Label Combinations

- A bug might have: `bug`, `high`, `in progress`
- A feature request might have: `feature`, `medium`, `help wanted`
- A blocked issue might have: `bug`, `critical`, `blocked`

### Special Cases

- **Critical issues**: Should also be tagged with `critical` in addition to type
- **Community contributions**: Add `help wanted` or `good first issue`
- **Needs review**: Use `needs-triage` for new issues requiring team review

## Label Maintenance

Labels should be reviewed and updated:
- Quarterly: Review and consolidate similar labels
- When needed: Add new labels for emerging categories
- Regular cleanup: Remove unused or outdated labels

## Automation

Labels can be automatically applied via:
- Issue templates (configured in `.github/ISSUE_TEMPLATE/`)
- GitHub Actions workflows
- Project board automation rules

---

**Last Updated**: December 2024
**Maintained by**: Zyeuté V3 Development Team
