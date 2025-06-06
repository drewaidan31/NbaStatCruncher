import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { formulaCalculationSchema, saveCustomStatSchema, NBA_STAT_MAPPINGS, type Player, playerAwards, allStarSelections, endOfSeasonTeams } from "@shared/schema";
import { evaluate } from "mathjs";
import { spawn } from "child_process";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { eq, and } from "drizzle-orm";


import { getTeamPossessionData } from "./team-stats-service";

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

  // User custom stats routes
  app.post('/api/custom-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, formula, description, isPublic } = req.body;
      
      if (!name || !formula) {
        return res.status(400).json({ message: "Name and formula are required" });
      }

      const customStat = await storage.saveCustomStat({
        name,
        formula,
        description,
        userId,
        isPublic: isPublic || false
      });

      res.json(customStat);
    } catch (error) {
      console.error("Error saving custom stat:", error);
      res.status(500).json({ message: "Failed to save custom stat" });
    }
  });

  app.get('/api/custom-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customStats = await storage.getUserCustomStats(userId);
      res.json(customStats);
    } catch (error) {
      console.error("Error fetching custom stats:", error);
      res.status(500).json({ message: "Failed to fetch custom stats" });
    }
  });

  app.delete('/api/custom-stats/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statId = parseInt(req.params.id);
      
      if (isNaN(statId)) {
        return res.status(400).json({ message: "Invalid stat ID" });
      }

      const deleted = await storage.deleteCustomStat(statId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Custom stat not found" });
      }

      res.json({ message: "Custom stat deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom stat:", error);
      res.status(500).json({ message: "Failed to delete custom stat" });
    }
  });

  app.put('/api/custom-stats/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statId = parseInt(req.params.id);
      const { name, formula, description } = req.body;
      
      if (isNaN(statId)) {
        return res.status(400).json({ message: "Invalid stat ID" });
      }

      const updatedStat = await storage.updateCustomStat(statId, userId, {
        name,
        formula,
        description,
        isPublic: req.body.isPublic
      });

      if (!updatedStat) {
        return res.status(404).json({ message: "Custom stat not found" });
      }

      res.json(updatedStat);
    } catch (error) {
      console.error("Error updating custom stat:", error);
      res.status(500).json({ message: "Failed to update custom stat" });
    }
  });

  // Community stats routes
  app.get('/api/community-stats', async (req, res) => {
    try {
      const publicStats = await storage.getPublicCustomStats();
      res.json(publicStats);
    } catch (error) {
      console.error("Error fetching community stats:", error);
      res.status(500).json({ message: "Failed to fetch community stats" });
    }
  });

  app.post('/api/custom-stats/:id/toggle-visibility', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statId = parseInt(req.params.id);
      const { isPublic } = req.body;

      if (isNaN(statId)) {
        return res.status(400).json({ message: "Invalid stat ID" });
      }

      const updatedStat = await storage.toggleStatVisibility(statId, userId, isPublic);

      if (!updatedStat) {
        return res.status(404).json({ message: "Custom stat not found" });
      }

      res.json(updatedStat);
    } catch (error) {
      console.error("Error toggling stat visibility:", error);
      res.status(500).json({ message: "Failed to toggle stat visibility" });
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
      
      // Force refresh if we have fewer than expected players (should be 553+ with historical data)
      if (existingPlayers.length >= 550) {
        console.log(`Using cached player data: ${existingPlayers.length} players`);
        return res.json(existingPlayers);
      }
      
      console.log(`Player count: ${existingPlayers.length}, refreshing to include historical players`);
      
      // Clear existing data to force refresh
      try {
        await storage.clearAllPlayers();
      } catch (error) {
        console.log("Could not clear existing players, continuing...");
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

  // Get players filtered by season
  app.get("/api/nba/players/season/:season", async (req, res) => {
    try {
      const { season } = req.params;
      const allPlayers = await storage.getAllPlayers();
      
      if (season === "all-time") {
        return res.json(allPlayers);
      }
      
      // Filter players who played in the specified season
      const filteredPlayers = allPlayers.filter(player => {
        if (player.seasons && Array.isArray(player.seasons)) {
          return player.seasons.some(s => s.season === season);
        }
        return player.currentSeason === season;
      }).map(player => {
        // Return player data for the specific season
        if (player.seasons && Array.isArray(player.seasons)) {
          const seasonData = player.seasons.find(s => s.season === season);
          if (seasonData) {
            return {
              ...player,
              // Override current season stats with specific season stats
              points: seasonData.points,
              assists: seasonData.assists,
              rebounds: seasonData.rebounds,
              steals: seasonData.steals,
              blocks: seasonData.blocks,
              turnovers: seasonData.turnovers,
              fieldGoalPercentage: seasonData.fieldGoalPercentage,
              fieldGoalAttempts: seasonData.fieldGoalAttempts,
              threePointPercentage: seasonData.threePointPercentage,
              threePointAttempts: seasonData.threePointAttempts,
              freeThrowPercentage: seasonData.freeThrowPercentage,
              freeThrowAttempts: seasonData.freeThrowAttempts,
              gamesPlayed: seasonData.gamesPlayed,
              minutesPerGame: seasonData.minutesPerGame,
              plusMinus: seasonData.plusMinus,
              team: seasonData.team,
              currentSeason: season
            };
          }
        }
        return player;
      });
      
      res.json(filteredPlayers);
    } catch (error) {
      console.error("Error filtering players by season:", error);
      res.status(500).json({ message: "Failed to filter players by season" });
    }
  });

  // Helper function to recursively resolve saved stat names in formulas
;

  // Calculate custom stats for formula
  app.post("/api/nba/calculate", async (req, res) => {
    try {
      const { formula, season } = req.body;
      
      console.log('Original formula:', formula);
      console.log('Resolved formula:', formula);
      
      let players;
      if (season && season !== "all-time") {
        // Get players for specific season
        const allPlayers = await storage.getAllPlayers();
        players = allPlayers.filter(player => {
          if (player.seasons && Array.isArray(player.seasons)) {
            return player.seasons.some(s => s.season === season);
          }
          return player.currentSeason === season;
        }).map(player => {
          // Use season-specific stats
          if (player.seasons && Array.isArray(player.seasons)) {
            const seasonData = player.seasons.find(s => s.season === season);
            if (seasonData) {
              return {
                ...player,
                points: seasonData.points,
                assists: seasonData.assists,
                rebounds: seasonData.rebounds,
                steals: seasonData.steals,
                blocks: seasonData.blocks,
                turnovers: seasonData.turnovers,
                fieldGoalPercentage: seasonData.fieldGoalPercentage,
                fieldGoalAttempts: seasonData.fieldGoalAttempts,
                threePointPercentage: seasonData.threePointPercentage,
                threePointAttempts: seasonData.threePointAttempts,
                freeThrowPercentage: seasonData.freeThrowPercentage,
                freeThrowAttempts: seasonData.freeThrowAttempts,
                gamesPlayed: seasonData.gamesPlayed,
                minutesPerGame: seasonData.minutesPerGame,
                plusMinus: seasonData.plusMinus,
                team: seasonData.team,
                currentSeason: season
              };
            }
          }
          return player;
        });
      } else {
        players = await storage.getAllPlayers();
      }
      
      if (players.length === 0) {
        return res.status(400).json({ 
          message: "No player data available. Please fetch NBA data first." 
        });
      }

      // Validate resolved formula contains valid NBA stats
      const formulaUpper = formula.toUpperCase();
      const availableStats = Object.keys(NBA_STAT_MAPPINGS);
      const usedStats = availableStats.filter(stat => formulaUpper.includes(stat));
      
      if (usedStats.length === 0) {
        return res.status(400).json({ 
          message: `Formula must contain at least one valid NBA stat: ${availableStats.join(", ")}` 
        });
      }

      // Calculate custom stat for each player (or each season for all-time)
      const results: any[] = [];
      
      for (const player of players) {
        try {
          if (season && season !== "all-time") {
            // For specific season, use only that season's data
            if (player.seasons && Array.isArray(player.seasons)) {
              const targetSeason = player.seasons.find(s => s.season === season);
              if (!targetSeason) {
                // Player didn't play in this season, skip them
                continue;
              }
              
              // Check if formula uses percentage stats and apply minimum games filter
              const formulaUpper = formula.toUpperCase();
              const percentageStats = ['W_PCT', 'FG_PCT', 'FG%', '3P_PCT', '3P%', 'FT_PCT', 'FT%'];
              const usesPercentageStats = percentageStats.some(stat => formulaUpper.includes(stat));
              
              // Skip players with fewer than 10 games if formula uses percentage stats
              if (usesPercentageStats && targetSeason.gamesPlayed < 10) {
                continue;
              }
              
              // Calculate custom stat using the specific season's data
              let evaluationFormula = formula.toUpperCase();
              
              for (const [abbrev, field] of Object.entries(NBA_STAT_MAPPINGS)) {
                const value = targetSeason[field] as number || 0;
                evaluationFormula = evaluationFormula.replace(
                  new RegExp(`\\b${abbrev}\\b`, 'g'), 
                  value.toString()
                );
              }
              
              const customStat = evaluate(evaluationFormula);
              
              // Only include results with valid, finite numbers
              if (typeof customStat === 'number' && isFinite(customStat) && customStat !== 0) {
                results.push({
                  player: {
                    ...player,
                    team: targetSeason.team
                  },
                  customStat: Number(customStat.toFixed(2)),
                  bestSeason: targetSeason.season,
                  formula: formula
                });
              }
            }
          } else {
            // For all-time, include ALL seasons for each player
            if (player.seasons && Array.isArray(player.seasons)) {
              for (const seasonData of player.seasons) {
                // Check if formula uses percentage stats and apply minimum games filter
                const formulaUpper = formula.toUpperCase();
                const percentageStats = ['W_PCT', 'FG_PCT', 'FG%', '3P_PCT', '3P%', 'FT_PCT', 'FT%'];
                const usesPercentageStats = percentageStats.some(stat => formulaUpper.includes(stat));
                
                // Skip seasons with fewer than 10 games if formula uses percentage stats
                if (usesPercentageStats && seasonData.gamesPlayed < 10) {
                  continue;
                }
                
                let evaluationFormula = formula.toUpperCase();
                
                // Replace NBA stat abbreviations with season values
                for (const [abbrev, field] of Object.entries(NBA_STAT_MAPPINGS)) {
                  const value = seasonData[field] as number || 0;
                  evaluationFormula = evaluationFormula.replace(
                    new RegExp(`\\b${abbrev}\\b`, 'g'), 
                    value.toString()
                  );
                }
                
                try {
                  const seasonCustomStat = evaluate(evaluationFormula);
                  // Only include results with valid, finite numbers
                  if (typeof seasonCustomStat === 'number' && isFinite(seasonCustomStat) && seasonCustomStat !== 0) {
                    results.push({
                      player: {
                        ...player,
                        team: seasonData.team
                      },
                      customStat: Number(seasonCustomStat.toFixed(2)),
                      bestSeason: seasonData.season,
                      formula: formula
                    });
                  }
                } catch (seasonError) {
                  continue;
                }
              }
            } else {
              // Fallback to career averages if no seasons data
              // Check if formula uses percentage stats and apply minimum games filter
              const formulaUpper = formula.toUpperCase();
              const percentageStats = ['W_PCT', 'FG_PCT', 'FG%', '3P_PCT', '3P%', 'FT_PCT', 'FT%'];
              const usesPercentageStats = percentageStats.some(stat => formulaUpper.includes(stat));
              
              // Skip players with fewer than 10 career games if formula uses percentage stats
              if (usesPercentageStats && player.gamesPlayed < 10) {
                continue;
              }
              
              let evaluationFormula = formula.toUpperCase();
              
              for (const [abbrev, field] of Object.entries(NBA_STAT_MAPPINGS)) {
                const value = player[field as keyof Player] as number;
                evaluationFormula = evaluationFormula.replace(
                  new RegExp(`\\b${abbrev}\\b`, 'g'), 
                  value.toString()
                );
              }
              
              const customStat = evaluate(evaluationFormula);
              
              // Only include results with valid, finite numbers
              if (typeof customStat === 'number' && isFinite(customStat) && customStat !== 0) {
                results.push({
                  player: {
                    ...player,
                    team: player.team
                  },
                  customStat: Number(customStat.toFixed(2)),
                  bestSeason: player.currentSeason || '2024-25',
                  formula: formula
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error calculating stat for ${player.name}:`, error);
        }
      }

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

  // Get player awards by name and season
  app.get("/api/awards/:playerName/:season", async (req, res) => {
    try {
      const { playerName, season } = req.params;
      
      // Get all awards for this player and season
      const awards = await db.select().from(playerAwards)
        .where(and(eq(playerAwards.playerName, playerName), eq(playerAwards.season, season)));
      
      // Get All-Star selection for this player and season
      const allStar = await db.select().from(allStarSelections)
        .where(and(eq(allStarSelections.playerName, playerName), eq(allStarSelections.season, season)));
      
      // Get All-NBA/All-Defense teams for this player and season
      const teams = await db.select().from(endOfSeasonTeams)
        .where(and(eq(endOfSeasonTeams.playerName, playerName), eq(endOfSeasonTeams.season, season)));
      
      res.json({
        awards,
        allStar: allStar[0] || null,
        teams
      });
    } catch (error) {
      console.error("Error fetching player awards:", error);
      res.status(500).json({ message: "Failed to fetch player awards" });
    }
  });

  // Fixed calculation endpoint
  app.post("/api/custom-stats/calculate", async (req, res) => {
    try {
      const { formula } = req.body;
      
      if (!formula) {
        return res.status(400).json({ message: "Formula is required" });
      }

      const allPlayers = await storage.getAllPlayers();
      const results: any[] = [];

      for (const player of allPlayers) {
        try {
          // Replace ALL problematic variable names before evaluation
          let cleanFormula = formula
            .replace(/3P_PCT/g, 'THREE_PCT')
            .replace(/3PA/g, 'THREE_PA')
            .replace(/3P/g, 'THREE_P');
          
          const context: any = {
            PTS: Number(player.points) || 0,
            AST: Number(player.assists) || 0,
            REB: Number(player.rebounds) || 0,
            TOV: Number(player.turnovers) || 0,
            PLUS_MINUS: Number(player.plusMinus) || 0,
            FG_PCT: Number(player.fieldGoalPercentage) || 0,
            FGA: Math.max(Number(player.fieldGoalAttempts) || 0, 0.1),
            FT_PCT: Number(player.freeThrowPercentage) || 0,
            FTA: Number(player.freeThrowAttempts) || 0,
            THREE_PCT: Number(player.threePointPercentage) || 0,
            THREE_PA: Number(player.threePointAttempts) || 0,
            THREE_P: Number(player.threePointAttempts) || 0,
            MIN: Math.max(Number(player.minutesPerGame) || 0, 0.1),
            STL: Number(player.steals) || 0,
            BLK: Number(player.blocks) || 0,
            GP: Math.max(Number(player.gamesPlayed) || 0, 1),
            W_PCT: Number(player.winPercentage) || 0
          };

          const customStat = evaluate(cleanFormula, context);
          
          if (typeof customStat === 'number' && !isNaN(customStat) && isFinite(customStat)) {
            results.push({
              playerId: player.playerId,
              name: player.name,
              team: player.team,
              customStat: Math.round(customStat * 100) / 100,
              points: player.points,
              assists: player.assists,
              rebounds: player.rebounds,
              rank: 0
            });
          }
        } catch (err) {
          continue;
        }
      }

      results.sort((a, b) => b.customStat - a.customStat);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      res.json(results.slice(0, 100));
    } catch (error) {
      console.error("Calculation error:", error);
      res.status(500).json({ message: "Calculation failed" });
    }
  });

  // Get user's saved custom stats (requires authentication)
  app.get("/api/custom-stats/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Fetching stats for user ID:", userId, "type:", typeof userId);
      console.log("User claims:", req.user.claims);
      
      // Ensure userId is a string
      const userIdString = String(userId);
      console.log("Looking for stats with userId:", userIdString, "type:", typeof userIdString);
      
      const userStats = await storage.getUserCustomStats(userIdString);
      console.log("Found stats count:", userStats.length);
      console.log("Found stats:", userStats);
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

  // Get team stats for a specific season
  app.get("/api/teams/:season", async (req, res) => {
    try {
      const { season } = req.params;
      const teamData = await getTeamPossessionData(season);
      
      if (!teamData) {
        return res.status(500).json({ message: "Failed to fetch team data from NBA API" });
      }
      
      res.json(teamData);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({ message: "Failed to fetch team statistics" });
    }
  });

  // Calculate custom stats for teams
  app.post("/api/teams/calculate", async (req, res) => {
    try {
      const { formula, season = '2024-25' } = req.body;
      
      if (!formula) {
        return res.status(400).json({ message: "Formula is required" });
      }

      const teamData = await getTeamPossessionData(season);
      
      if (!teamData) {
        return res.status(500).json({ message: "Failed to fetch team data" });
      }

      const results = [];
      
      for (const team of teamData.teams) {
        try {
          let evaluationFormula = formula.toUpperCase();
          
          // Map team stats to formula variables
          const teamStatMappings = {
            'PPG': team.pointsPerGame,
            'PTS': team.points,
            'AST': team.assists,
            'REB': team.rebounds,
            'STL': team.steals,
            'BLK': team.blocks,
            'TOV': team.turnovers,
            'FG_PCT': team.fieldGoalPercentage,
            'FG%': team.fieldGoalPercentage,
            '3P_PCT': team.threePointPercentage,
            '3P%': team.threePointPercentage,
            'FT_PCT': team.freeThrowPercentage,
            'FT%': team.freeThrowPercentage,
            'W_PCT': team.winPercentage,
            'GP': team.gamesPlayed,
            'W': team.wins,
            'L': team.losses,
            'PACE': team.pace,
            'ORTG': team.offensiveRating,
            'DRTG': team.defensiveRating,
            'POSS': team.possessionsPerGame,
            'PLUS_MINUS': team.plusMinus
          };
          
          for (const [abbrev, value] of Object.entries(teamStatMappings)) {
            evaluationFormula = evaluationFormula.replace(
              new RegExp(`\\b${abbrev}\\b`, 'g'), 
              value.toString()
            );
          }
          
          const customStat = evaluate(evaluationFormula);
          
          results.push({
            team,
            customStat: typeof customStat === 'number' ? 
              Number(customStat.toFixed(2)) : 0,
            formula
          });
        } catch (error) {
          console.error(`Error calculating stat for ${team.teamName}:`, error);
        }
      }

      // Sort by custom stat value (highest first)
      results.sort((a, b) => b.customStat - a.customStat);
      
      // Add rank
      const rankedResults = results.map((result, index) => ({
        ...result,
        rank: index + 1
      }));

      res.json(rankedResults);
    } catch (error) {
      console.error("Error calculating team stats:", error);
      res.status(500).json({ message: "Failed to calculate custom team stats" });
    }
  });

  // Clean up duplicate custom stats (requires authentication)
  app.post("/api/custom-stats/cleanup-duplicates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const duplicatesRemoved = await storage.removeDuplicateCustomStats(userId);
      res.json({ message: `Removed ${duplicatesRemoved} duplicate stats` });
    } catch (error) {
      console.error("Error cleaning up duplicates:", error);
      res.status(500).json({ message: "Failed to clean up duplicates" });
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

  // Get team possession data and advanced analytics
  app.get("/api/nba/teams/possessions", async (req, res) => {
    try {
      const season = req.query.season as string || '2024-25';
      
      const teamData = await getTeamPossessionData(season);
      if (!teamData) {
        return res.status(500).json({ 
          message: "Failed to fetch team possession data. Please check the NBA API connection." 
        });
      }
      
      res.json(teamData);
    } catch (error) {
      console.error("Error fetching team possession data:", error);
      res.status(500).json({ message: "Failed to fetch team possession data" });
    }
  });

  // Get specific team's possession data
  app.get("/api/nba/teams/:teamId/possessions", async (req, res) => {
    try {
      const { teamId } = req.params;
      const season = req.query.season as string || '2024-25';
      
      const teamData = await getTeamPossessionData(season);
      if (!teamData) {
        return res.status(500).json({ 
          message: "Failed to fetch team possession data" 
        });
      }
      
      const specificTeam = teamData.teams.find(team => team.teamId === parseInt(teamId));
      if (!specificTeam) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json({
        team: specificTeam,
        leagueAverage: teamData.leagueAverage
      });
    } catch (error) {
      console.error("Error fetching specific team possession data:", error);
      res.status(500).json({ message: "Failed to fetch team possession data" });
    }
  });

  // Favorite players routes (requires authentication)
  app.get("/api/favorite-players", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavoritePlayers(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorite players:", error);
      res.status(500).json({ message: "Failed to fetch favorite players" });
    }
  });

  app.post("/api/favorite-players", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { playerId, playerName } = req.body;
      
      if (!playerId || !playerName) {
        return res.status(400).json({ message: "Player ID and name are required" });
      }

      // Check if already favorited
      const existingFavorites = await storage.getUserFavoritePlayers(userId);
      const alreadyFavorited = existingFavorites.find(fav => fav.playerId === playerId);
      
      if (alreadyFavorited) {
        // Return the existing favorite instead of an error
        return res.json(alreadyFavorited);
      }

      const favoritePlayer = await storage.addFavoritePlayer({
        userId,
        playerId,
        playerName
      });
      
      res.json(favoritePlayer);
    } catch (error) {
      console.error("Error adding favorite player:", error);
      res.status(500).json({ message: "Failed to add favorite player" });
    }
  });

  app.delete("/api/favorite-players/:playerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playerId = parseInt(req.params.playerId);
      
      if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const success = await storage.removeFavoritePlayer(userId, playerId);
      
      if (success) {
        res.json({ message: "Favorite player removed successfully" });
      } else {
        res.status(404).json({ message: "Favorite player not found" });
      }
    } catch (error) {
      console.error("Error removing favorite player:", error);
      res.status(500).json({ message: "Failed to remove favorite player" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
