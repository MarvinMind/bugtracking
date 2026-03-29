#!/bin/bash

# Automated Cloudflare Pages Deployment Script
# This script deploys to Cloudflare Pages using the Direct Upload API
# to avoid wrangler's account ID caching issues

set -e

echo "🚀 Starting deployment to Cloudflare Pages..."

# Configuration
PROJECT_NAME="renoir-bug-tracker"
ACCOUNT_ID="c1eced11930d6d091108da03bb14dfae"
BRANCH="${1:-main}"

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN environment variable is not set"
    echo "Please set it using: export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Create deployment tarball
echo "📦 Creating deployment package..."
cd dist
tar -czf ../deployment.tar.gz .
cd ..

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
RESPONSE=$(curl -s -X POST \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -F "manifest={}" \
    -F "branch=$BRANCH" \
    -F "file=@deployment.tar.gz")

# Parse response
SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    URL=$(echo $RESPONSE | jq -r '.result.url')
    DEPLOYMENT_ID=$(echo $RESPONSE | jq -r '.result.id')
    echo ""
    echo "✅ Deployment successful!"
    echo "📍 Deployment URL: $URL"
    echo "🆔 Deployment ID: $DEPLOYMENT_ID"
    echo ""
    
    # Production URL
    if [ "$BRANCH" = "main" ]; then
        echo "🌐 Production URL: https://$PROJECT_NAME-6xk.pages.dev"
    fi
else
    ERROR=$(echo $RESPONSE | jq -r '.errors[0].message // "Unknown error"')
    echo "❌ Deployment failed: $ERROR"
    exit 1
fi

# Cleanup
rm -f deployment.tar.gz

echo "✨ Deployment complete!"
