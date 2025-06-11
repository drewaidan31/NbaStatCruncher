# NBA Analytics Platform

A comprehensive NBA analytics platform that transforms complex player statistics into engaging, user-friendly visualizations and insights.

## Features

- **Custom Stat Formulas**: Create and test your own basketball statistics formulas
- **Player Analysis**: Deep dive into individual player performance across seasons
- **Team Analytics**: Advanced team statistics and possession-based metrics
- **Leaderboards**: Rank players using custom or traditional statistics
- **Favorites System**: Save and track your favorite players
- **Historical Data**: Access to NBA data from 1996-2025

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Optimized for Render

## Quick Start

### Environment Variables

Create a `.env` file with:

```bash
DATABASE_URL=postgresql://username:password@hostname:port/database
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secure-random-session-secret
```

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database:
   ```bash
   npm run db:push
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Deployment on Render

### Option 1: Using render.yaml (Recommended)

1. **Push to GitHub**: Commit all changes to your GitHub repository
2. **Connect to Render**: Go to [render.com](https://render.com) and connect your GitHub repo
3. **Automatic Setup**: Render will use the `render.yaml` file for configuration
4. **Environment Variables**: Render automatically provides DATABASE_URL and generates SESSION_SECRET

### Option 2: Manual Setup

1. **Create Web Service** on Render dashboard
2. **Build Command**: `./build.sh`
3. **Start Command**: `npm start`
4. **Add PostgreSQL Database** from Render dashboard
5. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: Generate a random string
   - `DATABASE_URL`: Automatically provided by Render PostgreSQL

### Health Check

The application includes a health check endpoint at `/api/health` that verifies:
- Server status
- Database connectivity
- Player data availability

## Database Schema

The application automatically creates all necessary tables on first deployment. Key tables include:
- `players`: NBA player statistics and career data
- `customStats`: User-created statistical formulas
- `favoritePlayers`: User favorite player lists
- `users`: Authentication and user management

## API Endpoints

### Core Features
- `GET /api/nba/players` - Get all NBA players
- `POST /api/nba/calculate` - Calculate custom statistics
- `GET /api/health` - Health check endpoint

### User Features (Authentication Required)
- `POST /api/custom-stats` - Save custom stat formulas
- `GET /api/custom-stats/my` - Get user's saved stats
- `POST /api/favorite-players` - Add favorite players

## Production Considerations

- **SSL Configuration**: Automatically handles SSL for PostgreSQL connections
- **Connection Pooling**: Optimized database connection management
- **Error Handling**: Comprehensive error logging and user feedback
- **Performance**: Chunked builds and optimized asset loading

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Ensure database allows external connections
- Check SSL requirements (most cloud databases require SSL)

### Build Failures
- Ensure all environment variables are set
- Check build logs for specific error messages
- Verify PostgreSQL database is accessible during build

### Performance Issues
- Monitor database connection pool usage
- Check for long-running queries in application logs
- Consider upgrading Render service tier for higher traffic

## Support

For deployment issues:
1. Check the health endpoint: `/api/health`
2. Review application logs in Render dashboard
3. Verify all environment variables are set correctly