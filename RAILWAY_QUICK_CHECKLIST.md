# 🚂 Railway Deployment - Quick Checklist

Check off each step as you complete it:

## 📋 Pre-flight Check
- [ ] Have your Replit project open
- [ ] Know your OPENAI_API_KEY
- [ ] Have 30-45 minutes free

## 🔧 Setup Steps

### GitHub (10 min)
- [ ] Created GitHub account
- [ ] Created new repository named `restaurant-wine-app`
- [ ] Got personal access token

### Push Code (15 min)
- [ ] Ran `git init` in Replit Shell
- [ ] Ran `git add .`
- [ ] Ran `git commit -m "Initial commit"`
- [ ] Connected to GitHub with `git remote add`
- [ ] Pushed with `git push -u origin main`
- [ ] Code visible on GitHub ✓

### Railway Setup (20 min)
- [ ] Created Railway account (with GitHub login)
- [ ] Created new project
- [ ] Selected my GitHub repo
- [ ] Added PostgreSQL database
- [ ] Set environment variables:
  - [ ] DATABASE_URL (auto-linked)
  - [ ] OPENAI_API_KEY
  - [ ] SESSION_SECRET
  - [ ] NODE_ENV=production

### Deploy (10 min)
- [ ] Clicked redeploy
- [ ] Build succeeded (green)
- [ ] Got my app URL
- [ ] App loads in browser
- [ ] Can log in successfully

## 🚨 If Stuck

**Build fails?**
→ Check environment variables

**Database error?**
→ Make sure PostgreSQL is green
→ Run migrations

**App won't load?**
→ Check logs for red errors

**Still stuck?**
→ Railway Discord: https://discord.gg/railway
→ Or ask AI with error message

## 🎯 Success Signs

✅ Railway shows green deployment
✅ Your custom URL works
✅ You can log in
✅ Wine database loads
✅ Recipe features work

## 📝 For Future Updates

When you change code in Replit:
```bash
git add .
git commit -m "Updated features"
git push
```
Railway auto-deploys in ~2 minutes!

---

**Remember:** If it's not working after 45 minutes, take a break and ask for help. Deployment is tricky even for experts!