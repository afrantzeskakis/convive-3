# Railway Auto-Deployment Setup Guide

## Current Situation
Your code changes in Replit are NOT automatically deploying to Railway. This is why the database fix worked but the website still shows errors.

## Option 1: Connect Railway to GitHub (Recommended)

1. **Push your Replit code to GitHub:**
   ```bash
   # In Replit Shell
   git init (if not already initialized)
   git add .
   git commit -m "Latest code with email fix"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **In Railway Dashboard:**
   - Go to your project
   - Click "Settings" → "Deploy"
   - Click "Connect GitHub"
   - Select your repository
   - Choose the branch (usually `main`)
   - Enable "Auto Deploy" toggle

## Option 2: Manual Deploy via Railway CLI

1. **Install Railway CLI in Replit:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link your project:**
   ```bash
   railway link
   # Select your project from the list
   ```

4. **Deploy manually:**
   ```bash
   railway up
   ```

## Option 3: Direct Deploy from Replit (Quick Fix)

1. **Create deployment script:**
   ```bash
   # Already created as deploy-to-railway.sh
   chmod +x deploy-to-railway.sh
   ./deploy-to-railway.sh
   ```

## Immediate Fix (While Setting Up Auto-Deploy)

1. **Go to Railway Dashboard**
2. **Click on your deployment**
3. **Click "Redeploy" button**
4. **Or click "Deploy" → "Deploy from GitHub" if connected**

## Verify Deployment

After deploying, check:
1. Railway logs should show new build starting
2. Build should complete in 3-5 minutes
3. Test user creation at www.convive.us

## Why This Happened

- Replit and Railway are separate platforms
- Changes in Replit don't automatically sync to Railway
- Railway needs to pull code from a Git repository
- Without auto-deploy, you must manually trigger deployments

## Best Practice Going Forward

1. Connect Railway to GitHub for automatic deployments
2. Use git commits to trigger deployments
3. Or use Railway CLI for manual deploys when needed