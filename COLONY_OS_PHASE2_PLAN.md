# 🐝 COLONY OS PHASE 2: THE HIVE NETWORK

**Status:** 🟢 ACTIVE  
**Phase:** 2 - Revenue & Security Intelligence  
**Date:** December 15, 2025  
**Mission:** Deploy Finance Bee & Guardian Bee to live infrastructure

---

## 🎯 MISSION OVERVIEW

**Colony OS** is Zyeuté's Python-based neurosphere kernel that orchestrates specialized "Bees" - autonomous agents that monitor, analyze, and protect the platform's critical infrastructure.

**Phase 2 Goals:**
1. ✅ Deploy **Finance Bee** for real-time revenue intelligence
2. ✅ Deploy **Guardian Bee** for automated security monitoring
3. ✅ Establish Hive Network communication layer
4. ✅ Integrate with Supabase & Stripe webhooks

---

## 🐝 BEE SPECIFICATIONS

### Finance Bee (Revenue Intelligence)

**Purpose:** Monitor subscription revenue streams and payment events in real-time

**Core Functions:**
- Listen to Stripe webhook events (payment_intent.succeeded, subscription.created, etc.)
- Route revenue data to Supabase `subscription_tiers` table
- Track MRR (Monthly Recurring Revenue) and churn metrics
- Alert on payment failures and subscription cancellations
- Generate daily revenue reports

**Technical Stack:**
- Python 3.12+ with FastAPI or Flask
- Stripe Python SDK
- Supabase Python client
- Background task scheduler (APScheduler)

**Data Flow:**
```
Stripe → Webhook → Finance Bee → Validate → Supabase → Analytics Dashboard
```

**Environment Variables Required:**
- `STRIPE_SECRET_KEY` - Server-side Stripe key
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `VITE_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for database writes

---

### Guardian Bee (Security Sentinel)

**Purpose:** Automated threat detection and security monitoring

**Core Functions:**
- Scan application logs for suspicious patterns
- Detect SQL injection attempts in query strings
- Monitor authentication failures and rate limit violations
- Alert on unauthorized API access attempts
- Generate security incident reports

**Technical Stack:**
- Python 3.12+ with async capabilities
- Supabase Python client for log access
- Pattern matching with regex
- Real-time log streaming

**Threat Patterns Monitored:**
1. **SQL Injection:** `' OR '1'='1`, `UNION SELECT`, `DROP TABLE`
2. **Path Traversal:** `../`, `..\\`, `/etc/passwd`
3. **XSS Attempts:** `<script>`, `javascript:`, `onerror=`
4. **Authentication Abuse:** Failed login rate > 5/minute
5. **API Rate Limiting:** Request rate > 100/minute per IP

**Alert Levels:**
- 🟢 **INFO:** Normal operations
- 🟡 **WARNING:** Suspicious pattern detected
- 🔴 **CRITICAL:** Active attack detected

---

## 🏗️ INFRASTRUCTURE ARCHITECTURE

### Directory Structure

```
infrastructure/
└── colony/
    ├── docker-compose.yml          # Orchestration for all services
    ├── .env.colony                 # Colony-specific environment vars
    ├── requirements.txt            # Python dependencies
    │
    ├── bees/
    │   ├── __init__.py
    │   ├── finance_bee.py          # Revenue intelligence
    │   ├── guardian.py             # Security sentinel
    │   └── tests/
    │       ├── __init__.py
    │       ├── test_finance_bee.py # Integration tests
    │       └── test_guardian.py    # Security tests
    │
    ├── monitoring/
    │   ├── __init__.py
    │   ├── check-health.py         # Health check script
    │   └── dashboard.py            # Monitoring dashboard
    │
    └── core/
        ├── __init__.py
        ├── neurosphere.py          # Central coordination kernel
        └── hive_client.py          # Communication layer
```

---

## 🔄 DEPLOYMENT WORKFLOW

### Step 1: Environment Setup

```bash
# Navigate to colony directory
cd infrastructure/colony

# Install Python dependencies
pip3 install -r requirements.txt

# Copy environment template
cp .env.example .env.colony

# Configure environment variables
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - VITE_SUPABASE_URL
# - SUPABASE_SERVICE_KEY
```

### Step 2: Database Schema

Ensure Supabase has required tables:

```sql
-- subscription_tiers table (should already exist)
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tier_name TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- security_events table (new)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  detected_at TIMESTAMP DEFAULT NOW()
);
```

### Step 3: Start Services

```bash
# Using Docker Compose
docker-compose up -d

# Or manually
python3 bees/finance_bee.py &
python3 bees/guardian.py &
```

### Step 4: Verify Connectivity

```bash
# Run health check
python3 monitoring/check-health.py

# Expected output:
# ✅ Finance Bee: OPERATIONAL
# ✅ Guardian Bee: OPERATIONAL
# ✅ Supabase Connection: ACTIVE
# ✅ Stripe Webhook: LISTENING
```

---

## 🧪 TESTING PROCEDURES

### Finance Bee Integration Test

```bash
cd infrastructure/colony/bees/tests
python3 -m pytest test_finance_bee.py -v

# Tests:
# ✅ Stripe webhook signature verification
# ✅ Subscription creation event handling
# ✅ Database write operations
# ✅ Error handling and retries
```

### Guardian Bee Security Test

```bash
python3 monitoring/check-health.py

# Manual threat simulation:
# 1. Attempt SQL injection in test environment
# 2. Verify Guardian Bee detects and logs threat
# 3. Check security_events table for record
```

---

## 📊 SUCCESS METRICS

**Finance Bee:**
- ✅ Stripe webhooks processing < 200ms
- ✅ Revenue data accuracy: 100%
- ✅ Uptime: 99.9%
- ✅ Database write success rate: > 99.5%

**Guardian Bee:**
- ✅ Threat detection latency: < 1 second
- ✅ False positive rate: < 0.1%
- ✅ Log processing throughput: 10,000 events/minute
- ✅ Alert delivery time: < 5 seconds

---

## 🔐 SECURITY CONSIDERATIONS

1. **Webhook Signature Verification**
   - Always validate Stripe webhook signatures
   - Reject unsigned or invalid requests

2. **Service Key Protection**
   - Never commit `SUPABASE_SERVICE_KEY` to version control
   - Use environment variables only
   - Rotate keys quarterly

3. **Rate Limiting**
   - Implement rate limits on webhook endpoints
   - Prevent DDoS attacks on bee services

4. **Logging & Monitoring**
   - Log all security events
   - Monitor bee health continuously
   - Alert on bee failures

---

## 🚀 NEXT STEPS (Phase 3)

Once Phase 2 is stable:
- Deploy **Analytics Bee** for user behavior insights
- Deploy **Content Bee** for AI-powered moderation
- Establish **Swarm Intelligence** for multi-bee coordination
- Build **Hive Dashboard** for real-time monitoring

---

## 📞 SUPPORT & TROUBLESHOOTING

**Logs Location:**
- Finance Bee: `/var/log/colony/finance_bee.log`
- Guardian Bee: `/var/log/colony/guardian.log`
- Health Check: `/var/log/colony/health.log`

**Common Issues:**

1. **Finance Bee not receiving webhooks**
   - Check Stripe webhook configuration
   - Verify endpoint URL is accessible
   - Validate webhook secret

2. **Guardian Bee false positives**
   - Review threat patterns in `guardian.py`
   - Adjust sensitivity thresholds
   - Whitelist known safe patterns

3. **Supabase connection errors**
   - Verify service key is valid
   - Check network connectivity
   - Confirm RLS policies allow service role

---

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** 🟢 Ready for Deployment

---

🎭⚜️ **Colony OS - Powered by Zyeuté Neurosphere**
