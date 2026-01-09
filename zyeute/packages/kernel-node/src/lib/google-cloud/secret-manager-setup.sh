#!/bin/bash
# Enshrine the Royal Vault (Secret Manager)
# Moves root .env to Google Secret Manager for secure "Nectar" storage

set -e

echo "🏛️ [ROYAL VAULT] Enshrining Colony Nectar in Google Secret Manager..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env exists
if [ ! -f "../../.env" ]; then
    echo "❌ Error: Root .env file not found at ../../.env"
    exit 1
fi

# Create the secret container
echo "📦 Creating COLONY_NECTAR secret..."
gcloud secrets create COLONY_NECTAR \
    --replication-policy="automatic" \
    --project="${GOOGLE_CLOUD_PROJECT}" \
    || echo "⚠️ Secret may already exist, continuing..."

# Inject your root .env content
echo "🔐 Injecting .env content into Secret Manager..."
gcloud secrets versions add COLONY_NECTAR \
    --data-file="../../.env" \
    --project="${GOOGLE_CLOUD_PROJECT}"

echo "✅ [ROYAL VAULT] Colony Nectar enshrined in Secret Manager"
echo "   Secret: COLONY_NECTAR"
echo "   Project: ${GOOGLE_CLOUD_PROJECT}"
