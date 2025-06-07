#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏀 NBA Analytics Database Setup');
console.log('================================');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Create a .env file with your DATABASE_URL first');
  console.log('Example .env file:');
  console.log('DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require');
  console.log('SESSION_SECRET=your-random-secret-key');
  console.log('NODE_ENV=development');
  process.exit(1);
}

try {
  // Load environment variables
  dotenv.config();
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('1️⃣ Setting up database schema...');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  
  console.log('2️⃣ Importing NBA player data...');
  // Check if Python scripts exist
  const scripts = [
    'scripts/nba_data.py',
    'scripts/create_historical_dataset.py',
    'scripts/import_awards_data.py'
  ];
  
  let hasDataScripts = false;
  for (const script of scripts) {
    if (fs.existsSync(script)) {
      console.log(`   Running ${script}...`);
      try {
        execSync(`python3 ${script}`, { stdio: 'inherit' });
        hasDataScripts = true;
      } catch (error) {
        console.log(`   ⚠️  ${script} failed, continuing...`);
      }
    }
  }
  
  if (!hasDataScripts) {
    console.log('   ⚠️  No data import scripts found. You may need to manually import player data.');
  }
  
  console.log('✅ Database setup complete!');
  console.log('🚀 Run: npm run dev');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('- Verify your DATABASE_URL is correct');
  console.log('- Check that your database is accessible');
  console.log('- Ensure you have the required dependencies installed');
  process.exit(1);
}