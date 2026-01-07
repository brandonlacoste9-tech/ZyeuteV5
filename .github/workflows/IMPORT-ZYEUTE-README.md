# Import Zyeute Workflow Documentation

This document provides complete instructions for using the `import-zyeute.yml` workflow to import the Zyeute repository into your monorepo as a git subtree.

## Overview

The workflow automates the process of:
- Fetching the Zyeute source repository
- Creating a timestamped import branch
- Importing/updating Zyeute as a subtree in the `zyeute/` directory
- Running npm install and tests (if applicable)
- Creating a pull request with the changes

## Ready to Run Checklist

Before running this workflow, ensure all prerequisites are met:

### ✅ 1. Personal Access Token (PAT)

**Create a PAT with `repo` scope:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: `Zyeute Import Workflow`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

**Save it as a repository secret:**

1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `PAT`
4. Value: paste your token
5. Click "Add secret"

### ✅ 2. Source Repository Configuration

**Verify these values in `import-zyeute.yml`:**

```yaml
SOURCE_REPO: "https://github.com/brandonlacoste9-tech/ZyeuteV5.git"
SOURCE_BRANCH: "main"
```

- `SOURCE_REPO`: Currently set to this repository
- `SOURCE_BRANCH`: Currently set to "main" (change if your default branch is different)

### ✅ 3. Runner Tools

The workflow requires these tools (pre-installed on `ubuntu-latest`):
- ✅ `git`
- ✅ `curl`
- ✅ `jq`

**For Git LFS support** (if needed), add this step before subtree operations:

```yaml
- name: Install Git LFS
  run: |
    sudo apt-get update
    sudo apt-get install -y git-lfs
    git lfs install
    cd <source-path>
    git lfs fetch --all
```

### ✅ 4. Permissions

If your monorepo has branch protection:
- The PAT must belong to a user with push rights
- OR allow the workflow to bypass branch protection
- OR configure the workflow to push to unprotected branches only

---

## How to Trigger the Workflow

### Method 1: GitHub UI (Recommended)

1. Go to your repository
2. Click **Actions** tab
3. Select **import-zyeute** from the workflows list (left sidebar)
4. Click **Run workflow** button (top right)
5. Select the branch (usually `main`)
6. Click **Run workflow**

### Method 2: GitHub CLI

```bash
gh workflow run import-zyeute.yml \
  --repo brandonlacoste9-tech/ZyeuteV5 \
  --ref main
```

### Method 3: cURL (API)

```bash
curl -X POST \
  -H "Authorization: token $PAT" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/brandonlacoste9-tech/ZyeuteV5/actions/workflows/import-zyeute.yml/dispatches" \
  -d '{"ref":"main"}'
```

---

## What to Expect During the Run

### Step-by-Step Execution:

1. **Branch Creation**
   - Creates: `import/zyeute-<timestamp>`
   - Example: `import/zyeute-1704625200`

2. **Source Fetch**
   - Adds remote: `zyeute-src`
   - Fetches all branches and tags

3. **Subtree Import**
   - **First run**: `git subtree add --prefix=zyeute zyeute-src main`
   - **Subsequent runs**: `git subtree pull --prefix=zyeute zyeute-src main`

4. **Dependency Installation** (if `zyeute/package.json` exists)
   - Runs: `npm ci --no-audit --no-fund`
   - Runs: `npm test || echo "Tests failed but continuing"`

5. **Commit & Push**
   - Commits changes with message: `"chore: import zyeute via CI"`
   - Pushes to: `import/zyeute-<timestamp>`

6. **Pull Request Creation**
   - Title: "Import zyeute"
   - Body: "Automated import of zyeute into monorepo"
   - Base: `main`
   - Prints PR URL in logs

### Expected Duration:
- Small repos: 1-2 minutes
- Large repos: 5-10 minutes
- Repos with LFS: 10-20 minutes

---

## Common Failures and Fixes

### ❌ Access denied / Authentication errors

**Symptoms:**
```
fatal: could not read Username for 'https://github.com': No such device or address
fatal: Authentication failed
```

**Cause:** Runner lacks permission to fetch or push

**Fix:**
1. Verify `secrets.PAT` is set correctly
2. Ensure PAT has `repo` scope
3. Check PAT hasn't expired
4. Verify PAT user has repository access

### ❌ Subtree add failed because prefix exists

**Symptoms:**
```
fatal: prefix 'zyeute' already exists.
```

**Cause:** `zyeute/` directory already exists and isn't tracked as a subtree

**Fix:**
The workflow handles this automatically with:
```bash
if [ ! -d "zyeute" ]; then
  git subtree add --prefix=zyeute zyeute-src "$SOURCE_BRANCH"
else
  git subtree pull --prefix=zyeute zyeute-src "$SOURCE_BRANCH"
fi
```

If you need a fresh import:
```bash
git rm -r zyeute
git commit -m "Remove existing zyeute directory"
# Then re-run the workflow
```

### ❌ Large repo or Git LFS errors

**Symptoms:**
```
Git LFS: (0 of X files) 0 B / Y MB
Error downloading object
```

**Cause:** Source repo uses LFS or is very large

**Fix:**
1. Add Git LFS support (see section above)
2. Increase job timeout:
```yaml
jobs:
  import:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Default is 360
```

### ❌ PR creation fails

**Symptoms:**
```
PR creation failed
{"message": "Bad credentials", "documentation_url": "..."}
```

**Cause:** Insufficient token scope or API rate limits

**Fix:**
1. Verify PAT has `repo` scope (not just `public_repo`)
2. Check PAT is stored in `secrets.PAT` (not `secrets.GITHUB_TOKEN`)
3. Review workflow logs for exact API error message

### ❌ Tests fail and block workflow

**Symptoms:**
```
npm test exited with code 1
Error: Process completed with exit code 1.
```

**Current behavior:** Tests continue even if they fail (`|| echo "Tests failed but continuing"`)

**To make tests block PR creation:**
```yaml
- name: Install dependencies and run tests
  run: |
    if [ -d "zyeute" ]; then
      cd zyeute || exit 0
      if [ -f package.json ]; then
        npm ci --no-audit --no-fund
        npm test  # Remove the || echo fallback
      fi
      cd ..
    fi
```

---

## Workflow Customization Options

### Add npm caching for faster runs:

```yaml
- name: Setup Node.js with caching
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: 'zyeute/package-lock.json'
```

### Make PR title/base configurable:

```yaml
on:
  workflow_dispatch:
    inputs:
      pr_title:
        description: 'Pull request title'
        required: false
        default: 'Import zyeute'
      base_branch:
        description: 'Target branch for PR'
        required: false
        default: 'main'
```

Then use: `${{ inputs.pr_title }}` and `${{ inputs.base_branch }}`

### Add Git LFS support:

See "Runner Tools" section above for installation steps.

---

## Logs and Diagnostics

When a run fails, provide these log excerpts for troubleshooting:

### What to include:
1. **Git fetch output** and any `fatal:` lines
2. **Git subtree command output** and error block
3. **Git push or curl PR creation** error block

### Where to find logs:
1. Go to repository → Actions tab
2. Click on the failed workflow run
3. Click on the "import" job
4. Expand the failed step
5. Copy relevant error messages (filter out progress/info lines)

### Example useful log snippet:
```
Run git fetch zyeute-src --tags --prune
fatal: unable to access 'https://github.com/...': The requested URL returned error: 403
Error: Process completed with exit code 128.
```

---

## Support and Troubleshooting

For issues not covered here:

1. **Review the workflow file**: `.github/workflows/import-zyeute.yml`
2. **Check workflow runs**: Actions tab → import-zyeute
3. **Verify secrets**: Settings → Secrets and variables → Actions
4. **Test PAT manually**:
   ```bash
   curl -H "Authorization: token $PAT" \
     https://api.github.com/repos/brandonlacoste9-tech/ZyeuteV5
   ```

---

## Additional Resources

- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Git subtree documentation](https://git-scm.com/book/en/v2/Git-Tools-Subtree-Merging)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub REST API - Pull Requests](https://docs.github.com/en/rest/pulls/pulls)

---

**Last Updated:** January 7, 2026
**Workflow Version:** 2.0 (Refactored with PAT authentication and API PR creation)
