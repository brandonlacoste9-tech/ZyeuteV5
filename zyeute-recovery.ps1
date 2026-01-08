#!/usr/bin/env pwsh
# Zyeuté Recovery Script (PowerShell)
# Cleans up, validates, and tests the codebase

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$LOG_DIR = "$PSScriptRoot/recovery-logs"
$TIMESTAMP = Get-Date -Format "yyyyMMdd-HHmmss"
$LOG_FILE = "$LOG_DIR/recovery-$TIMESTAMP.log"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path $LOG_FILE -Value $logMessage
}

function Test-Step {
    param([string]$StepName, [scriptblock]$Action)
    Write-Log "`n=== $StepName ===" "Cyan"
    try {
        & $Action
        Write-Log "✅ $StepName completed" "Green"
        return $true
    } catch {
        Write-Log "❌ $StepName failed: $_" "Red"
        return $false
    }
}

# Create log directory
New-Item -ItemType Directory -Force -Path $LOG_DIR | Out-Null
Write-Log "🚀 Starting Zyeuté Recovery Protocol" "BrightCyan"
Write-Log "Log file: $LOG_FILE" "Gray"

# Step 1: Check prerequisites
Test-Step "Checking Prerequisites" {
    # Check Node.js
    $nodeVersion = node --version
    if (-not $nodeVersion) {
        throw "Node.js not found"
    }
    Write-Log "Node.js: $nodeVersion" "Gray"
    
    # Check Git
    $gitVersion = git --version
    Write-Log "Git: $gitVersion" "Gray"
    
    # Check if in correct directory
    if (-not (Test-Path "zyeute")) {
        throw "Not in ZyeuteV5 directory or zyeute/ folder missing"
    }
}

# Step 2: Clean up locked files
Test-Step "Cleaning Locked Files" {
    $lockedFolders = @("node_modules", ".next", "dist", ".turbo")
    
    foreach ($folder in $lockedFolders) {
        if (Test-Path $folder) {
            Write-Log "Removing $folder..." "Yellow"
            Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            
            if (Test-Path $folder) {
                Write-Log "⚠️  $folder still exists, may be locked" "Yellow"
            } else {
                Write-Log "✅ Removed $folder" "Green"
            }
        }
    }
}

# Step 3: Clean npm cache
Test-Step "Cleaning npm Cache" {
    npm cache clean --force 2>&1 | Out-File -FilePath "$LOG_DIR/npm-cache-clean.log" -Append
    Write-Log "npm cache cleaned" "Gray"
}

# Step 4: Install dependencies
Test-Step "Installing Dependencies" {
    Set-Location zyeute
    npm ci 2>&1 | Out-File -FilePath "$LOG_DIR/npm-ci.log" -Append
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "⚠️  npm ci had issues, trying npm install..." "Yellow"
        npm install 2>&1 | Out-File -FilePath "$LOG_DIR/npm-install.log" -Append
    }
    
    Set-Location ..
}

# Step 5: Run BugBot test harness
Test-Step "Running BugBot Test Harness" {
    Set-Location zyeute
    npx tsx scripts/test-bugbot.ts 2>&1 | Out-File -FilePath "$LOG_DIR/bugbot-test.log" -Append
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "⚠️  BugBot tests had issues (check log)" "Yellow"
    }
    Set-Location ..
}

# Step 6: Run analytics test
Test-Step "Testing Supabase Analytics Connection" {
    Set-Location zyeute
    if (Test-Path ".env") {
        npx tsx scripts/test-analytics.ts 2>&1 | Out-File -FilePath "$LOG_DIR/analytics-test.log" -Append
    } else {
        Write-Log "⚠️  .env file not found, skipping analytics test" "Yellow"
    }
    Set-Location ..
}

# Step 7: Check Git status
Test-Step "Checking Git Status" {
    $gitStatus = git status --short
    $changedFiles = ($gitStatus | Measure-Object -Line).Lines
    Write-Log "Changed files: $changedFiles" "Gray"
    
    if ($changedFiles -gt 0) {
        Write-Log "📋 Summary of changes:" "Cyan"
        $gitStatus | Select-Object -First 10 | ForEach-Object {
            Write-Log "  $_" "Gray"
        }
    }
}

# Step 8: Validate TypeScript
Test-Step "Validating TypeScript" {
    Set-Location zyeute
    npx tsc --noEmit 2>&1 | Out-File -FilePath "$LOG_DIR/tsc-check.log" -Append
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ TypeScript compilation successful" "Green"
    } else {
        Write-Log "⚠️  TypeScript errors found (check log)" "Yellow"
    }
    Set-Location ..
}

# Final summary
Write-Log "`n=== Recovery Summary ===" "BrightCyan"
Write-Log "Log file: $LOG_FILE" "Gray"
Write-Log "✅ Recovery protocol complete!" "Green"
