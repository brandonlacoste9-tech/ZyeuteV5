# 💰 How to Use Your Google Cloud Credits

**Your Available Credits:**

- **Trial for Gen App Builder:** $1,367.95 (expires Jan 9, 2027)
- **Free Trial:** $410.39 (expires April 10, 2026)
- **Total:** $1,778.34

---

## 🎯 How Google Cloud Credits Work

Credits are **automatically applied** to your billing. When you use Google Cloud services, the charges are deducted from your credits first, then charged to your payment method.

**Key Points:**

- ✅ Credits are used automatically (no manual activation needed)
- ✅ Credits apply to most Google Cloud services
- ✅ You'll see credit usage in your billing dashboard
- ⚠️ Credits expire if not used by the end date

---

## 🚀 Using Credits for Colony OS Deployment

### Step 1: Verify Your Project is Set Up

```powershell
# Check your current project
gcloud config get-value project

# If not set, set it:
gcloud config set project YOUR_PROJECT_ID
```

### Step 2: Enable Required APIs (Uses Credits)

These APIs will start using your credits:

```powershell
# Cloud Run (for Queen Bee)
gcloud services enable run.googleapis.com

# GKE Autopilot (for Siege Engines)
gcloud services enable container.googleapis.com

# Secret Manager (for Royal Vault)
gcloud services enable secretmanager.googleapis.com

# BigQuery (for Wax Ledger)
gcloud services enable bigquery.googleapis.com

# Vertex AI (for SWAT Elites)
gcloud services enable aiplatform.googleapis.com
```

**Cost:** ~$0.01-0.10 per API enable (one-time, uses credits)

---

## 📊 Step 3: Deploy Services (They'll Use Credits Automatically)

### Deploy Queen Bee to Cloud Run

```powershell
cd zyeute\packages\kernel-node
gcloud run deploy queen-bee `
  --source . `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID"
```

**Cost:** ~$0.00-0.10 per request (uses credits)

### Deploy to GKE Autopilot

```powershell
# Create GKE Autopilot cluster
gcloud container clusters create-auto colony-cluster `
  --region us-central1 `
  --project YOUR_PROJECT_ID
```

**Cost:** ~$0.10-0.50 per hour per node (uses credits)

### Set Up BigQuery Dataset

```powershell
# Create dataset for telemetry
bq mk --dataset --location=US colony_telemetry
```

**Cost:** ~$0.02 per GB stored, $5 per TB queried (uses credits)

---

## 💡 Step 4: Monitor Credit Usage

### Check Credit Usage in Console

1. Go to: **Billing → Credits**
2. You'll see:
   - Credit name
   - Remaining value
   - Usage over time
   - Which services are using credits

### Check via Command Line

```powershell
# View billing account
gcloud billing accounts list

# Check current usage (if billing export is set up)
gcloud billing projects describe YOUR_PROJECT_ID
```

---

## 🎯 Quick Start: Use Credits Right Now

### Option 1: Deploy Queen Bee (Easiest)

```powershell
cd zyeute\packages\kernel-node
.\google-cloud\cloud-run-deploy.sh
```

This will:

- Deploy to Cloud Run
- Use your credits automatically
- Cost: ~$0.10-1.00 per day (idle)

### Option 2: Set Up Secret Manager

```powershell
cd zyeute\packages\kernel-node\google-cloud
.\secret-manager-setup.ps1
```

This will:

- Store your `.env` in Secret Manager
- Use credits for storage
- Cost: ~$0.06 per secret per month

### Option 3: Stream to BigQuery

```powershell
# Run the Dazzle Demo (it logs to BigQuery)
cd zyeute\packages\kernel-node
.\google-cloud\run-dazzle-demo.ps1
```

This will:

- Stream telemetry to BigQuery
- Use credits for storage/querying
- Cost: ~$0.01-0.10 per demo run

---

## 📈 Understanding Credit Usage

### What Uses Credits?

✅ **These services use credits:**

- Cloud Run (compute time)
- GKE Autopilot (node hours)
- BigQuery (storage + queries)
- Secret Manager (storage)
- Vertex AI (API calls)
- Cloud Storage (if used)
- Network egress (data transfer)

❌ **These DON'T use credits:**

- API enablement (one-time, minimal)
- Console usage (free)
- Basic monitoring (free tier)

### Typical Costs (Using Your Credits)

| Service                   | Cost            | Your Credits Cover |
| ------------------------- | --------------- | ------------------ |
| Cloud Run (idle)          | $0.00/day       | ✅ Forever         |
| Cloud Run (active)        | $0.10-1.00/day  | ✅ ~1,700 days     |
| GKE Autopilot (1 node)    | $0.10-0.50/hour | ✅ ~3,500 hours    |
| BigQuery (1GB storage)    | $0.02/month     | ✅ ~88,000 GB      |
| Secret Manager (1 secret) | $0.06/month     | ✅ ~29,000 months  |
| Vertex AI (1M tokens)     | $0.50-2.00      | ✅ ~1,000M tokens  |

**You have plenty of credits for testing and development!**

---

## 🚨 Important Notes

### Credit Expiration

- **Trial for Gen App Builder:** Expires Jan 9, 2027 (1 year)
- **Free Trial:** Expires April 10, 2026 (3 months)

**Action:** Use them before they expire!

### Credit Application

- Credits apply to **net pricing** (after discounts)
- Credits are used **automatically** (no manual step)
- You'll see credit usage in billing reports

### When Credits Run Out

- Services will continue to work
- Charges will go to your payment method
- You'll get billing alerts (if set up)

---

## ✅ Quick Checklist

- [ ] Set `GOOGLE_CLOUD_PROJECT` in `.env`
- [ ] Run `gcloud auth login`
- [ ] Enable required APIs
- [ ] Deploy Queen Bee to Cloud Run
- [ ] Set up Secret Manager
- [ ] Test BigQuery logging
- [ ] Monitor credit usage in console

---

## 🎯 Recommended First Steps

1. **Deploy Queen Bee** (uses ~$0.10/day)

   ```powershell
   cd zyeute\packages\kernel-node
   .\google-cloud\cloud-run-deploy.sh
   ```

2. **Set Up Secret Manager** (uses ~$0.06/month)

   ```powershell
   .\google-cloud\secret-manager-setup.ps1
   ```

3. **Test BigQuery** (uses ~$0.01 per test)

   ```powershell
   .\google-cloud\run-dazzle-demo.ps1
   ```

4. **Monitor Usage**
   - Go to: Billing → Credits
   - Watch credit usage in real-time

---

**Your credits are ready to use! Just deploy services and they'll automatically consume credits.** 🚀💰
