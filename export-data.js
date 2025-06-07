const { Pool } = require('pg');
const fs = require('fs');

async function exportData() {
  console.log('Exporting NBA data from current database...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Export players
    console.log('Exporting players...');
    const playersResult = await pool.query('SELECT * FROM players ORDER BY "playerId"');
    fs.writeFileSync('players-export.json', JSON.stringify(playersResult.rows, null, 2));
    console.log(`Exported ${playersResult.rows.length} players`);

    // Export custom stats
    console.log('Exporting custom stats...');
    const customStatsResult = await pool.query('SELECT * FROM custom_stats ORDER BY id');
    fs.writeFileSync('custom-stats-export.json', JSON.stringify(customStatsResult.rows, null, 2));
    console.log(`Exported ${customStatsResult.rows.length} custom stats`);

    // Export users
    console.log('Exporting users...');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY id');
    fs.writeFileSync('users-export.json', JSON.stringify(usersResult.rows, null, 2));
    console.log(`Exported ${usersResult.rows.length} users`);

    // Export favorite players
    console.log('Exporting favorite players...');
    const favoritesResult = await pool.query('SELECT * FROM favorite_players ORDER BY id');
    fs.writeFileSync('favorites-export.json', JSON.stringify(favoritesResult.rows, null, 2));
    console.log(`Exported ${favoritesResult.rows.length} favorite players`);

    console.log('Export complete! Files created:');
    console.log('- players-export.json');
    console.log('- custom-stats-export.json');
    console.log('- users-export.json');
    console.log('- favorites-export.json');

  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await pool.end();
  }
}

exportData();