# 🚀 Issue Triage Quick Start Guide

**Goal:** Turn audit findings into organized, actionable GitHub issues in 6 hours

---

## ⚡ 5-Minute Overview

**You have audit findings → Create organized issues → Team fixes them**

**Input:** Issues #1-3 with bug reports, security findings, test gaps  
**Output:** 20-30 triaged GitHub issues with priorities, estimates, and roadmap  
**Time:** 6 hours  
**Tools:** GitHub issue templates + labels + dependency mapping

---

## 📋 The 6-Hour Plan

### Hour 1: Collect (Extract findings)
- Read Issue #1 (SWE Agent) - extract bugs
- Read Issue #2 (Code Analysis) - extract security issues
- Read Issue #3 (CI/CD) - extract test gaps
- Create a spreadsheet/list of all findings

### Hour 2: Categorize (Priority assignment)
- Mark CRITICAL (blocks revenue)
- Mark HIGH (impacts UX)
- Mark MEDIUM (reduces quality)
- Mark LOW (technical debt)

### Hour 3: Dependencies (Map relationships)
- Identify "depends on" chains
- Find blocking relationships
- Create dependency tree

### Hour 4: Estimate (Time to fix)
- Add effort estimates (1h, 2-4h, 4-8h, 8h+)
- Calculate totals per priority
- Identify resource needs

### Hour 5: Criteria (Define success)
- Write acceptance criteria for CRITICAL issues
- Add testing instructions
- Define success metrics

### Hour 6: Roadmap (Publish plan)
- Create fix order (critical → high → medium → low)
- Assign to milestones
- Publish to team

---

## 🎯 Step-by-Step: First Issue

### Example: SWE Agent finds "Login button not clickable"

#### Step 1: Open Issue Template
```
GitHub → Issues → New Issue → "Audit Bug (Triaged)"
```

#### Step 2: Fill Priority
```
Priority: 🔴 CRITICAL - Fix immediately (blocks revenue)
```

#### Step 3: Fill Description
```
Description: Login button doesn't respond to clicks. Users cannot log in.
```

#### Step 4: Fill Root Cause
```
File: /src/pages/LoginPage.tsx
Line: 45
Root Cause: onClick handler missing on button element
```

#### Step 5: Fill Behaviors
```
Current: Button doesn't respond, no action on click
Expected: Button triggers form submission, starts auth flow
```

#### Step 6: Fill Acceptance Criteria
```
- [ ] Button clickable and responds
- [ ] Form submits to Supabase
- [ ] Loading state shows
- [ ] Success redirects to dashboard
- [ ] Error shows message
- [ ] Unit tests pass
- [ ] Integration tests pass
```

#### Step 7: Fill Technical Details
```
Severity: CRITICAL - Blocks all logins
Effort: 1-2h (Quick fix)
Complexity: Low
Risk: Low (isolated change)

Files Affected:
- /src/pages/LoginPage.tsx

Related Issues:
- Depends on: #11 (Supabase client)
- Blocks: #13 (User authentication)
```

#### Step 8: Fill Testing
```
1. Open https://www.zyeute.com/login
2. Enter test credentials
3. Click "Sign In" button
4. Verify: Button responds, form submits, user logged in
```

#### Step 9: Add Labels
```
critical, blocker, bug, auth, audit, triaged, effort/1-2h
```

#### Step 10: Create Issue ✅

**Time spent:** 10-15 minutes per issue

---

## 🏷️ Labels Cheat Sheet

**Priority (pick one):**
- `critical` - Fix in 24h
- `high` - Fix this week
- `medium` - Fix next sprint
- `low` - Fix eventually

**Effort (pick one):**
- `effort/1h` - Quick fix
- `effort/2-4h` - Small change
- `effort/4-8h` - Medium complexity
- `effort/8h+` - Large change

**Type (pick one):**
- `bug` - Something broken
- `security` - Security issue
- `testing` - Test coverage

**Status:**
- `audit` - From audit
- `triaged` - Fully analyzed
- `blocker` - Blocks others

**Component:**
- `auth`, `ui`, `api`, `database`, `payment`

---

## 🔗 Dependency Mapping (Simple Method)

### For each issue, ask 3 questions:

**1. What must be done before this?**
```
Example: "Login form" depends on "Supabase client initialized"
→ Add: "Depends on: #11"
```

**2. What is waiting for this?**
```
Example: "User auth" needs "Login form" working
→ Add: "Blocks: #13"
```

**3. What is this similar to?**
```
Example: "Login form" is similar to "Signup form"
→ Add: "Related to: #15"
```

### Simple Dependency Tree
```
#10 (env vars)
  └─ #11 (client init)
     └─ #12 (login form)
        └─ #13 (user auth)

Fix order: 10 → 11 → 12 → 13
```

---

## 📊 Priority Decision Tree

```
Is revenue blocked? → YES → CRITICAL
  ↓ NO
Is core feature broken? → YES → HIGH
  ↓ NO
Is UX degraded? → YES → MEDIUM
  ↓ NO
Is it cosmetic? → YES → LOW
```

**Examples:**
- Login broken = CRITICAL (revenue blocked)
- Error messages missing = HIGH (UX issue)
- Code duplication = MEDIUM (quality issue)
- Unused imports = LOW (cosmetic)

---

## ⏱️ Effort Estimation Rules

**1 hour or less:**
- Configuration changes
- Add missing handlers
- Simple validation

**2-4 hours:**
- Form implementations
- API integrations
- Multiple file changes

**4-8 hours:**
- Refactoring needed
- Complex logic
- Multiple components

**8+ hours:**
- Architectural changes
- Database migrations
- Major features

**When in doubt:** Add 50% buffer time

---

## 📋 Templates to Use

### For Bugs (from SWE Agent)
```
Use: .github/ISSUE_TEMPLATE/audit_bug_triaged.yml
```

### For Security (from Code Analysis)
```
Use: .github/ISSUE_TEMPLATE/audit_security.yml
```

### For Tests (from CI/CD Agent)
```
Use: .github/ISSUE_TEMPLATE/audit_test_coverage.yml
```

---

## 🗺️ Creating the Roadmap

### Group issues by priority:

```markdown
# Fix Order Roadmap

## 🔴 CRITICAL (24 hours)
1. #10 - Env vars (30m)
2. #11 - Supabase client (1h) [after #10]
3. #12 - Login form (1-2h) [after #11]
4. #13 - User auth (2h) [after #11, #12]

Total: 4.5-5.5 hours
Deploy together after all complete

## 🟠 HIGH (1 week)
5. #20 - API keys (1h) [independent]
6. #21 - Error messages (2h) [after #13]
7. #22 - Mobile layout (3h) [independent]

Total: 6 hours
Can work in parallel

## 🟡 MEDIUM (next sprint)
8-12. Various refactoring (10-15 hours)

## 🟢 LOW (backlog)
13-20. Technical debt items
```

---

## ✅ Quality Checklist

Before creating an issue, verify:
- [ ] Title is clear and specific
- [ ] Priority is correct
- [ ] Root cause identified (for bugs)
- [ ] Effort estimated
- [ ] Files listed
- [ ] Acceptance criteria defined
- [ ] Dependencies noted
- [ ] Testing instructions included
- [ ] Labels added
- [ ] Source audit referenced

---

## 💡 Pro Tips

### Tip 1: Start with CRITICAL issues
Focus on issues blocking revenue first. Get those perfect, then do the rest.

### Tip 2: Copy from examples
Use `.github/SAMPLE_TRIAGED_ISSUES.md` as templates. Don't start from scratch.

### Tip 3: Batch similar issues
If you find 5 similar bugs, create one issue and note all instances.

### Tip 4: Use GitHub CLI
```bash
# List all audit issues
gh issue list --label "audit,triaged"

# Create issue from template
gh issue create --template audit_bug_triaged.yml
```

### Tip 5: Link issues visually
Use GitHub's "Link issue" feature in the sidebar to show dependencies visually.

### Tip 6: Review before publishing
Have someone else review your first 3 issues to ensure quality.

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T:**
- Create duplicate issues
- Skip effort estimation
- Forget dependencies
- Write vague acceptance criteria
- Mix multiple bugs in one issue
- Use wrong templates
- Skip testing instructions

✅ **DO:**
- One issue per bug
- Clear, specific titles
- Complete all fields
- Use templates
- Add examples
- Link related issues
- Test your instructions

---

## 📚 Resources

**Full Documentation:**
- Triage Workflow: `.github/TRIAGE_WORKFLOW.md`
- Labels Guide: `.github/LABELS.md`
- Dependency Mapping: `.github/DEPENDENCY_MAP_TEMPLATE.md`
- Roadmap Template: `.github/FIX_ORDER_ROADMAP_TEMPLATE.md`
- Sample Issues: `.github/SAMPLE_TRIAGED_ISSUES.md`

**Quick Links:**
- Issue Templates: `.github/ISSUE_TEMPLATE/`
- Master Tracker: `AUDIT_MASTER_TRACKER.md`
- Bug Tracker: `BUG_TRACKER.md`

---

## 🎯 Success Criteria

You're done when:
- [ ] All findings from Issues #1-3 are GitHub issues
- [ ] Every issue has priority, effort, and dependencies
- [ ] CRITICAL issues have detailed acceptance criteria
- [ ] Fix order roadmap is published
- [ ] Team can start fixing immediately
- [ ] 20-30+ issues created total

---

## 📞 Need Help?

**Stuck on priority?** → Check BUG_TRACKER.md for similar issues  
**Unsure about effort?** → Ask a developer for input  
**Dependency confusion?** → Draw it out on paper first  
**Template issues?** → Check SAMPLE_TRIAGED_ISSUES.md

---

## 🏁 Your First Hour Checklist

**Hour 1 Goal:** Create first 5 CRITICAL issues

- [ ] Read Issue #1 findings
- [ ] Identify 5 most critical bugs
- [ ] Open "Audit Bug (Triaged)" template
- [ ] Fill out first issue completely
- [ ] Add all labels
- [ ] Create issue
- [ ] Repeat for bugs 2-5
- [ ] Review your work

**Output:** 5 CRITICAL issues created, fully documented

**If you complete this in 1 hour, you're on track! ✅**

---

**Version:** 1.0  
**Created:** December 15, 2025  
**Target Audience:** Issue triage agents, project managers

🎭⚜️ **Made for Zyeuté - L'app sociale du Québec**

---

## 💪 You Got This!

Triage is just:
1. Read the findings
2. Fill out the template
3. Add labels
4. Create issue
5. Repeat

**It's straightforward once you do the first one!**
