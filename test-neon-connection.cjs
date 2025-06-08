const { Pool } = require('pg');

async function testNeonConnection() {
  const connectionString = process.argv[2];
  
  if (!connectionString) {
    console.log('Usage: node test-neon-connection.cjs "your-neon-connection-string"');
    console.log('Get your connection string from Neon dashboard -> Connection Details');
    process.exit(1);
  }

  console.log('Testing Neon database connection...');
  
  const pool = new Pool({
    connectionString: connectionString
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Check if any tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (result.rows.length === 0) {
      console.log('📋 Database is empty (no tables) - ready for schema setup');
    } else {
      console.log('📋 Existing tables found:');
      result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    }
    
    client.release();
    
  } catch (error) {
    console.log('❌ Connection failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Check your username/password in the connection string');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Check your database name in the connection string');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Check your network connection or database host');
    }
  } finally {
    await pool.end();
  }
}

testNeonConnection();