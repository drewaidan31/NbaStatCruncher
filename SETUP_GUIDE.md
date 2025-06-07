# NBA Analytics Setup Guide

## Quick Setup for GitHub Deployment

### 1. Create Environment File
Create a `.env` file in your project root:

```bash
DATABASE_URL=your_neon_connection_string_here
SESSION_SECRET=nba-analytics-secret-2024
NODE_ENV=development
PORT=5000
```

### 2. Set up Database Schema
Run this command to create the database tables:

```bash
npx drizzle-kit push --config=drizzle.config.ts
```

### 3. Import Player Data (Optional)
If you have Python installed and want the full dataset:

```bash
python3 scripts/nba_data.py
```

If Python isn't available, the app will work with an empty database - you can add custom stats and formulas without player data.

### 4. Start the Application
```bash
npm run dev
```

## Troubleshooting

**Database connection error?**
- Verify your DATABASE_URL is correct
- Check that your Neon database is accessible
- Make sure the connection string includes `?sslmode=require`

**No player data?**
- The app works without player data for testing formulas
- Player data import requires Python and the nba-api package

**Authentication not working?**
- Replit Auth only works in Replit environment
- For external deployment, authentication features will be disabled
- Core analytics features (formulas, calculations) work without auth

## Core Features That Work:
- Custom stat formula creation and testing
- Player search and filtering (when data is available)
- Statistical calculations and rankings
- Player comparisons
- All UI components and visualizations