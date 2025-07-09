# Email Optional Database Update

## Problem
The database schema mismatch is preventing user creation when email is not provided. The production database still requires email (NOT NULL constraint) while the code now allows optional emails.

## Solution Applied
1. Updated `shared/schema.ts` - removed `.notNull()` from email field
2. Updated local database - made email column nullable
3. Created production sync script

## Deployment Steps

### 1. Deploy Code Changes
```bash
./deploy-to-railway.sh
```

### 2. Sync Production Database (REQUIRED)
After deployment completes:

1. Open Railway dashboard
2. Click on your app
3. Go to "Settings" tab
4. Click "Generate Shell Command" 
5. Run the command in your terminal
6. Once connected, run:
```bash
npx tsx scripts/sync-production-email-optional.ts
```

### 3. Verify
- Try creating a user without email in SuperAdmin dashboard
- Test login with existing users (like restadmin1)

## Note
This database sync is a one-time operation. Future deployments won't need this step.