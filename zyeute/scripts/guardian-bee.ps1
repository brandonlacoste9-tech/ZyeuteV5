# Guardian Bee - Windows Production Watcher
# Self-healing system with secure reporting and escalation

$ErrorActionPreference = "Stop"

# Configuration
$ENDPOINT = if ($env:HEALTH_ENDPOINT) { $env:HEALTH_ENDPOINT } else { "http://localhost:8080/health" }
$WEBHOOK = if ($env:GUARDIAN_WEBHOOK) { $env:GUARDIAN_WEBHOOK } else { "https://hooks.zyeute.app/guardian" }
$SECRET = if ($env:QUEEN_HMAC_SECRET) { $env:QUEEN_HMAC_SECRET } else { if ($env:COLONY_NECTAR) { $env:COLONY_NECTAR } else { "default-secret" } }
$CHECK_INTERVAL = if ($env:GUARDIAN_CHECK_INTERVAL) { [int]$env:GUARDIAN_CHECK_INTERVAL } else { 60000 } # 60 seconds
$MAX_HEAL_COUNT = if ($env:MAX_HEAL_COUNT) { [int]$env:MAX_HEAL_COUNT } else { 3 }
$HEAL_WINDOW_MINUTES = if ($env:HEAL_WINDOW_MINUTES) { [int]$env:HEAL_WINDOW_MINUTES } else { 60 }

$HealCount = 0
$HealTimestamps = @()

# HMAC-SHA256 Signature Function
function Sign-Payload {
    param([string]$Body, [string]$Secret)
    
    $HMAC = New-Object System.Security.Cryptography.HMACSHA256
    $HMAC.Key = [System.Text.Encoding]::UTF8.GetBytes($Secret)
    $Hash = $HMAC.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Body))
    $Signature = [Convert]::ToBase64String($Hash)
    return $Signature
}

# Send Secure Webhook
function Send-SecureWebhook {
    param([string]$Event, [hashtable]$Data = @{})
    
    $NodeName = if ($env:NODE_NAME) { $env:NODE_NAME } else { "windows-primary" }
    $Payload = @{
        event = $Event
        node = $NodeName
        timestamp = (Get-Date).ToUniversalTime().ToString("o")
    } + $Data
    
    $Body = $Payload | ConvertTo-Json -Compress
    $Signature = Sign-Payload -Body $Body -Secret $SECRET
    
    $Headers = @{
        "Content-Type" = "application/json"
        "X-Zyeute-Signature" = $Signature
        "X-Zyeute-Node" = $NodeName
    }
    
    try {
        $Response = Invoke-RestMethod -Uri $WEBHOOK -Method Post -Body $Body -Headers $Headers
        Write-Host "✅ Webhook sent: $Event" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Webhook failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check if Escalation Needed
function Should-Escalate {
    $Now = Get-Date
    $CutoffTime = $Now.AddMinutes(-$HEAL_WINDOW_MINUTES)
    
    # Filter timestamps within window
    $HealTimestamps = $script:HealTimestamps | Where-Object { $_ -gt $CutoffTime }
    $script:HealTimestamps = $HealTimestamps
    
    if ($HealTimestamps.Count -gt $MAX_HEAL_COUNT) {
        return $true
    }
    return $false
}

# Send Slack Alert
function Send-SlackAlert {
    param([string]$NodeName, [int]$HealCount)
    
    $SlackWebhook = $env:SLACK_WEBHOOK
    if (-not $SlackWebhook) {
        Write-Host "⚠️  SLACK_WEBHOOK not configured, skipping Slack alert" -ForegroundColor Yellow
        return
    }
    
    $Message = @{
        text = "🚨 ALERT: Multiple recoveries detected on $NodeName"
        blocks = @(
            @{
                type = "section"
                text = @{
                    type = "mrkdwn"
                    text = "*🚨 Guardian Bee Alert*`n`nNode: *$NodeName*`nRecovery Count: *$HealCount*`nTime Window: *$HEAL_WINDOW_MINUTES minutes*`n`nManual intervention suggested."
                }
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri $SlackWebhook -Method Post -Body $Message -ContentType "application/json"
        Write-Host "✅ Slack alert sent" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Slack alert failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Self-Healing Function
function Invoke-Heal {
    $script:HealCount++
    $script:HealTimestamps += Get-Date
    
    Write-Host "🚨 Node Unresponsive. Pulling fresh Genetic Code... (Heal #$script:HealCount)" -ForegroundColor Yellow
    
    # Try Docker Compose recovery
    if ($env:USE_DOCKER -eq "true") {
        try {
            Set-Location "C:\Users\north\ZyeuteV5\ZyeuteV5-1"
            docker-compose pull
            docker-compose down
            docker-compose up -d
            Write-Host "✅ Docker containers refreshed" -ForegroundColor Green
            Send-SecureWebhook -Event "self_heal" -Data @{ method = "docker_compose"; healCount = $script:HealCount }
        }
        catch {
            Write-Host "❌ Docker recovery failed: $($_.Exception.Message)" -ForegroundColor Red
            Send-SecureWebhook -Event "self_heal_failed" -Data @{ error = $_.Exception.Message; healCount = $script:HealCount }
        }
    }
    else {
        # Try PM2 recovery (if installed)
        try {
            pm2 restart all
            Write-Host "✅ PM2 processes restarted" -ForegroundColor Green
            Send-SecureWebhook -Event "self_heal" -Data @{ method = "pm2"; healCount = $script:HealCount }
        }
        catch {
            # Fallback: Restart Node.js service
            try {
                Restart-Service -Name "ZyeuteBackend" -ErrorAction SilentlyContinue
                Write-Host "✅ Service restarted" -ForegroundColor Green
                Send-SecureWebhook -Event "self_heal" -Data @{ method = "service"; healCount = $script:HealCount }
            }
            catch {
                Write-Host "❌ Recovery failed: $($_.Exception.Message)" -ForegroundColor Red
                Send-SecureWebhook -Event "self_heal_failed" -Data @{ error = $_.Exception.Message; healCount = $script:HealCount }
            }
        }
    }
    
    # Check if escalation needed
    if (Should-Escalate) {
        $NodeName = if ($env:NODE_NAME) { $env:NODE_NAME } else { "windows-primary" }
        Write-Host "🚨 ESCALATION: Too many heals ($($script:HealTimestamps.Count)) in $HEAL_WINDOW_MINUTES minutes" -ForegroundColor Red
        Send-SlackAlert -NodeName $NodeName -HealCount $script:HealTimestamps.Count
        Send-SecureWebhook -Event "escalation" -Data @{ healCount = $script:HealTimestamps.Count; timeWindow = $HEAL_WINDOW_MINUTES }
    }
}

# Health Check Function
function Test-Health {
    try {
        $Response = Invoke-WebRequest -Uri $ENDPOINT -Method Get -TimeoutSec 5 -UseBasicParsing
        
        if ($Response.StatusCode -ne 200) {
            Write-Host "⚠️  Health check returned $($Response.StatusCode)" -ForegroundColor Yellow
            Invoke-Heal
        }
        else {
            Write-Host "✅ Health check passed: $($Response.Content.Substring(0, [Math]::Min(50, $Response.Content.Length)))..." -ForegroundColor Green
            
            # Send periodic heartbeat (every 10 checks)
            if ($script:HealCount % 10 -eq 0) {
                Send-SecureWebhook -Event "heartbeat" -Data @{ status = "healthy"; uptime = (Get-Process -Id $PID).StartTime }
            }
        }
    }
    catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Invoke-Heal
    }
}

# Graceful Shutdown Handler
Register-ObjectEvent -InputObject ([System.Console]) -EventName "CancelKeyPress" -Action {
    Write-Host "`n🛑 Guardian Bee shutting down gracefully..." -ForegroundColor Yellow
    Send-SecureWebhook -Event "shutdown" -Data @{ reason = "SIGINT" }
    exit 0
}

# Start Monitoring
Write-Host "🐝 Guardian Bee started" -ForegroundColor Cyan
Write-Host "   Endpoint: $ENDPOINT" -ForegroundColor Gray
Write-Host "   Webhook: $WEBHOOK" -ForegroundColor Gray
Write-Host "   Check Interval: $CHECK_INTERVAL ms" -ForegroundColor Gray
Write-Host "   Max Heals: $MAX_HEAL_COUNT per $HEAL_WINDOW_MINUTES minutes" -ForegroundColor Gray
Write-Host ""

# Initial health check
Test-Health

# Periodic health checks
while ($true) {
    Start-Sleep -Milliseconds $CHECK_INTERVAL
    Test-Health
}