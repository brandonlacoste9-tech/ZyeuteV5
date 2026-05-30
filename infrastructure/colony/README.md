# 🐝 Colony OS - Phase 2: The Hive Network

**Status:** 🟢 Active Deployment  
**Version:** 2.0.0  
**Last Updated:** December 15, 2025

---

## 📋 Quick Start

### Prerequisites
- Python 3.12+
- pip
- virtualenv (recommended)
- Active Supabase project
- Stripe account with webhook access

### 1. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.colony

# Edit with your actual keys
nano .env.colony
```

Required variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

### 3. Deploy Finance Bee

```bash
# Using deployment script (recommended)
./deploy-finance-bee.sh

# Or manually
python3 bees/finance_bee.py
```

### 4. Deploy Guardian Bee

```bash
# In a new terminal
python3 bees/guardian.py
```

### 5. Verify Deployment

```bash
python3 monitoring/check-health.py
```

Expected output:
```
🐝 COLONY OS - HEALTH CHECK
======================================================================

Finance Bee          ✅ OPERATIONAL
Guardian Bee         ✅ OPERATIONAL
Supabase             ✅ CONNECTED
Stripe               ✅ CONFIGURED

SUMMARY: 4/4 services healthy
Status: 🟢 ALL SYSTEMS OPERATIONAL
```

---

## 🐝 Services

### Finance Bee (Port 8001)
Revenue intelligence agent that monitors Stripe webhooks.

**Endpoints:**
- `GET /` - Service info
- `POST /webhook` - Stripe webhook receiver
- `GET /health` - Health check

**Handles Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### Guardian Bee (Port 8002)
Security sentinel that detects threats in real-time.

**Endpoints:**
- `GET /` - Service info
- `POST /scan` - Scan text for threats
- `GET /health` - Health check

**Detects:**
- SQL injection attempts
- Path traversal attacks
- XSS (Cross-site scripting)
- Authentication abuse
- API rate limit violations

### Neurosphere (Port 8000)
Central coordination kernel (Phase 3 expansion).

**Endpoints:**
- `GET /` - Kernel info
- `GET /bees` - List registered bees
- `GET /health` - Health check

---

## 🧪 Testing

### Run Finance Bee Tests

```bash
cd bees/tests
pytest test_finance_bee.py -v
```

### Manual Health Check

```bash
# Check all services
python3 monitoring/check-health.py

# Check individual bee
curl http://localhost:8001/health  # Finance Bee
curl http://localhost:8002/health  # Guardian Bee
```

### Test Threat Detection

```bash
# Test SQL injection detection
curl -X POST http://localhost:8002/scan \
  -H "Content-Type: application/json" \
  -d '{"text": "SELECT * FROM users WHERE id=1 OR 1=1", "source": "test"}'
```

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container

```bash
# Build image
docker build -t colony-finance-bee .

# Run Finance Bee
docker run -d \
  --name finance-bee \
  -p 8001:8001 \
  --env-file .env.colony \
  colony-finance-bee \
  python3 bees/finance_bee.py
```

---

## 📊 Monitoring

### View Logs

```bash
# Finance Bee
tail -f logs/finance_bee.log

# Guardian Bee
tail -f logs/guardian.log

# All logs
tail -f logs/*.log
```

### Health Monitoring

Set up a cron job to run health checks:

```bash
# Add to crontab
*/5 * * * * cd /path/to/colony && python3 monitoring/check-health.py >> logs/health.log 2>&1
```

---

## 🔧 Troubleshooting

### Finance Bee Not Receiving Webhooks

1. Check Stripe webhook configuration
2. Verify endpoint URL is publicly accessible
3. Confirm webhook secret matches `.env.colony`
4. Check firewall/security group rules

### Guardian Bee False Positives

1. Review threat patterns in `bees/guardian.py`
2. Adjust pattern sensitivity
3. Add whitelisting for known safe patterns

### Supabase Connection Issues

1. Verify service key is correct
2. Check RLS policies allow service role
3. Confirm network connectivity
4. Validate table names match expected schema

### Services Won't Start

1. Check port availability: `lsof -i :8001`
2. Verify Python version: `python3 --version` (need 3.12+)
3. Install missing dependencies: `pip install -r requirements.txt`
4. Check environment variables: `cat .env.colony`

---

## 📂 Directory Structure

```
infrastructure/colony/
├── .env.example              # Environment template
├── .env.colony               # Your environment (gitignored)
├── requirements.txt          # Python dependencies
├── Dockerfile                # Container definition
├── docker-compose.yml        # Multi-service orchestration
├── deploy-finance-bee.sh     # Deployment script
├── README.md                 # This file
│
├── bees/                     # Bee agents
│   ├── __init__.py
│   ├── finance_bee.py        # Revenue intelligence
│   ├── guardian.py           # Security sentinel
│   └── tests/
│       ├── __init__.py
│       └── test_finance_bee.py
│
├── monitoring/               # Health checks
│   ├── __init__.py
│   └── check-health.py
│
├── core/                     # Neurosphere kernel
│   ├── __init__.py
│   └── neurosphere.py
│
└── logs/                     # Service logs
    ├── finance_bee.log
    └── guardian.log
```

---

## 🚀 Next Steps (Phase 3)

Once Phase 2 is stable:

1. **Analytics Bee** - User behavior insights
2. **Content Bee** - AI-powered content moderation
3. **Swarm Intelligence** - Multi-bee coordination
4. **Hive Dashboard** - Real-time monitoring UI
5. **Auto-scaling** - Dynamic bee deployment

---

## 📞 Support

**Documentation:** See `COLONY_OS_PHASE2_PLAN.md` in project root

**Logs:** Check `logs/` directory for detailed error messages

**Health Check:** Run `python3 monitoring/check-health.py` anytime

---

## 📜 License

Part of Zyeuté V3 - L'app sociale du Québec 🇨🇦⚜️

---

**🐝 Colony OS - Powered by Python Neurosphere**
