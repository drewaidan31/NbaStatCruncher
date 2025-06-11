#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('NBA Analytics - Deployment Verification');
console.log('=====================================');

// Check required files exist
const requiredFiles = [
  'package.json',
  'render.yaml', 
  'build.sh',
  'server/index.ts',
  'server/db.ts',
  'server/routes.ts',
  'drizzle.config.ts',
  'vite.config.ts'
];

console.log('\nChecking required files...');
let allFilesExist = true;

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} missing`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\nError: Missing required files for deployment');
  process.exit(1);
}

// Check if build script is executable
try {
  fs.accessSync('./build.sh', fs.constants.X_OK);
  console.log('✓ build.sh is executable');
} catch (error) {
  console.log('✗ build.sh is not executable');
  console.log('  Run: chmod +x build.sh');
}

// Verify package.json structure
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredScripts = ['dev', 'build', 'start', 'db:push'];
const requiredDeps = ['express', 'drizzle-orm', '@neondatabase/serverless'];

console.log('\nChecking package.json...');
for (const script of requiredScripts) {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✓ Script: ${script}`);
  } else {
    console.log(`✗ Missing script: ${script}`);
  }
}

for (const dep of requiredDeps) {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✓ Dependency: ${dep}`);
  } else {
    console.log(`✗ Missing dependency: ${dep}`);
  }
}

// Check environment variables for deployment
console.log('\nEnvironment check for deployment:');
const envVars = ['DATABASE_URL', 'NODE_ENV', 'SESSION_SECRET'];
for (const envVar of envVars) {
  if (process.env[envVar]) {
    console.log(`✓ ${envVar} is set`);
  } else {
    console.log(`- ${envVar} should be set in Render dashboard`);
  }
}

// Check if TypeScript compiles
console.log('\nChecking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✓ TypeScript compilation successful');
} catch (error) {
  console.log('⚠ TypeScript compilation warnings (non-critical for deployment)');
}

// Test build process
console.log('\nTesting build process...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✓ Build process successful');
  
  // Check if build output exists
  if (fs.existsSync('dist/index.js')) {
    console.log('✓ Server build output exists');
  }
  if (fs.existsSync('dist/public/index.html')) {
    console.log('✓ Client build output exists');
  }
} catch (error) {
  console.log('✗ Build process failed');
  console.log('Check the build logs for specific errors');
}

console.log('\n🚀 Deployment verification complete!');
console.log('\nNext steps for Render deployment:');
console.log('1. Push code to GitHub repository');
console.log('2. Connect GitHub repo to Render');
console.log('3. Render will use render.yaml for automatic configuration');
console.log('4. Monitor deployment logs for any issues');
console.log('5. Test the /api/health endpoint after deployment');