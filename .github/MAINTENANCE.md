# Maintenance Guide for Bug & Feature Tracking System

This guide provides instructions for maintaining the bug and feature tracking ecosystem in Zyeuté V3.

## 📋 Overview

The tracking system consists of:
- GitHub Issue Templates
- Label System
- Bug Tracker Document
- Project Board
- Sample Issues
- Documentation

## 🔄 Regular Maintenance Tasks

### Daily Tasks (5-10 minutes)

**For Project Managers / Leads:**

1. **Review New Issues**
   - Check for new bug reports and feature requests
   - Apply appropriate labels (priority, type)
   - Assign to team members when appropriate
   - Add to project board

2. **Update BUG_TRACKER.md**
   - Update status of active items
   - Add newly created GitHub issues
   - Update quick stats

3. **Monitor In Progress Items**
   - Check if any items are stalled
   - Identify blockers
   - Follow up with assignees

**Commands:**
```bash
# View new issues
gh issue list --label needs-triage

# Check in-progress items
gh issue list --label "in progress"
```

### Weekly Tasks (30-60 minutes)

**For Project Managers:**

1. **Backlog Grooming**
   - Review backlog items
   - Prioritize for upcoming sprint
   - Move items from Backlog to Todo
   - Close stale or invalid issues

2. **Update Metrics in BUG_TRACKER.md**
   - Calculate average resolution times
   - Update quick stats
   - Review velocity trends
   - Update status distribution

3. **Project Board Maintenance**
   - Verify automation is working
   - Clean up Done column (archive old items)
   - Review blocked items and resolve if possible
   - Ensure all issues are properly categorized

4. **Label Audit**
   - Check for label consistency
   - Add missing labels to issues
   - Remove incorrect labels
   - Create new labels if needed

**Commands:**
```bash
# List issues missing labels
gh issue list --json number,labels --jq '.[] | select(.labels | length == 0)'

# View issues by label
gh issue list --label bug
gh issue list --label feature

# Close stale issues (example)
gh issue close NUMBER --comment "Closing due to inactivity"
```

### Monthly Tasks (1-2 hours)

**For Development Team:**

1. **Documentation Review**
   - Update BUG_TRACKER.md with completed items
   - Review and update SAMPLE_ISSUES.md if needed
   - Check all documentation links are working
   - Update metrics and statistics

2. **System Health Check**
   - Review issue template effectiveness
   - Check if labels are being used correctly
   - Analyze resolution time trends
   - Identify process improvements

3. **Reporting**
   - Generate monthly metrics report
   - Summarize completed work
   - Identify patterns in bugs/features
   - Present to stakeholders

4. **Archive Completed Items**
   - Move items from Done to archive (if using)
   - Update BUG_TRACKER.md to reflect archived items
   - Clean up project board

5. **Label Maintenance**
   - Review label usage statistics
   - Consolidate similar labels
   - Remove unused labels
   - Update LABELS.md if changes made

**Monthly Metrics to Track:**
- Total issues opened/closed
- Average resolution time by priority
- Bug vs feature ratio
- Most common bug categories
- Team velocity (items completed)
- Backlog growth rate

## 🔧 Specific Maintenance Procedures

### Adding New Sample Issues

When adding new examples to SAMPLE_ISSUES.md:

1. Document the issue thoroughly:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Problem statement and solution (for features)
   - Priority and impact assessment

2. Add GitHub CLI command:
   ```bash
   gh issue create \
     --title "[BUG] Clear title" \
     --body "Full description..." \
     --label "bug,priority"
   ```

3. Update BUG_TRACKER.md with the new item

4. Add to project board

### Updating BUG_TRACKER.md

**When an issue status changes:**

1. Locate the issue in BUG_TRACKER.md
2. Update the Status field:
   ```markdown
   | **Status** | 🔄 In Progress |
   ```
3. Update the "Updated" date
4. Add notes about the change
5. Update quick stats at the top

**When adding a new issue:**

1. Assign it an ID (BUG-XXX or FEAT-XXX)
2. Create a new section using the template
3. Fill in all fields
4. Add to appropriate category (Bugs or Features)
5. Update quick stats

**Template for new entries:**
```markdown
### Bug/Feature #X: Title

| Property | Value |
|----------|-------|
| **ID** | BUG-XXX / FEAT-XXX |
| **Title** | Full title |
| **Type** | 🐛 Bug / ✨ Feature |
| **Status** | 🆕 Backlog |
| **Priority** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Assignee** | Name or Unassigned |
| **Created** | YYYY-MM-DD |
| **Updated** | YYYY-MM-DD |
| **Labels** | `label1`, `label2` |

**Description**: ...

**Impact**: ...

**Proposed Fix**: ...

**Testing Required**: ...

**Related Issues**: #XXX
```

### Managing Labels

**Creating a new label:**

```bash
# Via GitHub CLI
gh label create "label-name" \
  --description "Label description" \
  --color "HEX_COLOR"

# Example
gh label create "database" \
  --description "Database related issues" \
  --color "0e8a16"
```

**Updating LABELS.md:**
1. Add the new label to the appropriate category table
2. Include color, description
3. Add to CLI commands section
4. Document usage guidelines if needed

**Removing unused labels:**
```bash
# List all labels and usage
gh label list

# Delete a label
gh label delete "label-name"
```

### Project Board Automation

**Verify automation is working:**

1. Create a test issue
2. Assign it to someone → should move to "In Progress"
3. Open a PR → should move to "Review"
4. Merge PR → should move to "Done"
5. Close issue → should move to "Done"

**If automation breaks:**

1. Check column automation settings in Project Board
2. Verify GitHub Actions permissions
3. Review project board workflows
4. Consult PROJECT_BOARD.md for setup

**Manually updating board:**
```bash
# Add issue to project (if not automated)
gh project item-add PROJECT_NUMBER --owner OWNER --repo REPO --issue ISSUE_NUMBER
```

## 📊 Generating Reports

### Weekly Status Report

```bash
# Issues opened this week
gh issue list --search "created:>=YYYY-MM-DD" --json number,title,labels

# Issues closed this week
gh issue list --state closed --search "closed:>=YYYY-MM-DD" --json number,title

# In progress issues
gh issue list --label "in progress" --json number,title,assignees
```

### Monthly Metrics Report

Use this template:

```markdown
# Zyeuté V3 Monthly Report - [Month Year]

## Summary
- Total Issues Opened: X
- Total Issues Closed: Y
- Open Issues: Z
- Backlog Growth: +/- N

## Breakdown by Type
- Bugs: X (Y closed)
- Features: X (Y closed)
- Enhancements: X (Y closed)

## Breakdown by Priority
- Critical: X (avg resolution: Y days)
- High: X (avg resolution: Y days)
- Medium: X (avg resolution: Y days)
- Low: X (avg resolution: Y days)

## Top Contributors
1. User1 - X issues/PRs
2. User2 - Y issues/PRs

## Notable Achievements
- Major feature X completed
- Critical bug Y fixed
- Performance improvement Z

## Upcoming Focus
- Priority items for next month
- Roadmap updates
```

## 🚨 Handling Special Cases

### Critical Bugs

When a critical bug is reported:

1. **Immediate Actions** (within 1 hour):
   - Verify the bug is critical
   - Apply `critical` label
   - Assign to appropriate developer
   - Move to "In Progress" on project board
   - Update BUG_TRACKER.md status
   - Notify team (Slack, email, etc.)

2. **Communication**:
   - Post status updates every 2-4 hours
   - Inform stakeholders
   - Document in issue comments

3. **Post-Fix**:
   - Verify fix in production
   - Update BUG_TRACKER.md
   - Document lessons learned
   - Update prevention measures

### Blocked Issues

When an issue becomes blocked:

1. **Apply blocked label**
   ```bash
   gh issue edit NUMBER --add-label "blocked"
   ```

2. **Move to Blocked column** on project board

3. **Document blocker** in issue comments:
   ```markdown
   **Blocked by**: #123 (Description of blocking issue)
   **Expected resolution**: ETA or "Unknown"
   ```

4. **Update BUG_TRACKER.md**:
   ```markdown
   | **Status** | 🚫 Blocked |
   | **Blocked By** | #123, External dependency |
   ```

5. **Weekly review** of blocked items:
   - Check if blocker is resolved
   - Update status
   - Communicate with team

### Stale Issues

For issues with no activity for 30+ days:

1. **Add comment** asking for status:
   ```markdown
   This issue has had no activity for 30 days. 
   
   - Is this still relevant?
   - Should we close this issue?
   - Does it need to be reprioritized?
   
   Please respond within 7 days or this will be closed.
   ```

2. **If no response**, close with comment:
   ```markdown
   Closing due to inactivity. Please reopen if this is still relevant.
   ```

3. **Apply `wontfix`** label if appropriate

## 🔍 Quality Checks

### Weekly Quality Checklist

- [ ] All open issues have labels (type + priority)
- [ ] All critical/high priority items have assignees
- [ ] No issues stuck in "In Progress" for >7 days without updates
- [ ] Project board reflects current status accurately
- [ ] BUG_TRACKER.md is up to date
- [ ] No broken links in documentation
- [ ] Quick stats are current

### Monthly Quality Checklist

- [ ] All documentation is current
- [ ] Label system is being used correctly
- [ ] Automation is working properly
- [ ] Metrics are accurate
- [ ] Sample issues are relevant
- [ ] Archive old completed items
- [ ] Review and update templates if needed

## 🛠️ Tools and Scripts

### Useful GitHub CLI Commands

```bash
# List all open bugs by priority
gh issue list --label bug --json number,title,labels | \
  jq '.[] | select(.labels[].name | contains("critical"))'

# Count issues by label
gh issue list --label bug --json number | jq '. | length'

# Find issues without assignees
gh issue list --json number,title,assignees | \
  jq '.[] | select(.assignees | length == 0)'

# List overdue issues (example with custom field)
gh issue list --json number,title,updatedAt | \
  jq '.[] | select(.updatedAt < "2024-01-01")'

# Bulk label application
gh issue list --search "is:open label:bug" --json number | \
  jq -r '.[].number' | \
  xargs -I {} gh issue edit {} --add-label "needs-triage"
```

### Automation Scripts

Consider creating scripts for:
- Daily stats update
- Weekly report generation
- Stale issue identification
- Label consistency check
- BUG_TRACKER.md validation

## 📚 Training New Maintainers

### Onboarding Checklist

- [ ] Review all documentation
- [ ] Understand label system
- [ ] Practice creating issues with templates
- [ ] Learn GitHub CLI commands
- [ ] Shadow current maintainer for 1 week
- [ ] Perform maintenance tasks with supervision
- [ ] Take over weekly tasks
- [ ] Join maintainer communication channels

### Key Skills

- GitHub Issues and Projects proficiency
- GitHub CLI basics
- Markdown formatting
- Project management principles
- Communication skills
- Understanding of software development lifecycle

## 🆘 Troubleshooting

### Common Issues

**Issue templates not appearing:**
- Check `.github/ISSUE_TEMPLATE/` directory exists
- Verify YAML syntax is correct
- Clear browser cache
- Check repository permissions

**Project board automation not working:**
- Verify column automation settings
- Check if workflows have correct permissions
- Review GitHub Actions logs
- Ensure project is linked to repository

**Labels not applying automatically:**
- Check issue template YAML `labels:` field
- Verify label names match exactly
- Ensure labels exist in repository

**BUG_TRACKER.md getting out of sync:**
- Implement daily review process
- Use automation scripts
- Assign specific team member responsibility
- Set calendar reminders

## 📞 Getting Help

If you encounter issues maintaining the tracking system:

1. Check this maintenance guide
2. Review related documentation:
   - [PROJECT_BOARD.md](PROJECT_BOARD.md)
   - [LABELS.md](LABELS.md)
   - [SAMPLE_ISSUES.md](SAMPLE_ISSUES.md)
3. Search GitHub Docs
4. Ask in team discussions
5. Contact project maintainers

## 📝 Maintenance Log

Keep a log of maintenance activities:

```markdown
## Maintenance Log

### 2024-12-14
- Initial system setup
- Created all templates and documentation
- Added sample issues

### [Date]
- Activity performed
- Changes made
- Issues encountered
```

---

**Last Updated**: December 14, 2024  
**Next Review**: December 21, 2024  
**Maintained By**: Zyeuté V3 Development Team

---

*Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️*
