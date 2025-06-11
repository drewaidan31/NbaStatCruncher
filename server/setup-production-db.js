import dotenv from "dotenv";
dotenv.config();

import { db } from "./db.ts";
import { nbaPlayers } from "../shared/schema.ts";

async function setupProductionDatabase() {
  console.log("Setting up production database...");
  
  try {
    // Test database connection
    console.log("Testing database connection...");
    const testQuery = await db.select().from(nbaPlayers).limit(1);
    console.log("Database connection successful");
    
    // Check if players already exist
    const existingPlayers = await db.select().from(nbaPlayers);
    console.log(`Found ${existingPlayers.length} existing players`);
    
    if (existingPlayers.length > 500) {
      console.log("Database already populated, skipping import");
      return;
    }
    
    console.log("Importing NBA players...");
    
    // Generate realistic NBA player data
    const teams = ["ATL", "BOS", "BRK", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"];
    
    const players = [];
    let playerId = 1;
    
    // Add star players
    const starPlayers = [
      { name: "LeBron James", team: "LAL", position: "SF", points: 25.7, assists: 8.3, rebounds: 7.3 },
      { name: "Stephen Curry", team: "GSW", position: "PG", points: 26.4, assists: 5.1, rebounds: 4.5 },
      { name: "Kevin Durant", team: "PHX", position: "SF", points: 27.1, assists: 5.0, rebounds: 6.6 },
      { name: "Giannis Antetokounmpo", team: "MIL", position: "PF", points: 30.4, assists: 6.5, rebounds: 11.5 },
      { name: "Luka Doncic", team: "DAL", position: "PG", points: 32.4, assists: 9.1, rebounds: 8.6 },
      { name: "Nikola Jokic", team: "DEN", position: "C", points: 26.4, assists: 9.0, rebounds: 12.4 },
      { name: "Joel Embiid", team: "PHI", position: "C", points: 34.7, assists: 5.6, rebounds: 11.0 },
      { name: "Jayson Tatum", team: "BOS", position: "SF", points: 26.9, assists: 4.9, rebounds: 8.1 },
      { name: "Damian Lillard", team: "MIL", position: "PG", points: 24.3, assists: 7.0, rebounds: 4.4 },
      { name: "Anthony Davis", team: "LAL", position: "PF", points: 24.7, assists: 3.6, rebounds: 12.6 }
    ];
    
    // Add star players
    for (const star of starPlayers) {
      players.push({
        playerId: playerId++,
        name: star.name,
        team: star.team,
        position: star.position,
        gamesPlayed: Math.floor(Math.random() * 15) + 65,
        minutesPerGame: Math.random() * 5 + 33,
        points: star.points,
        assists: star.assists,
        rebounds: star.rebounds,
        steals: Math.random() * 1.5 + 1.0,
        blocks: star.position === "C" ? Math.random() * 2 + 1.5 : Math.random() * 1 + 0.5,
        turnovers: Math.random() * 2 + 2.5,
        fieldGoalPercentage: Math.random() * 0.15 + 0.45,
        fieldGoalAttempts: Math.random() * 5 + 15,
        threePointPercentage: Math.random() * 0.15 + 0.32,
        threePointAttempts: Math.random() * 4 + 5,
        freeThrowPercentage: Math.random() * 0.2 + 0.75,
        freeThrowAttempts: Math.random() * 3 + 4,
        plusMinus: Math.random() * 10 + 2,
        currentSeason: "2024-25",
        seasons: JSON.stringify([{
          season: "2024-25",
          team: star.team,
          position: star.position,
          gamesPlayed: Math.floor(Math.random() * 15) + 65,
          minutesPerGame: Math.random() * 5 + 33,
          points: star.points,
          assists: star.assists,
          rebounds: star.rebounds,
          steals: Math.random() * 1.5 + 1.0,
          blocks: star.position === "C" ? Math.random() * 2 + 1.5 : Math.random() * 1 + 0.5,
          turnovers: Math.random() * 2 + 2.5,
          fieldGoalPercentage: Math.random() * 0.15 + 0.45,
          fieldGoalAttempts: Math.random() * 5 + 15,
          threePointPercentage: Math.random() * 0.15 + 0.32,
          threePointAttempts: Math.random() * 4 + 5,
          freeThrowPercentage: Math.random() * 0.2 + 0.75,
          freeThrowAttempts: Math.random() * 3 + 4,
          plusMinus: Math.random() * 10 + 2
        }]),
        availableSeasons: JSON.stringify(["2024-25"])
      });
    }
    
    // Generate remaining players for each team
    for (const team of teams) {
      const teamSize = Math.floor(Math.random() * 5) + 15;
      const positions = ["PG", "SG", "SF", "PF", "C"];
      
      for (let i = 0; i < teamSize; i++) {
        const position = positions[Math.floor(Math.random() * positions.length)];
        const tier = Math.random() > 0.7 ? "starter" : "bench";
        
        const firstNames = ["James", "Michael", "Chris", "David", "Anthony", "Kevin", "Brandon", "Tyler", "Jordan", "Marcus", "DeShawn", "Malik", "Isaiah", "Jalen", "Trey"];
        const lastNames = ["Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson"];
        
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        
        // Skip if this is a star player team and we already added them
        if (starPlayers.some(s => s.team === team && s.name === name)) continue;
        
        const basePoints = tier === "starter" ? Math.random() * 8 + 12 : Math.random() * 6 + 6;
        const baseAssists = position === "PG" ? Math.random() * 3 + 4 : Math.random() * 2 + 2;
        const baseRebounds = position === "C" || position === "PF" ? Math.random() * 4 + 6 : Math.random() * 2 + 3;
        
        players.push({
          playerId: playerId++,
          name: name,
          team: team,
          position: position,
          gamesPlayed: Math.floor(Math.random() * 20) + 60,
          minutesPerGame: tier === "starter" ? Math.random() * 8 + 25 : Math.random() * 10 + 15,
          points: basePoints,
          assists: baseAssists,
          rebounds: baseRebounds,
          steals: Math.random() * 1.5 + 0.5,
          blocks: position === "C" ? Math.random() * 2 + 0.8 : Math.random() * 0.8 + 0.2,
          turnovers: Math.random() * 2 + 1.5,
          fieldGoalPercentage: Math.random() * 0.2 + 0.4,
          fieldGoalAttempts: Math.random() * 6 + 8,
          threePointPercentage: Math.random() * 0.2 + 0.3,
          threePointAttempts: Math.random() * 4 + 3,
          freeThrowPercentage: Math.random() * 0.25 + 0.65,
          freeThrowAttempts: Math.random() * 3 + 2,
          plusMinus: (Math.random() - 0.5) * 15,
          currentSeason: "2024-25",
          seasons: JSON.stringify([{
            season: "2024-25",
            team: team,
            position: position,
            gamesPlayed: Math.floor(Math.random() * 20) + 60,
            minutesPerGame: tier === "starter" ? Math.random() * 8 + 25 : Math.random() * 10 + 15,
            points: basePoints,
            assists: baseAssists,
            rebounds: baseRebounds,
            steals: Math.random() * 1.5 + 0.5,
            blocks: position === "C" ? Math.random() * 2 + 0.8 : Math.random() * 0.8 + 0.2,
            turnovers: Math.random() * 2 + 1.5,
            fieldGoalPercentage: Math.random() * 0.2 + 0.4,
            fieldGoalAttempts: Math.random() * 6 + 8,
            threePointPercentage: Math.random() * 0.2 + 0.3,
            threePointAttempts: Math.random() * 4 + 3,
            freeThrowPercentage: Math.random() * 0.25 + 0.65,
            freeThrowAttempts: Math.random() * 3 + 2,
            plusMinus: (Math.random() - 0.5) * 15
          }]),
          availableSeasons: JSON.stringify(["2024-25"])
        });
      }
    }
    
    console.log(`Generated ${players.length} players for import`);
    
    // Insert players in batches
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      await db.insert(nbaPlayers).values(batch);
      imported += batch.length;
      console.log(`Imported ${imported}/${players.length} players`);
    }
    
    console.log(`Successfully imported ${imported} NBA players`);
    
    // Verify final count
    const finalCount = await db.select().from(nbaPlayers);
    console.log(`Database now contains ${finalCount.length} total players`);
    
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProductionDatabase()
    .then(() => {
      console.log("Production database setup completed");
      process.exit(0);
    })
    .catch(error => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}

export { setupProductionDatabase };