import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

// Initialize database connection early
import "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`Error ${status}: ${message}`);
  console.error("Full error details:", err);
  
  try {
    res.status(status).json({ error: message, status });
  } catch (jsonError) {
    res.status(500).send("Internal Server Error");
  }
});

(async () => {
  try {
    console.log('Starting production server...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database URL configured:', !!process.env.DATABASE_URL);
    
    // Setup session middleware and passport
    const session = (await import("express-session")).default;
    const passport = (await import("passport")).default;
    
    const sessionSettings = {
      secret: process.env.SESSION_SECRET || "nba-analytics-default-secret-2025",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: (process.env.NODE_ENV === "production" ? "strict" : "lax") as "strict" | "lax"
      }
    };

    app.set("trust proxy", 1);
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Mount authentication routes
    const authRoutes = (await import("./auth-routes")).default;
    app.use("/api/auth", authRoutes);
    console.log('Auth routes mounted at /api/auth');
    
    // Test database connection before registering routes
    try {
      const { storage } = await import("./storage");
      const players = await storage.getAllPlayers();
      console.log(`Database connection verified: ${players.length} players found`);
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      console.error('DATABASE_URL present:', !!process.env.DATABASE_URL);
    }
    
    // Register all API routes
    const server = await registerRoutes(app);
    console.log('API routes registered');
    
    // Serve static files from the build directory
    const distPath = path.resolve(__dirname, 'public');
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath));
    
    // Handle client-side routing - serve index.html for non-API routes
    app.get('*', (req, res) => {
      // Skip API routes - they should have been handled above
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
          error: 'API endpoint not found',
          path: req.path,
          method: req.method
        });
      }
      
      // For all other routes, serve the React app
      const indexPath = path.join(distPath, 'index.html');
      console.log('Serving index.html for route:', req.path);
      res.sendFile(indexPath);
    });

    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Production server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
})();