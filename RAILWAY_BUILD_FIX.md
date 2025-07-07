# Railway Build Fix Guide

## The Problem
Your Railway deployment looks different from the local development version because the frontend assets aren't being built properly during deployment.

## The Solution
I've updated the `build.sh` script to properly build your React frontend for production. Here's what needs to happen:

### 1. Clean Up Temporary Files
First, let's clean up any temporary build files:
```bash
rm -f vite.config.prod.mjs vite.config.production.js vite.config.build.mjs production-build-fix.sh fix-build.sh
```

### 2. Test the Build Locally
Run this command to test if the build works:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npx vite build
```

### 3. If Build Fails with @ Import Errors
The vite config might need adjustment. The issue is typically with module resolution during production builds.

### 4. Commit and Deploy
Once the build works locally:
```bash
git add -A
git commit -m "Fix production build for Railway deployment"
git push
```

### 5. Railway Deployment
Railway will automatically:
1. Detect the push to your GitHub repository
2. Run the `build.sh` script
3. Build the frontend assets into `dist/public`
4. Start the production server

### 6. Verify Deployment
After Railway redeploys:
1. Visit your Railway app URL
2. The app should now look exactly like your local development version
3. All features (wine enrichment, recipe analysis) should work properly

## What Changed
- Updated `build.sh` to use the standard vite build command
- Ensured platform-specific dependencies are installed
- Added build verification to confirm frontend assets are created

## If Issues Persist
1. Check Railway build logs for specific errors
2. Ensure all environment variables are set in Railway
3. Verify the database connection is working

The key fix is ensuring the frontend gets built during deployment, which creates the `dist/public` folder with all your React components and styles.