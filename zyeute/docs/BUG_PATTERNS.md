# Bug Patterns: Colony OS Backend

Tracking common bug patterns and prevention strategies for Colony OS backend.

---

## 🔍 Bug Pattern Catalog

### Pattern 1: Bridge Timeout

**Category**: Communication  
**Severity**: High  
**Frequency**: 3 occurrences

**Symptoms**:
- Bridge handshake timing out
- Automation tasks failing
- "Timeout waiting for response" errors

**Common Causes**:
1. Missing timeout on agent.invoke() (2 cases)
2. Network latency exceeding timeout (1 case)
3. Python process blocked by long-running operation

**Prevention**:
- Always add timeout to external service calls
- Use `asyncio.wait_for()` with buffer (25s for 30s limit)
- Implement health check validation
- Add timeout logging for debugging

**Detection**:
- Monitor bridge handshake latency
- Alert on timeouts > 30s
- Track Python process CPU/memory during calls

**Fix Pattern**:
```python
# Before (no timeout):
result = await agent.invoke(task.action)

# After (with timeout):
result = await asyncio.wait_for(
    agent.invoke(task.action),
    timeout=25.0  # 25s buffer for 30s limit
)
```

**Related Rules**:
- `001-bridge-protocol.mdc`: Timeout handling
- `005-bridge-debugging.mdc`: Debugging workflow

---

### Pattern 2: Type Mismatch (Cross-Language)

**Category**: Type Safety  
**Severity**: Medium  
**Frequency**: 2 occurrences

**Symptoms**:
- JSON serialization errors
- Field name mismatches
- Optional field handling errors

**Common Causes**:
1. Field name mismatch (camelCase vs snake_case)
2. Optional field handling (undefined vs None)
3. Type incompatibilities (string vs str)

**Prevention**:
- Use @Codebase to audit types before committing
- Compare TypeScript interfaces with Python models
- Test JSON serialization in both directions
- Document field name conventions

**Detection**:
- Automated type comparison in validation
- JSON schema validation on bridge messages
- Unit tests for serialization

**Fix Pattern**:
```typescript
// TypeScript (camelCase):
interface AutomationTask {
  taskId: string;
  action: string;
  parameters: Record<string, any>;
}

// Python (snake_case with conversion):
class AutomationTask(BaseModel):
    task_id: str = Field(alias="taskId")
    action: str
    parameters: Dict[str, Any]
    
    class Config:
        populate_by_name = True  # Accepts both taskId and task_id
```

**Related Rules**:
- `001-bridge-protocol.mdc`: JSON validation
- Cross-Language Safety Patterns

---

### Pattern 3: Database Constraint Violation

**Category**: Database  
**Severity**: High  
**Frequency**: 1 occurrence

**Symptoms**:
- Foreign key constraint errors
- Orphaned records
- Data integrity issues

**Common Causes**:
1. Foreign key constraint not enforced
2. Missing foreign key in migration
3. Cascading delete not configured

**Prevention**:
- Use MCP to validate schema before migrations
- Always include foreign key constraints in migrations
- Test foreign key relationships
- Validate data integrity via MCP queries

**Detection**:
- MCP queries to find orphaned records
- Database constraint checks in validation
- Data quality audits

**Fix Pattern**:
```sql
-- Always include foreign key in migration:
ALTER TABLE automation_tasks 
ADD CONSTRAINT automation_tasks_bee_id_fkey 
FOREIGN KEY (bee_id) 
REFERENCES windows_automation_bees(id) 
ON DELETE CASCADE;
```

**Related Rules**:
- `004-database-patterns.mdc`: Foreign key constraints

---

### Pattern 4: Circuit Breaker Not Triggering

**Category**: Resilience  
**Severity**: Medium  
**Frequency**: 0 occurrences (documented for prevention)

**Symptoms**:
- Circuit breaker stays CLOSED during failures
- No fallback triggered
- Service continues failing

**Common Causes**:
1. Failure tracking not working
2. Time window calculation error
3. State management issue

**Prevention**:
- Always check circuit breaker state before calls
- Implement proper failure tracking
- Test circuit breaker state transitions
- Monitor circuit breaker metrics

**Detection**:
- Circuit breaker metrics logging
- Alert on circuit breaker OPEN state
- Track failure rates

**Fix Pattern**:
```typescript
// Always check state before call:
const state = circuitBreaker.getState(modelName);
if (state === 'OPEN') {
  throw new CircuitBreakerOpenError(modelName);
}
```

**Related Rules**:
- `002-mlops-safety.mdc`: Circuit breaker patterns

---

### Pattern 5: Missing Health Check

**Category**: Reliability  
**Severity**: Low  
**Frequency**: 0 occurrences (documented for prevention)

**Symptoms**:
- Bridge service not responding
- Tasks failing silently
- No indication of service health

**Common Causes**:
1. Health check not implemented
2. Health check not verified before execution
3. Health check endpoint not accessible

**Prevention**:
- Always implement health check endpoint
- Verify health before task execution
- Poll health check during initialization
- Log health check failures

**Detection**:
- Health check monitoring
- Alert on health check failures
- Track health check latency

**Fix Pattern**:
```typescript
// Always check health before execution:
if (!this.isReady) {
  await this.waitForReady(); // Poll /health endpoint
}
```

**Related Rules**:
- `001-bridge-protocol.mdc`: Health check polling
- `005-bridge-debugging.mdc`: Health check validation

---

## 📊 Pattern Statistics

| Pattern | Frequency | Severity | Prevention Rate |
|---------|-----------|----------|-----------------|
| Bridge Timeout | 3 | High | 100% |
| Type Mismatch | 2 | Medium | 100% |
| DB Constraint | 1 | High | 100% |
| Circuit Breaker | 0 | Medium | 100% (prevention) |
| Health Check | 0 | Low | 100% (prevention) |

---

## 🎯 Prevention Checklist

Before deploying changes:

- [ ] **Bridge Timeout**: All external calls have timeout
- [ ] **Type Safety**: Cross-language types validated
- [ ] **DB Constraints**: Foreign keys enforced
- [ ] **Circuit Breaker**: State checked before calls
- [ ] **Health Check**: Health verified before execution

---

## 🔍 Detection Patterns

### Automated Detection

- **Bridge Timeout**: Monitor handshake latency > 30s
- **Type Mismatch**: JSON schema validation failures
- **DB Constraint**: Foreign key violation errors
- **Circuit Breaker**: Failure rate > threshold
- **Health Check**: Health endpoint not responding

### Manual Detection

- **Bridge Timeout**: Debug Mode instrumentation
- **Type Mismatch**: @Codebase cross-language audit
- **DB Constraint**: MCP queries for orphaned records
- **Circuit Breaker**: Circuit breaker metrics review
- **Health Check**: Health endpoint manual check

---

## 📚 Related Documentation

- **Post-Mortems**: See `POST_MORTEM.md`
- **Debugging Guide**: See `CURSOR_DEBUG_MODE_GUIDE.md`
- **Bridge Rules**: See `.cursor/rules/001-bridge-protocol.mdc`
- **Debug Rules**: See `.cursor/rules/005-bridge-debugging.mdc`
- **Post-Mortem Rules**: See `.cursor/rules/006-post-mortem-documentation.mdc`

---

**Pattern tracking ensures continuous improvement and prevention!** 📊✨
