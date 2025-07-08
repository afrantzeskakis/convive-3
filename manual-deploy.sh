#!/bin/bash

echo "Manual deployment to Railway"
echo "============================"

# Remove any git locks if they exist
rm -f .git/index.lock 2>/dev/null

# Configure git
git config --global user.email "deploy@convive.com"
git config --global user.name "Convive Deploy"

# Stage all changes
echo "Staging changes..."
git add -A

# Show status
echo ""
echo "Files to be committed:"
git status --short

# Commit changes
echo ""
echo "Committing changes..."
COMMIT_MSG="Fix super admin dashboard - setTotalWines error and restaurants API"
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

# Push to Railway
echo ""
echo "Pushing to Railway..."
git push origin main || git push

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Railway will now build and deploy your changes."
echo "This typically takes 2-3 minutes."
echo ""
echo "Monitor your deployment at: https://railway.app/dashboard"
echo ""
echo "Once deployed, access your app at:"
echo "https://convive-3-production.up.railway.app"