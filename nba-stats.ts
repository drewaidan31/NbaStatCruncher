import { NBA_STAT_MAPPINGS, NBA_STAT_DESCRIPTIONS } from "@shared/schema";

export function validateNBAFormula(formula: string): {
  isValid: boolean;
  error?: string;
  usedStats: string[];
} {
  if (!formula.trim()) {
    return { isValid: false, error: "Formula cannot be empty", usedStats: [] };
  }

  const formulaUpper = formula.toUpperCase();
  const availableStats = Object.keys(NBA_STAT_MAPPINGS);
  const usedStats = availableStats.filter(stat => 
    new RegExp(`\\b${stat}\\b`).test(formulaUpper)
  );

  if (usedStats.length === 0) {
    return {
      isValid: false,
      error: `Formula must contain at least one valid NBA stat: ${availableStats.join(", ")}`,
      usedStats: []
    };
  }

  // Check for balanced parentheses
  const openParens = (formula.match(/\(/g) || []).length;
  const closeParens = (formula.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    return {
      isValid: false,
      error: "Unbalanced parentheses in formula",
      usedStats
    };
  }

  // Check for invalid characters (allow only numbers, operators, parentheses, and NBA stats)
  const allowedPattern = /^[A-Z_\s\d+\-*/().,]+$/i;
  if (!allowedPattern.test(formula)) {
    return {
      isValid: false,
      error: "Formula contains invalid characters",
      usedStats
    };
  }

  return { isValid: true, usedStats };
}

export function getStatDescription(statAbbrev: string): string {
  return NBA_STAT_DESCRIPTIONS[statAbbrev as keyof typeof NBA_STAT_DESCRIPTIONS] || statAbbrev;
}

export function getAllAvailableStats() {
  return Object.entries(NBA_STAT_DESCRIPTIONS).map(([abbrev, description]) => ({
    abbreviation: abbrev,
    description,
    field: NBA_STAT_MAPPINGS[abbrev as keyof typeof NBA_STAT_MAPPINGS]
  }));
}

// Popular formula presets
export const FORMULA_PRESETS = [
  {
    name: "Player Efficiency Rating",
    formula: "PTS + REB + AST - TOV",
    category: "Overall"
  },
  {
    name: "True Shooting Impact",
    formula: "PTS * (FG_PCT + FT_PCT) / 2",
    category: "Shooting"
  },
  {
    name: "Court Vision",
    formula: "AST / (TOV + 1) * MIN",
    category: "Playmaking"
  },
  {
    name: "Defensive Presence",
    formula: "STL + BLK + REB * 0.5",
    category: "Defense"
  },
  {
    name: "Triple Double Threat",
    formula: "(PTS >= 10) + (AST >= 10) + (REB >= 10)",
    category: "Versatility"
  }
] as const;
