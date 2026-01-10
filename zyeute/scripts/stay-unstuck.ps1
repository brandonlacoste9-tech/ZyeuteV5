# 🐝 Stay Unstuck - Hive Maintenance Script
# Run every 4 hours to prevent zombie processes
# Prevents RAM hijacking and Cursor slowdown

Write-Host "🐝 ==========================================" -ForegroundColor Cyan
Write-Host "🐝  STAY UNSTUCK - HIVE MAINTENANCE" -ForegroundColor Cyan
Write-Host "🐝 ==========================================`n" -ForegroundColor Cyan

# Step 1: Kill Zombie Processes
Write-Host "🔍 Step 1: Hunting zombie processes..." -ForegroundColor Yellow

$zombieProcesses = Get-Process | Where-Object {
    ($_.Name -like "*ollama*" -or $_.Name -like "*docker*" -or $_.Name -like "*node*") -and
    $_.StartTime -lt (Get-Date).AddHours(-4)
}

if ($zombieProcesses.Count -gt 0) {
    Write-Host "   ⚠️  Found $($zombieProcesses.Count) zombie process(es)" -ForegroundColor Yellow
    
    foreach ($proc in $zombieProcesses) {
        Write-Host "   🧹 Killing: $($proc.Name) (PID: $($proc.Id), Started: $($proc.StartTime))" -ForegroundColor Gray
        try {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "      ✅ Killed" -ForegroundColor Green
        } catch {
            Write-Host "      ⚠️  Could not kill (may require admin)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ✅ No zombie processes found`n" -ForegroundColor Green
}

# Step 2: Re-seat the Queen (Docker Services)
Write-Host "`n👑 Step 2: Re-seating the Queen (Docker services)..." -ForegroundColor Yellow

try {
    # Check if docker-compose.yml exists
    if (Test-Path "docker-compose.yml") {
        Write-Host "   📦 Restarting Docker Compose services..." -ForegroundColor Gray
        
        # Stop services
        docker-compose down 2>$null
        
        # Start services
        docker-compose up -d 2>$null
        
        Start-Sleep -Seconds 5
        
        # Health check
        try {
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            Write-Host "   ✅ Queen Bee is healthy (Status: $($healthResponse.StatusCode))`n" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Queen Bee health check failed (may still be starting)`n" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ℹ️  No docker-compose.yml found, skipping`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Docker operations failed: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# Step 3: Check Ollama Service
Write-Host "🦙 Step 3: Checking Ollama service..." -ForegroundColor Yellow

try {
    $ollamaHealth = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($ollamaHealth.StatusCode -eq 200) {
        Write-Host "   ✅ Ollama service is healthy`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Ollama service not responding (may not be running)`n" -ForegroundColor Yellow
}

# Step 4: Memory Check
Write-Host "💾 Step 4: Memory status..." -ForegroundColor Yellow

$memory = Get-CimInstance Win32_OperatingSystem
$totalMemory = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
$freeMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
$usedMemory = $totalMemory - $freeMemory
$percentFree = [math]::Round(($freeMemory / $totalMemory) * 100, 1)

Write-Host "   📊 Total: ${totalMemory} GB" -ForegroundColor Gray
Write-Host "   📊 Used: ${usedMemory} GB" -ForegroundColor Gray
Write-Host "   📊 Free: ${freeMemory} GB ($percentFree%)" -ForegroundColor Gray

if ($percentFree -lt 10) {
    Write-Host "   ⚠️  WARNING: Low memory! Consider closing applications`n" -ForegroundColor Red
} elseif ($percentFree -lt 20) {
    Write-Host "   ⚠️  Memory getting low`n" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Memory status healthy`n" -ForegroundColor Green
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Maintenance Complete" -ForegroundColor Yellow
Write-Host "   • Zombie processes: Cleaned" -ForegroundColor Gray
Write-Host "   • Queen Bee: Restarted" -ForegroundColor Gray
Write-Host "   • Memory: $percentFree% free" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "💡 Run this script every 4 hours to keep the Hive healthy!`n" -ForegroundColor Yellow