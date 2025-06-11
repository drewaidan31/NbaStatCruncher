import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check with database test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Players endpoint with direct database query
app.get('/api/players', async (req, res) => {
  try {
    console.log('Fetching NBA players from database...');
    
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query('SELECT * FROM nba_players ORDER BY name');
    const players = result.rows;
    
    console.log(`Retrieved ${players.length} players from database`);
    
    // Transform database rows to match expected format
    const formattedPlayers = players.map(row => ({
      playerId: row.player_id,
      name: row.name,
      team: row.team,
      position: row.position,
      gamesPlayed: row.games_played,
      minutesPerGame: row.minutes_per_game,
      points: row.points,
      assists: row.assists,
      rebounds: row.rebounds,
      steals: row.steals,
      blocks: row.blocks,
      turnovers: row.turnovers,
      fieldGoalPercentage: row.field_goal_percentage,
      fieldGoalAttempts: row.field_goal_attempts,
      threePointPercentage: row.three_point_percentage,
      threePointAttempts: row.three_point_attempts,
      freeThrowPercentage: row.free_throw_percentage,
      freeThrowAttempts: row.free_throw_attempts,
      plusMinus: row.plus_minus,
      currentSeason: row.current_season,
      seasons: row.seasons ? JSON.parse(row.seasons) : [],
      availableSeasons: row.available_seasons ? JSON.parse(row.available_seasons) : []
    }));
    
    res.json(formattedPlayers);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Failed to fetch players',
      message: error.message
    });
  }
});

// Auth endpoints for guest mode
app.get('/api/auth/user', (req, res) => {
  res.status(401).json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Static file serving
const staticPath = path.join(process.cwd(), 'dist/client');
app.use(express.static(staticPath));

// SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`NBA Analytics server running on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
});