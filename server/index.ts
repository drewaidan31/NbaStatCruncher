import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure CORS for all environments
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

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  log(`Error ${status}: ${message}`);
  console.error("Full error details:", err);
  
  // Ensure we always send valid JSON
  try {
    res.status(status).json({ error: message, status });
  } catch (jsonError) {
    res.status(500).send("Internal Server Error");
  }
});

(async () => {
  // Setup session middleware and passport
  const session = (await import("express-session")).default;
  const passport = (await import("passport")).default;
  
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "nba-analytics-default-secret-2025",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax' as const,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Mount authentication routes
  const authRoutes = (await import("./auth-routes")).default;
  app.use("/api/auth", authRoutes);
  
  const server = await registerRoutes(app);
  
  // Important: setup vite middleware after registering routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();