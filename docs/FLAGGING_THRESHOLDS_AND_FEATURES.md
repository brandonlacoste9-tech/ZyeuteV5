# Flagging System: Features & Thresholds Reference

## 📊 Current Thresholds & Settings

### Risk Score Calculation (0-100)

**Base Risk Components:**

- **Banned Connection**: +30 points per banned user directly connected
- **High Severity Connection**: +15 points per user with moderation score ≥8
- **Moderate Severity Connection**: +5 points per user with moderation score ≥5
- **Relationship Strength Bonus**: Up to +20 points based on connection strength

**Risk Score Formula:**

```
riskScore = (bannedConnections × 30) + (highSeverityConnections × 15) + (moderateSeverityConnections × 5)
riskScore = min(100, riskScore) // Capped at 100
```

### Relationship Strength (0-100)

**Strength Calculation:**

- **Mutual Follow**: 80 points
- **One-way Follow**: 20 points (follower) or 50 points (following)
- **Interactions**: +5 points per comment/reaction (max +40)
- **Banned Connection**: Automatically set to 100 (maximum)

**Strength Formula:**

```
strength = (mutualFollow ? 40 : oneWayFollow ? 20 : 0) + min(40, interactionCount × 5)
strength = min(100, strength) // Capped at 100
```

---

## 🚨 Flagging Rules (Current Configuration)

### 1. Critical Association Rule

**Triggers:** Auto-ban

- **Banned Connections Required**: 3+
- **Relationship Strength Minimum**: 50
- **Risk Score Minimum**: N/A (uses connection count)
- **Action**: `ban`
- **Auto-Execute**: ✅ Yes (immediate ban)

**Example:**

- User follows 3 banned accounts → **AUTO-BANNED**

---

### 2. High Risk Association Rule

**Triggers:** Review Required

- **Banned Connections Required**: 2+
- **Risk Score Minimum**: 60
- **Action**: `review`
- **Auto-Execute**: ❌ No (requires admin review)

**Example:**

- User follows 2 banned accounts + has risk score ≥60 → **FLAGGED FOR REVIEW**

---

### 3. Moderate Association Rule

**Triggers:** Flag for Monitoring

- **Banned Connections Required**: 1+
- **Risk Score Minimum**: 40
- **Action**: `flag`
- **Auto-Execute**: ❌ No (monitoring only)

**Example:**

- User follows 1 banned account + has risk score ≥40 → **FLAGGED**

---

### 4. Pattern Detection Rule

**Triggers:** Review Required

- **Risk Score Minimum**: 50
- **Own Violation History**: Required (user has own moderation violations)
- **Action**: `review`
- **Auto-Execute**: ❌ No (requires admin review)

**Example:**

- User has risk score ≥50 + has own violation history → **FLAGGED FOR REVIEW**

---

## 📈 Severity Levels

### Severity Assignment Logic:

```typescript
if (riskScore >= 70 || bannedConnections >= 3) {
  severity = "critical"; // Auto-ban
} else if (riskScore >= 50 || bannedConnections >= 2) {
  severity = "high"; // Review required
} else if (riskScore >= 30 || bannedConnections >= 1) {
  severity = "medium"; // Flag for monitoring
} else {
  severity = "low"; // Monitor only
}
```

### Severity Thresholds:

- **Critical**: Risk ≥70 OR 3+ banned connections
- **High**: Risk ≥50 OR 2+ banned connections
- **Medium**: Risk ≥30 OR 1+ banned connection
- **Low**: Risk <30 AND 0 banned connections

---

## 🔍 Analysis Depth Settings

### Default Analysis Depth: **2 degrees**

- **1st Degree**: Direct followers/following
- **2nd Degree**: Followers of followers, following of following
- **3rd Degree**: (Not enabled by default, can be configured)

**Configurable via API:**

```typescript
GET /api/admin/flagging/analyze/:userId?maxDepth=3
```

---

## ⚙️ Configurable Features

### 1. **Auto-Execute Rules**

Each rule can be set to auto-execute or require review:

- `autoExecute: true` → Action taken immediately
- `autoExecute: false` → Requires admin review

### 2. **Relationship Types Tracked**

- ✅ Follow relationships (one-way)
- ✅ Mutual follows
- ✅ Comment interactions
- ✅ Reaction interactions
- ⏳ Shared content (future enhancement)
- ⏳ Message/DM relationships (future enhancement)

### 3. **Actions Available**

- `flag` - Mark user for monitoring
- `review` - Add to review queue
- `ban` - Immediate ban
- `shadowban` - Hide content but allow platform access
- `warn` - Send warning notification (future enhancement)

### 4. **Worker Scan Intervals**

Default: **60 minutes**

- Scans users banned in last 24 hours
- Identifies high-risk users with recent violations
- Configurable: `startFlaggingWorker(30)` for 30-minute intervals

---

## 📋 Current Default Values Summary

| Setting                         | Value                 | Location                            |
| ------------------------------- | --------------------- | ----------------------------------- |
| **Critical Auto-Ban Threshold** | 3 banned connections  | `DEFAULT_FLAGGING_RULES[0]`         |
| **High Risk Threshold**         | Risk ≥60 OR 2+ banned | `DEFAULT_FLAGGING_RULES[1]`         |
| **Moderate Flag Threshold**     | Risk ≥40 OR 1+ banned | `DEFAULT_FLAGGING_RULES[2]`         |
| **Pattern Detection Threshold** | Risk ≥50 + violations | `DEFAULT_FLAGGING_RULES[3]`         |
| **Banned Connection Risk**      | +30 per connection    | `userRelationshipAnalyzer.ts:217`   |
| **High Severity Risk**          | +15 per connection    | `userRelationshipAnalyzer.ts:218`   |
| **Moderate Severity Risk**      | +5 per connection     | `userRelationshipAnalyzer.ts:219`   |
| **Mutual Follow Strength**      | 80 points             | `userRelationshipAnalyzer.ts:96`    |
| **One-way Follow Strength**     | 20-50 points          | `userRelationshipAnalyzer.ts:73,96` |
| **Interaction Strength**        | +5 per interaction    | `userRelationshipAnalyzer.ts:133`   |
| **Max Analysis Depth**          | 2 degrees             | `analyzeUserRelationships()`        |
| **Worker Scan Interval**        | 60 minutes            | `flaggingWorker.ts`                 |
| **Recent Ban Window**           | 24 hours              | `flaggingWorker.ts:20`              |

---

## 🎛️ How to Adjust Thresholds

### Option 1: Modify Default Rules

Edit `backend/services/userFlaggingSystem.ts`:

```typescript
export const DEFAULT_FLAGGING_RULES: FlaggingRule[] = [
  {
    id: "critical_association",
    conditions: {
      bannedConnections: 3, // ← Change this
      riskScore: 70, // ← Or add this
    },
    action: "ban",
    autoExecute: true,
  },
  // ... other rules
];
```

### Option 2: Adjust Risk Score Calculation

Edit `backend/services/userRelationshipAnalyzer.ts`:

```typescript
// Line ~217-220
riskScore += bannedConnections * 30; // ← Adjust multiplier
riskScore += highSeverityConnections * 15; // ← Adjust multiplier
riskScore += flaggedConnections * 5; // ← Adjust multiplier
```

### Option 3: Adjust Relationship Strength

Edit `backend/services/userRelationshipAnalyzer.ts`:

```typescript
// Line ~73, 96, 133
strength: 50,                    // ← One-way follow strength
strength: isMutual ? 80 : 40,   // ← Mutual vs follower strength
strength += count * 5,           // ← Interaction strength multiplier
```

---

## 🔧 Advanced Configuration Options

### Custom Rule Creation

You can add custom rules to `DEFAULT_FLAGGING_RULES`:

```typescript
{
  id: "custom_rule",
  name: "Custom Rule Name",
  description: "Custom description",
  conditions: {
    bannedConnections: 5,      // Custom threshold
    riskScore: 80,             // Custom risk score
    relationshipStrength: 70,   // Custom strength requirement
    violationHistory: true,     // Require own violations
  },
  action: "shadowban",          // Custom action
  autoExecute: false,           // Require review
}
```

### Worker Configuration

```typescript
// Run every 30 minutes
startFlaggingWorker(30);

// Run every 2 hours
startFlaggingWorker(120);

// Run every 15 minutes (aggressive)
startFlaggingWorker(15);
```

### Analysis Depth Configuration

```typescript
// Analyze 1st degree only (faster)
analyzeUserRelationships(userId, 1);

// Analyze up to 3rd degree (more thorough, slower)
analyzeUserRelationships(userId, 3);
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Track:

1. **Flag Rate**: Number of users flagged per day
2. **False Positive Rate**: Flagged users that were cleared
3. **Average Risk Scores**: Distribution of risk scores
4. **Time to Review**: Average time flagged users wait for review
5. **Auto-Ban Rate**: Percentage of flags that result in auto-bans

### Log Prefixes for Monitoring:

- `[RelationshipAnalyzer]` - Relationship analysis operations
- `[FlaggingSystem]` - Flagging operations
- `[FlaggingWorker]` - Background worker operations
- `[FlaggingRoute]` - API endpoint operations

---

## 🚀 Recommended Adjustments by Use Case

### **Stricter Security** (More Aggressive)

```typescript
// Lower thresholds for faster flagging
bannedConnections: 2,  // Instead of 3
riskScore: 50,         // Instead of 60
autoExecute: true,     // Auto-ban high-risk
```

### **Balanced Approach** (Current Default)

- 3+ banned = auto-ban
- 2+ banned = review
- 1+ banned = flag

### **More Lenient** (Fewer False Positives)

```typescript
// Higher thresholds, more review required
bannedConnections: 5,  // Instead of 3
riskScore: 70,         // Instead of 60
autoExecute: false,    // Always review first
```

---

## 📝 Notes

- **Risk scores are cumulative**: Multiple factors add together
- **Relationship strength affects risk**: Stronger relationships = higher risk
- **Auto-execute only for critical**: Only critical rules auto-ban
- **All flags are logged**: Full audit trail in `moderation_logs` table
- **Fail-safe behavior**: Errors don't prevent bans, just flagging

---

## 🔄 Future Enhancement Ideas

- [ ] Machine learning model for risk prediction
- [ ] Temporal analysis (when relationships formed)
- [ ] Geographic clustering detection
- [ ] Content similarity analysis
- [ ] Appeal system for flagged users
- [ ] Real-time risk score updates
- [ ] Custom rule builder UI
- [ ] A/B testing for threshold optimization
