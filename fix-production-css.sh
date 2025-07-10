#!/bin/bash

# Direct CSS fix for production
echo "🔧 Fixing production CSS directly..."

# Ensure the directory exists
mkdir -p server/public/assets

# Copy the complete production CSS
cp server/production-styles.css server/public/assets/index.css

echo "✅ Production CSS applied!"
echo "CSS file size: $(ls -lh server/public/assets/index.css | awk '{print $5}')"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ CSS fix deployed! Production should update in 2-3 minutes."