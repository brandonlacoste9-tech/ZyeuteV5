# Issue Labels for Zyeuté V3

This document defines the standardized labels used for issue tracking in the Zyeuté V3 repository.

## Label Categories

### Type Labels

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` | Something isn't working correctly |
| `feature` | `#0e8a16` | New feature or functionality request |
| `enhancement` | `#a2eeef` | Improvement to existing feature |
| `documentation` | `#0075ca` | Improvements or additions to documentation |

### Priority Labels

| Label | Color | Description |
|-------|-------|-------------|
| `critical` | `#b60205` | Critical issue requiring immediate attention |
| `high` | `#d93f0b` | High priority issue |
| `medium` | `#fbca04` | Medium priority issue |
| `low` | `#0e8a16` | Low priority issue |

### Status Labels

| Label | Color | Description |
|-------|-------|-------------|
| `in progress` | `#d4c5f9` | Currently being worked on |
| `blocked` | `#e99695` | Blocked by another issue or external dependency |
| `fixed` | `#5cb85c` | Issue has been fixed and is awaiting verification |
| `wontfix` | `#ffffff` | This will not be worked on |
| `needs-triage` | `#fef2c0` | Needs review and prioritization |
| `help wanted` | `#008672` | Community contributions welcome |
| `good first issue` | `#7057ff` | Good for newcomers |

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
