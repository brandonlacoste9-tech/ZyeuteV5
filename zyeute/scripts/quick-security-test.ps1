# Quick Security Test Script for PowerShell
# Run this after the server is started

$API_BASE = "http://localhost:5000"

Write-Host "🛡️  Security Test Suite" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_BASE/api/health" -Method Get
    Write-Host "✅ Server is running" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure server is running: cd zyeute/backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Feed Endpoint (Unauthenticated)
Write-Host "Test 2: Feed Endpoint (Unauthenticated)" -ForegroundColor Yellow
try {
    $feed = Invoke-RestMethod -Uri "$API_BASE/api/feed" -Method Get
    
    if ($feed.posts -and $feed.posts.Count -gt 0) {
        $firstPost = $feed.posts[0]
        $hasOriginalUrl = $firstPost.PSObject.Properties.Name -contains "originalUrl"
        $hasJobId = $firstPost.PSObject.Properties.Name -contains "jobId"
        
        if ($hasOriginalUrl -or $hasJobId) {
            Write-Host "❌ FAIL: Sensitive fields found in feed!" -ForegroundColor Red
            Write-Host "   originalUrl present: $hasOriginalUrl" -ForegroundColor Red
            Write-Host "   jobId present: $hasJobId" -ForegroundColor Red
        } else {
            Write-Host "✅ PASS: Feed sanitized correctly" -ForegroundColor Green
            Write-Host "   Posts returned: $($feed.posts.Count)" -ForegroundColor Gray
            Write-Host "   Sensitive fields hidden: ✅" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  No posts in feed to test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error testing feed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""

# Test 3: Check Debug Logs
Write-Host "Test 3: Security Logs Check" -ForegroundColor Yellow
$logPath = "C:\Users\north\ZyeuteV5\.cursor\debug.log"
if (Test-Path $logPath) {
    $logs = Get-Content $logPath -Tail 20 | Select-String "sanitizePostForUser|Ownership check|Sensitive fields"
    if ($logs) {
        Write-Host "✅ Security instrumentation active" -ForegroundColor Green
        Write-Host "   Found $($logs.Count) security log entries" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No security logs found yet" -ForegroundColor Yellow
        Write-Host "   Make an API call to trigger logging" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Debug log file not found" -ForegroundColor Yellow
    Write-Host "   Path: $logPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host ("=" * 50) -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test single post endpoint:" -ForegroundColor White
Write-Host "   curl http://localhost:5000/api/posts/YOUR_POST_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check full debug logs:" -ForegroundColor White
Write-Host "   Get-Content C:\Users\north\ZyeuteV5\.cursor\debug.log -Tail 50" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify originalUrl/jobId are NOT in responses" -ForegroundColor White
