# GitHub Codespaces Deployment Guide

## Quick Setup (Using Your Existing Database)

Your Replit database is already hosted on Neon, so you can use the same database for GitHub deployment.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "NBA Analytics Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nba-analytics.git
git push -u origin main
```

### Step 2: Open in Codespaces
1. Go to your GitHub repository
2. Click green "Code" button → "Codespaces" → "Create codespace"
3. Wait for environment to load

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` file:
```
DATABASE_URL=postgresql://neondb_owner:npg_lasou4KL5Sci@ep-silent-waterfall-a5vavjeg.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=nba-analytics-secret-2024
NODE_ENV=development
PORT=5000
```

### Step 5: Start Application
```bash
npm run dev
```

Codespaces will automatically forward the port and provide a URL.

## What Works Immediately:
- All 3,848 NBA players with complete statistics
- Custom formula calculations and leaderboards
- Player search, filtering, and comparisons
- All UI components and visualizations

## What Won't Work (Authentication Features):
- User login/logout
- Saving custom statistics
- Favorite players management

## Production Deployment:

### Vercel:
```bash
npm install -g vercel
vercel --prod
```
Add DATABASE_URL in Vercel dashboard environment variables.

### Railway:
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Render:
Connect GitHub repo at render.com, add DATABASE_URL environment variable.

Your application will be fully functional with all NBA data and analytics features working immediately.