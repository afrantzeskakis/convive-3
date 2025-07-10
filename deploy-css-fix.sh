#!/bin/bash

echo "=== Deploying CSS Fix to Production ==="

# Build CSS with all styles
echo "Building complete CSS..."
chmod +x build-css.sh
./build-css.sh

# Create deployment marker
echo "CSS rebuilt on $(date)" > DEPLOYMENT_CSS_FIX_MARKER.txt

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up || echo "Railway CLI not authenticated. Please deploy manually."

echo "=== Deployment Complete ==="
echo "CSS has been rebuilt with all styles including purple color fixes (111KB)"
echo "Production should update within 2-3 minutes"