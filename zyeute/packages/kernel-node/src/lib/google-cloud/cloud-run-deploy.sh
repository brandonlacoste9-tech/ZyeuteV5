#!/bin/bash
# Deploy the Queen Bee (SwarmOrchestrator) to Cloud Run
# The Queen scales to zero when idle, saving credits for the real fight

set -e

echo "👑 [QUEEN BEE] Deploying to Google Cloud Run..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_ID="${GOOGLE_CLOUD_PROJECT}"
SERVICE_NAME="queen-bee"
REGION="us-central1"

# Build and deploy
echo "🚀 Building and deploying ${SERVICE_NAME}..."

gcloud run deploy ${SERVICE_NAME} \
    --source . \
    --region=${REGION} \
    --project=${PROJECT_ID} \
    --set-secrets="DATABASE_URL=COLONY_NECTAR:latest,GROQ_API_KEY=COLONY_NECTAR:latest,APIFY_TOKEN=COLONY_NECTAR:latest" \
    --set-env-vars="LLAMA_STACK_URL=http://localhost:8321,GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --memory=2Gi \
    --cpu=2 \
    --timeout=300 \
    --max-instances=10 \
    --min-instances=0 \
    --allow-unauthenticated \
    --port=8080

echo "✅ [QUEEN BEE] Deployment complete!"
echo "   Service: https://${SERVICE_NAME}-${PROJECT_ID}.a.run.app"
echo "   Region: ${REGION}"
