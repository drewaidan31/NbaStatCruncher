// Final production server for Render deployment
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting NBA Analytics production server...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

const app = express();

// Essential middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: !!process.env.DATABASE_URL
  });
});

// Main players API endpoint
app.get('/api/players', async (req, res) => {
  try {
    console.log('Fetching players from database...');
    
    // Import Drizzle components directly
    const { Pool } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    
    // Try different import paths for schema
    let nbaPlayers;
    try {
      const schema = await import('../shared/schema.js');
      nbaPlayers = schema.nbaPlayers;
    } catch (error) {
      const schema = await import('../shared/schema.ts');
      nbaPlayers = schema.nbaPlayers;
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });
    
    const players = await db.select().from(nbaPlayers);
    console.log(`Retrieved ${players.length} players`);
    
    res.json(players);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Auth endpoints
app.get('/api/auth/user', (req, res) => {
  res.status(401).json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Serve static files
const publicPath = path.join(process.cwd(), 'dist/client');
console.log('Static files path:', publicPath);
app.use(express.static(publicPath));

// Handle all other routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});