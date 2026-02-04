# Grant Required Roles to Service Account
# 
# This script grants the required roles to vertex-express@floguru.iam.gserviceaccount.com
# 
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\grant-service-account-roles.ps1 [PROJECT_ID]
#
# Default PROJECT_ID: spatial-garden-483401-g8

param(
    [string]$ProjectId = "spatial-garden-483401-g8"
)

$ServiceAccount = "vertex-express@floguru.iam.gserviceaccount.com"

Write-Host "🔐 Granting roles to Service Account..." -ForegroundColor Cyan
Write-Host "Project: $ProjectId"
Write-Host "Service Account: $ServiceAccount"
Write-Host ""

# Grant Vertex AI User role
Write-Host "1️⃣  Granting Vertex AI User role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$ServiceAccount" `
  --role="roles/aiplatform.user" `
  --condition=None

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to grant Vertex AI User role" -ForegroundColor Red
    exit 1
}

# Grant Dialogflow API Client role
Write-Host ""
Write-Host "2️⃣  Granting Dialogflow API Client role..." -ForegroundColor Yellow
gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$ServiceAccount" `
  --role="roles/dialogflow.client" `
  --condition=None

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to grant Dialogflow API Client role" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Roles granted!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Verify with:" -ForegroundColor Cyan
Write-Host "   npm run verify:service-account"
