# Automatic Validation Setup Guide

Complete guide to setting up automatic validation hooks for your Colony OS backend.

---

## 🎯 Available Options

Three ways to set up automatic validation:

1. **File Watcher** - Validates when bridge files change
2. **VS Code Tasks** - Run validation on-demand or on folder open
3. **Git Hooks** - Validate before every commit

---

## 🔧 Option 1: File Watcher (Recommended for Active Development)

### Setup

**Script Created**: `zyeute/scripts/watch-and-validate.ts`

### Usage

```bash
# Terminal 1: Start file watcher
cd zyeute
npx tsx scripts/watch-and-validate.ts
```

**What It Does**:
- Watches bridge files for changes
- Automatically runs validation 2 seconds after file save
- Shows validation results in real-time
- Continues watching until stopped (Ctrl+C)

### Features

- ✅ **Debouncing**: Waits 2 seconds after last change
- ✅ **Non-blocking**: Doesn't prevent file saves
- ✅ **Real-time feedback**: Shows results immediately
- ✅ **Background mode**: Can run while you code

### Files Watched

- `backend/services/windows-automation-bridge.ts`
- `backend/services/automation-service.ts`
- `Windows-Use/bridge_service.py`
- `Windows-Use/config.py`

---

## 🔧 Option 2: VS Code Tasks

### Setup

**File Created**: `.vscode/tasks.json`

### Usage

#### Run Single Validation

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "Validate Colony OS Backend"

#### Start File Watcher

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "Watch & Validate Bridge Files"

#### Check Database Connection

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "Check Supabase Connection"

### Features

- ✅ **Integrated**: Works within VS Code/Cursor
- ✅ **Keyboard shortcuts**: Can bind to keys
- ✅ **Terminal panel**: Shows results in dedicated panel
- ✅ **Multiple tasks**: Different validations available

---

## 🔧 Option 3: Git Hooks (Pre-commit)

### Setup

**File Created**: `.git/hooks/pre-commit`

### Usage

**Automatic**: Runs before every commit

**Manual**:
```bash
# Test hook manually
.git/hooks/pre-commit
```

### Features

- ✅ **Automatic**: Runs on every commit
- ✅ **Prevents bad commits**: Blocks commits if validation fails
- ✅ **Fast feedback**: Catches issues before pushing
- ✅ **Configurable**: Can skip with `--no-verify` (not recommended)

### What Happens

1. You commit changes
2. Git runs pre-commit hook
3. Hook runs validation script
4. If validation passes → Commit succeeds
5. If validation fails → Commit blocked (fix issues first)

---

## 🎯 Recommendation: Use All Three

### For Active Development
- **File Watcher**: Real-time validation as you code

### For Quick Checks
- **VS Code Tasks**: On-demand validation

### For Quality Assurance
- **Git Hooks**: Prevent bad commits

---

## ⚙️ Configuration

### File Watcher Settings

Edit `watch-and-validate.ts` to:
- Change debounce time (default: 2000ms)
- Add more files to watch
- Change validation script path

### VS Code Tasks

Edit `.vscode/tasks.json` to:
- Add more tasks
- Change command paths
- Customize presentation

### Git Hooks

Edit `.git/hooks/pre-commit` to:
- Add more validation steps
- Change validation script
- Customize error messages

---

## 🚀 Quick Start

### Option 1: File Watcher (2 minutes)

```bash
cd zyeute
npx tsx scripts/watch-and-validate.ts
```

**Result**: Automatic validation when bridge files change

---

### Option 2: VS Code Tasks (1 minute)

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Tasks: Run Task"
3. Select "Validate Colony OS Backend"

**Result**: On-demand validation

---

### Option 3: Git Hooks (Automatic)

```bash
# Make hook executable (if needed)
chmod +x .git/hooks/pre-commit

# Test manually
.git/hooks/pre-commit
```

**Result**: Automatic validation before commits

---

## 📊 Validation Triggers

| Trigger | When | What Validates |
|---------|------|----------------|
| **File Watcher** | File save | Bridge files |
| **VS Code Task** | Manual run | All backend |
| **Git Hook** | Before commit | All backend |
| **Super-Agent** | Manual command | Everything |

---

## ✅ Setup Checklist

### File Watcher
- [ ] Script exists: `zyeute/scripts/watch-and-validate.ts`
- [ ] Test run: `npx tsx scripts/watch-and-validate.ts`
- [ ] Verify it watches correct files
- [ ] Test by saving a bridge file

### VS Code Tasks
- [ ] File exists: `.vscode/tasks.json`
- [ ] Test task: "Validate Colony OS Backend"
- [ ] Verify results show in terminal panel
- [ ] Test file watcher task

### Git Hooks
- [ ] File exists: `.git/hooks/pre-commit`
- [ ] Make executable: `chmod +x .git/hooks/pre-commit`
- [ ] Test manually: `.git/hooks/pre-commit`
- [ ] Test with commit: `git commit` (should trigger)

---

## 🔥 Pro Tips

1. **Use File Watcher for Development**: Real-time feedback as you code
2. **Use VS Code Tasks for Quick Checks**: On-demand validation
3. **Use Git Hooks for Quality**: Prevent bad commits
4. **Use Super-Agent for Full Validation**: Complete system check
5. **Combine All Three**: Maximum coverage and safety

---

## 🚨 Troubleshooting

### Issue: File Watcher Not Starting

**Error**: `Cannot find module 'fs'`

**Fix**: Node.js version issue, use `tsx` with correct Node version

---

### Issue: VS Code Tasks Not Running

**Error**: Task not found

**Fix**: Reload VS Code/Cursor window (`Cmd/Ctrl + Shift + P` → "Reload Window")

---

### Issue: Git Hook Not Running

**Error**: Hook not executing

**Fix**:
1. Verify file exists: `.git/hooks/pre-commit`
2. Make executable: `chmod +x .git/hooks/pre-commit`
3. Test manually: `.git/hooks/pre-commit`

---

## 📚 Related Resources

- **File Watcher Script**: `zyeute/scripts/watch-and-validate.ts`
- **VS Code Tasks**: `.vscode/tasks.json`
- **Git Hooks**: `.git/hooks/pre-commit`
- **Validation Script**: `zyeute/scripts/run-final-validation.ts`
- **Super-Agent Command**: `SUPER_AGENT_VALIDATION_COMMAND.md`

---

**Automatic validation keeps your Colony OS backend healthy!** 🚀
