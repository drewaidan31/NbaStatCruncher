const { evaluate } = require('mathjs');

// Test the exact same calculation logic
const testData = {
  PTS: 28.6,
  AST: 8.2,
  REB: 8.6,
  TOV: 3.9,
  PLUS_MINUS: 5.2,
  FG_PCT: 0.466,
  FGA: 20.1,
  FT_PCT: 0.786,
  FTA: 7.8,
  THREE_PCT: 0.348,
  '3P_PCT': 0.348,
  '3PA': 8.2,
  MIN: 36.2,
  STL: 1.2,
  BLK: 0.5,
  GP: 82,
  W_PCT: 0.634
};

const formula = "(((PTS * 1.6 + AST * 2.4 + REB * 1 + STL * 1.6 + 3PA * 1.5 + 3P_PCT * 5 + (3PA / FGA) * 3 + AST * 3.2 + (AST / (TOV + 1)) * 2) * (0.8 + FG_PCT * 0.2)) - (TOV * 0.8)) * (GP / 82)";

try {
  const result = evaluate(formula, testData);
  console.log("Test calculation result:", result);
  console.log("Type:", typeof result);
  console.log("IsNaN:", isNaN(result));
  console.log("IsFinite:", isFinite(result));
} catch (error) {
  console.log("Error:", error.message);
}