# GitHub Deployment Guide

## Quick Setup Steps

1. **Replace vite.config.ts with the GitHub version:**
   ```bash
   cp vite.config.ts vite.config.replit.ts
   cp vite.config.github.ts vite.config.ts
   ```

2. **Replace package.json with GitHub version:**
   ```bash
   cp package.json package.replit.json
   cp package.github.json package.json
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create .env file:**
   ```bash
   DATABASE_URL=your_postgresql_url_here
   SESSION_SECRET=any_random_string_here
   NODE_ENV=development
   ```

5. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## Deployment Options

### Option A: Railway (Recommended)
1. Push code to GitHub
2. Go to railway.app
3. Deploy from GitHub repo
4. Add environment variables in Railway dashboard

### Option B: Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Set as Node.js project
4. Add environment variables

### Option C: Heroku
1. Create Heroku app
2. Add PostgreSQL addon
3. Connect GitHub repo
4. Deploy

## Database Setup
For external deployment, you'll need a PostgreSQL database from:
- Neon (free tier)
- Supabase (free tier)
- Railway PostgreSQL
- Heroku PostgreSQL

The DATABASE_URL should be in format:
`postgresql://username:password@host:port/database`