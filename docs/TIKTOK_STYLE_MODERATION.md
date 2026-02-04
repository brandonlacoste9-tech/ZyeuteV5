# TikTok-Style Moderation System

## Overview

The flagging and moderation system has been updated to match TikTok's aggressive moderation thresholds and strike-based enforcement system.

## Key Changes from Default to TikTok-Style

### Threshold Adjustments

| Setting                     | Default               | TikTok-Style              | Change               |
| --------------------------- | --------------------- | ------------------------- | -------------------- |
| **Auto-Ban Threshold**      | 3+ banned connections | **2+ banned connections** | ⬇️ More aggressive   |
| **High Risk Threshold**     | Risk ≥60, 2+ banned   | **Risk ≥50, 1+ banned**   | ⬇️ Lower threshold   |
| **Moderate Flag Threshold** | Risk ≥40              | **Risk ≥35**              | ⬇️ Earlier detection |
| **Pattern Detection**       | Risk ≥50              | **Risk ≥40**              | ⬇️ More sensitive    |
| **Banned Connection Risk**  | +30 per connection    | **+40 per connection**    | ⬆️ Higher penalty    |
| **High Severity Risk**      | +15 per connection    | **+20 per connection**    | ⬆️ Higher penalty    |
| **Moderate Severity Risk**  | +5 per connection     | **+8 per connection**     | ⬆️ Higher penalty    |
| **Critical Severity**       | Risk ≥70, 3+ banned   | **Risk ≥60, 2+ banned**   | ⬇️ Lower threshold   |

---

## TikTok Strike System

### 5 Strike Types

1. **Warning Strikes**
   - Educational notifications for minor violations
   - No reach reduction
   - No feature restrictions

2. **Feature-Specific Strikes**
   - Disable specific features for 24-168 hours
   - Features: Comments, LIVE, DMs, Duets/Stitches
   - Applied for medium-severity violations

3. **Policy-Specific Strikes**
   - Reduce For You page visibility by 60-80%
   - Applied for high-severity violations
   - Core guideline violations (hate speech, harassment, misinformation, nudity)

4. **Cumulative Strikes**
   - Triggered at 5+ violations within 90 days
   - Creates permanent ban risk
   - Automatic ban evaluation

5. **Severe Violation Strikes**
   - Immediate permanent bans
   - No strike accumulation
   - For: Child exploitation, violence threats, severe violations

### Strike Expiration

- **90-Day Rolling Window**: Strikes expire after 90 days
- **Algorithmic Penalties**: Can persist up to 180 days after violations
- **Cumulative Count**: Only counts strikes within 90-day window

---

## Updated Flagging Rules

### 1. Severe Violation (TikTok-Style)

- **Risk Score**: ≥90
- **Action**: Immediate permanent ban
- **Auto-Execute**: ✅ Yes

### 2. Critical Association (TikTok-Style)

- **Banned Connections**: 2+ (lowered from 3)
- **Relationship Strength**: ≥40
- **Action**: Auto-ban
- **Auto-Execute**: ✅ Yes

### 3. Cumulative Strikes (TikTok-Style)

- **Violations**: 5+ within 90 days
- **Risk Score**: ≥50
- **Action**: Permanent ban
- **Auto-Execute**: ✅ Yes

### 4. High Risk Association (TikTok-Style)

- **Banned Connections**: 1+ (lowered from 2)
- **Risk Score**: ≥50 (lowered from 60)
- **Action**: Review required
- **Auto-Execute**: ❌ No

### 5. Moderate Association (TikTok-Style)

- **Risk Score**: ≥35 (lowered from 40)
- **Action**: Flag for monitoring
- **Auto-Execute**: ❌ No

### 6. Pattern Detection (TikTok-Style)

- **Risk Score**: ≥40 (lowered from 50)
- **Violation History**: Required
- **Action**: Review required
- **Auto-Execute**: ❌ No

---

## Risk Score Calculation (TikTok-Style)

**More Aggressive Scoring:**

```
riskScore = (bannedConnections × 40) + (highSeverityConnections × 20) + (moderateSeverityConnections × 8)
```

**Previous (Default):**

```
riskScore = (bannedConnections × 30) + (highSeverityConnections × 15) + (moderateSeverityConnections × 5)
```

**Impact**: Users reach ban thresholds faster with TikTok-style scoring.

---

## Severity Assignment (TikTok-Style)

**Lower Thresholds for Earlier Detection:**

```typescript
if (riskScore >= 60 || bannedConnections >= 2) {
  severity = "critical"; // Lowered from 70/3
} else if (riskScore >= 40 || bannedConnections >= 1) {
  severity = "high"; // Lowered from 50/2
} else if (riskScore >= 25 || connectionCount >= 5) {
  severity = "medium"; // Lowered from 30
}
```

---

## Coordinated Behavior Detection

TikTok uses network-based approaches to detect coordinated inauthentic behavior:

- **Multilayer Network Analysis**: Captures coordination across video, audio, and text
- **User Similarity Networks**: Based on synchronized posting, repeated captions, content reuse
- **Graph Pruning**: Identifies dense networks of coordinated accounts

**Our Implementation:**

- Analyzes 1st and 2nd degree connections
- Tracks relationship strength and interaction patterns
- Flags users with suspicious association patterns
- Lower thresholds for coordinated behavior detection

---

## Enforcement Flow

```
1. Violation Detected
   ↓
2. Check Severity:
   ├─ Critical → Immediate ban (no strike)
   ├─ High → Policy-specific strike + reach reduction
   ├─ Medium → Feature-specific strike + feature disable
   └─ Low → Warning strike (educational)
   ↓
3. Check Strike Count (90-day window):
   ├─ 5+ strikes → Permanent ban risk (auto-ban)
   ├─ 3-4 strikes → Increased penalties
   └─ 1-2 strikes → Standard penalties
   ↓
4. Apply Penalties:
   ├─ Reach reduction (60-80% for policy violations)
   ├─ Feature restrictions (24-168 hours)
   └─ Educational warnings
```

---

## Comparison: Default vs TikTok-Style

### Auto-Ban Triggers

| Condition          | Default | TikTok-Style      |
| ------------------ | ------- | ----------------- |
| Banned connections | 3+      | **2+**            |
| Risk score         | ≥70     | **≥60**           |
| Cumulative strikes | N/A     | **5+ in 90 days** |

### Flagging Thresholds

| Condition         | Default             | TikTok-Style            |
| ----------------- | ------------------- | ----------------------- |
| High risk         | Risk ≥60, 2+ banned | **Risk ≥50, 1+ banned** |
| Moderate          | Risk ≥40            | **Risk ≥35**            |
| Pattern detection | Risk ≥50            | **Risk ≥40**            |

### Risk Scoring

| Factor            | Default | TikTok-Style |
| ----------------- | ------- | ------------ |
| Banned connection | +30     | **+40**      |
| High severity     | +15     | **+20**      |
| Moderate severity | +5      | **+8**       |

---

## Benefits of TikTok-Style Approach

✅ **Faster Detection**: Lower thresholds catch violations earlier
✅ **Coordinated Behavior**: Better at detecting network-based abuse
✅ **Strike System**: Graduated penalties with clear escalation
✅ **90-Day Window**: Prevents permanent penalties for reformed users
✅ **Transparency**: Clear strike system users can understand

---

## Implementation Files

- `backend/services/userFlaggingSystem.ts` - Updated flagging rules
- `backend/services/userRelationshipAnalyzer.ts` - Updated risk scoring
- `backend/services/tiktokStrikeSystem.ts` - New strike system
- `backend/routes/user-flagging.ts` - Admin API (unchanged)

---

## Monitoring

### Key Metrics (TikTok-Style)

- Strike distribution by type
- 90-day strike expiration rate
- Cumulative strike ban rate
- Average strikes per banned user
- False positive rate (appeals)

### Log Prefixes

- `[TikTokStrikeSystem]` - Strike operations
- `[RelationshipAnalyzer]` - Relationship analysis
- `[FlaggingSystem]` - Flagging operations

---

## Notes

- **More Aggressive**: TikTok-style is stricter than default
- **Strike-Based**: Uses graduated penalty system
- **90-Day Window**: Strikes expire, allowing user reform
- **Coordinated Detection**: Better at catching network abuse
- **Auto-Ban**: 2+ banned connections = immediate ban (vs 3+)
