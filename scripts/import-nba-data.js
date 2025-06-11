import dotenv from "dotenv";
dotenv.config();

// Generate comprehensive NBA player dataset
async function generateNBAPlayers() {
  const teams = [
    "ATL", "BOS", "BRK", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
    "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK",
    "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"
  ];
  
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const seasons = ["2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25"];
  
  const players = [];
  let playerId = 1;
  
  // Generate star players with historical data
  const starPlayers = [
    { name: "LeBron James", team: "LAL", pos: "SF", tier: "superstar" },
    { name: "Stephen Curry", team: "GSW", pos: "PG", tier: "superstar" },
    { name: "Kevin Durant", team: "PHX", pos: "SF", tier: "superstar" },
    { name: "Giannis Antetokounmpo", team: "MIL", pos: "PF", tier: "superstar" },
    { name: "Luka Doncic", team: "DAL", pos: "PG", tier: "superstar" },
    { name: "Nikola Jokic", team: "DEN", pos: "C", tier: "superstar" },
    { name: "Joel Embiid", team: "PHI", pos: "C", tier: "superstar" },
    { name: "Jayson Tatum", team: "BOS", pos: "SF", tier: "allstar" },
    { name: "Damian Lillard", team: "MIL", pos: "PG", tier: "allstar" },
    { name: "Anthony Davis", team: "LAL", pos: "PF", tier: "allstar" }
  ];
  
  // Generate players for each team
  for (const team of teams) {
    const teamSize = Math.floor(Math.random() * 5) + 15; // 15-20 players per team
    
    for (let i = 0; i < teamSize; i++) {
      const position = positions[Math.floor(Math.random() * positions.length)];
      const isStarPlayer = starPlayers.find(p => p.team === team);
      
      let playerName, tier;
      if (isStarPlayer && i === 0) {
        playerName = isStarPlayer.name;
        tier = isStarPlayer.tier;
      } else {
        const firstNames = ["James", "Michael", "Chris", "David", "Anthony", "Kevin", "Brandon", "Tyler", "Jordan", "Marcus"];
        const lastNames = ["Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas"];
        playerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        tier = Math.random() > 0.8 ? "allstar" : Math.random() > 0.6 ? "starter" : "bench";
      }
      
      // Generate base stats based on tier
      const baseStats = generatePlayerStats(tier, position);
      
      // Create player with multiple seasons
      const playerSeasons = [];
      for (const season of seasons) {
        const seasonStats = {
          ...baseStats,
          season: season,
          team: team,
          position: position,
          // Add some variation across seasons
          points: Math.max(0, baseStats.points + (Math.random() - 0.5) * 4),
          assists: Math.max(0, baseStats.assists + (Math.random() - 0.5) * 2),
          rebounds: Math.max(0, baseStats.rebounds + (Math.random() - 0.5) * 2),
        };
        playerSeasons.push(seasonStats);
      }
      
      const player = {
        playerId: playerId++,
        name: playerName,
        team: team,
        position: position,
        currentSeason: "2024-25",
        ...baseStats,
        seasons: playerSeasons,
        availableSeasons: seasons
      };
      
      players.push(player);
    }
  }
  
  return players;
}

function generatePlayerStats(tier, position) {
  let basePoints, baseAssists, baseRebounds, baseSteals, baseBlocks;
  
  // Position-based stat tendencies
  switch (position) {
    case "PG":
      baseAssists = tier === "superstar" ? 8 : tier === "allstar" ? 6 : tier === "starter" ? 4 : 2;
      basePoints = tier === "superstar" ? 25 : tier === "allstar" ? 18 : tier === "starter" ? 12 : 8;
      baseRebounds = 4;
      break;
    case "SG":
      basePoints = tier === "superstar" ? 28 : tier === "allstar" ? 20 : tier === "starter" ? 14 : 9;
      baseAssists = tier === "superstar" ? 6 : tier === "allstar" ? 4 : 3;
      baseRebounds = 5;
      break;
    case "SF":
      basePoints = tier === "superstar" ? 26 : tier === "allstar" ? 19 : tier === "starter" ? 13 : 8;
      baseAssists = tier === "superstar" ? 7 : tier === "allstar" ? 5 : 3;
      baseRebounds = tier === "superstar" ? 8 : 6;
      break;
    case "PF":
      basePoints = tier === "superstar" ? 24 : tier === "allstar" ? 17 : tier === "starter" ? 11 : 7;
      baseRebounds = tier === "superstar" ? 11 : tier === "allstar" ? 8 : 6;
      baseAssists = 3;
      break;
    case "C":
      basePoints = tier === "superstar" ? 22 : tier === "allstar" ? 16 : tier === "starter" ? 10 : 6;
      baseRebounds = tier === "superstar" ? 12 : tier === "allstar" ? 9 : 7;
      baseBlocks = tier === "superstar" ? 2.5 : tier === "allstar" ? 1.8 : 1.2;
      baseAssists = 2;
      break;
  }
  
  return {
    gamesPlayed: Math.floor(Math.random() * 20) + 60, // 60-80 games
    minutesPerGame: tier === "superstar" ? 35 : tier === "allstar" ? 30 : tier === "starter" ? 25 : 15,
    points: basePoints + (Math.random() - 0.5) * 4,
    assists: baseAssists + (Math.random() - 0.5) * 2,
    rebounds: baseRebounds + (Math.random() - 0.5) * 2,
    steals: Math.random() * 2 + 0.5,
    blocks: baseBlocks || Math.random() * 1.5 + 0.2,
    turnovers: Math.random() * 3 + 1,
    fieldGoalPercentage: Math.random() * 0.2 + 0.4, // 40-60%
    fieldGoalAttempts: Math.random() * 8 + 8,
    threePointPercentage: Math.random() * 0.25 + 0.25, // 25-50%
    threePointAttempts: Math.random() * 6 + 2,
    freeThrowPercentage: Math.random() * 0.3 + 0.6, // 60-90%
    freeThrowAttempts: Math.random() * 4 + 2,
    plusMinus: (Math.random() - 0.5) * 20 // -10 to +10
  };
}

async function importNBAData() {
  console.log("Starting NBA data import...");
  
  try {
    // Import storage dynamically
    let storage;
    try {
      const storageModule = await import("../server/storage.js");
      storage = storageModule.storage;
    } catch (error) {
      console.log("Fallback: importing from dist directory");
      const storageModule = await import("../dist/storage.js");
      storage = storageModule.storage;
    }
    
    // Check if data already exists
    const existingPlayers = await storage.getAllPlayers();
    console.log(`Found ${existingPlayers.length} existing players in database`);
    
    if (existingPlayers.length > 500) {
      console.log("Database already contains player data, skipping import");
      return;
    }
    
    // Generate comprehensive NBA dataset
    const nbaPlayers = await generateNBAPlayers();
    
    console.log(`Importing ${nbaPlayers.length} NBA players...`);
    
    let importedCount = 0;
    for (const player of nbaPlayers) {
      try {
        await storage.createPlayer(player);
        importedCount++;
        if (importedCount % 50 === 0) {
          console.log(`Imported ${importedCount}/${nbaPlayers.length} players`);
        }
      } catch (error) {
        console.error(`Failed to import player ${player.name}:`, error.message);
      }
    }
    
    console.log(`Successfully imported ${importedCount} NBA players`);
    
    // Verify final count
    const finalPlayers = await storage.getAllPlayers();
    console.log(`Database now contains ${finalPlayers.length} total players`);
    
  } catch (error) {
    console.error("NBA data import failed:", error);
    throw error;
  }
}

// Run the import
importNBAData()
  .then(() => {
    console.log("NBA data import completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("NBA data import failed:", error);
    process.exit(1);
  });