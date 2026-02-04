# Security Audit Guide: "Scan the Hive"

**Purpose:** Comprehensive security scan for leaked secrets, API keys, and sensitive data  
**When to Run:** Before committing, before deploying, or periodically

---

## Quick Start

### Run Security Audit

```bash
npm run audit:security
```

### Verbose Mode (Show All Findings)

```bash
npm run audit:security:verbose
```

---

## What It Scans For

### 🔴 Critical Severity

- **Private Keys** (`-----BEGIN PRIVATE KEY-----`)
- **RSA Private Keys** (`-----BEGIN RSA PRIVATE KEY-----`)
- **Service Account JSON** (inline JSON with private keys)
- **Database Connection Strings** (with passwords)
- **Stripe Live Keys** (`sk_live_...`)

### 🟠 High Severity

- **Dialogflow Agent IDs** (`AQ.xxx...`)
- **Google API Keys** (`AIza...`)
- **Supabase Service Role Keys** (JWT tokens)
- **AWS Access Keys** (`AKIA...`)
- **GitHub Tokens** (`ghp_...`)

### 🟡 Medium Severity

- **Stripe Test Keys** (`sk_test_...`)
- **Slack Tokens** (`xoxb-...`)

---

## What It Ignores

- **Placeholders:** Patterns like `YOUR_`, `placeholder`, `example`
- **Gitignored Files:** `.env`, `node_modules`, `dist`, etc.
- **Binary Files:** Images, fonts, videos, PDFs
- **Documentation:** Safe patterns in docs are flagged but context-checked

---

## Example Output

```
🛡️  Security Audit: Scanning the Hive...

📊 Scanning 1247 files...

🔴 CRITICAL (1):

   backend/config.ts:42
   Pattern: Private Key
   Match: -----BEGIN PRIVATE KEY-----\nMIIEvQIBA...

🟠 HIGH (2):

   docs/example.md:15
   Pattern: Dialogflow Agent ID
   Match: AQ.Ab8RN6JXQGPlRh_wZvOyiRAWgsgC3XIVpUfILZkPUy_-RrUlNg

📊 Summary:
   Critical: 1
   High: 2
   Medium: 0
   Total files scanned: 1247

❌ Security issues found!
```

---

## Fixing Issues

### 1. Remove Sensitive Data

If found in code:

- Remove the hardcoded value
- Replace with `process.env.VARIABLE_NAME`
- Add to `.env` file (gitignored)

### 2. Use Placeholders in Docs

If found in documentation:

- Replace with `YOUR_KEY_HERE` or `placeholder`
- Add note: "Replace with actual value"

### 3. Verify .gitignore

Ensure sensitive files are gitignored:

- `.env`
- `*.key.json`
- `.secrets/`
- Service Account JSON files

---

## Integration with CI/CD

### Pre-Commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run audit:security
```

### GitHub Actions

Add to `.github/workflows/security.yml`:

```yaml
- name: Security Audit
  run: npm run audit:security
```

---

## Max Integration

Max can run this audit via WhatsApp:

**Command to Max:**

```
Max, scan the hive for security issues
```

**Max's Response:**

- Runs `npm run audit:security`
- Reports findings
- Suggests fixes

---

## Best Practices

1. **Run Before Committing:**

   ```bash
   npm run audit:security
   ```

2. **Run Before Deploying:**

   ```bash
   npm run audit:security:verbose
   ```

3. **Run Periodically:**
   - Weekly security scans
   - After adding new integrations
   - After pulling from remote

4. **Fix Immediately:**
   - Don't commit with critical/high findings
   - Fix issues before pushing

---

## Security Layers

| Layer          | Protection         | Status                   |
| -------------- | ------------------ | ------------------------ |
| **Code**       | Placeholders only  | ✅ Verified by audit     |
| **.env**       | Gitignored         | ✅ Safe                  |
| **Production** | Render env vars    | ✅ Encrypted             |
| **Secrets**    | GCP Secret Manager | ⚪ Recommended next step |

---

## Troubleshooting

### False Positives

If the audit flags something that's safe:

1. **Check Context:**
   - Is it a placeholder? (`YOUR_`, `example`)
   - Is it in documentation?
   - Is it in a gitignored file?

2. **Verify:**
   - Run with `--verbose` to see full context
   - Check if file is actually committed (`git ls-files`)

### Missing Findings

If you know there's an issue but audit doesn't find it:

1. **Check Patterns:**
   - Review `SENSITIVE_PATTERNS` in script
   - Add custom patterns if needed

2. **Check Scope:**
   - Verify file is in `FILES_TO_SCAN`
   - Check if file is skipped by `SKIP_PATTERNS`

---

**Run `npm run audit:security` regularly to keep your Hive secure!** 🛡️🐝
