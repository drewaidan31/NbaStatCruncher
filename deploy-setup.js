#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('NBA Analytics - Deployment Setup');
console.log('================================');

// Check environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);

// Verify required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['SESSION_SECRET', 'OPENAI_API_KEY'];

console.log('\nChecking environment variables...');
let hasAllRequired = true;

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✓ ${envVar} is set`);
  } else {
    console.log(`✗ ${envVar} is missing`);
    hasAllRequired = false;
  }
}

for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`✓ ${envVar} is set`);
  } else {
    console.log(`- ${envVar} is optional but not set`);
  }
}

if (!hasAllRequired) {
  console.log('\nError: Missing required environment variables');
  process.exit(1);
}

// Set default session secret if not provided
if (!process.env.SESSION_SECRET) {
  console.log('Generating default SESSION_SECRET for deployment...');
  // In production, Render should provide this
}

console.log('\n✓ Environment check passed');

// Install dependencies if needed
try {
  console.log('\nInstalling dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });
  console.log('✓ Dependencies installed');
} catch (error) {
  console.log('Falling back to npm install...');
  execSync('npm install', { stdio: 'inherit' });
}

// Build application
console.log('\nBuilding application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ Build completed successfully');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Verify build output
const distPath = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distPath)) {
  console.error('Build output not found at dist/');
  process.exit(1);
}

console.log('✓ Build output verified');

console.log('\n🚀 Deployment setup complete!');
console.log('Ready to start with: npm start');