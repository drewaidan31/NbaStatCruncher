// Local rule-based stat name generator
export function generateStatName(formula: string): { name: string; description: string } {
  const upperFormula = formula.toUpperCase();
  
  // Define stat categories and their keywords
  const statPatterns = {
    // Offensive patterns
    scoring: ['PTS', 'PPG', 'FG', 'THREE', 'FT'],
    playmaking: ['AST', 'APG'],
    rebounding: ['REB', 'RPG'],
    
    // Defensive patterns
    defense: ['STL', 'BLK', 'SPG', 'BPG'],
    
    // Efficiency patterns
    efficiency: ['/', 'TOV', 'TPG'],
    shooting: ['FG_PCT', 'FG%', 'THREE_PCT', '3P%', 'FT_PCT', 'FT%'],
    
    // Impact patterns
    impact: ['PLUS_MINUS', '+/-'],
    durability: ['GP', 'MIN']
  };
  
  // Count occurrences of each category
  const categoryScores = Object.entries(statPatterns).map(([category, keywords]) => ({
    category,
    score: keywords.reduce((sum, keyword) => sum + (upperFormula.includes(keyword) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  
  // Analyze formula structure
  const hasDivision = formula.includes('/');
  const hasMultiplication = formula.includes('*');
  const hasAddition = formula.includes('+');
  const hasSubtraction = formula.includes('-');
  
  // Generate names based on patterns
  let name = "Custom Metric";
  let description = "A custom basketball statistic";
  
  const topCategories = categoryScores.filter(c => c.score > 0).slice(0, 2);
  
  if (topCategories.length > 0) {
    const primary = topCategories[0].category;
    const secondary = topCategories[1]?.category;
    
    // Efficiency-based names (has division)
    if (hasDivision && upperFormula.includes('TOV')) {
      name = "Efficiency Rating";
      description = "Measures productive output while minimizing turnovers";
    } else if (hasDivision) {
      name = "Production Rate";
      description = "Calculates statistical output per unit of measurement";
    }
    
    // Multi-category combinations
    else if (primary === 'scoring' && secondary === 'playmaking') {
      name = "Offensive Impact";
      description = "Combines scoring and playmaking contributions";
    } else if (primary === 'scoring' && secondary === 'rebounding') {
      name = "Big Man Index";
      description = "Measures traditional big man statistical production";
    } else if (primary === 'defense' && secondary === 'rebounding') {
      name = "Defensive Presence";
      description = "Quantifies defensive impact through blocks, steals, and rebounds";
    } else if (primary === 'playmaking' && secondary === 'scoring') {
      name = "Point Guard Rating";
      description = "Emphasizes playmaking with scoring support";
    } else if (primary === 'shooting' && secondary === 'scoring') {
      name = "Shooter's Touch";
      description = "Measures scoring efficiency across different shot types";
    }
    
    // Single category focus
    else if (primary === 'scoring') {
      if (hasMultiplication) {
        name = "Scoring Punch";
        description = "Weighted scoring metric emphasizing volume and efficiency";
      } else {
        name = "Offensive Output";
        description = "Measures total offensive statistical production";
      }
    } else if (primary === 'defense') {
      name = "Defensive Impact";
      description = "Tracks defensive contributions through steals and blocks";
    } else if (primary === 'playmaking') {
      name = "Floor General";
      description = "Focuses on playmaking and team facilitation";
    } else if (primary === 'rebounding') {
      name = "Board Control";
      description = "Measures rebounding dominance and presence";
    } else if (primary === 'efficiency') {
      name = "Smart Play Index";
      description = "Rewards efficient play while penalizing mistakes";
    } else if (primary === 'impact') {
      name = "Winning Impact";
      description = "Incorporates team success metrics with individual stats";
    }
    
    // Special pattern recognition
    if (upperFormula.includes('PTS') && upperFormula.includes('AST') && upperFormula.includes('REB')) {
      if (upperFormula.includes('STL') || upperFormula.includes('BLK')) {
        name = "Complete Player";
        description = "Comprehensive metric covering all major statistical categories";
      } else {
        name = "Triple Threat";
        description = "Measures scoring, rebounding, and playmaking ability";
      }
    }
    
    if (hasSubtraction && upperFormula.includes('TOV')) {
      name = "Clean Game Score";
      description = "Rewards positive contributions while penalizing turnovers";
    }
    
    if (upperFormula.includes('GP') || upperFormula.includes('MIN')) {
      name = "Durability Factor";
      description = "Incorporates games played or minutes as a reliability measure";
    }
  }
  
  return { name, description };
}