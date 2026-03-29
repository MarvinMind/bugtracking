#!/bin/bash
set -e

echo "🚀 Starting deployment to Cloudflare Pages..."

# Configuration
PROJECT_NAME="bugs2fixes"
ACCOUNT_ID="c1eced11930d6d091108da03bb14dfae"
D1_DATABASE_ID="97bef0b6-3820-45a2-8575-2b618330472d"

# Ensure API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Error: CLOUDFLARE_API_TOKEN is not set"
  exit 1
fi

# Build the project
echo "📦 Building application..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
tar -czf ../deployment.tar.gz .
cd ..

# Upload deployment using Direct Upload API
echo "📤 Uploading to Cloudflare Pages..."
UPLOAD_RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -F "file=@deployment.tar.gz" \
  -F 'manifest={"production_branch":"main","build_config":{"production_branch":"main"}}' \
  -F "branch=main")

# Extract deployment URL
DEPLOYMENT_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "❌ Deployment failed!"
  echo $UPLOAD_RESPONSE | jq '.' || echo $UPLOAD_RESPONSE
  exit 1
fi

echo "✅ Deployment successful!"
echo "📝 Deployment ID: $DEPLOYMENT_ID"
echo "🌐 Production URL: https://${PROJECT_NAME}.pages.dev"
echo "🔗 Deployment URL: https://${DEPLOYMENT_ID}.${PROJECT_NAME}.pages.dev"

# Update D1 binding via API
echo "🔧 Configuring D1 database binding..."
BINDING_CONFIG=$(cat <<EOF
{
  "deployment_configs": {
    "production": {
      "d1_databases": {
        "DB": {
          "id": "${D1_DATABASE_ID}"
        }
      },
      "compatibility_date": "2025-10-29",
      "compatibility_flags": ["nodejs_compat"]
    }
  }
}
EOF
)

PATCH_RESPONSE=$(curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$BINDING_CONFIG")

echo "✅ D1 binding configured!"
echo "🎉 Deployment complete!"
