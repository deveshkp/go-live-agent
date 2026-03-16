# Go-live — Google Cloud Run Deployment Guide

This guide walks you through deploying Go-live to Google Cloud Run in under 10 minutes.

## Prerequisites

Before you start, ensure you have:

1. **Google Cloud Account** — [Create one here](https://cloud.google.com) (free tier available)
2. **Google Cloud CLI** — [Install gcloud](https://cloud.google.com/sdk/docs/install)
3. **Docker** (optional) — Only needed if testing locally before deployment
4. **GitHub repository** (optional) — For automatic deployments via Cloud Build

## Quick Start (5 minutes)

### Step 1: Set Up Google Cloud Project

```bash
# Set your project ID (replace with your actual project ID)
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Login to Google Cloud
gcloud auth login

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 2: Deploy Using Cloud Build (Automatic)

This is the easiest method — Cloud Build automatically builds and deploys:

```bash
# From the project root directory
gcloud builds submit \
  --config=cloudbuild.yaml \
  --region=$REGION
```

Cloud Build will:
1. Build the Docker image
2. Push to Container Registry
3. Deploy to Cloud Run
4. Provide you with a public URL

**That's it!** Your app is now live.

### Step 3: Get Your Public URL

After deployment completes, you'll see output like:

```
Service [go-live] revision [go-live-00001-xyz] has been deployed and is serving 100 percent of traffic.
Service URL: https://go-live-xxxxx.run.app
```

Share this URL with judges — they can open it on any iPhone in Safari and add it to their home screen.

## Alternative: Manual Docker Deployment

If you prefer to build and deploy manually:

```bash
# Build the image
docker build -t gcr.io/$PROJECT_ID/go-live:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/go-live:latest

# Deploy to Cloud Run
gcloud run deploy go-live \
  --image gcr.io/$PROJECT_ID/go-live:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 100
```

## Environment Variables

If you need to pass environment variables to the app (e.g., for the Gemini API), add them during deployment:

```bash
gcloud run deploy go-live \
  --image gcr.io/$PROJECT_ID/go-live:latest \
  --region $REGION \
  --set-env-vars GEMINI_API_KEY=your-key-here
```

## Continuous Deployment (Optional)

For automatic deployments when you push to GitHub:

1. **Connect your GitHub repository** to Cloud Build:
   ```bash
   gcloud builds connect --repository-name=gemini-router-assistant \
     --repository-owner=your-github-username \
     --region=$REGION
   ```

2. **Create a build trigger** in the Cloud Console that runs `cloudbuild.yaml` on every push

3. **Push to main branch** — Cloud Build automatically deploys

## Monitoring & Logs

View your app's logs:

```bash
gcloud run logs read go-live --region=$REGION --limit=50
```

View in Cloud Console:

```bash
gcloud run services describe go-live --region=$REGION
```

## Scaling & Performance

Cloud Run automatically scales based on traffic. To adjust limits:

```bash
gcloud run deploy go-live \
  --region $REGION \
  --max-instances 50 \
  --memory 512Mi \
  --cpu 2
```

## Troubleshooting

**Build fails with "permission denied":**
```bash
# Grant Cloud Build service account permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin
```

**App crashes on startup:**
```bash
# Check logs for errors
gcloud run logs read go-live --region=$REGION --limit=100
```

**High latency or timeouts:**
- Increase memory: `--memory 1Gi`
- Increase CPU: `--cpu 2`
- Check logs for slow operations

## Cost Estimation

For a hackathon demo:

| Resource | Usage | Cost |
|----------|-------|------|
| Cloud Run (2M requests/month free) | ~1000 requests | Free |
| Container Registry storage | ~200MB | ~$0.10/month |
| Outbound bandwidth | ~500MB | Free (within US) |
| **Total** | | **Free tier** |

## Cleanup

To delete the deployment and avoid charges:

```bash
gcloud run services delete go-live --region=$REGION
gcloud container images delete gcr.io/$PROJECT_ID/go-live --quiet
```

## Next Steps

1. **Custom Domain** — Add a custom domain to your Cloud Run service in the Cloud Console
2. **HTTPS** — Cloud Run automatically provides HTTPS certificates
3. **API Key Management** — Use Secret Manager to store Gemini API keys securely
4. **Analytics** — Enable Cloud Logging to track usage

## Support

For more details, see the [Cloud Run documentation](https://cloud.google.com/run/docs).
