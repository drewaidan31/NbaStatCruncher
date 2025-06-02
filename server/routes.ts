import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formulaCalculationSchema, NBA_STAT_MAPPINGS, type Player } from "@shared/schema";
import { evaluate } from "mathjs";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Fetch NBA players data from RapidAPI
  app.get("/api/nba/players", async (req, res) => {
    try {
      const existingPlayers = await storage.getAllPlayers();
      
      // If we already have players, return them
      if (existingPlayers.length > 0) {
        return res.json(existingPlayers);
      }

      // Fetch from RapidAPI
      const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.NBA_API_KEY || "";
      
      if (!rapidApiKey) {
        return res.status(500).json({ 
          message: "RapidAPI key not configured. Please add RAPIDAPI_KEY to environment variables." 
        });
      }

      console.log("Fetching NBA data with API key:", rapidApiKey ? "API key present" : "API key missing");
      
      // Get season data to find current season info
      const seasonsResponse = await fetch("https://api-nba-v1.p.rapidapi.com/seasons", {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "api-nba-v1.p.rapidapi.com"
        }
      });

      if (!seasonsResponse.ok) {
        const errorText = await seasonsResponse.text();
        console.log("Seasons API Error:", errorText);
        return res.status(500).json({ 
          message: `Failed to fetch NBA seasons: ${seasonsResponse.status} ${seasonsResponse.statusText}` 
        });
      }

      const seasonsData = await seasonsResponse.json();
      console.log("Seasons data received:", seasonsData?.response?.length || 0, "seasons");

      // Use current season (2024) to get player statistics
      const response = await fetch("https://api-nba-v1.p.rapidapi.com/players/statistics?season=2024", {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "api-nba-v1.p.rapidapi.com"
        }
      });

      console.log("NBA API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("NBA API Error:", errorText);
        return res.status(500).json({ 
          message: `Failed to fetch NBA data: ${response.status} ${response.statusText}. ${errorText}` 
        });
      }

      const data = await response.json();
      console.log("NBA API Data received:", data ? "Data exists" : "No data", data?.response?.length || 0, "players");
      
      // Transform NBA API data to our schema
      const players = data.response?.slice(0, 100).map((playerData: any) => ({
        playerId: playerData.player?.id || 0,
        name: `${playerData.player?.firstname || ""} ${playerData.player?.lastname || ""}`.trim(),
        team: playerData.team?.code || "UNK",
        position: playerData.pos || "G",
        gamesPlayed: 1, // This is per-game data
        minutesPerGame: parseFloat(playerData.min) || 0,
        points: parseFloat(playerData.points) || 0,
        assists: parseFloat(playerData.assists) || 0,
        rebounds: parseFloat(playerData.totReb) || 0,
        steals: parseFloat(playerData.steals) || 0,
        blocks: parseFloat(playerData.blocks) || 0,
        turnovers: parseFloat(playerData.turnovers) || 0,
        fieldGoalPercentage: parseFloat(playerData.fgp) / 100 || 0,
        threePointPercentage: parseFloat(playerData.tpp) / 100 || 0,
        freeThrowPercentage: parseFloat(playerData.ftp) / 100 || 0,
        plusMinus: parseFloat(playerData.plusMinus) || 0,
      })) || [];

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
