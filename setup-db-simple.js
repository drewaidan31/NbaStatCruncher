const { execSync } = require('child_process');

console.log('Setting up NBA Analytics database...');

try {
  console.log('Creating database tables...');
  execSync('npx drizzle-kit push --config=drizzle.config.ts', { stdio: 'inherit' });
  console.log('Database setup complete!');
} catch (error) {
  console.error('Setup failed:', error.message);
  console.log('Make sure your .env file has the correct DATABASE_URL');
}