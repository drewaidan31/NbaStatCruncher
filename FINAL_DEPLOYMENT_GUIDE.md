# NBA Analytics - Deployment Guide

## Recommended Approach: Railway with Docker

The configuration errors you're seeing occur because deployment platforms can't resolve the Replit-specific setup. Using Railway with Docker provides the cleanest deployment path.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "NBA Analytics Platform"
git remote add origin https://github.com/YOUR_USERNAME/nba-analytics.git
git push -u origin main
```

### Step 2: Deploy to Railway
1. Go to railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway detects the Dockerfile automatically

### Step 3: Environment Variables
Add in Railway dashboard:
- `SESSION_SECRET`: `nba-analytics-secret-2025`
- Railway provides `DATABASE_URL` automatically

### Step 4: Database Setup
Railway creates PostgreSQL instance automatically. No manual setup needed.

## Alternative: Heroku
1. Create Heroku app
2. Add Heroku PostgreSQL addon
3. Connect GitHub repository
4. Deploy from GitHub

## Alternative: Render
1. Connect GitHub repository
2. Choose "Web Service"
3. Build command: `docker build -t app .`
4. Start command: `docker run -p $PORT:5000 app`

## Why Docker Works
- Isolates build environment
- Bypasses vite.config import issues
- Handles PostCSS configuration automatically
- Provides consistent deployment across platforms

## Expected Outcome
Your NBA analytics platform will be fully functional with:
- Player search and statistics
- Custom stat calculator with delete button
- Guided stat builder with all archetypes
- Career progression visualization
- User authentication and saved stats
- All existing functionality preserved