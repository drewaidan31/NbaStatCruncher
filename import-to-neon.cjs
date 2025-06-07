const { Pool } = require('pg');
const fs = require('fs');

async function importToNeon() {
  console.log('Importing NBA data to Neon database...');
  
  // You'll need to update this with your Neon connection string
  const neonConnectionString = process.argv[2];
  
  if (!neonConnectionString) {
    console.log('Usage: node import-to-neon.cjs "your-neon-connection-string"');
    console.log('Example: node import-to-neon.cjs "postgresql://user:pass@host/db?sslmode=require"');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: neonConnectionString
  });

  try {
    // First, set up the database schema (tables)
    console.log('Setting up database schema...');
    
    // Create nba_players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nba_players (
        id SERIAL PRIMARY KEY,
        player_id INTEGER,
        name TEXT,
        team TEXT,
        position TEXT,
        games_played INTEGER,
        minutes_per_game REAL,
        points REAL,
        assists REAL,
        rebounds REAL,
        steals REAL,
        blocks REAL,
        turnovers REAL,
        field_goal_percentage REAL,
        field_goal_attempts REAL,
        three_point_percentage REAL,
        three_point_attempts REAL,
        free_throw_percentage REAL,
        free_throw_attempts REAL,
        plus_minus REAL,
        current_season TEXT,
        seasons JSONB,
        available_seasons TEXT[],
        win_percentage REAL
      );
    `);

    // Create custom_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_stats (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        formula TEXT NOT NULL,
        description TEXT,
        "userId" TEXT,
        "isPublic" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        "firstName" TEXT,
        "lastName" TEXT,
        "profileImageUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create favorite_players table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorite_players (
        id SERIAL PRIMARY KEY,
        "userId" TEXT,
        "playerId" INTEGER,
        "playerName" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Schema created successfully!');

    // Import players data
    console.log('Importing players...');
    const playersData = JSON.parse(fs.readFileSync('players-export.json', 'utf8'));
    
    for (const player of playersData) {
      await pool.query(`
        INSERT INTO nba_players (
          player_id, name, team, position, games_played, minutes_per_game,
          points, assists, rebounds, steals, blocks, turnovers,
          field_goal_percentage, field_goal_attempts, three_point_percentage,
          three_point_attempts, free_throw_percentage, free_throw_attempts,
          plus_minus, current_season, seasons, available_seasons, win_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `, [
        player.player_id, player.name, player.team, player.position,
        player.games_played, player.minutes_per_game, player.points,
        player.assists, player.rebounds, player.steals, player.blocks,
        player.turnovers, player.field_goal_percentage, player.field_goal_attempts,
        player.three_point_percentage, player.three_point_attempts,
        player.free_throw_percentage, player.free_throw_attempts,
        player.plus_minus, player.current_season, player.seasons,
        player.available_seasons, player.win_percentage
      ]);
    }
    console.log(`Imported ${playersData.length} players`);

    // Import custom stats
    console.log('Importing custom stats...');
    const customStatsData = JSON.parse(fs.readFileSync('custom-stats-export.json', 'utf8'));
    
    for (const stat of customStatsData) {
      await pool.query(`
        INSERT INTO custom_stats (name, formula, description, "userId", "isPublic", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [stat.name, stat.formula, stat.description, stat.userId, stat.isPublic, stat.createdAt]);
    }
    console.log(`Imported ${customStatsData.length} custom stats`);

    // Import users
    console.log('Importing users...');
    const usersData = JSON.parse(fs.readFileSync('users-export.json', 'utf8'));
    
    for (const user of usersData) {
      await pool.query(`
        INSERT INTO users (id, email, "firstName", "lastName", "profileImageUrl", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [user.id, user.email, user.firstName, user.lastName, user.profileImageUrl, user.createdAt, user.updatedAt]);
    }
    console.log(`Imported ${usersData.length} users`);

    // Import favorite players
    console.log('Importing favorite players...');
    const favoritesData = JSON.parse(fs.readFileSync('favorites-export.json', 'utf8'));
    
    for (const favorite of favoritesData) {
      await pool.query(`
        INSERT INTO favorite_players ("userId", "playerId", "playerName", "createdAt")
        VALUES ($1, $2, $3, $4)
      `, [favorite.userId, favorite.playerId, favorite.playerName, favorite.createdAt]);
    }
    console.log(`Imported ${favoritesData.length} favorite players`);

    console.log('Import completed successfully!');
    console.log('Your Neon database now contains:');
    console.log(`- ${playersData.length} NBA players`);
    console.log(`- ${customStatsData.length} custom statistics`);
    console.log(`- ${usersData.length} users`);
    console.log(`- ${favoritesData.length} favorite players`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

importToNeon();