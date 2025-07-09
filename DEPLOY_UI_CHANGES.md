# Deploy UI Changes to Railway

## Quick Steps

Since you've made changes to the Convive Select UI, here's how to deploy them:

### Method 1: Using Replit Shell
1. Open the Shell tab in Replit
2. Run these commands one by one:
   ```bash
   git add -A
   git commit -m "Update Convive Select UI with refined pricing and features"
   git push
   ```

### Method 2: If Git Commands Don't Work
1. Go to your GitHub repository in the browser
2. Click "Upload files" or "Add file" > "Upload files"
3. Select all your project files and upload them
4. Add commit message: "Update Convive Select UI with refined pricing and features"
5. Click "Commit changes"

### What Happens Next
- Railway will automatically detect the changes
- It will rebuild your app (takes 2-3 minutes)
- Your live site will update with the new UI

### Changes Being Deployed
- Changed "Convive Black" to "Convive Select"
- Updated pricing text to "Less than $15 per connection"
- Changed to "Up to 30 high-value connections per month"
- Updated to "5 curated dinners per month"
- New features list with refined descriptions
- Better text sizing and spacing

### Check Deployment Status
1. Go to your Railway project dashboard
2. Click on the "Deployments" tab
3. You'll see a new deployment starting
4. Wait for it to turn green (successful)
5. Visit your live site to see the changes

Your site should be live at: `www.convive.us`