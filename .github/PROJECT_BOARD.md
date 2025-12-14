# GitHub Project Board Setup for Zyeuté V3

This document provides instructions for creating and configuring the "Zyeuté V3 Bug & Feature Tracker" GitHub Project Board.

## 📋 Overview

The Project Board provides a visual kanban-style workflow for tracking bugs and features through their lifecycle. It integrates with GitHub Issues and Pull Requests for seamless project management.

**Project Name**: Zyeuté V3 Bug & Feature Tracker  
**Board Type**: Team Board (Classic Project or Projects Beta)  
**View**: Board (Kanban)

---

## 🏗️ Board Structure

### Columns

The board uses 6 columns representing different stages of work:

| Column | Purpose | Automation |
|--------|---------|------------|
| **Backlog** | Issues identified but not yet prioritized | Manual add |
| **Todo** | Prioritized and ready to work on | Manual add |
| **In Progress** | Currently being worked on | Auto-add on issue assignment |
| **Review** | Code review or testing | Auto-add when PR opened |
| **Done** | Completed and merged | Auto-move on PR merge |
| **Blocked** | Cannot proceed due to dependencies | Manual move |

---

## 🚀 Setup Instructions

### Option 1: Using GitHub Web Interface

#### Step 1: Create New Project

1. Navigate to repository: `https://github.com/brandonlacoste9-tech/zyeute-v3`
2. Click on **"Projects"** tab
3. Click **"New project"** or **"Link a project"** > **"New project"**
4. Choose **"Board"** template
5. Enter project details:
   - **Name**: `Zyeuté V3 Bug & Feature Tracker`
   - **Description**: `Comprehensive tracking for bugs, features, and enhancements in the Zyeuté V3 social media platform`
6. Click **"Create project"**

#### Step 2: Configure Columns

If using Projects (Beta):
1. Columns are created automatically (Todo, In Progress, Done)
2. Click **"+"** to add additional columns:
   - Add **"Backlog"** column (move to first position)
   - Add **"Review"** column (between In Progress and Done)
   - Add **"Blocked"** column (last position)

If using Classic Projects:
1. Delete default columns
2. Add columns in this order:
   - **Backlog**
   - **Todo**
   - **In Progress**
   - **Review**
   - **Done**
   - **Blocked**

#### Step 3: Configure Column Settings

For each column, configure automation:

**Backlog**:
- Automation: Manual only
- Description: "Issues identified but not yet prioritized for work"

**Todo**:
- Automation: Manual only
- Description: "Prioritized issues ready to be worked on"
- Preset: None

**In Progress**:
- Automation: 
  - ✅ Move issues here when assigned
  - ✅ Move PRs here when opened
- Description: "Active development in progress"

**Review**:
- Automation:
  - ✅ Move PRs here when ready for review
  - ✅ Move PRs here when changes requested
- Description: "Code review or QA testing in progress"

**Done**:
- Automation:
  - ✅ Move issues here when closed
  - ✅ Move PRs here when merged
- Description: "Completed and deployed"

**Blocked**:
- Automation: Manual only
- Description: "Cannot proceed due to blockers or dependencies"

#### Step 4: Add Issues to Board

Add the sample issues to the board:

1. Click **"Add item"** or **"+"** in Backlog column
2. Search for or create issues:
   - BUG-001: Stripe.js fails to load on checkout page
   - BUG-002: Supabase returns 422 error with special characters
   - BUG-003: React DOM warning about missing key props
   - FEAT-001: Implement guest mode to allow browsing
   - FEAT-002: Resolve manifest.json 401 error and PWA support
3. Organize by priority:
   - Critical issues in top positions
   - High priority next
   - Medium and low priorities below

---

### Option 2: Using GitHub CLI

```bash
# Note: GitHub CLI project management is in beta
# You may need to use the web interface for full functionality

# Create project (if supported by your gh version)
gh project create --title "Zyeuté V3 Bug & Feature Tracker" \
  --body "Comprehensive tracking for bugs, features, and enhancements"

# Add issues to project (adjust issue numbers as needed)
# Replace {PROJECT_NUMBER} with your actual project number (e.g., 1, 2, 3)
gh issue list --label bug --json number --jq '.[].number' | \
  xargs -I {} gh project item-add {PROJECT_NUMBER} --owner brandonlacoste9-tech --repo zyeute-v3 --issue {}

gh issue list --label feature --json number --jq '.[].number' | \
  xargs -I {} gh project item-add {PROJECT_NUMBER} --owner brandonlacoste9-tech --repo zyeute-v3 --issue {}
```

---

### Option 3: Using GitHub API

For automation or bulk operations:

```bash
# Get repository ID
REPO_ID=$(gh api repos/brandonlacoste9-tech/zyeute-v3 --jq '.id')

# Create project (Projects V2 API)
gh api graphql -f query='
  mutation {
    createProjectV2(input: {
      ownerId: "OWNER_ID"
      title: "Zyeuté V3 Bug & Feature Tracker"
      repositoryId: "'$REPO_ID'"
    }) {
      projectV2 {
        id
        title
      }
    }
  }
'
```

---

## 🔧 Board Configuration

### Filters and Views

Create custom views for different perspectives:

#### View 1: By Priority
- Filter: None
- Group by: Priority label (critical, high, medium, low)
- Sort: Creation date (newest first)

#### View 2: By Type
- Filter: None
- Group by: Type label (bug, feature, enhancement)
- Sort: Priority (critical first)

#### View 3: Active Work
- Filter: Status = "In Progress" OR "Review"
- Group by: Assignee
- Sort: Updated date (most recent first)

#### View 4: Blocked Items
- Filter: Status = "Blocked"
- Group by: None
- Sort: Priority (critical first)

### Custom Fields (Projects Beta)

Add custom fields for enhanced tracking:

| Field Name | Type | Options/Values |
|------------|------|----------------|
| Priority | Single select | Critical, High, Medium, Low |
| Type | Single select | Bug, Feature, Enhancement, Documentation |
| Effort | Single select | Small, Medium, Large, XLarge |
| Sprint | Text | Sprint number or name |
| Due Date | Date | Target completion date |

---

## 📊 Using the Board

### For Developers

1. **Check "Todo" column** for next work items
2. **Move to "In Progress"** when starting work
3. **Add notes** on the card about implementation details
4. **Move to "Review"** when PR is opened
5. **Move to "Done"** after merge (automated)

### For Project Managers

1. **Groom Backlog** regularly - prioritize and add to Todo
2. **Monitor In Progress** - check for stalled items
3. **Review Blocked** - identify and resolve blockers
4. **Track velocity** - measure items completed per sprint
5. **Generate reports** - use insights and analytics

### For QA/Testers

1. **Monitor Review column** for items needing testing
2. **Add testing notes** on cards
3. **Move back to In Progress** if issues found
4. **Verify Done items** in production

---

## 🤖 Automation Rules

### Recommended Automations

Projects (Beta) supports custom workflows:

```yaml
# Example automation workflow
name: Project Board Automation

on:
  issues:
    types: [opened, assigned, closed]
  pull_request:
    types: [opened, ready_for_review, closed]

jobs:
  update_project:
    runs-on: ubuntu-latest
    steps:
      - name: Add to project
        uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/brandonlacoste9-tech/projects/[NUMBER]
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Status Transitions

Automatic transitions:
- Issue opened → Backlog
- Issue assigned → In Progress
- PR opened → Review
- PR merged → Done
- Issue closed → Done
- PR changes requested → In Progress

Manual transitions:
- Backlog → Todo (after prioritization)
- Any → Blocked (when dependencies identified)
- Blocked → Todo (when unblocked)

---

## 📈 Metrics and Insights

### Key Metrics to Track

1. **Velocity**
   - Issues completed per week/sprint
   - Average time in each column
   - Throughput trends

2. **Work In Progress (WIP)**
   - Number of issues in "In Progress"
   - Target: Keep WIP reasonable (3-5 per developer)
   - Alert: Flag if WIP exceeds limits

3. **Cycle Time**
   - Time from Todo → Done
   - Average: Track by priority and type
   - Goal: Reduce over time

4. **Lead Time**
   - Time from creation → Done
   - Trend: Monitor for bottlenecks
   - Comparison: By issue type

5. **Blocked Items**
   - Number of blocked items
   - Time spent in blocked state
   - Common blocking reasons

### Using GitHub Insights

Projects (Beta) provides built-in insights:

1. Navigate to **"Insights"** tab on project
2. Create custom charts:
   - Burndown chart for sprints
   - Cumulative flow diagram
   - Cycle time scatter plot
   - Throughput bar chart

---

## 🔄 Maintenance Schedule

### Daily
- Update card statuses
- Add new issues to board
- Check for blocked items

### Weekly
- Review and prioritize backlog
- Analyze WIP and bottlenecks
- Update sprint planning

### Monthly
- Review metrics and trends
- Adjust automation rules
- Archive completed items (>30 days)
- Generate stakeholder reports

---

## 🎯 Best Practices

### Do's ✅

- Keep card descriptions up to date
- Add relevant labels to all issues
- Link related PRs to issues
- Use mentions for collaboration
- Add time estimates when possible
- Regularly groom the backlog
- Celebrate Done items!

### Don'ts ❌

- Don't let cards sit in Review too long
- Don't skip status updates
- Don't create duplicate cards
- Don't ignore blocked items
- Don't let backlog grow indefinitely
- Don't forget to close completed issues

---

## 📚 Additional Resources

### GitHub Documentation

- [About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
- [Creating a Project](https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project)
- [Automating Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project)
- [Using Insights](https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project)

### Templates and Examples

- [GitHub Project Templates](https://github.com/features/project-management/)
- [Kanban Board Best Practices](https://www.atlassian.com/agile/kanban/boards)
- [Agile Workflow Examples](https://www.agilealliance.org/agile101/)

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Cards not moving automatically
- **Solution**: Check automation settings for each column
- **Solution**: Verify project permissions

**Issue**: Can't add issues to project
- **Solution**: Ensure project is linked to repository
- **Solution**: Check user permissions

**Issue**: Insights not showing data
- **Solution**: Add custom fields to issues
- **Solution**: Wait for data to populate (24 hours)

**Issue**: Too many items in one column
- **Solution**: Set WIP limits
- **Solution**: Review and prioritize

---

## 📞 Support

For questions or issues with the project board:

1. Check [GitHub Status](https://www.githubstatus.com/)
2. Review [GitHub Docs](https://docs.github.com/)
3. Open a discussion in the repository
4. Contact repository maintainers

---

## 📝 Changelog

### Version 1.0 (December 2024)
- Initial project board setup
- 6-column kanban board
- Automation rules configured
- Sample issues added
- Documentation created

---

**Document Version**: 1.0  
**Last Updated**: December 14, 2024  
**Maintained By**: Zyeuté V3 Development Team

---

*Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️*
