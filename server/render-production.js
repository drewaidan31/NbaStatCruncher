// Simplified production server for Render
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: !!process.env.DATABASE_URL
  });
});

// Test database connection
app.get('/api/players', async (req, res) => {
  try {
    console.log('Players API called - Environment:', process.env.NODE_ENV);
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    
    // Dynamic import of storage
    const { storage } = await import('./storage.js');
    const players = await storage.getAllPlayers();
    
    console.log(`Returning ${players.length} players from database`);
    res.json(players);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Import and register all routes
try {
  const routes = await import('./routes.js');
  if (routes.registerRoutes) {
    await routes.registerRoutes(app);
    console.log('All API routes registered');
  }
} catch (error) {
  console.error('Failed to register routes:', error);
}

// Serve static files
const staticPath = path.join(process.cwd(), 'dist', 'client');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// Handle client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Database configured: ${!!process.env.DATABASE_URL}`);
});