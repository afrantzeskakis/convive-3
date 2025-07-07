# Complete Railway Setup Guide - Step by Step

This guide walks you through deploying your Restaurant Wine Management app to Railway. Written for non-coders - just follow each step exactly.

## What You'll Need
- Your Replit project (you have this ✓)
- A GitHub account (free)
- A Railway account (free)
- Your API keys (OPENAI_API_KEY, etc.)

## Part 1: Set Up GitHub (10 minutes)

### Step 1: Create GitHub Account
1. Go to https://github.com
2. Click "Sign up"
3. Create username/password
4. Verify your email

### Step 2: Create New Repository
1. Click the "+" icon (top right)
2. Select "New repository"
3. Name it: `restaurant-wine-app`
4. Keep it "Public"
5. Don't initialize with README
6. Click "Create repository"
7. Keep this page open!

## Part 2: Push Your Code to GitHub (15 minutes)

### Step 3: Open Replit Shell
1. In your Replit project
2. Click "Shell" tab at bottom
3. You'll see a command prompt

### Step 4: Initialize Git
Copy and paste these commands one by one:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit - Restaurant Wine Management System"
```

### Step 5: Connect to GitHub
1. Go back to your GitHub page
2. Find the section "…or push an existing repository"
3. Copy the commands that look like:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/restaurant-wine-app.git
   git branch -M main
   git push -u origin main
   ```
4. Paste them in Replit Shell one by one

### Step 6: Enter GitHub Credentials
When prompted:
- Username: Your GitHub username
- Password: You need a token (not your password!)
  
To get a token:
1. Go to GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. Name: "Replit Deploy"
5. Check the "repo" checkbox
6. Click "Generate token"
7. Copy the token (save it somewhere!)
8. Use this token as the password

## Part 3: Set Up Railway (20 minutes)

### Step 7: Create Railway Account
1. Go to https://railway.app
2. Click "Login"
3. Choose "Login with GitHub" (easiest!)
4. Authorize Railway

### Step 8: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `restaurant-wine-app` repository
4. Click "Deploy Now"

### Step 9: Wait for Initial Deploy
1. Railway will start building
2. It will probably FAIL - this is normal!
3. We need to add environment variables

### Step 10: Add Database
1. In your Railway project
2. Click "New" → "Database" → "PostgreSQL"
3. Click "Create"
4. Wait for it to provision (green checkmark)

### Step 11: Set Environment Variables
1. Click on your app service (not the database)
2. Go to "Variables" tab
3. Click "Raw Editor"
4. Paste this (replace with your actual values):

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your-openai-key-here
SESSION_SECRET=any-random-text-you-want-here-make-it-long
NODE_ENV=production
PORT=5000
```

5. Click "Update Variables"

### Step 12: Add More Variables If Needed
If you have these, add them too:
```
APIFY_API_TOKEN=your-apify-token
STRIPE_SECRET_KEY=your-stripe-key
```

## Part 4: Configure & Deploy (10 minutes)

### Step 13: Configure Build Settings
1. Go to "Settings" tab
2. Under "Build Command", make sure it says: `npm run build`
3. Under "Start Command", make sure it says: `npm start`
4. Under "Root Directory", leave it empty

### Step 14: Redeploy
1. Go to "Deployments" tab
2. Click the three dots on failed deployment
3. Select "Redeploy"
4. Watch the logs (should work now!)

### Step 15: Run Database Migrations
1. Once deployed (green), go to "Settings"
2. Find your deployment URL (like `xxx.railway.app`)
3. Back in Replit Shell, run:
   ```bash
   DATABASE_URL="your-railway-database-url" npm run db:migrate
   ```
   (Get the database URL from Railway variables)

## Part 5: Access Your App (5 minutes)

### Step 16: Find Your URL
1. In Railway, go to "Settings"
2. Under "Domains", you'll see something like:
   `restaurant-wine-app-production.up.railway.app`
3. Click it to open your app!

### Step 17: First Login
1. Your app should load
2. Try logging in with your credentials
3. If login fails, check the logs in Railway

## Troubleshooting Common Issues

### "Build Failed"
Check these in order:
1. All environment variables set?
2. DATABASE_URL has the Railway one?
3. Try redeploying

### "Cannot Connect to Database"
1. Make sure PostgreSQL is green in Railway
2. DATABASE_URL should be automatically linked
3. Did you run migrations?

### "Application Error"
1. Check logs: Deployments → View Logs
2. Look for red error messages
3. Usually missing environment variable

### "Login Not Working"
1. Is SESSION_SECRET set?
2. Try a different browser
3. Clear cookies and try again

## Getting Help

### Railway Discord
1. Join: https://discord.gg/railway
2. Go to #help channel
3. Say: "New to Railway, deploying Node.js/React app, getting [error]"
4. Share your deployment logs

### Ask AI
Copy this template:
```
I followed the Railway setup guide and got to step [X].
Now I'm seeing this error: [paste error]
My logs show: [paste relevant logs]
All my environment variables are set.
How do I fix this?
```

## Success Checklist

- [ ] GitHub repo created and code pushed
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] All environment variables set
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Deployment is green
- [ ] Can access the URL
- [ ] Can log in successfully

## Next Steps

Once deployed:
1. Share your Railway URL with others
2. Set up a custom domain (optional)
3. Enable automatic deploys (already on by default)
4. Monitor usage in Railway dashboard

## Keep Development Simple

Remember:
- Keep developing on Replit
- Push to GitHub when ready: `git add . && git commit -m "Updates" && git push`
- Railway auto-deploys when you push
- Check Railway logs if something breaks

Congratulations! Your app is now live on the internet! 🎉