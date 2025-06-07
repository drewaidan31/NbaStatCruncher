# NBA Analytics - Vercel Deployment Guide

## Quick Fix for TailwindCSS Error

The error you encountered is because Vercel needs TailwindCSS in `dependencies` rather than `devDependencies`. Here's how to fix it:

### Option 1: Use the Pre-configured Package File (Recommended)

1. **Replace package.json with the deployment version:**
   ```bash
   cp package.vercel.json package.json
   npm install
   ```

2. **Set Environment Variables in Vercel:**
   - `DATABASE_URL` - Your PostgreSQL database connection string
   - `SESSION_SECRET` - A random string for session encryption
   - `NODE_ENV=production`

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

### Option 2: Manual Package.json Fix

If you prefer to modify your existing package.json manually:

1. **Move these packages from devDependencies to dependencies:**
   ```json
   "tailwindcss": "^3.4.17",
   "autoprefixer": "^10.4.20", 
   "postcss": "^8.4.47",
   "@tailwindcss/typography": "^0.5.15",
   "@tailwindcss/vite": "^4.1.3"
   ```

2. **Install and deploy:**
   ```bash
   npm install
   vercel --prod
   ```

## Database Setup

### Using Neon (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to Vercel environment variables
4. Run database migration: `npm run db:push`

### Using Vercel Postgres
1. Add Vercel Postgres to your project
2. Environment variables are automatically set
3. Run migration: `npm run db:push`

## Vercel Configuration

Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Build Commands

Vercel will automatically detect and run:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Install Command:** `npm install`

## Environment Variables Required

Set these in your Vercel dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-random-session-secret-key
NODE_ENV=production
```

## Post-Deployment Steps

1. **Initialize Database:**
   ```bash
   npm run db:push
   ```

2. **Test the Application:**
   - Visit your Vercel URL
   - Verify NBA player data loads
   - Test custom stat calculations
   - Confirm guided stat builder works

## Troubleshooting

### TailwindCSS Not Found
- Ensure TailwindCSS is in `dependencies` not `devDependencies`
- Use the provided `package.vercel.json` configuration

### Database Connection Issues
- Verify DATABASE_URL format
- Ensure database allows external connections
- Check SSL requirements (Neon requires SSL)

### Build Timeout
- Increase Vercel build timeout in project settings
- Consider using Vercel Pro for longer build times

## Alternative: Railway Deployment

If Vercel continues to have issues, Railway offers better Node.js support:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Railway automatically handles dependencies and provides a PostgreSQL database.

## Support

If you encounter issues:
1. Check Vercel build logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure database is accessible from Vercel's servers
4. Consider using Railway as an alternative platform