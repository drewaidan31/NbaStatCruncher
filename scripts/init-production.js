import { execSync } from 'child_process';
import fs from 'fs';
import { db } from '../server/db.js';

async function initializeProduction() {
  console.log('🚀 Initializing NBA Analytics for production deployment...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Run database migrations
    console.log('🔄 Running database migrations...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('✅ Database schema updated');
    
    // Check if player data exists
    console.log('🏀 Checking for existing player data...');
    const result = await db.execute('SELECT COUNT(*) as count FROM players');
    const playerCount = parseInt(result.rows[0].count);
    
    if (playerCount === 0) {
      console.log('📊 No player data found. The application will work with empty dataset.');
      console.log('   Users can still create and test custom stat formulas.');
      console.log('   To import NBA data, run the Python scripts manually after deployment.');
    } else {
      console.log(`✅ Found ${playerCount} players in database`);
    }
    
    console.log('🎉 Production initialization complete!');
    console.log('🌐 Application ready for deployment');
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error.message);
    
    if (error.message.includes('connect')) {
      console.log('💡 Database connection troubleshooting:');
      console.log('   - Verify DATABASE_URL is correct');
      console.log('   - Ensure database server is running');
      console.log('   - Check firewall/security group settings');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeProduction();
}