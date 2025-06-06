import type { Player, CustomStat, FavoritePlayer } from "@shared/schema";

export interface PersonalizedGraphConfig {
  favorites: FavoritePlayer[];
  userCustomStats: CustomStat[];
  allPlayers: Player[];
  refreshCounter: number;
}

export interface FormulaExample {
  name: string;
  formula: string;
  description: string;
}

// Default formula examples from the app
const DEFAULT_FORMULAS: FormulaExample[] = [
  {
    name: "True Shooting % (TS%)",
    formula: "PTS / (2 * (FGA + 0.44 * FTA))",
    description: "Measures shooting efficiency accounting for 2P, 3P, and FT"
  },
  {
    name: "Offensive Impact",
    formula: "PTS + AST * 1.5 + REB * 0.5",
    description: "Comprehensive offensive contribution metric"
  },
  {
    name: "Complete Player",
    formula: "(PTS + AST + REB + STL + BLK) / TOV",
    description: "Well-rounded performance with turnover efficiency"
  },
  {
    name: "Efficiency Rating",
    formula: "(PTS + REB + AST + STL + BLK - (FGA - (PTS/2)) - (FTA - PTS) - TOV) / GP",
    description: "NBA efficiency rating formula"
  },
  {
    name: "Usage Rate Approximation",
    formula: "((FGA + 0.44 * FTA + TOV) * 40 * 5) / (MIN * (5 * (FGA + 0.44 * FTA + TOV) + (40 - MIN) * 2))",
    description: "Estimates percentage of team plays used by player"
  },
  {
    name: "Defensive Impact",
    formula: "STL + BLK + REB * 0.75 - (TOV * 0.5)",
    description: "Defensive contribution with turnover penalty"
  },
  {
    name: "Floor General",
    formula: "AST / TOV + (AST * 2) / FGA",
    description: "Playmaking efficiency and ball distribution"
  },
  {
    name: "Big Man Index",
    formula: "REB + BLK * 2 + (FG_PCT * 10) - (FGA / PTS)",
    description: "Interior presence and efficiency for centers/forwards"
  },
  {
    name: "Shooter's Touch",
    formula: "THREE_PCT + FT_PCT + (PTS / FGA)",
    description: "Pure shooting ability across all shot types"
  },
  {
    name: "Hustle Metric",
    formula: "STL + BLK + (REB / GP) + (PLUS_MINUS / 10)",
    description: "Effort-based stats and team impact"
  },
  {
    name: "Versatility Score",
    formula: "PTS + AST + REB + STL + BLK",
    description: "Raw statistical versatility across all categories"
  },
  {
    name: "Point Guard Rating",
    formula: "AST * 2 + STL * 1.5 + (AST / TOV) - (FGA / AST)",
    description: "Specialized metric for point guard effectiveness"
  },
  {
    name: "Scoring Punch",
    formula: "PTS + (THREE_PCT * 30) + (FT_PCT * 10)",
    description: "Scoring volume with shooting efficiency bonus"
  },
  {
    name: "Rim Protector",
    formula: "BLK * 3 + REB + (PLUS_MINUS / 5)",
    description: "Interior defense and overall defensive impact"
  },
  {
    name: "Two-Way Impact",
    formula: "(PTS + AST) + (STL + BLK + REB * 0.8)",
    description: "Balanced offensive and defensive contribution"
  },
  {
    name: "Consistency Factor",
    formula: "GP * (PTS + REB + AST) / 82",
    description: "Performance weighted by games played availability"
  },
  {
    name: "Clutch Shooter",
    formula: "FG_PCT + THREE_PCT + FT_PCT + (PTS / GP)",
    description: "Shooting reliability across all situations"
  },
  {
    name: "Paint Presence",
    formula: "REB * 1.2 + BLK * 2.5 + (FG_PCT * 15)",
    description: "Interior dominance for big men"
  },
  {
    name: "Pace Impact",
    formula: "(PTS + AST * 1.5) * (MIN / 36)",
    description: "Per-minute offensive impact adjusted for playing time"
  },
  {
    name: "Winning Formula",
    formula: "PLUS_MINUS + (PTS + AST + REB) * W_PCT",
    description: "Individual performance weighted by team success"
  }
];

/**
 * Generates a personalized random graph configuration based on user preferences
 */
export function generatePersonalizedGraph(config: PersonalizedGraphConfig): {
  selectedPlayer: Player;
  selectedStat: FormulaExample;
  playerIndex: number;
  statIndex: number;
} {
  const { favorites, userCustomStats, allPlayers, refreshCounter } = config;
  
  // Create enhanced formula pool - user custom stats appear with 2x probability for favorites
  const enhancedFormulas: FormulaExample[] = [...DEFAULT_FORMULAS];
  
  // Add user custom stats to the pool
  if (userCustomStats.length > 0) {
    const userFormulas = userCustomStats.map(stat => ({
      name: stat.name,
      formula: stat.formula,
      description: stat.description || "Custom user-created statistic"
    }));
    
    enhancedFormulas.push(...userFormulas);
    
    // For favorite players, add user custom stats again to double their probability
    if (favorites.length > 0) {
      enhancedFormulas.push(...userFormulas);
    }
  }
  
  // Determine player selection strategy - use ONLY favorites if available
  let playerPool = allPlayers;
  let useFavorites = false;
  
  // Always use favorites if user has any
  if (favorites.length > 0) {
    const favoritePlayerIds = favorites.map(fav => fav.playerId);
    const favoritePlayers = allPlayers.filter(player => 
      favoritePlayerIds.includes(player.playerId)
    );
    
    if (favoritePlayers.length > 0) {
      playerPool = favoritePlayers;
      useFavorites = true;
    }
  }
  
  // Generate pseudo-random indices based on refresh counter and time
  const timeComponent = Math.floor(Date.now() / 1000) % 10000;
  const playerSeed = (refreshCounter * 17 + timeComponent * 3) % playerPool.length;
  const statSeed = (refreshCounter * 23 + timeComponent * 7) % enhancedFormulas.length;
  
  const selectedPlayer = playerPool[playerSeed];
  const selectedStat = enhancedFormulas[statSeed];
  
  // Log for debugging
  console.log(`Refresh counter: ${refreshCounter}, Player Index: ${playerSeed}, Stat Index: ${statSeed}, Selected Stat: "${selectedStat.name}"`);
  
  if (useFavorites) {
    console.log(`Using favorite player: ${selectedPlayer.name}`);
  }
  
  if (userCustomStats.some(stat => stat.name === selectedStat.name)) {
    console.log(`Selected user custom stat: "${selectedStat.name}"`);
  }
  
  return {
    selectedPlayer,
    selectedStat,
    playerIndex: playerSeed,
    statIndex: statSeed
  };
}

/**
 * Generates career progression chart data for a player using a specific formula
 */
export function generateCareerProgressionData(
  player: Player,
  formula: string,
  formulaName: string
): Array<{ season: string; value: number; team: string }> {
  if (!player.seasons || !Array.isArray(player.seasons)) {
    return [];
  }
  
  const chartData: Array<{ season: string; value: number; team: string }> = [];
  
  for (const seasonData of player.seasons) {
    try {
      // Replace NBA stat abbreviations with season values
      let evaluationFormula = formula.toUpperCase();
      
      const statMappings: Record<string, keyof typeof seasonData> = {
        'PTS': 'points',
        'AST': 'assists', 
        'REB': 'rebounds',
        'TOV': 'turnovers',
        'PLUS_MINUS': 'plusMinus',
        'FG_PCT': 'fieldGoalPercentage',
        'FGA': 'fieldGoalAttempts',
        'FT_PCT': 'freeThrowPercentage',
        'FTA': 'freeThrowAttempts',
        'THREE_PCT': 'threePointPercentage',
        '3PA': 'threePointAttempts',
        'MIN': 'minutesPerGame',
        'STL': 'steals',
        'BLK': 'blocks',
        'GP': 'gamesPlayed',
        'W_PCT': 'winPercentage'
      };
      
      for (const [abbrev, field] of Object.entries(statMappings)) {
        const value = (seasonData as any)[field] as number || 0;
        evaluationFormula = evaluationFormula.replace(
          new RegExp(`\\b${abbrev}\\b`, 'g'), 
          value.toString()
        );
      }
      
      // Use a simple math evaluator for basic operations
      const result = evaluateFormula(evaluationFormula);
      
      if (typeof result === 'number' && isFinite(result)) {
        chartData.push({
          season: seasonData.season,
          value: Number(result.toFixed(2)),
          team: seasonData.team
        });
      }
    } catch (error) {
      console.error(`Error calculating stat for ${player.name} in ${seasonData.season}:`, error);
    }
  }
  
  // Sort by season year
  return chartData.sort((a, b) => {
    const yearA = parseInt(a.season.split('-')[0]);
    const yearB = parseInt(b.season.split('-')[0]);
    return yearA - yearB;
  });
}

/**
 * Simple formula evaluator for basic math operations
 */
function evaluateFormula(formula: string): number {
  try {
    // Remove any non-math characters and evaluate
    const cleanFormula = formula.replace(/[^0-9+\-*/.() ]/g, '');
    return Function(`"use strict"; return (${cleanFormula})`)();
  } catch {
    return 0;
  }
}