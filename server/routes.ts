import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formulaCalculationSchema, saveCustomStatSchema, NBA_STAT_MAPPINGS, type Player } from "@shared/schema";
import { evaluate } from "mathjs";
import { spawn } from "child_process";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Clear players cache
  app.post("/api/nba/players/clear", async (req, res) => {
    try {
      await storage.deleteAllPlayers();
      res.json({ message: "Player cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing players:", error);
      res.status(500).json({ message: "Failed to clear player cache" });
    }
  });

  // Fetch NBA players data from official NBA API
  app.get("/api/nba/players", async (req, res) => {
    try {
      const existingPlayers = await storage.getAllPlayers();
      
      // If we already have players, return them
      if (existingPlayers.length > 0) {
        return res.json(existingPlayers);
      }

      console.log("Loading authentic NBA player statistics from official NBA API");
      
      // Use Python script to fetch authentic NBA data
      const python = spawn("python3", ["server/nba_data.py"]);
      
      let pythonData = "";
      let pythonError = "";
      
      python.stdout.on("data", (data: any) => {
        pythonData += data.toString();
      });
      
      python.stderr.on("data", (data: any) => {
        pythonError += data.toString();
      });
      
      await new Promise((resolve, reject) => {
        python.on("close", (code: number) => {
          if (code === 0) {
            resolve(code);
          } else {
            console.log("Python script error:", pythonError);
            reject(new Error(`NBA API script failed: ${pythonError}`));
          }
        });
      });

      if (!pythonData.trim()) {
        console.log("No data from Python script, using fallback");
        return res.status(500).json({ 
          message: "Unable to load NBA player data" 
        });
      }

      const allPlayers = JSON.parse(pythonData);

      console.log("NBA API Data received:", allPlayers.length, "players");

      if (allPlayers.length === 0) {
        return res.status(500).json({ 
          message: "No NBA player data received from the official NBA API" 
        });
      }

      // The NBA API library already provides structured data
      const players = allPlayers;

      // Store players in memory
      for (const playerData of players) {
        await storage.createPlayer(playerData);
      }

      const storedPlayers = await storage.getAllPlayers();
      res.json(storedPlayers);

    } catch (error) {
      console.error("Error fetching NBA data:", error);
      res.status(500).json({ 
        message: "Failed to fetch NBA player data. Please check your API configuration and try again." 
      });
    }
  });

  // Calculate custom stats for formula
  app.post("/api/nba/calculate", async (req, res) => {
    try {
      const { formula } = formulaCalculationSchema.parse(req.body);
      
      const players = await storage.getAllPlayers();
      
      if (players.length === 0) {
        return res.status(400).json({ 
          message: "No player data available. Please fetch NBA data first." 
        });
      }

      // Validate formula contains valid NBA stats
      const formulaUpper = formula.toUpperCase();
      const availableStats = Object.keys(NBA_STAT_MAPPINGS);
      const usedStats = availableStats.filter(stat => formulaUpper.includes(stat));
      
      if (usedStats.length === 0) {
        return res.status(400).json({ 
          message: `Formula must contain at least one valid NBA stat: ${availableStats.join(", ")}` 
        });
      }

      // Calculate custom stat for each player
      const results = players.map(player => {
        try {
          // Replace NBA stat abbreviations with actual values
          let evaluationFormula = formula.toUpperCase();
          
          for (const [abbrev, field] of Object.entries(NBA_STAT_MAPPINGS)) {
            const value = player[field as keyof Player] as number;
            // Replace whole words only to avoid partial matches
            evaluationFormula = evaluationFormula.replace(
              new RegExp(`\\b${abbrev}\\b`, 'g'), 
              value.toString()
            );
          }

          // Safely evaluate the mathematical expression
          const customStatValue = evaluate(evaluationFormula);
          
          return {
            player,
            customStat: typeof customStatValue === 'number' ? 
              Number(customStatValue.toFixed(2)) : 0,
            formula
          };
        } catch (error) {
          console.error(`Error calculating stat for ${player.name}:`, error);
          return {
            player,
            customStat: 0,
            formula
          };
        }
      });

      // Sort by custom stat value (highest first)
      results.sort((a, b) => b.customStat - a.customStat);
      
      // Add rank
      const rankedResults = results.map((result, index) => ({
        ...result,
        rank: index + 1
      }));

      res.json(rankedResults);

    } catch (error) {
      console.error("Error calculating custom stats:", error);
      
      if (error instanceof Error && error.message.includes("Unexpected")) {
        return res.status(400).json({ 
          message: "Invalid formula syntax. Please check your mathematical expression." 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to calculate custom statistics. Please verify your formula and try again." 
      });
    }
  });

  // Save custom stat with name (requires authentication)
  app.post("/api/custom-stats/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = saveCustomStatSchema.parse({
        ...req.body,
        userId
      });
      
      const savedStat = await storage.saveCustomStat(validatedData);
      res.status(201).json(savedStat);
    } catch (error) {
      console.error("Error saving custom stat:", error);
      res.status(400).json({ message: "Failed to save custom stat" });
    }
  });

  // Get user's saved custom stats (requires authentication)
  app.get("/api/custom-stats/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userStats = await storage.getUserCustomStats(userId);
      res.json(userStats);
    } catch (error) {
      console.error("Error fetching user custom stats:", error);
      res.status(500).json({ message: "Failed to fetch saved stats" });
    }
  });

  // Refresh NBA data
  app.post("/api/nba/refresh", async (req, res) => {
    try {
      await storage.deleteAllPlayers();
      res.json({ message: "Player data cleared. Next request will fetch fresh data." });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ message: "Failed to refresh data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
