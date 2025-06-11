import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Players endpoint with direct PostgreSQL query
app.get('/api/players', async (req, res) => {
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(`
      SELECT 
        player_id as "playerId",
        name,
        team,
        position,
        games_played as "gamesPlayed",
        minutes_per_game as "minutesPerGame",
        points,
        assists,
        rebounds,
        steals,
        blocks,
        turnovers,
        field_goal_percentage as "fieldGoalPercentage",
        field_goal_attempts as "fieldGoalAttempts",
        three_point_percentage as "threePointPercentage",
        three_point_attempts as "threePointAttempts",
        free_throw_percentage as "freeThrowPercentage",
        free_throw_attempts as "freeThrowAttempts",
        plus_minus as "plusMinus",
        current_season as "currentSeason",
        seasons,
        available_seasons as "availableSeasons"
      FROM nba_players 
      ORDER BY name
    `);
    
    const players = result.rows.map(row => ({
      ...row,
      seasons: row.seasons ? JSON.parse(row.seasons) : [],
      availableSeasons: row.availableSeasons ? JSON.parse(row.availableSeasons) : []
    }));
    
    console.log(`Retrieved ${players.length} players`);
    res.json(players);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database failed', message: error.message });
  }
});

// Auth endpoints for guest mode
app.get('/api/auth/user', (req, res) => {
  res.status(401).json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Static files
const staticPath = path.join(process.cwd(), 'dist/client');
app.use(express.static(staticPath));

// SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'connected' : 'missing'}`);
});