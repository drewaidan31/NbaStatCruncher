// Production entry point for Render
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

console.log('🚀 Starting NBA Analytics production server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Database configured:', !!process.env.DATABASE_URL);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: !!process.env.DATABASE_URL
  });
});

// Players API endpoint
app.get('/api/players', async (req, res) => {
  try {
    console.log('Players API called - Environment:', process.env.NODE_ENV);
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    
    // Import storage with proper file extension handling
    let storage;
    try {
      const storageModule = await import('./storage.js');
      storage = storageModule.storage;
    } catch (importError) {
      console.log('Fallback: importing TypeScript storage');
      const storageModule = await import('./storage.ts');
      storage = storageModule.storage;
    }
    
    const players = await storage.getAllPlayers();
    
    console.log(`Returning ${players.length} players from database`);
    res.json(players);
  } catch (error) {
    console.error('Players API error:', error);
    res.status(500).json({
      error: 'Failed to fetch players',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Authentication routes
app.get('/api/auth/user', (req, res) => {
  res.status(401).json({ authenticated: false });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Serve static files
const staticPath = path.resolve(process.cwd(), 'dist/client');
console.log('Static files path:', staticPath);

app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});