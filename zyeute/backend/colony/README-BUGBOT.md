# 🐛 BugBot - Automated Bug Detection and Reporting

## Overview

**BugBot** is a Guardian Bee in the Colony OS ecosystem that automatically detects, reports, and learns from bugs. It monitors system health, tracks errors, and creates patterns to prevent future issues.

## Features

### 🎯 **Automatic Bug Detection**
- Monitors uncaught exceptions
- Tracks unhandled promise rejections
- Watches for task failures from other bees
- Detects governance policy violations
- Monitors system health issues

### 🧠 **Pattern Learning**
- Learns from repeated bugs
- Creates bug patterns automatically
- Shares patterns with other hives via Colony OS
- Suggests fixes based on learned patterns

### 📊 **Bug Reporting**
- Categorizes bugs by severity (critical, high, medium, low)
- Tracks bug types (error, performance, security, data, integration)
- Maintains bug history and statistics
- Links related bugs together

### 🔄 **Integration**
- Integrates with Bee System
- Shares knowledge via Learning System
- Communicates with other bees
- Reports to Colony OS

## Bug Severity Levels

- **Critical**: System crashes, data loss, security breaches
- **High**: Major feature broken, significant user impact
- **Medium**: Feature partially broken, moderate impact
- **Low**: Minor issues, cosmetic problems

## Bug Types

- **Error**: Code errors, exceptions, crashes
- **Performance**: Slow responses, timeouts, resource issues
- **Security**: Policy violations, unauthorized access
- **Data**: Data corruption, missing data, validation errors
- **Integration**: API failures, service unavailability

## Usage

### Automatic Detection

BugBot automatically detects bugs from:
- Uncaught exceptions
- Unhandled promise rejections
- Failed bee tasks
- Governance violations
- System health issues

### Manual Bug Reporting

```typescript
import { bugBot } from "./colony/bugbot.js";

// Report a bug manually
const bug = await bugBot.detectBug({
  severity: "high",
  type: "error",
  title: "API endpoint returning 500",
  description: "POST /api/posts fails with internal server error",
  location: "routes.ts:123",
  context: {
    endpoint: "/api/posts",
    method: "POST",
    userId: "user123",
  },
  stackTrace: "...",
});
```

### Get Bug Reports

```typescript
// Get all bugs
const bugs = bugBot.getAllBugs();

// Get bugs by filter
const criticalBugs = bugBot.getAllBugs({ severity: "critical" });

// Get specific bug
const bug = bugBot.getBug("bug-123");

// Get statistics
const stats = bugBot.getBugStats();
```

### Mark Bug as Fixed

```typescript
await bugBot.markBugFixed("bug-123", "developer-id");
```

## API Endpoints

### `GET /api/bugbot/bugs`
Get all bug reports (with optional filters)

**Query Parameters:**
- `severity`: Filter by severity (critical, high, medium, low)
- `type`: Filter by type (error, performance, security, data, integration)
- `status`: Filter by status (new, investigating, fixing, fixed, ignored)

### `GET /api/bugbot/bugs/:bugId`
Get specific bug report

### `POST /api/bugbot/bugs`
Manually report a bug

**Body:**
```json
{
  "severity": "high",
  "type": "error",
  "title": "Bug title",
  "description": "Bug description",
  "location": "file.ts:123",
  "context": {},
  "stackTrace": "..."
}
```

### `POST /api/bugbot/bugs/:bugId/fix`
Mark bug as fixed

### `GET /api/bugbot/stats`
Get bug statistics

## Pattern Learning

BugBot automatically learns patterns from bugs:

1. **Detects Similar Bugs**: When the same bug appears 2+ times
2. **Creates Pattern**: Extracts common error patterns
3. **Stores Pattern**: Saves to Learning System
4. **Shares Pattern**: Makes it available to all hives
5. **Suggests Fix**: Provides auto-fix suggestions

### Example Pattern

```typescript
{
  id: "pattern-123",
  pattern: "Cannot read property '\\w+'",
  severity: "high",
  description: "Auto-learned from 3 similar bugs",
  autoFix: "Add null check before accessing property",
  learnedFrom: "bug-456"
}
```

## Integration with Colony OS

### Event Publishing

BugBot publishes events to Colony OS:
- `bug.detected` - When a new bug is found
- `bug.fixed` - When a bug is marked as fixed
- `bug.pattern.learned` - When a new pattern is learned

### Knowledge Sharing

BugBot shares knowledge:
- Bug patterns (learned from experience)
- Fix strategies (what worked)
- Common error locations
- Prevention strategies

### Cross-Hive Learning

BugBot learns from other hives:
- Receives bug patterns from other hives
- Applies learned patterns to prevent bugs
- Shares successful fixes

## Statistics

BugBot tracks:
- Total bugs detected
- Bugs by severity
- Bugs by type
- Bugs by status
- Critical open bugs
- Bug resolution time
- Pattern effectiveness

## Benefits

1. **Proactive Detection**: Finds bugs before users report them
2. **Pattern Recognition**: Learns from past bugs to prevent future ones
3. **Cross-Hive Learning**: Benefits from bugs found in other hives
4. **Automatic Reporting**: No manual bug tracking needed
5. **Fix Suggestions**: Provides auto-fix recommendations

## Example Workflow

```
1. Bug occurs (uncaught exception)
   ↓
2. BugBot detects it automatically
   ↓
3. BugBot creates bug report
   ↓
4. BugBot checks for similar bugs
   ↓
5. If similar → Creates pattern
   ↓
6. Shares pattern with Colony OS
   ↓
7. Other hives learn from it
   ↓
8. Bug gets fixed
   ↓
9. BugBot learns from the fix
   ↓
10. System improves automatically
```

---

**Status**: ✅ Complete  
**Type**: Guardian Bee  
**Capabilities**: analytics, moderation
