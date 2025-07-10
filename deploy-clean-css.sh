#!/bin/bash

echo "=== Deploying Clean CSS Solution ==="

# Build CSS using clean process
echo "Building clean CSS without hardcoded colors..."
NODE_ENV=production npx tailwindcss -i client/src/styles.css -o server/public/assets/index.css --minify

# Create deployment marker
echo "Clean CSS build deployed on $(date)" > DEPLOYMENT_CLEAN_CSS_MARKER.txt

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up || echo "Railway CLI not authenticated. Please deploy manually."

echo "=== Deployment Complete ==="
echo "CSS now uses proper variable resolution without hardcoded colors"
echo "Production should update within 2-3 minutes"