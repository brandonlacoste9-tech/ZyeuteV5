# 🚨 Project Suspended - Resolution Guide

**Project:** `unique-spirit-482300-s4`  
**Status:** CONSUMER_SUSPENDED  
**Account:** `planexo.it@gmail.com`

---

## 🔍 What Happened

The Google Cloud project has been suspended. This prevents:

- Secret Manager operations
- BigQuery dataset creation
- Cloud Run deployments
- All GCP service operations

---

## 🛠️ Resolution Steps

### Step 1: Check Billing Account

1. Go to: https://console.cloud.google.com/billing
2. Check if billing account is:
   - ✅ Active
   - ✅ Linked to project `unique-spirit-482300-s4`
   - ✅ Has valid payment method

### Step 2: Reactivate Project

1. Go to: https://console.cloud.google.com/home/dashboard?project=unique-spirit-482300-s4
2. Look for suspension notification
3. Follow the reactivation steps

### Step 3: Link Billing Account

If billing account exists but isn't linked:

```powershell
# List billing accounts
gcloud billing accounts list

# Link billing account to project
gcloud billing projects link unique-spirit-482300-s4 --billing-account=BILLING_ACCOUNT_ID
```

### Step 4: Verify Project Status

```powershell
# Check project info
gcloud projects describe unique-spirit-482300-s4

# Check if APIs are enabled
gcloud services list --enabled --project=unique-spirit-482300-s4
```

---

## 💡 Alternative: Use Account 2 (Proving Grounds)

If Account 1 (The Palace) is suspended, switch to Account 2:

```powershell
# List all projects
gcloud projects list

# Switch to Account 2 project
gcloud config set project ACCOUNT_2_PROJECT_ID

# Verify switch
gcloud config get-value project
```

Then re-run the deployment commands with the new project ID.

---

## 🔄 After Reactivation

Once the project is reactivated, re-run:

1. **Secret Manager:**

   ```powershell
   gcloud secrets create COLONY_NECTAR --replication-policy="automatic"
   gcloud secrets versions add COLONY_NECTAR --data-file=.env
   ```

2. **BigQuery:**

   ```powershell
   bq mk --dataset --location=US colony_telemetry
   ```

3. **Cloud Run:**
   ```powershell
   gcloud run deploy queen-bee --source . --region us-central1 --allow-unauthenticated
   ```

---

## 📞 Support

If project remains suspended:

- Check Google Cloud Console for specific error messages
- Review billing account status
- Contact Google Cloud Support if needed

---

**Status:** Waiting for project reactivation before proceeding with deployment.
