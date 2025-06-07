# NBA Analytics - Railway Deployment Guide

Railway is the recommended deployment platform for your NBA analytics application because it handles full-stack Node.js apps seamlessly and provides PostgreSQL databases.

## Quick Deploy to Railway

### Option 1: One-Click Deploy (Easiest)

1. **Connect GitHub to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "Deploy from GitHub repo"
   - Select your NBA analytics repository

2. **Railway automatically:**
   - Detects Node.js application
   - Installs dependencies
   - Builds the application
   - Provides a PostgreSQL database
   - Sets up environment variables

### Option 2: Railway CLI Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Environment Variables

Railway will automatically set up:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port
- `NODE_ENV=production`

You only need to add:
- `SESSION_SECRET` - Set to any random string like `nba-analytics-secret-2024`

## Database Setup

Railway provides PostgreSQL automatically:

1. **Database is created automatically**
2. **Run migration after deployment:**
   ```bash
   railway run npm run db:push
   ```

## Post-Deployment

Your NBA analytics application will be available at:
`https://your-app-name.up.railway.app`

The application includes:
- 553 NBA players with complete statistics
- Custom stat calculator with delete button
- Guided stat builder with archetype mechanics
- Player comparison and analysis tools
- Favorite players functionality

## Why Railway vs Vercel

**Railway Advantages:**
- Better Node.js support
- Automatic PostgreSQL database
- Simpler configuration
- No serverless function limitations
- Better for full-stack applications

**Railway automatically handles:**
- Build process
- Database connections
- Environment variables
- SSL certificates
- Domain management

## Troubleshooting

If deployment fails:

1. **Check build logs in Railway dashboard**
2. **Ensure all dependencies are in package.json**
3. **Verify DATABASE_URL is set correctly**
4. **Run database migration: `railway run npm run db:push`**

## Cost

Railway offers:
- Free tier with 500 hours/month
- $5/month for unlimited usage
- PostgreSQL database included

## Alternative: Back to Vercel

If you prefer Vercel, the 404 error can be fixed by:

1. **Using the updated vercel.json configuration**
2. **Ensuring build output is in correct directory**
3. **Setting environment variables properly**

But Railway is recommended for easier deployment and better Node.js support.