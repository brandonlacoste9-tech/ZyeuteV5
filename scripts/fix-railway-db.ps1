# Railway Database Connection Fix Script
# Run this to diagnose and fix Railway DB issues

Write-Host "🔧 RAILWAY DATABASE DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check Railway CLI
$railwayCheck = railway --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway CLI not found. Install with: npm i -g @railway/cli" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Current Railway Project:" -ForegroundColor Yellow
railway status

Write-Host ""
Write-Host "🔍 Checking Database Variables..." -ForegroundColor Yellow
railway variables --service "zyeute-backend" | findstr "DATABASE_URL PGHOST PGUSER"

Write-Host ""
Write-Host "💡 To fix the database connection:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to Railway Dashboard: https://railway.app/dashboard" -ForegroundColor White
Write-Host "2. Select your 'zyeute-backend' service" -ForegroundColor White
Write-Host "3. Click 'Variables' tab" -ForegroundColor White
Write-Host "4. Find DATABASE_URL - it should look like:" -ForegroundColor White
Write-Host "   postgresql://postgres:PASSWORD@HOST:5432/railway" -ForegroundColor Gray
Write-Host ""
Write-Host "5. If DATABASE_URL is missing or wrong, get the correct one:" -ForegroundColor White
Write-Host "   - Go to your PostgreSQL service in Railway" -ForegroundColor White
Write-Host "   - Click 'Connect' tab" -ForegroundColor White
Write-Host "   - Copy the 'Database URL'" -ForegroundColor White
Write-Host ""
Write-Host "6. Set the correct DATABASE_URL:" -ForegroundColor White
Write-Host "   railway variables --service 'zyeute-backend' --set 'DATABASE_URL=your_url_here'" -ForegroundColor Yellow
Write-Host ""
Write-Host "7. Redeploy: railway up" -ForegroundColor Yellow
