# Fix for GoDaddy Root Domain with Railway

## The Problem
- You're trying to use `convive.us` (root domain) with Railway
- Railway gave you: `uj64602c.up.railway.app`
- GoDaddy won't accept CNAME for root domains

## Solution 1: Use www subdomain (Recommended)

### Step 1: In GoDaddy DNS Management
1. Delete any existing CNAME record for @ or root
2. Add new record:
   ```
   Type: CNAME
   Name: www
   Value: uj64602c.up.railway.app
   TTL: 600 seconds (or 1 hour)
   ```

### Step 2: Set up Domain Forwarding
1. In GoDaddy, go to Domain Settings → Forwarding
2. Set up forwarding:
   - Forward to: https://www.convive.us
   - Forward type: Permanent (301)
   - Update my nameservers: Yes

### Step 3: Update Railway
1. In Railway Settings → Domains
2. Remove `convive.us` if it's there
3. Add `www.convive.us` instead
4. Railway will verify the CNAME

## Solution 2: Use app subdomain

### In GoDaddy:
```
Type: CNAME
Name: app
Value: uj64602c.up.railway.app
TTL: 600 seconds
```

### In Railway:
- Add custom domain: `app.convive.us`

## Important Notes

1. **Remove https://** - Never include https:// in CNAME values
2. **Root domains need A records** - But Railway uses dynamic IPs, so CNAME is required
3. **Use subdomains** - www.convive.us or app.convive.us work perfectly

## What You Should Do Now

1. Go to GoDaddy DNS Management
2. Delete any @ or root CNAME records
3. Add CNAME for `www` pointing to `uj64602c.up.railway.app`
4. Set up forwarding from convive.us to www.convive.us
5. Update Railway to use `www.convive.us` as the custom domain

Your site will be accessible at both:
- convive.us (redirects to www)
- www.convive.us (main site)

## Verification
After 5-10 minutes, check:
- https://dnschecker.org
- Enter: www.convive.us
- Select: CNAME
- Should show: uj64602c.up.railway.app