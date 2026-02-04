# User Flagging & Related User Management System

## Overview

A comprehensive system to automatically flag and ban users based on their relationships with banned accounts. This system analyzes the social graph to identify suspicious associations and prevent coordinated abuse.

## Architecture

### Core Components

1. **User Relationship Analyzer** (`backend/services/userRelationshipAnalyzer.ts`)
   - Analyzes social graph connections (follows, interactions, shared content)
   - Calculates relationship strength and risk scores
   - Identifies 1st, 2nd, and 3rd degree connections

2. **User Flagging System** (`backend/services/userFlaggingSystem.ts`)
   - Applies flagging rules based on relationship analysis
   - Automatically flags/ban users based on associations
   - Manages flag severity and recommended actions

3. **Flagging Worker** (`backend/services/flaggingWorker.ts`)
   - Background job for periodic scanning
   - Scans recently banned users
   - Identifies high-risk users

4. **Admin API** (`backend/routes/user-flagging.ts`)
   - Endpoints for managing flagged users
   - Manual flagging and ban propagation
   - Analytics and statistics

## How It Works

### Automatic Flagging Flow

```
1. User gets banned (violation detected)
   ↓
2. System automatically scans related users:
   - Direct followers/following
   - Users who interacted (comments, reactions)
   - 2nd degree connections
   ↓
3. For each related user:
   - Analyze relationship strength
   - Calculate risk score
   - Check against flagging rules
   ↓
4. Apply actions based on rules:
   - CRITICAL (3+ banned connections) → Auto-ban
   - HIGH (2+ banned connections, risk ≥60) → Review required
   - MEDIUM (1+ banned connection, risk ≥40) → Flag
   - LOW (risk ≥20) → Flag for monitoring
```

### Flagging Rules

#### Critical Association

- **Condition**: 3+ direct connections to banned users
- **Action**: Auto-ban
- **Auto-execute**: Yes

#### High Risk Association

- **Condition**: 2+ direct connections to banned users, risk score ≥60
- **Action**: Review required
- **Auto-execute**: No

#### Moderate Association

- **Condition**: 1+ connection to banned user, risk score ≥40
- **Action**: Flag for review
- **Auto-execute**: No

#### Pattern Detection

- **Condition**: Risk score ≥50 + own violation history
- **Action**: Review required
- **Auto-execute**: No

## API Endpoints

### Admin Endpoints (Require Admin/Moderator Role)

#### `GET /api/admin/flagging/flagged`

Get all flagged users (optionally filtered by severity)

**Query Parameters:**

- `severity` (optional): `low` | `medium` | `high` | `critical`

**Response:**

```json
{
  "success": true,
  "flags": [...],
  "count": 42
}
```

#### `GET /api/admin/flagging/analyze/:userId`

Analyze a specific user's relationships

**Query Parameters:**

- `maxDepth` (optional): Number of degrees to analyze (default: 2)

**Response:**

```json
{
  "success": true,
  "analysis": {
    "userId": "...",
    "relatedUsers": [...],
    "riskScore": 65,
    "flaggedReasons": [...],
    "recommendedAction": "review"
  }
}
```

#### `POST /api/admin/flagging/scan-related/:bannedUserId`

Scan and flag users related to a banned user

**Response:**

```json
{
  "success": true,
  "message": "5 utilisateurs signalés",
  "flags": [...]
}
```

#### `GET /api/admin/flagging/related/:userId`

Get all users related to a specific user

**Query Parameters:**

- `maxDepth` (optional): Number of degrees (default: 2)

#### `POST /api/admin/flagging/manual-flag`

Manually flag a user for review

**Body:**

```json
{
  "userId": "...",
  "reason": "Suspicious behavior",
  "severity": "high"
}
```

#### `POST /api/admin/flagging/ban-related/:userId`

Ban a user and automatically scan/flag their related users

**Body:**

```json
{
  "reason": "Violation of terms"
}
```

#### `GET /api/admin/flagging/rules`

Get current flagging rules

#### `GET /api/admin/flagging/stats`

Get flagging statistics

## Integration Points

### Automatic Scanning on Ban

The system automatically scans related users when:

- A user is banned for child safety violations
- A user is banned via video moderation
- A user is banned via text moderation (critical violations)

### Background Worker

The flagging worker runs periodically (configurable interval):

- Scans users banned in the last 24 hours
- Identifies high-risk users with recent violations
- Flags users matching pattern detection rules

**To start the worker:**

```typescript
import { startFlaggingWorker } from "./services/flaggingWorker.js";

// Run every hour
const stopWorker = startFlaggingWorker(60);
```

## Risk Score Calculation

Risk scores (0-100) are calculated based on:

- **Banned Connections**: +30 per banned user connected
- **High Severity Connections**: +15 per user with score ≥8
- **Moderate Severity Connections**: +5 per user with score ≥5
- **Relationship Strength**: Higher strength = higher risk
- **Own Violation History**: Recent violations increase risk

## Relationship Types

1. **Follow**: User follows another user (strength: 50)
2. **Follower**: Another user follows this user (strength: 40)
3. **Mutual Follow**: Both users follow each other (strength: 80)
4. **Interaction**: User commented/reacted on content (strength: 10-40 based on frequency)
5. **Shared Content**: Users posted similar content (future enhancement)

## Security Features

### ✅ **Automatic Propagation**

- When a user is banned, related users are automatically analyzed
- Critical associations result in immediate auto-ban
- Prevents coordinated abuse networks

### ✅ **Graduated Response**

- Not all associations result in bans
- Risk-based flagging allows for review
- Prevents false positives

### ✅ **Audit Trail**

- All flags logged in moderation_logs
- Evidence tracked for each flag
- Review history maintained

### ✅ **Fail-Safe Behavior**

- Scanning failures don't prevent bans
- Errors logged but don't crash system
- Manual review always available

## Configuration

### Flagging Rules

Rules can be customized in `DEFAULT_FLAGGING_RULES`:

- Adjust thresholds (banned connections, risk scores)
- Change actions (flag vs. ban vs. shadowban)
- Enable/disable auto-execution

### Worker Interval

Default: 60 minutes
Can be adjusted when starting worker:

```typescript
startFlaggingWorker(30); // Run every 30 minutes
```

## Monitoring

### Logs

Look for prefixes:

- `[RelationshipAnalyzer]` - Relationship analysis
- `[FlaggingSystem]` - Flagging operations
- `[FlaggingWorker]` - Background worker
- `[FlaggingRoute]` - API endpoints

### Metrics to Track

- Number of users flagged per day
- False positive rate
- Average risk scores
- Time to review flagged users

## Future Enhancements

- [ ] Machine learning model for pattern detection
- [ ] Content similarity analysis for shared content detection
- [ ] Temporal analysis (when relationships formed)
- [ ] Geographic clustering detection
- [ ] Appeal system for flagged users
- [ ] Admin dashboard UI
- [ ] Real-time alerts for critical flags
- [ ] Integration with external threat intelligence

## Related Files

- `backend/services/userRelationshipAnalyzer.ts` - Core relationship analysis
- `backend/services/userFlaggingSystem.ts` - Flagging logic and rules
- `backend/services/flaggingWorker.ts` - Background worker
- `backend/routes/user-flagging.ts` - Admin API endpoints
- `shared/schema.ts` - Database schema (moderation_logs, follows, users)
