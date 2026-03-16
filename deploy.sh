#!/bin/bash

# Go-live — Quick Cloud Run Deployment Script
# Usage: ./deploy.sh [project-id] [region]

set -e

PROJECT_ID="${1:-}"
REGION="${2:-us-central1}"
SERVICE_NAME="go-live"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Usage: ./deploy.sh <project-id> [region]"
  echo ""
  echo "Example:"
  echo "  ./deploy.sh my-gcp-project us-central1"
  exit 1
fi

echo "🚀 Deploying Go-live to Google Cloud Run..."
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Enable APIs
echo "📦 Enabling Google Cloud APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Deploy using Cloud Build
echo "🔨 Building and deploying..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --region=$REGION \
  --substitutions=_REGION=$REGION,_SERVICE=$SERVICE_NAME

# Get the service URL
echo ""
echo "✅ Deployment complete!"
echo ""
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo "🌐 Your app is live at:"
echo "   $SERVICE_URL"
echo ""
echo "📱 To add to iPhone home screen:"
echo "   1. Open the URL in Safari"
echo "   2. Tap Share button"
echo "   3. Select 'Add to Home Screen'"
echo ""
echo "🔗 Share this link with judges:"
echo "   $SERVICE_URL"
