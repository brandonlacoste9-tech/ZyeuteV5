# 🔍 Verification Script - Check TONIGHT Setup
# Run this after completing the action plan to verify everything is working

Write-Host "🔍 [VERIFICATION] Checking TONIGHT Setup" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$allGood = $true

# Check 1: Google Cloud Authentication
Write-Host "`n1️⃣ Checking Google Cloud Authentication..." -ForegroundColor Cyan
try {
    $auth = gcloud auth list --format="json" | ConvertFrom-Json
    if ($auth.Count -gt 0) {
        Write-Host "✅ Authenticated as: $($auth[0].account)" -ForegroundColor Green
    } else {
        Write-Host "❌ Not authenticated. Run: gcloud auth login" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "❌ gcloud not found or not working" -ForegroundColor Red
    $allGood = $false
}

# Check 2: Project Set
Write-Host "`n2️⃣ Checking Google Cloud Project..." -ForegroundColor Cyan
try {
    $project = gcloud config get-value project
    if ($project) {
        Write-Host "✅ Project: $project" -ForegroundColor Green
    } else {
        Write-Host "❌ No project set. Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "❌ Could not get project" -ForegroundColor Red
    $allGood = $false
}

# Check 3: Secret Manager Access
Write-Host "`n3️⃣ Checking Secret Manager Access..." -ForegroundColor Cyan
try {
    $secret = gcloud secrets describe COLONY_NECTAR --format="json" 2>&1 | ConvertFrom-Json
    if ($secret) {
        Write-Host "✅ Secret COLONY_NECTAR exists" -ForegroundColor Green
        
        # Try to access latest version
        $version = gcloud secrets versions access latest --secret=COLONY_NECTAR 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Can access secret content" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Secret exists but cannot access content" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Secret COLONY_NECTAR not found. Run: .\secret-manager-setup.ps1" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "❌ Secret Manager check failed" -ForegroundColor Red
    $allGood = $false
}

# Check 4: Free Trial Status
Write-Host "`n4️⃣ Checking Free Trial Status..." -ForegroundColor Cyan
Write-Host "   ⚠️ Manual check required:" -ForegroundColor Yellow
Write-Host "   Go to: https://console.cloud.google.com/billing" -ForegroundColor Yellow
Write-Host "   Verify: Free Trial credits are visible" -ForegroundColor Yellow

# Check 5: Application Status
Write-Host "`n5️⃣ Checking Application Status..." -ForegroundColor Cyan
Write-Host "   ⚠️ Manual check required:" -ForegroundColor Yellow
Write-Host "   Check email for:" -ForegroundColor Yellow
Write-Host "   • Startup Program confirmation" -ForegroundColor Yellow
Write-Host "   • AI Startup Tier confirmation" -ForegroundColor Yellow

# Final Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ($allGood) {
    Write-Host "✅ [VERIFICATION] Core setup looks good!" -ForegroundColor Green
    Write-Host "   Next: Check email for application confirmations" -ForegroundColor Cyan
    Write-Host "   Next: Verify Free Trial in Google Cloud Console" -ForegroundColor Cyan
} else {
    Write-Host "❌ [VERIFICATION] Some issues found" -ForegroundColor Red
    Write-Host "   Review errors above and fix before proceeding" -ForegroundColor Yellow
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
