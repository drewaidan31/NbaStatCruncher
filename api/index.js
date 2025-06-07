// Vercel serverless function entry point for NBA Analytics
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app;

const initializeApp = async () => {
  if (app) return app;
  
  app = express();
  app.use(cors());
  app.use(express.json());
  
  // Simple API endpoint for testing
  app.get('/api/test', (req, res) => {
    res.json({ message: 'NBA Analytics API is running', timestamp: new Date().toISOString() });
  });
  
  // Serve static files from Replit
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NBA Analytics</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>NBA Analytics Platform</h1>
        <p>Application is initializing...</p>
        <p>Visit the <a href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co">Replit version</a> for full functionality.</p>
      </body>
      </html>
    `);
  });
  
  return app;
};

export default async function handler(req, res) {
  try {
    const application = await initializeApp();
    return application(req, res);
  } catch (error) {
    console.error('Vercel function error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}