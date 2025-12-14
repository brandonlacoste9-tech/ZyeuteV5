# Quick Reference Guide - Bug & Feature Tracking

Quick reference for common tasks in the Zyeuté V3 bug and feature tracking system.

## 🚀 Common Tasks

### Report a Bug

```bash
# Via Web
1. Go to: https://github.com/brandonlacoste9-tech/zyeute-v3/issues/new/choose
2. Select "🐛 Bug Report"
3. Fill out the form
4. Submit

# Via GitHub CLI
gh issue create --title "[BUG] Brief description" \
  --body "Detailed description" \
  --label "bug,high"
```

### Request a Feature

```bash
# Via Web
1. Go to: https://github.com/brandonlacoste9-tech/zyeute-v3/issues/new/choose
2. Select "✨ Feature Request"
3. Fill out the form
4. Submit

# Via GitHub CLI
gh issue create --title "[FEATURE] Brief description" \
  --body "Detailed description" \
  --label "feature,medium"
```

### Check Issue Status

```bash
# List all open bugs
gh issue list --label bug

# List critical issues
gh issue list --label critical

# List issues assigned to you
gh issue list --assignee @me

# List in-progress items
gh issue list --label "in progress"
```

### Update an Issue

```bash
# Add a label
gh issue edit 123 --add-label "critical"

# Assign to someone
gh issue edit 123 --add-assignee username

# Change status (via label)
gh issue edit 123 --add-label "in progress"

# Close issue
gh issue close 123
```

## 📋 Label Reference

### Quick Label Guide

| Label | When to Use |
|-------|-------------|
| `bug` | Something is broken |
| `feature` | Requesting new functionality |
| `enhancement` | Improving existing feature |
| `critical` | Urgent, production broken |
| `high` | Important, needs attention soon |
| `medium` | Normal priority |
| `low` | Nice to have |
| `in progress` | Currently working on it |
| `blocked` | Can't proceed |
| `fixed` | Completed, awaiting verification |
| `wontfix` | Not going to address |

### Apply Multiple Labels

```bash
# Add several labels at once
gh issue edit 123 --add-label "bug,critical,in progress"
```

## 🎯 Project Board

### Quick Board Reference

| Column | Meaning |
|--------|---------|
| **Backlog** | Identified, not prioritized |
| **Todo** | Ready to work on |
| **In Progress** | Actively being developed |
| **Review** | In code review/testing |
| **Done** | Completed and merged |
| **Blocked** | Waiting on dependencies |

### Common Workflows

**Starting work on an issue:**
1. Assign yourself: `gh issue edit 123 --add-assignee @me`
2. Add label: `gh issue edit 123 --add-label "in progress"`
3. Move to "In Progress" on board (may auto-move)

**Completing work:**
1. Open PR and link issue: "Fixes #123"
2. PR will auto-move to "Review"
3. When merged, auto-moves to "Done"

## 📊 Useful Queries

### Find Work to Do

```bash
# Good first issues
gh issue list --label "good first issue"

# Help wanted
gh issue list --label "help wanted"

# Unassigned high priority
gh issue list --label high --json number,title,assignees | \
  jq '.[] | select(.assignees | length == 0)'

# My assigned issues
gh issue list --assignee @me --state open
```

### Check Progress

```bash
# Issues opened this week
gh issue list --search "created:>=2024-12-07"

# Issues closed this week
gh issue list --state closed --search "closed:>=2024-12-07"

# Blocked items
gh issue list --label blocked

# Overdue items (no activity in 7 days)
gh issue list --search "updated:<2024-12-07"
```

## 🔍 Search Patterns

### GitHub Issue Search Syntax

```bash
# By label
gh issue list --search "label:bug"
gh issue list --search "label:critical label:bug"

# By date
gh issue list --search "created:>=2024-12-01"
gh issue list --search "updated:<2024-12-01"

# By assignee
gh issue list --search "assignee:username"
gh issue list --search "no:assignee"

# By status
gh issue list --search "is:open"
gh issue list --search "is:closed"

# Combined
gh issue list --search "is:open label:bug assignee:@me"
```

## 📝 Update BUG_TRACKER.md

### Quick Update Template

```markdown
### Bug/Feature #X: Title

| Property | Value |
|----------|-------|
| **Status** | 🔄 In Progress |
| **Updated** | 2024-12-14 |

**Recent Update**: Brief note about what changed
```

### Status Emojis

- 🆕 Backlog
- 📋 Todo
- 🔄 In Progress
- 👀 Review
- ✅ Fixed/Done
- 🚫 Blocked
- ❌ Wontfix

## ⚡ Quick Fixes

### Issue Template Not Showing
- Clear browser cache
- Check file syntax: `yamllint .github/ISSUE_TEMPLATE/*.yml`
- Verify files are in correct directory

### Label Not Auto-Applying
- Check template `labels:` field matches exactly
- Ensure label exists in repo: `gh label list`

### Board Not Updating
- Check column automation settings
- Manually move: Drag & drop on web interface

## 🛠️ Installation & Setup

### Install GitHub CLI (if needed)

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli

# Login
gh auth login
```

### Set Repository Context

```bash
# Clone repo
git clone https://github.com/brandonlacoste9-tech/zyeute-v3.git
cd zyeute-v3

# Set as default repo for gh commands
gh repo set-default
```

## 📚 Documentation Links

### Essential Docs
- [BUG_TRACKER.md](../BUG_TRACKER.md) - Live issue tracking
- [LABELS.md](LABELS.md) - Complete label guide
- [SAMPLE_ISSUES.md](SAMPLE_ISSUES.md) - Example issues
- [PROJECT_BOARD.md](PROJECT_BOARD.md) - Board documentation
- [MAINTENANCE.md](MAINTENANCE.md) - Maintenance procedures
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guide

### Quick Links
- [Create Issue](https://github.com/brandonlacoste9-tech/zyeute-v3/issues/new/choose)
- [View All Issues](https://github.com/brandonlacoste9-tech/zyeute-v3/issues)
- [Project Board](https://github.com/brandonlacoste9-tech/zyeute-v3/projects)
- [Discussions](https://github.com/brandonlacoste9-tech/zyeute-v3/discussions)

## 💡 Tips & Tricks

### For Developers
- Always link PRs to issues: "Fixes #123" in PR description
- Update issue comments with progress notes
- Add screenshots when fixing UI bugs
- Test thoroughly before moving to Review

### For Project Managers
- Review new issues daily
- Keep BUG_TRACKER.md updated
- Groom backlog weekly
- Communicate blockers immediately

### For Everyone
- Search before creating duplicate issues
- Use clear, descriptive titles
- Add all relevant context upfront
- Be responsive to questions/feedback
- Keep discussions professional and constructive

## 🎓 Training Resources

### New to GitHub Issues?
- [GitHub Issues Docs](https://docs.github.com/en/issues)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Markdown Guide](https://www.markdownguide.org/)

### New to Zyeuté V3?
- Read [README.md](../README.md)
- Review [CONTRIBUTING.md](../CONTRIBUTING.md)
- Browse existing issues to understand patterns
- Start with "good first issue" labeled items

## 🆘 Getting Help

**Can't find what you need?**

1. Check [MAINTENANCE.md](MAINTENANCE.md) for detailed procedures
2. Search [closed issues](https://github.com/brandonlacoste9-tech/zyeute-v3/issues?q=is%3Aissue+is%3Aclosed) for similar cases
3. Ask in [Discussions](https://github.com/brandonlacoste9-tech/zyeute-v3/discussions)
4. Contact project maintainers

**Common Questions:**

Q: How do I get assigned to an issue?
A: Comment on the issue expressing interest, or assign yourself with `gh issue edit NUMBER --add-assignee @me`

Q: How do I know what to work on?
A: Check "good first issue" and "help wanted" labels, or ask in discussions

Q: How long should I wait for review?
A: Typically 1-3 days. If longer, add a comment requesting review

Q: Can I work on something not in the tracker?
A: Yes! Create an issue first to discuss, then proceed if approved

## 📞 Contacts

- **Project Repository**: [zyeute-v3](https://github.com/brandonlacoste9-tech/zyeute-v3)
- **Issue Tracker**: [Issues](https://github.com/brandonlacoste9-tech/zyeute-v3/issues)
- **Discussions**: [Discussions](https://github.com/brandonlacoste9-tech/zyeute-v3/discussions)

---

## 🔖 Bookmarks

Save these for quick access:
- 📝 [Create New Issue](https://github.com/brandonlacoste9-tech/zyeute-v3/issues/new/choose)
- 🐛 [View Bugs](https://github.com/brandonlacoste9-tech/zyeute-v3/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
- ✨ [View Features](https://github.com/brandonlacoste9-tech/zyeute-v3/issues?q=is%3Aissue+is%3Aopen+label%3Afeature)
- 🔴 [Critical Issues](https://github.com/brandonlacoste9-tech/zyeute-v3/issues?q=is%3Aissue+is%3Aopen+label%3Acritical)
- 📊 [Project Board](https://github.com/brandonlacoste9-tech/zyeute-v3/projects)
- 📋 [BUG_TRACKER.md](../BUG_TRACKER.md)

---

**Version**: 1.0  
**Last Updated**: December 14, 2024  
**Print-friendly**: Yes - Keep handy for reference!

---

*Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️*
