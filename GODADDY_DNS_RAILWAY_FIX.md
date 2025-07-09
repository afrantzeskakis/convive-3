# GoDaddy DNS Configuration Fix for Railway

## Common "Record Data is Invalid" Solutions

### What Railway Gives You
Railway provides a domain like: `your-app-production.up.railway.app`

### What GoDaddy Expects

**For CNAME Records (most common):**

1. **Type**: CNAME
2. **Name**: 
   - For subdomain (app.yourdomain.com): Enter just `app`
   - For www.yourdomain.com: Enter `www`
   - DO NOT use @ for root domain with CNAME
3. **Value**: Enter ONLY the Railway domain WITHOUT:
   - No `https://` prefix
   - No trailing slash `/`
   - No trailing dot `.`
   - Just: `your-app-production.up.railway.app`

### Step-by-Step Fix

1. **In GoDaddy DNS Management:**
   - Go to your domain's DNS settings
   - Click "Add" or "Add Record"

2. **Configure the Record:**
   ```
   Type: CNAME
   Name: app (or www, or your preferred subdomain)
   Value: your-app-production.up.railway.app
   TTL: 1 hour (or 600 seconds)
   ```

3. **Common Mistakes to Avoid:**
   ❌ DON'T: `https://your-app-production.up.railway.app`
   ❌ DON'T: `your-app-production.up.railway.app.`
   ❌ DON'T: `your-app-production.up.railway.app/`
   ✅ DO: `your-app-production.up.railway.app`

### If You Want Root Domain (yourdomain.com)

GoDaddy doesn't support CNAME for root domains. You need:

**Option 1: Use www subdomain**
- Set up CNAME for `www` as shown above
- Use GoDaddy's forwarding to redirect root to www

**Option 2: Use GoDaddy's Domain Forwarding**
1. Set up CNAME for `www` subdomain
2. In Domain Settings → Forwarding
3. Forward `yourdomain.com` to `https://www.yourdomain.com`

### Verification Steps

1. **After adding the record:**
   - Wait 5-10 minutes for propagation
   - Visit: `app.yourdomain.com` (or your chosen subdomain)

2. **Check DNS propagation:**
   - Visit: https://dnschecker.org
   - Enter your full domain (app.yourdomain.com)
   - Select "CNAME" record type
   - Should show your Railway domain

### Still Getting Errors?

**Try this exact format in GoDaddy:**
1. Delete any existing conflicting records for the same subdomain
2. Add new CNAME record
3. In the "Points to" field, paste ONLY the Railway domain
4. Make sure there are no spaces before or after
5. Save the record

**Railway's Custom Domain Setup:**
1. In Railway project settings
2. Go to Settings → Domains
3. Click "Add Domain"
4. Enter your full custom domain: `app.yourdomain.com`
5. Railway will verify the DNS configuration

### Quick Checklist

- [ ] Using CNAME record type (not A record)
- [ ] Subdomain name entered correctly (just `app`, not `app.yourdomain.com`)
- [ ] Railway domain has no https:// prefix
- [ ] No trailing dots or slashes
- [ ] No spaces in the domain value
- [ ] Waited 5-10 minutes for DNS propagation

### Example Configuration

If Railway shows: `convive-app-production.up.railway.app`

In GoDaddy:
```
Type: CNAME
Name: app
Value: convive-app-production.up.railway.app
TTL: 1 hour
```

This will make your app available at: `app.yourdomain.com`