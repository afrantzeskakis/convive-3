#!/bin/bash

echo "Deploying to Railway..."

# Add all changes
git add -A

# Commit with a message
git commit -m "Add optional email and logout button to SuperAdmin dashboard" || echo "No changes to commit"

# Push to trigger Railway deployment
git push

echo ""
echo "✅ Code pushed to Railway!"
echo ""
echo "Railway will now build and deploy your app. This usually takes 2-3 minutes."
echo ""
echo "After deployment completes, test the database connection at:"
echo "https://convive-3-production.up.railway.app/api/test-db"
echo ""
echo "Then login with:"
echo "Username: superadmin"
echo "Password: convive2023"