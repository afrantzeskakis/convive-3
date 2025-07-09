#!/bin/bash

echo "Deploying to Railway..."

# Add all changes
git add -A

# Commit with a message
git commit -m "Make email optional in user creation and sync database schema" || echo "No changes to commit"

# Push to trigger Railway deployment
git push

echo ""
echo "✅ Code pushed to Railway!"
echo ""
echo "Railway will now build and deploy your app. This usually takes 2-3 minutes."
echo ""
echo "⚠️  IMPORTANT: Database Schema Update Required!"
echo "=================================="
echo "After deployment completes, you need to sync the database schema:"
echo ""
echo "1. Go to your Railway dashboard"
echo "2. Open the app's shell/console"
echo "3. Run: npx tsx scripts/sync-production-email-optional.ts"
echo ""
echo "This will make the email field optional in the production database."
echo ""
echo "Then login with:"
echo "Username: superadmin"
echo "Password: convive2023"