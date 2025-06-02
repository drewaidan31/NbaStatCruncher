import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formulaCalculationSchema, saveCustomStatSchema, NBA_STAT_MAPPINGS, type Player } from "@shared/schema";
import { evaluate } from "mathjs";
import { spawn } from "child_process";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateStatName } from "./openai-service";

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
      // Check if we already have cached player data
      const existingPlayers = await storage.getAllPlayers();
      
      if (existingPlayers.length > 0) {
        console.log(`Using cached player data: ${existingPlayers.length} players`);
        return res.json(existingPlayers);
      }

      console.log(`Loading unified NBA player profiles from official NBA API`);
      
      // Use Python script to fetch unified player data with all seasons
      const python = spawn("python3", ["server/nba_data.py", "unified"]);
      
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

      // Store players in database (skip duplicates)
      for (const playerData of players) {
        try {
          await storage.createPlayer(playerData);
        } catch (error: any) {
          // Skip duplicate players (player_id already exists)
          if (error.code !== '23505') {
            console.error(`Error inserting player ${playerData.name}:`, error);
          }
        }
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

      // Calculate custom stat for each player's best season
      const results = players.map(player => {
        try {
          let bestSeason = null;
          let bestCustomStat = -Infinity;
          
          // If player has seasons data, find their best season for this formula
          if (player.seasons && Array.isArray(player.seasons)) {
            for (const season of player.seasons) {
              let evaluationFormula = formula.toUpperCase();
              
              // Replace NBA stat abbreviations with season values
              for (const [abbrev, field] of Object.entries(NBA_STAT_MAPPINGS)) {
                const value = season[field] as number || 0;
                evaluationFormula = evaluationFormula.replace(
                  new RegExp(`\\b${abbrev}\\b`, 'g'), 
                  value.toString()
                );
              }
              
              try {
                const seasonCustomStat = evaluate(evaluationFormula);
                if (typeof seasonCustomStat === 'number' && seasonCustomStat > bestCustomStat) {
                  bestCustomStat = seasonCustomStat;
                  bestSeason = season;
                }
              } catch (seasonError) {
                // Skip invalid seasons
                continue;
              }
            }
          } else {
            // Fallback to career averages if no seasons data
            let evaluationFormula = formula.toUpperCase();
            
            for (const [abbrev, field] of Object.entries(NBA_STAT_MAPPINGS)) {
              const value = player[field as keyof Player] as number;
              evaluationFormula = evaluationFormula.replace(
                new RegExp(`\\b${abbrev}\\b`, 'g'), 
                value.toString()
              );
            }
            
            bestCustomStat = evaluate(evaluationFormula);
            bestSeason = { season: player.currentSeason || '2024-25' };
          }
          
          return {
            player,
            customStat: typeof bestCustomStat === 'number' ? 
              Number(bestCustomStat.toFixed(2)) : 0,
            bestSeason: bestSeason?.season || player.currentSeason || '2024-25',
            formula
          };
        } catch (error) {
          console.error(`Error calculating stat for ${player.name}:`, error);
          return {
            player,
            customStat: 0,
            bestSeason: player.currentSeason || '2024-25',
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
      
      // Check for duplicates (same name and formula for this user)
      const existingStats = await storage.getUserCustomStats(userId);
      const duplicate = existingStats.find(stat => 
        stat.name === validatedData.name && stat.formula === validatedData.formula
      );
      
      if (duplicate) {
        return res.status(409).json({ message: "A stat with this name and formula already exists" });
      }
      
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

  // Delete a saved custom stat (requires authentication)
  app.delete("/api/custom-stats/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statId = parseInt(req.params.id);
      
      const success = await storage.deleteCustomStat(statId, userId);
      if (success) {
        res.json({ message: "Custom stat deleted successfully" });
      } else {
        res.status(404).json({ message: "Custom stat not found or unauthorized" });
      }
    } catch (error) {
      console.error("Error deleting custom stat:", error);
      res.status(500).json({ message: "Failed to delete custom stat" });
    }
  });

  // Update a saved custom stat (requires authentication)
  app.put("/api/custom-stats/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statId = parseInt(req.params.id);
      const { name, formula, description } = req.body;
      
      const updatedStat = await storage.updateCustomStat(statId, userId, { name, formula, description });
      if (updatedStat) {
        res.json(updatedStat);
      } else {
        res.status(404).json({ message: "Custom stat not found or unauthorized" });
      }
    } catch (error) {
      console.error("Error updating custom stat:", error);
      res.status(500).json({ message: "Failed to update custom stat" });
    }
  });

  // Generate AI name for custom stat formula (public endpoint)
  app.post("/api/custom-stats/generate-name", async (req, res) => {
    try {
      const { formula } = req.body;
      
      if (!formula || typeof formula !== 'string') {
        return res.status(400).json({ message: "Formula is required" });
      }

      const result = await generateStatName(formula);
      res.json(result);
    } catch (error) {
      console.error("Error generating stat name:", error);
      res.status(500).json({ message: "Failed to generate stat name" });
    }
  });

  // Get specific season stats for a player
  app.get("/api/nba/players/:playerId/season/:season", async (req, res) => {
    try {
      const { playerId, season } = req.params;
      
      // Get the player from stored data
      const players = await storage.getAllPlayers();
      const player = players.find(p => p.playerId.toString() === playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      // Check if seasons data exists and find the specific season
      const seasonsArray = Array.isArray(player.seasons) ? player.seasons : [];
      const seasonData = seasonsArray.find((s: any) => s.season === season);
      
      if (!seasonData) {
        return res.status(404).json({ message: "Season data not found for this player" });
      }
      
      // Return player with the selected season's stats
      const playerWithSeasonStats = {
        ...player,
        currentSeason: season,
        team: seasonData.team,
        position: seasonData.position,
        gamesPlayed: seasonData.gamesPlayed,
        minutesPerGame: seasonData.minutesPerGame,
        points: seasonData.points,
        assists: seasonData.assists,
        rebounds: seasonData.rebounds,
        steals: seasonData.steals,
        blocks: seasonData.blocks,
        turnovers: seasonData.turnovers,
        fieldGoalPercentage: seasonData.fieldGoalPercentage,
        threePointPercentage: seasonData.threePointPercentage,
        freeThrowPercentage: seasonData.freeThrowPercentage,
        plusMinus: seasonData.plusMinus
      };
      
      res.json(playerWithSeasonStats);
    } catch (error) {
      console.error("Error fetching player season data:", error);
      res.status(500).json({ message: "Failed to fetch player season data" });
    }
  });

  // Refresh NBA data by clearing cache and forcing reload
  app.post("/api/nba/refresh", async (req, res) => {
    try {
      await storage.deleteAllPlayers();
      
      // Immediately fetch fresh data
      console.log(`Refreshing unified NBA player profiles from official NBA API`);
      const python = spawn("python3", ["server/nba_data.py", "unified"]);
      
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
        console.log("No data from Python script during refresh");
        return res.status(500).json({ 
          message: "Unable to refresh NBA player data" 
        });
      }

      const allPlayers = JSON.parse(pythonData);
      console.log("Refreshed NBA API Data:", allPlayers.length, "players");

      // Store refreshed players in database
      for (const playerData of allPlayers) {
        try {
          await storage.createPlayer(playerData);
        } catch (error: any) {
          if (error.code !== '23505') {
            console.error(`Error inserting player ${playerData.name}:`, error);
          }
        }
      }

      const storedPlayers = await storage.getAllPlayers();
      res.json({ 
        message: `Successfully refreshed ${storedPlayers.length} players`,
        players: storedPlayers
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ message: "Failed to refresh data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
