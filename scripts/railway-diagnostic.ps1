#!/usr/bin/env pwsh
# Railway Database Connection Diagnostic Script
# Run this to check Railway configuration and logs

Write-Host "🔍 RAILWAY DATABASE DIAGNOSTIC - ZYEUTE V5" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Railway Project Info
$PROJECT_ID = "ad61359f-e003-47db-9feb-2434b9c266f5"
$SERVICE_ID = "6c38cd3e-0d5c-4b14-b92c-2f13670bbd21"  # ZyeuteV5
$DB_SERVICE_ID = "95c3b60e-f0a3-4538-ac07-619dbfb80e44"  # zyeute-db
$ENV_ID = "7e959131-6a71-4808-835e-0849ba99ed0b"  # production

Write-Host "📋 Project Configuration:" -ForegroundColor Yellow
Write-Host "   Project ID: $PROJECT_ID"
Write-Host "   Service ID: $SERVICE_ID"
Write-Host "   DB Service: $DB_SERVICE_ID"
Write-Host "   Environment: production"
Write-Host ""

# Check if Railway CLI is installed
Write-Host "🔧 Checking Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if ($railwayInstalled) {
    Write-Host "   ✅ Railway CLI found: $($railwayInstalled.Version)" -ForegroundColor Green

    Write-Host ""
    Write-Host "🔐 Checking Railway Authentication..." -ForegroundColor Yellow
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Authenticated as: $whoami" -ForegroundColor Green

        # Get variables
        Write-Host ""
        Write-Host "📊 Fetching Environment Variables..." -ForegroundColor Yellow
        railway variables

        # Get recent logs
        Write-Host ""
        Write-Host "📜 Fetching Recent Logs (last 100 lines)..." -ForegroundColor Yellow
        railway logs --lines 100

    } else {
        Write-Host "   ❌ Not authenticated. Run: railway login" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Railway CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 To install Railway CLI:" -ForegroundColor Yellow
    Write-Host "   npm install -g @railway/cli" -ForegroundColor White
    Write-Host "   OR"
    Write-Host "   scoop install railway" -ForegroundColor White
    Write-Host ""
}

# Check local database configuration
Write-Host ""
Write-Host "🔍 Checking Local Configuration..." -ForegroundColor Yellow

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "   ⚠️  .env file found (should not be used in Railway)" -ForegroundColor Yellow
    $envContent = Get-Content ".env" | Select-String "DATABASE_URL|SUPABASE"
    if ($envContent) {
        Write-Host "   📝 Database-related vars in .env:" -ForegroundColor Cyan
        $envContent | ForEach-Object {
            $line = $_.Line
            if ($line -match "PASSWORD|SECRET|KEY") {
                $line = $line -replace '=.*', '=***REDACTED***'
            }
            Write-Host "      $line" -ForegroundColor Gray
        }
    }
}

# Check backend/storage.ts
Write-Host ""
Write-Host "   📄 Checking backend/storage.ts..." -ForegroundColor Cyan
if (Test-Path "backend/storage.ts") {
    $storageContent = Get-Content "backend/storage.ts" | Select-String "connectionString|DATABASE_URL|SUPABASE" | Select-Object -First 5
    if ($storageContent) {
        Write-Host "   ✅ Found connection configuration:" -ForegroundColor Green
        $storageContent | ForEach-Object { Write-Host "      $($_.Line.Trim())" -ForegroundColor Gray }
    }
} else {
    Write-Host "   ❌ backend/storage.ts not found" -ForegroundColor Red
}

# Check package.json for Railway scripts
Write-Host ""
Write-Host "   📦 Checking package.json scripts..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts) {
        Write-Host "   Available scripts:" -ForegroundColor Green
        $packageJson.scripts.PSObject.Properties | Where-Object { $_.Name -match "build|start|railway" } | ForEach-Object {
            Write-Host "      $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
    }
}

# Dashboard URLs
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "🌐 RAILWAY DASHBOARD LINKS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   📊 Main Dashboard:" -ForegroundColor Yellow
Write-Host "   https://railway.com/project/$PROJECT_ID" -ForegroundColor Blue
Write-Host ""
Write-Host "   🖥️  ZyeuteV5 Service:" -ForegroundColor Yellow
Write-Host "   https://railway.com/project/$PROJECT_ID/service/$SERVICE_ID" -ForegroundColor Blue
Write-Host ""
Write-Host "   🗄️  Database Service:" -ForegroundColor Yellow
Write-Host "   https://railway.com/project/$PROJECT_ID/service/$DB_SERVICE_ID" -ForegroundColor Blue
Write-Host ""
Write-Host "   📜 Deployment Logs:" -ForegroundColor Yellow
Write-Host "   https://railway.com/project/$PROJECT_ID/service/$SERVICE_ID/deployments" -ForegroundColor Blue
Write-Host ""
Write-Host "   ⚙️  Environment Variables:" -ForegroundColor Yellow
Write-Host "   https://railway.com/project/$PROJECT_ID/service/$SERVICE_ID/variables" -ForegroundColor Blue
Write-Host ""

# Key checks
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ MANUAL CHECKS TO PERFORM:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Visit the ZyeuteV5 Variables page (link above)" -ForegroundColor White
Write-Host "      → Verify DATABASE_URL exists and starts with 'postgresql://'" -ForegroundColor Gray
Write-Host "      → Should contain 'railway.app' NOT 'supabase.co'" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Check the latest deployment logs" -ForegroundColor White
Write-Host "      → Look for '✅ Database Connected Successfully'" -ForegroundColor Gray
Write-Host "      → Look for errors containing 'password authentication failed'" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Verify Database Service is running" -ForegroundColor White
Write-Host "      → Should show 'Active' status with green indicator" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Test the health endpoint" -ForegroundColor White
Write-Host "      → Visit: https://zyeutev5-production.up.railway.app/api/health" -ForegroundColor Gray
Write-Host "      → Should return: {`"status`": `"ok`"}" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""

if (-not $railwayInstalled) {
    Write-Host "   1. Install Railway CLI: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "   2. Login: railway login" -ForegroundColor Yellow
    Write-Host "   3. Re-run this script to get logs and variables" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ All checks complete! Review the output above." -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 TIP: If DATABASE_URL is missing or wrong, you can set it in Railway:" -ForegroundColor Cyan
Write-Host "   1. Go to Database service → Variables → Copy DATABASE_URL" -ForegroundColor Gray
Write-Host "   2. Go to ZyeuteV5 service → Variables → Add/Update DATABASE_URL" -ForegroundColor Gray
Write-Host ""
