#!/bin/bash
set -e

echo "🚀 Starting deployment to Cloudflare Pages..."

# Configuration
PROJECT_NAME="bugs2fixes"

# Ensure API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Error: CLOUDFLARE_API_TOKEN is not set"
  exit 1
fi

# Clear wrangler cache to avoid account ID issues
echo "🧹 Clearing wrangler cache..."
rm -rf node_modules/.cache/wrangler/
rm -rf .wrangler/

# Build the project
echo "📦 Building application..."
npm run build

# Deploy using wrangler
echo "📤 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=${PROJECT_NAME} --commit-dirty=true

echo "✅ Deployment complete!"
echo "🌐 Production URL: https://${PROJECT_NAME}.pages.dev"
