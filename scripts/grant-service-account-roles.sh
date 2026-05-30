#!/bin/bash
# Grant Required Roles to Service Account
# 
# This script grants the required roles to vertex-express@floguru.iam.gserviceaccount.com
# 
# Usage:
#   bash scripts/grant-service-account-roles.sh [PROJECT_ID]
#
# Default PROJECT_ID: spatial-garden-483401-g8

PROJECT_ID=${1:-spatial-garden-483401-g8}
SERVICE_ACCOUNT="vertex-express@floguru.iam.gserviceaccount.com"

echo "🔐 Granting roles to Service Account..."
echo "Project: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Grant Vertex AI User role
echo "1️⃣  Granting Vertex AI User role..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user" \
  --condition=None

# Grant Dialogflow API Client role
echo ""
echo "2️⃣  Granting Dialogflow API Client role..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/dialogflow.client" \
  --condition=None

echo ""
echo "✅ Roles granted!"
echo ""
echo "📋 Verify with:"
echo "   npm run verify:service-account"
