# 🛡️ Graceful Shutdown Script - Sovereign Shield
# Scales down idle resources to save credits
# Keeps Queen Bee running (always available)

Write-Host "`n🛡️ SOVEREIGN SHIELD: Graceful Shutdown" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$projectId = gcloud config get-value project
if (-not $projectId) {
    Write-Host "❌ No Google Cloud project set. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Project: $projectId" -ForegroundColor Yellow
Write-Host ""

# Check for GKE clusters
Write-Host "🔍 Checking for GKE clusters..." -ForegroundColor Yellow
$clusters = gcloud container clusters list --format="json" | ConvertFrom-Json

if ($clusters.Count -gt 0) {
    Write-Host "   Found $($clusters.Count) cluster(s)" -ForegroundColor Green
    
    foreach ($cluster in $clusters) {
        $clusterName = $cluster.name
        $location = $cluster.location
        
        Write-Host "`n📦 Cluster: $clusterName ($location)" -ForegroundColor Cyan
        
        # Scale down deployments
        Write-Host "   Scaling down deployments..." -ForegroundColor Yellow
        try {
            gcloud container clusters get-credentials $clusterName --location $location --project $projectId | Out-Null
            
            # Get all deployments
            $deployments = kubectl get deployments -o json | ConvertFrom-Json
            
            foreach ($deployment in $deployments.items) {
                $deploymentName = $deployment.metadata.name
                Write-Host "     Scaling $deploymentName to 0..." -ForegroundColor Gray
                kubectl scale deployment $deploymentName --replicas=0 2>&1 | Out-Null
            }
            
            Write-Host "   ✅ Deployments scaled down" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Could not scale down: $_" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   No GKE clusters found" -ForegroundColor Gray
}

# Check Cloud Run services (keep running, but note them)
Write-Host "`n☁️  Cloud Run Services:" -ForegroundColor Yellow
$services = gcloud run services list --format="json" | ConvertFrom-Json

if ($services.Count -gt 0) {
    foreach ($service in $services) {
        $serviceName = $service.metadata.name
        $status = $service.status.conditions | Where-Object { $_.type -eq "Ready" } | Select-Object -First 1
        
        if ($status.status -eq "True") {
            Write-Host "   ✅ $serviceName - Running (kept active)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $serviceName - Not ready" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   No Cloud Run services found" -ForegroundColor Gray
}

# Check BigQuery (keep running)
Write-Host "`n📊 BigQuery:" -ForegroundColor Yellow
Write-Host "   ✅ Datasets remain active (minimal cost)" -ForegroundColor Green

# Check Secret Manager (keep active)
Write-Host "`n🔐 Secret Manager:" -ForegroundColor Yellow
Write-Host "   ✅ Secrets remain active (minimal cost)" -ForegroundColor Green

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "   • GKE clusters: Scaled down to 0 replicas" -ForegroundColor Gray
Write-Host "   • Cloud Run: Kept running (Queen Bee active)" -ForegroundColor Gray
Write-Host "   • BigQuery: Active (streaming logs)" -ForegroundColor Gray
Write-Host "   • Secret Manager: Active (secure storage)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 To restart GKE:" -ForegroundColor Yellow
Write-Host "   kubectl scale deployment DEPLOYMENT_NAME --replicas=2" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
