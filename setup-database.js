#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  No .env file found. Please create one with your DATABASE_URL');
  console.log('Example:');
  console.log('DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require');
  console.log('SESSION_SECRET=your-random-secret-key');
  console.log('NODE_ENV=development');
  process.exit(1);
}

try {
  // Load environment variables
  require('dotenv').config();
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  console.log('🔧 Setting up database schema...');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  
  console.log('✅ Database setup complete!');
  console.log('🚀 You can now run: npm run dev');
  
} catch (error) {
  console.error('❌ Error setting up database:', error.message);
  process.exit(1);
}