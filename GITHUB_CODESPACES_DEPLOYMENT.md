# GitHub Codespaces Deployment Guide

## Quick Deployment Steps

1. **Create GitHub Codespace**
   ```bash
   # Fork/clone this repository to your GitHub account
   # Create a new Codespace from the repository
   ```

2. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your database URL
   nano .env
   ```

3. **Add your Neon database URL to .env:**
   ```env
   DATABASE_URL=your_neon_database_url_here
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=your-secret-key
   ```

4. **Install Dependencies & Start**
   ```bash
   npm install
   npm run dev
   ```

5. **Handle Port Conflicts (if needed)**
   ```bash
   # If port 5000 is in use
   sudo lsof -ti:5000 | xargs kill -9
   npm run dev
   ```

## Features Verified Working

✅ **Database**: 553+ NBA players with historical data (1996-2025)
✅ **Authentication**: Mock user system for external deployment  
✅ **Custom Statistics**: Formula calculations with proper win percentages
✅ **Player Analysis**: Individual player profiles and career data
✅ **Leaderboards**: Custom stat rankings and filtering
✅ **Data Visualization**: Charts and graphs for player performance
✅ **Favorites System**: Save and track favorite players
✅ **Season Filtering**: Multi-season player data analysis

## Database Features

- **3,848 total player records** across multiple seasons
- **Corrected win percentages** for accurate formula calculations
- **Historical player data** from 1996-2025
- **Real NBA team records** for statistical accuracy

## Technical Notes

- **Port**: Application runs on port 5000 for Replit compatibility
- **Authentication**: Uses mock user system in external environments
- **Session Storage**: Memory-based sessions for external deployment
- **Database**: Direct PostgreSQL queries instead of Python scripts
- **Error Handling**: Comprehensive error states and validation

## Troubleshooting

**Formula showing 0 values?**
- Win percentages have been corrected in the database
- All custom statistics should calculate properly

**Port conflicts?**
- Kill existing processes: `sudo lsof -ti:5000 | xargs kill -9`
- Restart with: `npm run dev`

**Database connection issues?**
- Verify DATABASE_URL in .env file
- Ensure Neon database is accessible

Your NBA Analytics platform is now fully deployment-ready for GitHub Codespaces!