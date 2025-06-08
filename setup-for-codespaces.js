import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

async function setupForCodespaces() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('❌ DATABASE_URL not found in environment variables');
    console.log('Make sure your .env file contains the DATABASE_URL');
    process.exit(1);
  }

  console.log('🔧 Setting up database connection for Codespaces...');
  
  try {
    // Test connection
    const sql = postgres(connectionString);
    const db = drizzle(sql, { schema });
    
    // Simple test query
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`📋 Found ${tables.length} tables in database`);
    
    if (tables.length > 0) {
      console.log('✅ Database schema already exists');
      console.log('🚀 Ready to start application with: npm run dev');
    } else {
      console.log('⚠️  No tables found - database schema needs to be created');
    }
    
    await sql.end();
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Check your DATABASE_URL credentials');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Check your internet connection and DATABASE_URL host');
    }
  }
}

setupForCodespaces();