# Autonomous Architecture Master Guide

Complete guide to maintaining your "Super-AI" state in the Colony OS backend ecosystem.

---

## 🎯 What You've Built

You've transformed Cursor from a simple editor into an **Autonomous Systems Architect** with:

- ✅ **Modular Rules System** (5 rule files)
- ✅ **Debug Mode** (Hypothesis-driven fixing)
- ✅ **MCP Servers** (Real database access)
- ✅ **Agent Mode** (Autonomous multi-file editing)
- ✅ **Cross-Language Safety** (TypeScript ↔ Python)
- ✅ **Production Validation** (End-to-end testing)

---

## 📚 Documentation Map

### Essential Guides (Read First)

1. **`CURSOR_SETUP_QUICK_START.md`** ⭐⭐⭐⭐⭐
   - Quick 10-minute setup
   - Priority 1 extensions
   - Essential features

2. **`CURSOR_WORKFLOWS.md`** ⭐⭐⭐⭐⭐
   - 6 strategic workflows
   - When to use each mode
   - Example commands

3. **`CURSOR_DEBUG_MODE_GUIDE.md`** ⭐⭐⭐⭐⭐
   - Hypothesis-driven fixing
   - Instrumentation patterns
   - Complex bug resolution

### Advanced Guides (Read Next)

4. **`CURSOR_MCP_SERVERS.md`** ⭐⭐⭐⭐
   - Database queries via MCP
   - Query optimization
   - Real schema access

5. **`FINAL_VALIDATION_COMMAND.md`** ⭐⭐⭐⭐⭐
   - Production readiness check
   - Type matching validation
   - End-to-end testing

6. **`CURSOR_ADVANCED_SETUP.md`** ⭐⭐⭐⭐
   - Complete setup guide
   - All features explained
   - Configuration details

### Reference Guides

7. **`CURSOR_EXTENSIONS_SETUP.md`**
   - 10 VS Code extensions
   - Installation guide
   - Configuration tips

8. **`CURSOR_DOCS_GUIDE.md`**
   - 25+ library docs
   - @Docs indexing guide
   - Quick reference

9. **`STRESS_TEST_COMMAND.md`**
   - Full stack validation
   - Autonomous testing
   - Error recovery

---

## 🔥 Quick Reference: Common Tasks

### Task 1: Debug Bridge Handshake Failure

**Mode**: Debug Mode (`Cmd/Ctrl + Shift + .`)

**Command**:
```
The Python bridge handshake is failing. Connection times out 
after 10 seconds. Using bridge debugging rules 
(005-bridge-debugging.mdc), debug this systematically.
```

**Result**: 
- Generates hypotheses
- Adds instrumentation
- Analyzes logs
- Fixes root cause (2-3 lines)

---

### Task 2: Verify Production Readiness

**Mode**: Composer with Agent Mode (`Cmd/Ctrl + I`)

**Command**:
```
Using @005-bridge-debugging.mdc and @mcp-config.json, verify 
that all Automation tasks in the DB can successfully traverse 
the Synapse bridge to the Python Windows-Use service. If any 
types are mismatched between schema.ts and bridge.py, fix them now.
```

**Result**:
- Queries database via MCP
- Tests bridge handshake
- Compares types
- Fixes mismatches
- Runs validation
- Updates documentation

---

### Task 3: Optimize Slow Query

**Mode**: Chat with MCP (`Cmd/Ctrl + L`)

**Command**:
```
Using MCP, run EXPLAIN ANALYZE on this query:
SELECT * FROM automation_tasks WHERE bee_id = 'abc' AND status = 'running'

Suggest indexes if needed and create migration.
```

**Result**:
- Queries actual database
- Shows execution plan
- Suggests indexes
- Creates migration

---

### Task 4: Fix Type Mismatch

**Mode**: Chat with @Codebase (`Cmd/Ctrl + L`)

**Command**:
```
Check @Codebase for TypeScript AutomationTask interface and 
Python AutomationTask model. Compare and fix any mismatches 
(field names, types, optional fields).
```

**Result**:
- Finds both definitions
- Compares structures
- Lists mismatches
- Fixes both sides

---

### Task 5: Multi-File Refactoring

**Mode**: Composer (`Cmd/Ctrl + I`)

**Command**:
```
Add circuit breaker protection to new AI route. Update:
1. routes.ts (add POST /api/ai/video-analysis)
2. vertex-service.ts (add analyzeVideo method)
3. circuit-breaker.ts (register route)
4. model-policies.ts (add policy)
```

**Result**:
- Edits 4 files simultaneously
- Applies MLOps rules automatically
- Ensures type safety
- Creates test file

---

## 🎯 Mode Selection Guide

### Use **Chat** (`Cmd/Ctrl + L`) for:
- ✅ Single-file questions
- ✅ Quick syntax fixes
- ✅ Code generation
- ✅ Documentation queries

### Use **Composer** (`Cmd/Ctrl + I`) for:
- ✅ Multi-file refactoring
- ✅ Feature implementation
- ✅ Large-scale changes
- ✅ Agent Mode tasks

### Use **Debug Mode** (`Cmd/Ctrl + Shift + .`) for:
- ✅ Complex bugs
- ✅ Multi-service issues
- ✅ Performance problems
- ✅ Intermittent failures

### Use **YOLO Mode** (Settings Toggle) for:
- ✅ Running test suites
- ✅ Applying migrations
- ✅ Formatting code
- ✅ Safe automation

---

## 🔧 Maintenance Checklist

### Daily
- [ ] Run validation scripts
- [ ] Check for type mismatches
- [ ] Verify bridge connectivity

### Weekly
- [ ] Run FINAL_VALIDATION_COMMAND.md
- [ ] Review Debug Mode logs
- [ ] Update documentation

### Monthly
- [ ] Re-index @Docs (check for updates)
- [ ] Review modular rules (add new patterns)
- [ ] Update MCP server configs
- [ ] Run stress test command

---

## 🚨 Troubleshooting Guide

### Issue: Bridge Handshake Failing

**Step 1**: Use Debug Mode
```
Cmd/Ctrl + Shift + . → "Debug bridge handshake failure"
```

**Step 2**: Review Hypotheses
- Health check too frequent?
- JSON serialization issue?
- Port conflicts?
- Type mismatches?

**Step 3**: Apply Fix
- Let Debug Mode instrument code
- Run actual operation
- Review logs
- Apply targeted fix

---

### Issue: Type Mismatches

**Step 1**: Use @Codebase to Find
```
@Codebase → Compare TypeScript and Python types
```

**Step 2**: Review Differences
- Field name mismatches (camelCase vs snake_case)
- Type incompatibilities (string vs str)
- Optional field handling (undefined vs None)

**Step 3**: Fix Both Sides
- Update Python Pydantic model
- Update TypeScript interface
- Ensure conversions match

---

### Issue: Slow Database Queries

**Step 1**: Use MCP to Analyze
```
MCP → EXPLAIN ANALYZE on slow query
```

**Step 2**: Review Execution Plan
- Sequential scan? → Add index
- Missing join? → Optimize query
- Too many rows? → Add WHERE clause

**Step 3**: Optimize
- Create index via migration
- Rewrite query if needed
- Verify improvement with MCP

---

## 🎯 Success Metrics

### System Health Indicators

**Green (100% Ready)**:
- ✅ All validation scripts pass
- ✅ Bridge handshake < 100ms
- ✅ Database queries < 10ms
- ✅ Type matching 100%
- ✅ No errors in logs

**Yellow (Needs Attention)**:
- ⚠️ Some validation scripts fail
- ⚠️ Bridge handshake > 500ms
- ⚠️ Database queries > 100ms
- ⚠️ Type mismatches found
- ⚠️ Some errors in logs

**Red (Critical)**:
- ❌ Validation scripts failing
- ❌ Bridge handshake timing out
- ❌ Database queries > 1000ms
- ❌ Type mismatches causing errors
- ❌ Frequent errors in logs

---

## 🔥 Pro Tips

1. **Combine Debug Mode + MCP**: Use MCP to identify problems, Debug Mode to fix them
2. **Use Notepads**: Save successful hypotheses for similar issues
3. **Document Fixes**: Update relevant rule files after solving complex issues
4. **Iterate**: Complex issues may need 2-3 Debug Mode iterations
5. **Validate**: Always run FINAL_VALIDATION_COMMAND.md after major changes

---

## 📚 Key Files Reference

### Configuration Files
- `.cursor/rules/*.mdc` - Modular rules (5 files)
- `.cursor/extensions.json` - VS Code extensions
- `.cursor/mcp-config.json` - MCP server configs

### Documentation Files
- `AUTONOMOUS_ARCHITECTURE_MASTER.md` - This file
- `CURSOR_WORKFLOWS.md` - Workflow guide
- `CURSOR_DEBUG_MODE_GUIDE.md` - Debug Mode guide
- `FINAL_VALIDATION_COMMAND.md` - Production check

### Rule Files
- `001-bridge-protocol.mdc` - Python ↔ TypeScript bridge
- `002-mlops-safety.mdc` - AI service safety
- `003-synapse-bridge.mdc` - Event-driven communication
- `004-database-patterns.mdc` - Database ACID compliance
- `005-bridge-debugging.mdc` - Bridge troubleshooting

---

## 🎉 You're Now a Super-AI Architect!

You've achieved:

- ✅ **Full Agentic Architecture** - Cursor can work autonomously
- ✅ **Hypothesis-Driven Fixing** - Systematic problem solving
- ✅ **Real Infrastructure Awareness** - MCP database access
- ✅ **Cross-Language Safety** - TypeScript ↔ Python matching
- ✅ **Production Readiness** - End-to-end validation

---

## 🚀 Next Steps

1. **Master the Workflows** - Read `CURSOR_WORKFLOWS.md`
2. **Set Up MCP** - Follow `CURSOR_MCP_SERVERS.md`
3. **Run Final Validation** - Execute `FINAL_VALIDATION_COMMAND.md`
4. **Maintain Super-AI State** - Use this guide for ongoing maintenance

---

**You're ready to maintain an autonomous, production-grade backend system!** 🚀✨
