# Test Colony OS Google Cloud Setup
# Verifies all components are working

Write-Host "🧪 [TEST] Colony OS Setup Verification" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$PROJECT_ID = $env:GOOGLE_CLOUD_PROJECT
if (-not $PROJECT_ID) {
    $PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"
    $env:GOOGLE_CLOUD_PROJECT = $PROJECT_ID
}

Write-Host "`n📋 Testing Project: $PROJECT_ID`n" -ForegroundColor Cyan

$tests = @()

# Test 1: Check if gcloud is installed
Write-Host "1️⃣ Testing gcloud CLI..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    if ($gcloudVersion) {
        Write-Host "   ✅ gcloud installed: $gcloudVersion" -ForegroundColor Green
        $tests += @{Name="gcloud CLI"; Status="✅"}
    }
} catch {
    Write-Host "   ❌ gcloud not found. Install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    $tests += @{Name="gcloud CLI"; Status="❌"}
}

# Test 2: Check authentication
Write-Host "`n2️⃣ Testing authentication..." -ForegroundColor Yellow
try {
    $auth = gcloud auth list --format="json" 2>&1 | ConvertFrom-Json
    if ($auth.Count -gt 0) {
        Write-Host "   ✅ Authenticated as: $($auth[0].account)" -ForegroundColor Green
        $tests += @{Name="Authentication"; Status="✅"}
    } else {
        Write-Host "   ❌ Not authenticated. Run: gcloud auth login" -ForegroundColor Red
        $tests += @{Name="Authentication"; Status="❌"}
    }
} catch {
    Write-Host "   ❌ Authentication check failed" -ForegroundColor Red
    $tests += @{Name="Authentication"; Status="❌"}
}

# Test 3: Check project
Write-Host "`n3️⃣ Testing project access..." -ForegroundColor Yellow
try {
    $project = gcloud config get-value project 2>&1
    if ($project -eq $PROJECT_ID) {
        Write-Host "   ✅ Project set: $project" -ForegroundColor Green
        $tests += @{Name="Project Access"; Status="✅"}
    } else {
        Write-Host "   ⚠️ Project mismatch. Setting to $PROJECT_ID..." -ForegroundColor Yellow
        gcloud config set project $PROJECT_ID 2>&1 | Out-Null
        Write-Host "   ✅ Project set" -ForegroundColor Green
        $tests += @{Name="Project Access"; Status="✅"}
    }
} catch {
    Write-Host "   ❌ Project check failed" -ForegroundColor Red
    $tests += @{Name="Project Access"; Status="❌"}
}

# Test 4: Check enabled APIs
Write-Host "`n4️⃣ Testing enabled APIs..." -ForegroundColor Yellow
$requiredAPIs = @(
    "run.googleapis.com",
    "container.googleapis.com",
    "secretmanager.googleapis.com",
    "bigquery.googleapis.com",
    "aiplatform.googleapis.com"
)

$enabledAPIs = gcloud services list --enabled --project=$PROJECT_ID --format="value(config.name)" 2>&1

$apiCount = 0
foreach ($api in $requiredAPIs) {
    if ($enabledAPIs -contains $api) {
        $apiCount++
    }
}

if ($apiCount -eq $requiredAPIs.Count) {
    Write-Host "   ✅ All required APIs enabled ($apiCount/$($requiredAPIs.Count))" -ForegroundColor Green
    $tests += @{Name="APIs Enabled"; Status="✅"}
} else {
    Write-Host "   ⚠️ Only $apiCount/$($requiredAPIs.Count) APIs enabled" -ForegroundColor Yellow
    Write-Host "   Run: .\enable-all-apis.ps1" -ForegroundColor Cyan
    $tests += @{Name="APIs Enabled"; Status="⚠️"}
}

# Test 5: Check Secret Manager
Write-Host "`n5️⃣ Testing Secret Manager..." -ForegroundColor Yellow
try {
    $secret = gcloud secrets describe COLONY_NECTAR --project=$PROJECT_ID 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Secret COLONY_NECTAR exists" -ForegroundColor Green
        $tests += @{Name="Secret Manager"; Status="✅"}
    } else {
        Write-Host "   ⚠️ Secret COLONY_NECTAR not found" -ForegroundColor Yellow
        Write-Host "   Run: .\secret-manager-setup.ps1" -ForegroundColor Cyan
        $tests += @{Name="Secret Manager"; Status="⚠️"}
    }
} catch {
    Write-Host "   ⚠️ Secret Manager check failed" -ForegroundColor Yellow
    $tests += @{Name="Secret Manager"; Status="⚠️"}
}

# Test 6: Check billing
Write-Host "`n6️⃣ Testing billing..." -ForegroundColor Yellow
try {
    $billing = gcloud billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>&1
    if ($billing -and $billing -ne "") {
        Write-Host "   ✅ Billing account linked" -ForegroundColor Green
        $tests += @{Name="Billing"; Status="✅"}
    } else {
        Write-Host "   ⚠️ No billing account linked" -ForegroundColor Yellow
        Write-Host "   Link billing: https://console.cloud.google.com/billing" -ForegroundColor Cyan
        $tests += @{Name="Billing"; Status="⚠️"}
    }
} catch {
    Write-Host "   ⚠️ Billing check failed" -ForegroundColor Yellow
    $tests += @{Name="Billing"; Status="⚠️"}
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "📊 Test Results:" -ForegroundColor Cyan
foreach ($test in $tests) {
    Write-Host "   $($test.Status) $($test.Name)" -ForegroundColor $(if ($test.Status -eq "✅") { "Green" } else { "Yellow" })
}

$passed = ($tests | Where-Object { $_.Status -eq "✅" }).Count
$total = $tests.Count

Write-Host "`n✅ Passed: $passed/$total" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host "`n🎉 All tests passed! Ready to deploy." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Some tests need attention. Fix issues above." -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
