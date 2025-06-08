import dotenv from 'dotenv';
dotenv.config();

console.log('Environment verification:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.DATABASE_URL) {
  console.log('Database host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0]);
  console.log('Ready for deployment');
} else {
  console.log('Missing DATABASE_URL - check your .env file');
}