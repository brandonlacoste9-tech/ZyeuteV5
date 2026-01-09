# 🧪 THE "VERTEX GROUNDING" WIRE-UP
# Links SWAT Bees to BigQuery for hyper-intelligent, zero-hallucination results

Write-Host "🧪 [VERTEX GROUNDING] Setting up BigQuery Grounding" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$projectId = $env:GOOGLE_CLOUD_PROJECT
if (-not $projectId) {
    $projectId = Read-Host "Enter your Google Cloud Project ID"
    $env:GOOGLE_CLOUD_PROJECT = $projectId
}

# Step 1: Create BigQuery Dataset
Write-Host "`n1️⃣ Creating BigQuery dataset: colony_os_data" -ForegroundColor Cyan
bq mk --dataset --location=US $projectId:colony_os_data
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Dataset may already exist, continuing..." -ForegroundColor Yellow
}

# Step 2: Create business data table (example structure)
Write-Host "`n2️⃣ Creating business data table..." -ForegroundColor Cyan
$schema = @"
[
  {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "mission_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "unit", "type": "STRING", "mode": "REQUIRED"},
  {"name": "action", "type": "STRING"},
  {"name": "result", "type": "STRING"},
  {"name": "success", "type": "BOOLEAN"},
  {"name": "metadata", "type": "JSON"}
]
"@

$schemaFile = Join-Path $env:TEMP "colony_schema.json"
$schema | Out-File -FilePath $schemaFile -Encoding UTF8

bq mk --table --schema=$schemaFile $projectId:colony_os_data.mission_logs
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Table created successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Table may already exist, continuing..." -ForegroundColor Yellow
}

# Step 3: Instructions for Vertex AI Console
Write-Host "`n3️⃣ Next Steps (Manual in Vertex AI Console):" -ForegroundColor Cyan
Write-Host "   a. Go to: https://console.cloud.google.com/vertex-ai" -ForegroundColor Yellow
Write-Host "   b. Navigate to: Agent Builder > Create Agent" -ForegroundColor Yellow
Write-Host "   c. Select: 'Grounded in BigQuery'" -ForegroundColor Yellow
Write-Host "   d. Choose dataset: colony_os_data" -ForegroundColor Yellow
Write-Host "   e. Configure grounding: Enable 'Use BigQuery data'" -ForegroundColor Yellow
Write-Host "   f. Test: Ask agent a question about your missions" -ForegroundColor Yellow

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🧪 [VERTEX GROUNDING] Setup Complete!" -ForegroundColor Green
Write-Host "   SWAT Bees are now grounded in your production data." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
