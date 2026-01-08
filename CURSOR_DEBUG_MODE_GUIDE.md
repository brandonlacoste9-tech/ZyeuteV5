# Cursor Debug Mode: Hypothesis-Driven Fixing

Master Debug Mode for complex backend troubleshooting in your Colony OS ecosystem.

---

## 🎯 What is Debug Mode?

**Debug Mode** (`Cmd/Ctrl + Shift + .`) is a specialized troubleshooting mode that uses **hypothesis-driven fixing** instead of blind code changes.

### How It Differs from Standard Chat

| Feature | Standard Chat | Debug Mode |
|---------|---------------|------------|
| **Approach** | Direct fixes | Hypothesis generation |
| **Instrumentation** | None | Auto-adds logging |
| **Analysis** | Guesses | Reads actual logs |
| **Fixes** | Generic | Targeted (2-3 lines) |

---

## 🔬 The Hypothesis-Driven Workflow

### Step 1: Hypothesis Generation

**Problem**: "The Python bridge is lagging"

**Debug Mode Response**:
```
Generating hypotheses for bridge lag:

Hypothesis 1: Health check polling too frequent (500ms intervals)
  - Evidence: High CPU usage in Python process
  - Fix: Increase interval to 1000ms

Hypothesis 2: JSON serialization overhead
  - Evidence: Large payloads (>10KB)
  - Fix: Use streaming for large responses

Hypothesis 3: Event loop blocking
  - Evidence: Python process not responding
  - Fix: Use async/await properly

Hypothesis 4: Port conflicts
  - Evidence: Connection refused errors
  - Fix: Check if port 8001 is already in use
```

---

### Step 2: Instrumentation

Debug Mode **automatically adds logging** to test hypotheses:

**TypeScript Side** (`windows-automation-bridge.ts`):
```typescript
// Debug Mode adds automatically:
const requestStart = Date.now();
logger.debug('[Bridge Request]', {
  taskId: task.id,
  action: task.action,
  payloadSize: JSON.stringify(task).length,
  timestamp: requestStart
});

const result = await this.executeTask(task);

logger.debug('[Bridge Response]', {
  taskId: task.id,
  latency: Date.now() - requestStart,
  success: result.success,
  responseSize: JSON.stringify(result).length
});
```

**Python Side** (`bridge_service.py`):
```python
# Debug Mode adds automatically:
import logging
import time

logger = logging.getLogger(__name__)

@app.post("/execute")
async def execute_task(task: AutomationTask):
    start_time = time.time()
    logger.debug(f"[Bridge] Received task: {task.id}")
    logger.debug(f"[Bridge] Action: {task.action}")
    logger.debug(f"[Bridge] Payload size: {len(str(task))} bytes")
    
    try:
        result = await agent.invoke(task.action)
        latency = time.time() - start_time
        logger.debug(f"[Bridge] Task completed in {latency:.2f}s")
        return result
    except Exception as e:
        logger.error(f"[Bridge] Task failed: {str(e)}")
        raise
```

---

### Step 3: Analysis

**Run the Bridge**:
```bash
# Terminal 1: Python bridge
cd Windows-Use
python bridge_service.py --port 8001

# Terminal 2: Test
cd zyeute
npx tsx scripts/test-bridge-communication.ts
```

**Debug Mode reads the logs**:
```
[Bridge Request] taskId=test-123, payloadSize=245, timestamp=1234567890
[Bridge] Received task: test-123
[Bridge] Action: Navigate to vertical feed
[Bridge] Payload size: 245 bytes
[Bridge Response] taskId=test-123, latency=2543ms, success=true
[Bridge] Task completed in 2.54s
```

**Debug Mode Analysis**:
```
Hypothesis 2 confirmed: Large latency (2543ms) suggests 
JSON serialization or processing overhead.

Root cause: Python agent.invoke() taking 2.5s for simple task.

Fix: Add timeout to agent.invoke() and optimize task processing.
```

---

### Step 4: Targeted Fix

**Debug Mode applies minimal fix**:
```python
# Before (slow):
result = await agent.invoke(task.action)

# After (with timeout):
result = await asyncio.wait_for(
    agent.invoke(task.action),
    timeout=5.0  # Max 5 seconds
)
```

**Result**: Fix is **2 lines**, not 100 lines rewritten!

---

## 🎯 Debug Mode Best Practices

### 1. Be Specific About Symptoms

**Bad**: "The bridge is broken"
**Good**: "The bridge is timing out after 30 seconds on automation tasks"

**Why**: Specific symptoms help Debug Mode generate better hypotheses.

---

### 2. Let Debug Mode Instrument

**Don't**: Add logging yourself
**Do**: Let Debug Mode add instrumentation automatically

**Why**: Debug Mode knows where to add logs for maximum insight.

---

### 3. Run Actual Operations

**Don't**: Just describe the problem
**Do**: Run the actual command/service and let Debug Mode read the logs

**Why**: Real logs reveal the actual root cause, not assumptions.

---

### 4. Review Hypotheses Before Fixes

**Don't**: Accept fixes blindly
**Do**: Review the generated hypotheses first

**Why**: Understanding the root cause helps prevent future issues.

---

## 🔧 Debug Mode Examples

### Example 1: Bridge Handshake Failure

**Command** (`Cmd/Ctrl + Shift + .`):
```
The Python bridge handshake is failing. Connection times out after 
10 seconds. Using bridge debugging rules (005-bridge-debugging.mdc), 
debug this systematically.
```

**Debug Mode Process**:
1. Generates 4 hypotheses (health check, port, env vars, type mismatch)
2. Adds logging to both TypeScript and Python
3. Runs test and reads logs
4. Confirms hypothesis (e.g., "Missing GOOGLE_API_KEY in Python")
5. Fixes with minimal change (add env var check)

---

### Example 2: Circuit Breaker Not Triggering

**Command** (`Cmd/Ctrl + Shift + .`):
```
The circuit breaker is not triggering when Vertex AI fails. It should 
open after 5 failures in 60s, but it stays CLOSED even with errors.

Using MLOps safety rules (002-mlops-safety.mdc), debug this.
```

**Debug Mode Process**:
1. Generates hypotheses (failure tracking, time window, state management)
2. Adds logging to `circuit-breaker.ts`
3. Runs AI calls and reads failure logs
4. Confirms hypothesis (e.g., "Failures not being tracked correctly")
5. Fixes tracking logic (2-3 lines)

---

### Example 3: Database Transaction Failure

**Command** (`Cmd/Ctrl + Shift + .`):
```
Multi-table updates are failing. The transaction rolls back but I 
don't know which table is causing it. Debug using database patterns 
rules (004-database-patterns.mdc).
```

**Debug Mode Process**:
1. Generates hypotheses (foreign key violation, constraint error, timeout)
2. Adds detailed error logging to transaction
3. Runs update and reads PostgreSQL logs
4. Confirms hypothesis (e.g., "Foreign key constraint violation on automation_tasks.bee_id")
5. Fixes with proper foreign key check

---

## 🚨 Common Debug Mode Mistakes

### Mistake 1: Too Vague
**Wrong**: "Fix the bridge"
**Right**: "The bridge times out on automation tasks after 30s"

### Mistake 2: Not Running Tests
**Wrong**: Describe the problem without running it
**Right**: Run the actual command and let Debug Mode read logs

### Mistake 3: Ignoring Hypotheses
**Wrong**: Accept fixes without reviewing hypotheses
**Right**: Understand why Debug Mode chose that fix

### Mistake 4: Overwriting Instrumentation
**Wrong**: Remove Debug Mode's logging
**Right**: Keep instrumentation for future debugging

---

## ✅ Debug Mode Checklist

Before using Debug Mode:
- [ ] Problem is reproducible
- [ ] Symptoms are specific
- [ ] Service is running (if needed)
- [ ] Logs are accessible

During Debug Mode:
- [ ] Review hypotheses generated
- [ ] Let instrumentation be added
- [ ] Run actual operations
- [ ] Read analysis carefully

After Debug Mode:
- [ ] Verify fix works
- [ ] Keep instrumentation (commented if needed)
- [ ] Document root cause
- [ ] Update relevant rules if needed

---

## 🎯 When to Use Debug Mode

**Use Debug Mode for**:
- ✅ Multi-service integration issues
- ✅ Timing/performance problems
- ✅ Intermittent failures
- ✅ Complex state management bugs
- ✅ Bridge/API communication issues

**Use Standard Chat for**:
- ❌ Simple syntax errors
- ❌ Type mismatches (visible in editor)
- ❌ Single-file fixes
- ❌ Code generation (not debugging)

---

## 📚 Related Resources

- **Bridge Debugging Rules**: `.cursor/rules/005-bridge-debugging.mdc`
- **Debug Mode Video**: [Cursor Debug Mode Guide](https://www.youtube.com/watch?v=ejRcMxeU0oc)
- **Workflow Guide**: `CURSOR_WORKFLOWS.md`

---

## 🔥 Pro Tips

1. **Combine with MCP**: Use MCP to query database while Debug Mode instruments code
2. **Use with Notepads**: Save hypotheses to Notepads for future reference
3. **Iterate**: Debug Mode may need 2-3 iterations to find root cause
4. **Document**: Save successful hypotheses for similar issues later

---

**Master Debug Mode to solve complex backend issues in minutes!** 🚀
