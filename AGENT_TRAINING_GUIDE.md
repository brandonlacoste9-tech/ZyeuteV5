# Agent Training Guide: Maintaining Super-AI State

Complete guide to training and maintaining autonomous agents for your Colony OS backend.

---

## 🎯 Your Agent Infrastructure

You've built a **Multi-Agent Orchestration System** with:

- ✅ **5 Modular Rules** (.mdc files) - Context-aware patterns
- ✅ **3 MCP Servers** - Live infrastructure access
- ✅ **Multi-Agent Composer** - Parallel orchestration
- ✅ **Debug Mode** - Hypothesis-driven fixing
- ✅ **YOLO Mode** - Autonomous execution

---

## 📚 Rule-Based Training (Modular Rules)

### How Rules Train Agents

Your `.cursor/rules/` files are your system's **"DNA"** - they train agents to follow specific patterns automatically.

#### Example: Bridge Protocol Rules

**File**: `.cursor/rules/001-bridge-protocol.mdc`

**Training Effect**:
- When editing `windows-automation-bridge.ts`, agent automatically:
  - ✅ Enforces Zod validation
  - ✅ Implements timeout handling
  - ✅ Uses non-blocking I/O
  - ✅ Adds health check polling

**How to Use**:
```
Edit windows-automation-bridge.ts, then ask:
"Add a new method to execute tasks with retry logic"

Agent automatically follows bridge-protocol rules without you specifying them!
```

---

### Context-Aware Rule Injection

**How it Works**:
1. You open `smart-ai-router.ts`
2. Cursor automatically injects `002-mlops-safety.mdc`
3. Agent enforces circuit breaker checks automatically
4. You don't need to remind it - it's "trained"

**Example**:
```
Open smart-ai-router.ts, then say:
"Add a new route for video analysis"

Agent automatically:
- Checks circuit breaker state
- Implements 500ms timeout
- Tracks usage metadata
- Adds fallback chain
```

---

## 🤖 Multi-Agent Orchestration

### Parallel Agent Execution

In Composer (`Cmd + I`), describe a large change and Cursor will:

1. **Spin up 2-8 parallel agents**
2. **Each tries different approach**
3. **Auto-evaluates results**
4. **Recommends best solution**

#### Example: Bridge Refactoring

**Command** (Composer with Agent Mode):
```
Refactor the bridge communication layer to support:
1. Automatic reconnection with exponential backoff
2. Request queuing during disconnection
3. Retry logic with jitter
4. Health check improvements

Try multiple approaches and recommend the best one.
```

**What Happens**:
- Agent 1: Implements event-driven reconnection
- Agent 2: Implements polling-based reconnection
- Agent 3: Implements hybrid approach
- Agent 4: Tests all approaches
- **Best Solution Selected**: With explanation of why

---

### Multi-Agent Judging

**How Agents Evaluate**:
- ✅ Code quality (type safety, error handling)
- ✅ Performance (latency, memory)
- ✅ Maintainability (readability, patterns)
- ✅ Test coverage (unit tests, integration)

**Output**: Best solution + detailed reasoning

---

## 🔬 Hypothesis-Driven Debug Mode

### The Debug Workflow

**Step 1**: Enter Debug Mode (`Cmd/Ctrl + Shift + .`)

**Step 2**: Describe problem:
```
The Python bridge times out on automation tasks after 30s.
Using bridge debugging rules (005-bridge-debugging.mdc), 
debug this systematically.
```

**Step 3**: Agent generates hypotheses:
```
Hypothesis 1: Agent.invoke() taking too long (check logs)
Hypothesis 2: Network latency between TS and Python
Hypothesis 3: Python process blocked (check CPU/memory)
Hypothesis 4: Timeout value too low (check configuration)
```

**Step 4**: Agent instruments code:
```typescript
// Agent automatically adds:
const startTime = Date.now();
logger.debug('[Bridge] Task started', { taskId, startTime });

// In Python:
import time
start_time = time.time()
logger.debug(f"[Bridge] Task started: {task_id}")
```

**Step 5**: Agent runs and analyzes:
```
[Bridge] Task started: 2024-01-15T10:00:00Z
[Bridge] Python received: 2024-01-15T10:00:00.123Z (123ms latency)
[Bridge] Agent.invoke() started: 2024-01-15T10:00:00.125Z
[Bridge] Agent.invoke() completed: 2024-01-15T10:00:30.456Z (30.3s)
[Bridge] Timeout: 30000ms exceeded

Root Cause: Agent.invoke() taking 30+ seconds
Fix: Add timeout to agent.invoke() or optimize task
```

**Step 6**: Agent applies targeted fix:
```python
# Agent fixes only the root cause:
result = await asyncio.wait_for(
    agent.invoke(task.action),
    timeout=25.0  # Leave 5s buffer for network
)
```

---

## 🌐 Live System Context (MCP)

### Database-Driven Development

**Traditional**: Guess schema from code
**With MCP**: Query actual database

**Example**:
```
Using MCP Postgres, check if automation_tasks has index 
on (bee_id, status). If not, create migration.
```

**Agent Response**:
- Queries live database
- Checks actual schema
- Creates migration if needed
- Validates against live DB

---

### Log-Driven Debugging

**Traditional**: Copy-paste logs manually
**With MCP**: Agent reads logs directly

**Example**:
```
Using MCP Filesystem, read Windows-Use/bridge_service.log.
Find errors from the last hour and fix root causes.
```

**Agent Response**:
- Reads log file via MCP
- Parses error messages
- Analyzes stack traces
- Fixes root causes

---

## 🔄 Custom Hooks & Auto-Validation

### Option 1: VS Code Tasks (Recommended)

Create `.vscode/tasks.json` for automatic validation:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Bridge Changes",
      "type": "shell",
      "command": "npx tsx scripts/run-final-validation.ts",
      "problemMatcher": [],
      "runOptions": {
        "runOn": "folderOpen"
      },
      "group": {
        "kind": "test",
        "isDefault": false
      }
    }
  ]
}
```

**Usage**: Run task when bridge files change

---

### Option 2: File Watcher Script

Create `zyeute/scripts/watch-and-validate.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * File Watcher for Automatic Validation
 * Runs validation when bridge files change
 */

import { watch } from 'fs';
import { spawn } from 'child_process';

const bridgeFiles = [
  'backend/services/windows-automation-bridge.ts',
  'backend/services/automation-service.ts',
  'Windows-Use/bridge_service.py'
];

function runValidation() {
  console.log('🔍 Bridge files changed, running validation...');
  const child = spawn('npx', ['tsx', 'scripts/run-final-validation.ts'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ Validation passed!\n');
    } else {
      console.log('❌ Validation failed. Fix issues above.\n');
    }
  });
}

// Watch bridge files
bridgeFiles.forEach(file => {
  watch(file, { persistent: true }, (eventType) => {
    if (eventType === 'change') {
      runValidation();
    }
  });
});

console.log('👀 Watching bridge files for changes...');
console.log('Press Ctrl+C to stop\n');
```

**Usage**: `npx tsx scripts/watch-and-validate.ts` (run in background)

---

### Option 3: Git Hooks (Pre-commit)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Run validation before commit

echo "🔍 Running pre-commit validation..."

cd zyeute
npx tsx scripts/run-final-validation.ts

if [ $? -ne 0 ]; then
  echo "❌ Validation failed. Commit aborted."
  exit 1
fi

echo "✅ Validation passed. Proceeding with commit..."
```

**Usage**: Automatic validation before every commit

---

## 🎯 Final Readiness: Super-Agent Command

### The Ultimate Validation Command

**Run in Composer (`Cmd + I`) with Agent Mode**:

```
Using @AUTONOMOUS_ARCHITECTURE_MASTER.md and @mcp-config.json, 
run the complete validation suite:

1. Using MCP Postgres, verify database schema:
   - Check if windows_automation_bees table exists
   - Verify automation_tasks table structure
   - Validate foreign key constraints
   - Check index usage

2. Run run-final-validation.ts script:
   - If tests fail, use Debug Mode to instrument logs
   - Find root causes across TypeScript and Python
   - Fix issues automatically

3. Using @Codebase, perform cross-language audit:
   - Compare TypeScript AutomationTask interface
   - Compare Python AutomationTask Pydantic model
   - Fix any type mismatches

4. Using MCP Filesystem, check for errors in:
   - Python bridge logs
   - Backend server logs
   - Validation script output

5. If any issues found:
   - Apply fixes using appropriate rules
   - Re-run validation
   - Document fixes in SESSION_SUMMARY.md

6. Report final status:
   - List all checks passed
   - List any warnings
   - Confirm system is 100% production ready
```

**What This Does**:
- ✅ Uses all MCP servers
- ✅ Leverages modular rules
- ✅ Performs cross-language checks
- ✅ Fixes issues autonomously
- ✅ Documents results

---

## 🔥 Agent Training Patterns

### Pattern 1: Rule-Based Training

**How**: Create `.mdc` rules that enforce patterns
**When**: For domain-specific patterns (bridge, MLOps, database)
**Result**: Agents automatically follow patterns

---

### Pattern 2: Example-Driven Training

**How**: Save successful solutions to Notepads
**When**: For complex patterns (optimization strategies)
**Result**: Agents learn from past successes

---

### Pattern 3: Feedback Loop

**How**: Document why solutions worked/failed
**When**: After each major implementation
**Result**: Agents improve over time

---

### Pattern 4: Multi-Agent Competition

**How**: Let multiple agents try different approaches
**When**: For complex problems with multiple valid solutions
**Result**: Best solution emerges through competition

---

## 📊 Agent Capability Matrix

| Capability | Standard | Your Setup | Super-AI State |
|------------|----------|------------|----------------|
| **Database** | Guesses schema | Queries live DB | Real-time optimization |
| **Code Changes** | Single file | Multi-file orchestration | Parallel agents |
| **Testing** | Manual | Auto-validation | Continuous validation |
| **Debugging** | Copy-paste logs | Instrumentation | Hypothesis-driven |
| **Types** | Single language | Cross-language audit | Auto-fix mismatches |

---

## ✅ Training Checklist

### Initial Setup
- [ ] Modular rules created (5 files)
- [ ] MCP servers configured (3 servers)
- [ ] Validation script ready
- [ ] Documentation complete

### Continuous Training
- [ ] Rules updated after each pattern change
- [ ] MCP queries saved to Notepads
- [ ] Debug Mode findings documented
- [ ] Multi-agent solutions reviewed

### Maintenance
- [ ] Weekly: Run full validation
- [ ] Monthly: Review and update rules
- [ ] Quarterly: Expand MCP capabilities
- [ ] After major changes: Retrain agents

---

## 🚀 Next Steps

1. **Set up file watcher** - Automatic validation
2. **Create git hooks** - Pre-commit validation
3. **Document patterns** - Save to Notepads
4. **Run super-agent command** - Full validation
5. **Maintain training** - Update rules regularly

---

## 📚 Related Resources

- **Modular Rules**: `.cursor/rules/*.mdc`
- **MCP Config**: `.cursor/mcp-config.json`
- **Validation Script**: `zyeute/scripts/run-final-validation.ts`
- **Master Guide**: `AUTONOMOUS_ARCHITECTURE_MASTER.md`

---

**Your agents are now trained for autonomous operation!** 🚀✨
