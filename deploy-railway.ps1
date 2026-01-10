# Railway Deployment Script for Zyeuté
# This script sets up and deploys Zyeuté to Railway

Write-Host "🚀 Zyeuté Railway Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Railway Deployment Script for Zyeuté
# Note: Railway CLI requires interactive login. Run 'railway login' first.

# Verify Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Failed to install Railway CLI. Please install manually:" -ForegroundColor Red
        Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Railway CLI found" -ForegroundColor Green
Write-Host ""

# Verify authentication
Write-Host "🔐 Verifying Railway authentication..." -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Authenticated as: $whoami" -ForegroundColor Green
    } else {
        Write-Host "❌ Not authenticated. Please login first:" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Railway Token: 21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Option 1: Interactive login (recommended):" -ForegroundColor Cyan
        Write-Host "      railway login" -ForegroundColor White
        Write-Host ""
        Write-Host "   Option 2: Set token in Railway config:" -ForegroundColor Cyan
        Write-Host "      Create file: $env:USERPROFILE\.railway\config.json" -ForegroundColor White
        Write-Host "      Add: { `"token`": `"21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c`" }" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   After authentication, run this script again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Authentication check failed. Please run: railway login" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if project is already linked
Write-Host "🔗 Checking project status..." -ForegroundColor Yellow
if (Test-Path ".railway") {
    Write-Host "✅ Project already linked to Railway" -ForegroundColor Green
} else {
    Write-Host "📋 Linking project to Railway..." -ForegroundColor Yellow
    Write-Host "   Please select an existing project or create a new one:" -ForegroundColor Gray
    railway link
}

Write-Host ""

# Add PostgreSQL database
Write-Host "🗄️  Setting up PostgreSQL database..." -ForegroundColor Yellow
Write-Host "   Checking if PostgreSQL service exists..." -ForegroundColor Gray
railway add postgresql

Write-Host ""

# Set core environment variables
Write-Host "⚙️  Setting core environment variables..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set PORT=8080

Write-Host ""
Write-Host "✅ Railway setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Set your API keys:" -ForegroundColor White
Write-Host "      railway variables set DEEPSEEK_API_KEY='your-key'" -ForegroundColor Gray
Write-Host "      railway variables set FAL_KEY='your-key'" -ForegroundColor Gray
Write-Host "      railway variables set JWT_SECRET='your-secret'" -ForegroundColor Gray
Write-Host "      railway variables set QUEEN_HMAC_SECRET='your-secret'" -ForegroundColor Gray
Write-Host "      railway variables set COLONY_NECTAR='your-secret'" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Deploy to Railway:" -ForegroundColor White
Write-Host "      railway up" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Get your deployment URL:" -ForegroundColor White
Write-Host "      railway domain" -ForegroundColor Gray
Write-Host ""
