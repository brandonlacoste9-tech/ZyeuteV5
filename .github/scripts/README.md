# 🤖 Automated Issue Triage Scripts

Scripts to help automate the creation of triaged issues from audit findings.

---

## 📋 Scripts

### `create-triaged-issues.js`

Automatically creates GitHub issues from a JSON file of audit findings.

**Prerequisites:**
- Node.js installed
- [GitHub CLI](https://cli.github.com/) installed and authenticated
- Write access to the repository

**Usage:**
```bash
# Basic usage
node .github/scripts/create-triaged-issues.js findings.json

# Using example file
node .github/scripts/create-triaged-issues.js .github/scripts/example-findings.json
```

**Features:**
- ✅ Validates finding data
- ✅ Creates issues with proper templates
- ✅ Applies appropriate labels automatically
- ✅ Formats issue bodies with all required sections
- ✅ Handles errors gracefully
- ✅ Provides colored terminal output
- ✅ Shows summary statistics

---

## 📄 JSON Format

### Finding Object Structure

```json
{
  "type": "bug|security|test-coverage",
  "priority": "critical|high|medium|low",
  "title": "Brief issue title",
  "description": "Detailed description of the issue",
  "component": "auth|ui|api|database|payment|mobile|performance",
  "effort": "1h|2-4h|4-8h|8h+",
  "complexity": "Low|Medium|High",
  "risk": "Low|Medium|High",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "rootCause": {
    "file": "/path/to/file.tsx",
    "line": "45-50",
    "description": "What's causing the issue"
  },
  "currentBehavior": "What happens now",
  "expectedBehavior": "What should happen",
  "acceptanceCriteria": [
    "Criterion 1",
    "Criterion 2",
    "Criterion 3"
  ],
  "filesAffected": [
    "/path/to/file1.tsx",
    "/path/to/file2.ts"
  ],
  "relatedIssues": {
    "dependsOn": [10, 11],
    "blocks": [12, 13],
    "related": [14]
  },
  "testingInstructions": "Step-by-step testing guide",
  "proposedFix": "How to fix this issue",
  "sourceAudit": "Found in Issue #1 (SWE Agent) Phase 4"
}
```

### Required Fields

- `type` - Must be one of: `bug`, `security`, `test-coverage`
- `priority` - Must be one of: `critical`, `high`, `medium`, `low`
- `title` - Brief, descriptive title
- `description` - Detailed explanation of the issue

### Optional Fields

All other fields are optional but recommended for complete triaged issues.

---

## 🎯 Example Usage

### Step 1: Create Findings JSON

Create a file `my-findings.json`:

```json
{
  "findings": [
    {
      "type": "bug",
      "priority": "critical",
      "title": "Login button not clickable",
      "description": "Users cannot log in because button does not respond",
      "component": "auth",
      "effort": "1-2h",
      "complexity": "Low",
      "risk": "Low",
      "severity": "CRITICAL",
      "rootCause": {
        "file": "/src/pages/LoginPage.tsx",
        "line": "45",
        "description": "onClick handler missing"
      },
      "currentBehavior": "Button does not respond to clicks",
      "expectedBehavior": "Button triggers login flow",
      "acceptanceCriteria": [
        "Button is clickable",
        "Form submits on click",
        "Loading state shows"
      ],
      "filesAffected": [
        "/src/pages/LoginPage.tsx"
      ],
      "testingInstructions": "1. Navigate to /login\n2. Click button\n3. Verify submission",
      "sourceAudit": "Found in Issue #1 (SWE Agent) Phase 4"
    }
  ]
}
```

### Step 2: Run Script

```bash
node .github/scripts/create-triaged-issues.js my-findings.json
```

### Step 3: Review Output

```
🚀 Automated Issue Creation for Audit Findings
==================================================

📊 Found 1 findings to process

[1/1]
📋 Creating issue: Login button not clickable
✅ Created: https://github.com/brandonlacoste9-tech/zyeute-v3/issues/10

==================================================
✅ Successfully created: 1 issues
📊 Total processed: 1 findings
```

---

## 🏷️ Automatic Labels

The script automatically applies labels based on the finding data:

**Always Applied:**
- `audit` - Marks as audit finding
- `triaged` - Marks as fully analyzed

**From Priority:**
- `critical` - Critical priority
- `high` - High priority
- `medium` - Medium priority
- `low` - Low priority
- `blocker` - Added automatically for critical issues

**From Type:**
- `bug` - Bug finding
- `security` - Security finding
- `test-coverage` - Test coverage gap

**From Component:**
- `auth`, `ui`, `api`, `database`, `payment`, `mobile`, `performance`

**From Effort:**
- `effort/1h` - Quick fix
- `effort/2-4h` - Small change
- `effort/4-8h` - Medium complexity
- `effort/8h+` - Large change

---

## 📊 Issue Title Format

Issues are created with standardized titles:

```
[PRIORITY] Component: Title

Examples:
- [CRITICAL] auth: Login button not clickable
- [HIGH] database: Supabase 422 error with French characters
- [MEDIUM] ui: React DOM key prop warning
```

---

## 🔍 Validation

The script validates each finding before creating an issue:

**Required Fields Check:**
- Ensures `type`, `priority`, `title`, and `description` are present

**Type Validation:**
- Must be `bug`, `security`, or `test-coverage`

**Priority Validation:**
- Must be `critical`, `high`, `medium`, or `low`

**Error Handling:**
- Invalid findings are skipped with error message
- Script continues processing remaining findings
- Final summary shows success and failure counts

---

## 💡 Tips

### Tip 1: Use Example File as Template

Copy `example-findings.json` and modify:
```bash
cp .github/scripts/example-findings.json my-findings.json
# Edit my-findings.json with your findings
node .github/scripts/create-triaged-issues.js my-findings.json
```

### Tip 2: Test with Small Batches

Start with 1-2 findings to test the format, then scale up:
```json
{
  "findings": [
    // First test with just one finding
  ]
}
```

### Tip 3: Use Issue Numbers for Dependencies

After creating base issues, update `relatedIssues` with actual issue numbers:
```json
"relatedIssues": {
  "dependsOn": [10, 11],  // Real issue numbers
  "blocks": [12, 13]
}
```

### Tip 4: Batch Similar Issues

Group similar findings by component or type for easier creation:
```json
{
  "findings": [
    // All auth bugs
    { "type": "bug", "component": "auth", ... },
    { "type": "bug", "component": "auth", ... },
    // Then all UI bugs
    { "type": "bug", "component": "ui", ... }
  ]
}
```

### Tip 5: Save Findings File

Keep your findings JSON file for reference and documentation:
```bash
# Organize by audit phase
findings/
  ├── phase1-critical.json
  ├── phase2-high.json
  └── phase3-medium.json
```

---

## 🚨 Troubleshooting

### Error: GitHub CLI not installed

```bash
# Install GitHub CLI
brew install gh  # macOS
# or visit https://cli.github.com/
```

### Error: Not authenticated

```bash
# Authenticate with GitHub
gh auth login
```

### Error: Permission denied

Ensure you have write access to the repository.

### Error: Invalid JSON

Validate your JSON file:
```bash
# Use a JSON validator
cat my-findings.json | python -m json.tool
```

---

## 📚 Related Documentation

- [Triage Workflow](../TRIAGE_WORKFLOW.md) - Complete triage process
- [Issue Templates](../ISSUE_TEMPLATE/) - Manual issue creation
- [Labels Guide](../LABELS.md) - Label definitions
- [Sample Issues](../SAMPLE_TRIAGED_ISSUES.md) - Example triaged issues

---

## 🔄 Workflow Integration

### Manual Triage → Script

1. Review audit findings (Issues #1-3)
2. Extract findings manually into JSON
3. Run script to create issues
4. Review created issues
5. Add dependencies manually

### Hybrid Approach

1. Create CRITICAL issues manually (most important)
2. Use script for HIGH/MEDIUM/LOW issues (bulk)
3. Review and link dependencies

### Full Automation (Future)

Potential enhancements:
- Parse audit issues automatically
- Extract findings with AI/NLP
- Auto-detect dependencies
- Schedule periodic runs

---

**Version:** 1.0  
**Last Updated:** December 15, 2025  
**Maintained By:** Zyeuté V3 Development Team

🎭⚜️ **Made for Zyeuté - L'app sociale du Québec**
