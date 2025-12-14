# .github Directory Documentation

This directory contains GitHub-specific configurations and documentation for the Zyeuté V3 project.

## 📁 Contents

### Issue Templates (`ISSUE_TEMPLATE/`)

Standardized templates for reporting issues:

- **`bug_report.yml`** - Template for bug reports
  - Auto-assigns `bug` label
  - Prompts for description, steps, environment, priority
  - Ensures consistent bug reporting
  
- **`feature_request.yml`** - Template for feature requests
  - Auto-assigns `feature` label
  - Prompts for problem statement, solution, use cases
  - Structured feature proposal format
  
- **`config.yml`** - Issue template configuration
  - Links to Discussions, Documentation, Deployment guides
  - Controls blank issue creation

**Usage**: When creating a new issue, GitHub presents these templates as options.

### Documentation Files

- **`LABELS.md`** - Complete label system documentation
  - Type, priority, and status labels
  - Color codes and descriptions
  - GitHub CLI commands for label creation
  - Usage guidelines and best practices

- **`SAMPLE_ISSUES.md`** - Example bugs and features
  - 3 sample bug reports (Stripe.js, Supabase 422, React DOM)
  - 2 sample feature requests (Guest mode, PWA support)
  - Detailed descriptions and testing requirements
  - GitHub CLI commands for creating issues

- **`PROJECT_BOARD.md`** - Project board setup guide
  - Instructions for creating "Zyeuté V3 Bug & Feature Tracker"
  - 6-column kanban workflow (Backlog, Todo, In Progress, Review, Done, Blocked)
  - Automation rules and best practices
  - Metrics tracking and troubleshooting

- **`MAINTENANCE.md`** - Maintenance guide
  - Daily, weekly, and monthly maintenance tasks
  - Procedures for updating BUG_TRACKER.md
  - Label and project board management
  - Troubleshooting common issues

- **`README.md`** - This file
  - Overview of .github directory contents

## 🎯 Purpose

This tracking ecosystem provides:

1. **Standardized Communication** - Consistent issue reporting
2. **Efficient Workflow** - Clear process from report to resolution
3. **Better Tracking** - Comprehensive project visibility
4. **Team Collaboration** - Shared understanding of priorities
5. **Quality Assurance** - Thorough testing and documentation

## 🚀 Quick Start

### For Bug Reporters

1. Go to [Issues](../../issues/new/choose)
2. Select "🐛 Bug Report"
3. Fill out the template completely
4. Submit the issue

### For Feature Requesters

1. Go to [Issues](../../issues/new/choose)
2. Select "✨ Feature Request"
3. Describe your idea thoroughly
4. Submit for team discussion

### For Project Managers

1. Review [MAINTENANCE.md](MAINTENANCE.md) for daily/weekly tasks
2. Check [PROJECT_BOARD.md](PROJECT_BOARD.md) for board setup
3. Use [LABELS.md](LABELS.md) for label management
4. Reference [SAMPLE_ISSUES.md](SAMPLE_ISSUES.md) for examples

### For Developers

1. Check the [Project Board](../../projects) for work items
2. Reference [BUG_TRACKER.md](../BUG_TRACKER.md) for detailed status
3. Follow [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
4. Use issue templates when creating issues

## 📋 Label System

### Type Labels
- `bug` - Something isn't working
- `feature` - New functionality request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements

### Priority Labels
- `critical` - Urgent, immediate attention required
- `high` - Important, high priority
- `medium` - Moderate priority
- `low` - Low priority, nice to have

### Status Labels
- `in progress` - Currently being worked on
- `blocked` - Waiting on dependencies
- `fixed` - Completed and awaiting verification
- `wontfix` - Will not be addressed
- `needs-triage` - Requires review and prioritization
- `help wanted` - Community contributions welcome
- `good first issue` - Great for newcomers

See [LABELS.md](LABELS.md) for complete documentation.

## 🔗 Related Documentation

### In This Directory
- [Issue Templates](ISSUE_TEMPLATE/) - Bug and feature templates
- [Labels Guide](LABELS.md) - Label system documentation
- [Sample Issues](SAMPLE_ISSUES.md) - Example issues with CLI commands
- [Project Board Guide](PROJECT_BOARD.md) - Board setup and usage
- [Maintenance Guide](MAINTENANCE.md) - System maintenance procedures

### In Project Root
- [BUG_TRACKER.md](../BUG_TRACKER.md) - Live issue tracking table
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](../CHANGELOG.md) - Project change history
- [README.md](../README.md) - Project overview

## 🔧 Maintenance

### Regular Updates Required

**Daily** (by Project Manager):
- Review new issues and apply labels
- Update BUG_TRACKER.md status
- Monitor in-progress items

**Weekly** (by Team):
- Groom backlog and prioritize
- Update project board
- Review blocked items
- Check label consistency

**Monthly** (by Team):
- Audit documentation accuracy
- Review and update samples
- Generate metrics reports
- Archive completed items

See [MAINTENANCE.md](MAINTENANCE.md) for detailed procedures.

## 🎓 Best Practices

### Issue Creation
- Use the appropriate template
- Fill out all required fields
- Be clear and specific
- Include reproduction steps (bugs)
- Add screenshots/logs when helpful
- Check for duplicates first

### Label Usage
- Always add a type label (bug, feature, etc.)
- Add a priority label when known
- Update status labels as work progresses
- Don't over-label (3-5 labels max per issue)

### Project Board
- Keep cards up to date
- Move cards as status changes
- Add notes and comments
- Link related PRs
- Don't let items stall

### Documentation
- Keep BUG_TRACKER.md current
- Update when creating/closing issues
- Add notes about implementation
- Track testing status
- Link to related resources

## 🤝 Contributing

To improve the tracking system:

1. Suggest improvements via Issues or Discussions
2. Submit PRs for documentation updates
3. Share feedback on effectiveness
4. Help maintain and update regularly

## 📊 Metrics

Track these metrics monthly:
- Issues opened/closed
- Average resolution time by priority
- Backlog growth rate
- Team velocity
- Label distribution
- Common bug categories

## 🆘 Support

Need help with the tracking system?

1. Review documentation in this directory
2. Check [MAINTENANCE.md](MAINTENANCE.md) for common issues
3. Ask in [Discussions](../../discussions)
4. Contact project maintainers

## 📚 Resources

### GitHub Documentation
- [About Issues](https://docs.github.com/en/issues)
- [About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)
- [GitHub CLI](https://cli.github.com/manual/)

### External Resources
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [Kanban Board Practices](https://www.atlassian.com/agile/kanban)

## 🎯 Goals

The tracking system aims to:
- ✅ Reduce time to resolution
- ✅ Improve team communication
- ✅ Increase code quality
- ✅ Better prioritize work
- ✅ Enhance project visibility
- ✅ Support community contributions
- ✅ Maintain professional standards

---

## 📞 Contact

Questions about this directory or tracking system?
- Open a [Discussion](../../discussions)
- Comment on related [Issues](../../issues)
- Review [Contributing Guide](../CONTRIBUTING.md)

---

**Version**: 1.0  
**Created**: December 14, 2024  
**Last Updated**: December 14, 2024  
**Maintained By**: Zyeuté V3 Development Team

---

*Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️*
