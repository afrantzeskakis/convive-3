# Deployment Guide - Keep Replit for Development

This guide explains how to deploy your Restaurant Wine Management System to production platforms while continuing to use Replit for development with AI assistance.

## Recommended Workflow

1. **Develop on Replit** - Use Replit's AI and environment for all development
2. **Push to GitHub** - Version control and deployment source
3. **Auto-deploy** - Production platform pulls from GitHub automatically

## Deployment Options

### Option 1: Railway (Recommended)
**Best for: Full-stack apps with databases**

1. Create GitHub repository and push your code
2. Sign up at [railway.app](https://railway.app)
3. Create new project → Deploy from GitHub repo
4. Add PostgreSQL database service
5. Set environment variables:
   ```
   DATABASE_URL=(Railway provides this)
   OPENAI_API_KEY=your-key
   SESSION_SECRET=your-secret
   NODE_ENV=production
   ```

### Option 2: Render
**Best for: Free hosting with good performance**

1. Push code to GitHub
2. Sign up at [render.com](https://render.com)
3. Create Web Service → Connect GitHub
4. Build command: `npm run build`
5. Start command: `npm start`
6. Add environment variables in dashboard

### Option 3: Vercel (Frontend) + Railway (Backend)
**Best for: Optimal performance and separation**

Frontend on Vercel:
1. Deploy frontend separately
2. Update API URLs to point to backend

Backend on Railway:
1. Deploy Express server
2. Configure CORS for Vercel domain

### Option 4: Fly.io
**Best for: Global deployment with edge locations**

1. Install Fly CLI
2. Run `fly launch` in project directory
3. Configure `fly.toml` for Node.js
4. Deploy with `fly deploy`

## Setup Steps

### 1. Prepare Your Code

Already done:
- ✅ `.gitignore` file created
- ✅ Build scripts in `package.json`
- ✅ Environment variable usage

### 2. GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3. Environment Variables

Required for all platforms:
- `DATABASE_URL` - Your PostgreSQL connection
- `OPENAI_API_KEY` - For AI features
- `SESSION_SECRET` - For secure sessions
- `NODE_ENV=production`

Optional:
- `APIFY_API_TOKEN` - For wine verification
- `PORT` - Usually auto-set by platform

### 4. Database Options

**Keep Using Neon:**
- Use same `DATABASE_URL` everywhere
- Works on all platforms
- No migration needed

**Platform Database:**
- Railway/Render provide PostgreSQL
- Run migrations: `npm run db:migrate`
- Update `DATABASE_URL` in platform

## Development Workflow

1. **Edit on Replit** - Continue using AI assistance
2. **Test Locally** - Verify changes work
3. **Commit to Git** - Push changes
4. **Auto-Deploy** - Platform detects changes

```bash
# On Replit
git add .
git commit -m "Add new feature"
git push origin main
# Deployment platform auto-deploys
```

## Platform-Specific Notes

### Railway
- Automatic SSL certificates
- Built-in health checks
- Easy rollbacks
- GitHub integration

### Render
- Free tier available
- Automatic HTTPS
- Zero-downtime deploys
- Built-in CDN

### Vercel
- Best for React apps
- Global CDN
- Serverless functions
- Preview deployments

### Fly.io
- Docker-based
- Multi-region
- Built-in metrics
- WebSocket support

## Troubleshooting

**CORS Issues:**
Add deployed URL to CORS config in `server/index.ts`

**Database Connection:**
Ensure `DATABASE_URL` uses SSL: `?sslmode=require`

**Build Failures:**
Check Node version matches Replit (v20)

**Environment Variables:**
Double-check all secrets are set in platform dashboard

## Quick Start Commands

```bash
# Railway
npm install -g @railway/cli
railway login
railway link
railway up

# Render
# Use web dashboard

# Fly.io
curl -L https://fly.io/install.sh | sh
fly launch
fly deploy

# Vercel
npm install -g vercel
vercel
```

## Keeping Replit in Sync

1. Always pull latest changes: `git pull origin main`
2. Test on Replit before pushing
3. Use branches for major changes
4. Keep secrets in sync between platforms

This way you get the best of both worlds - Replit's AI development environment and production-grade hosting!