# 🎯 Cursor Deployment Commands - Quick Reference

Use these commands in Cursor (Ctrl+L) to deploy and manage Colony OS on Google Cloud.

---

## 🚀 Quick Deploy Commands

### Deploy Queen Bee to Cloud Run

```
Deploy the SwarmOrchestrator to Cloud Run using my $1,778 credits.
Use the COLONY_NECTAR secret from Secret Manager.
Ensure it's accessible at /health and /execute endpoints.
```

### Full Setup

```
Run the full Colony OS deployment: enable APIs, set up Secret Manager,
create BigQuery dataset, and deploy Queen Bee to Cloud Run.
Use the quick-start-credits.ps1 script.
```

### Check Deployment Status

```
Check if the Queen Bee Cloud Run service is healthy.
Verify the /health endpoint returns 200 OK.
```

---

## 🔍 Monitoring Commands

### Check Credit Usage

```
Open the Google Cloud Console billing credits page to show
current credit usage and remaining balance.
```

### View BigQuery Logs

```
Query the BigQuery colony_telemetry dataset to show the last 10
Queen Bee activities. Use bq query command.
```

### Check Service Logs

```
Show the last 20 log entries from the Cloud Run queen-bee service
using gcloud run services logs read.
```

---

## 🛠️ Development Commands

### Test BigQuery Integration

```
Run the Dazzle Demo to test BigQuery logging.
Verify telemetry is streaming to the colony_telemetry dataset.
```

### Update Secret Manager

```
Update the COLONY_NECTAR secret in Secret Manager with the latest
.env file contents. Use the secret-manager-setup.ps1 script.
```

### Verify MCP Tools

```
Check if all MCP tools (Windows, Chrome, Apify, Desktop Commander,
Filesystem) are available and working in the SwarmOrchestrator.
```

---

## 🧠 AI Routing Commands

### Test Google ADK

```
Create a test task that routes to Google ADK for a GCP operation.
Verify it uses the gemini-2.0-flash model and MCP tools.
```

### Test Llama 4 Maverick

```
Create a sovereign reasoning task that routes to Llama 4 Maverick.
Verify it uses tool calling and multi-turn reasoning.
```

### Test Hybrid Routing

```
Create two tasks: one GCP operation (Google ADK) and one security
analysis (Llama 4 Maverick). Verify routing works correctly.
```

---

## 🐛 Debugging Commands

### Fix Deployment Error

```
The Cloud Run deployment failed. Check the error logs, verify
GOOGLE_CLOUD_PROJECT is set, and ensure all required APIs are enabled.
```

### Debug BigQuery Connection

```
BigQuery logging is failing. Check credentials, verify the dataset
exists, and test the connection with a simple query.
```

### Fix Secret Manager Access

```
The COLONY_NECTAR secret cannot be accessed. Verify IAM permissions,
check the secret exists, and test access with gcloud secrets.
```

---

## 📊 Reporting Commands

### Generate Mission Report

```
Create a Weekly Mission Report from BigQuery logs showing:
- Total tasks processed
- Average response time
- Most active bee unit
- Credit usage summary
```

### Show Deployment Status

```
Show the current status of all Colony OS services:
- Cloud Run: Queen Bee status
- Secret Manager: COLONY_NECTAR status
- BigQuery: colony_telemetry dataset status
- Credit balance: Remaining credits
```

---

## 💡 Pro Tips

1. **Use @-mentions**: Reference specific files with `@filename` in Cursor
2. **Chain commands**: Ask Cursor to "deploy and then verify health"
3. **Error recovery**: If something fails, ask Cursor to "diagnose and fix"
4. **Credit awareness**: Always mention credits when deploying expensive services

---

**Remember:** Cursor is your Command Post. Use it to orchestrate the entire Colony OS deployment! 🐝👑
