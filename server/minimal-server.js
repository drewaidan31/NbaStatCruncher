import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Players API - direct database connection
app.get('/api/players', async (req, res) => {
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(`
      SELECT 
        player_id, name, team, position, games_played, minutes_per_game,
        points, assists, rebounds, steals, blocks, turnovers,
        field_goal_percentage, field_goal_attempts, three_point_percentage,
        three_point_attempts, free_throw_percentage, free_throw_attempts,
        plus_minus, current_season, seasons, available_seasons
      FROM nba_players ORDER BY name
    `);
    
    const players = result.rows.map(row => ({
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
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
app.use(express.static(path.join(process.cwd(), 'dist/client')));

// SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(process.cwd(), 'dist/client/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});