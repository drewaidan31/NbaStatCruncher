import { useState, useEffect } from "react";
import { ArrowLeft, Calculator, TrendingUp, Sparkles, BarChart3, Calendar } from "lucide-react";
import FormulaExamples from "./formula-examples";
import { evaluate } from "mathjs";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Player {
  playerId: number;
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  plusMinus: number;
  currentSeason?: string;
  seasons?: Array<{
    season: string;
    team: string;
    position: string;
    gamesPlayed: number;
    minutesPerGame: number;
    points: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
    plusMinus: number;
  }>;
  availableSeasons?: string[];
}

interface PlayerAnalysisProps {
  player: Player;
  season: string;
  onBack: () => void;
}

export default function PlayerAnalysis({ player, season, onBack }: PlayerAnalysisProps) {
  const [formula, setFormula] = useState("");
  const [customStatName, setCustomStatName] = useState("");
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showSavedStats, setShowSavedStats] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(player.currentSeason || season);
  const [currentPlayerData, setCurrentPlayerData] = useState(player);
  const [chartData, setChartData] = useState<Array<{season: string, value: number, team: string}>>([]);

  // Query to fetch specific season data for the player
  const { data: seasonPlayerData, isLoading: isLoadingSeason } = useQuery({
    queryKey: ['/api/nba/players', player.playerId, 'season', selectedSeason],
    enabled: selectedSeason !== player.currentSeason && !!selectedSeason,
  });

  // Query to fetch saved custom stats
  const { data: savedStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/custom-stats'],
    enabled: showSavedStats,
  });

  // Update current player data when season changes
  useEffect(() => {
    if (selectedSeason && player.seasons) {
      // Find the season data from the player's seasons array
      const seasonData = player.seasons.find(s => s.season === selectedSeason);
      if (seasonData) {
        // Create a player object with the season-specific data
        const updatedPlayerData = {
          ...player,
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
        setCurrentPlayerData(updatedPlayerData);
      }
    } else if (selectedSeason === player.currentSeason) {
      setCurrentPlayerData(player);
    }
  }, [selectedSeason, player]);

  const statMappings = {
    'PTS': currentPlayerData.points,
    'PPG': currentPlayerData.points, // Support both formats
    'AST': currentPlayerData.assists,
    'APG': currentPlayerData.assists, // Support both formats
    'REB': currentPlayerData.rebounds,
    'RPG': currentPlayerData.rebounds, // Support both formats
    'STL': currentPlayerData.steals,
    'SPG': currentPlayerData.steals, // Support both formats
    'BLK': currentPlayerData.blocks,
    'BPG': currentPlayerData.blocks, // Support both formats
    'TOV': currentPlayerData.turnovers,
    'TPG': currentPlayerData.turnovers, // Support both formats
    'FG_PCT': currentPlayerData.fieldGoalPercentage,
    'FG%': currentPlayerData.fieldGoalPercentage, // Support both formats
    'THREE_PCT': currentPlayerData.threePointPercentage,
    '3P%': currentPlayerData.threePointPercentage, // Support both formats
    'FT_PCT': currentPlayerData.freeThrowPercentage,
    'FT%': currentPlayerData.freeThrowPercentage, // Support both formats
    'GP': currentPlayerData.gamesPlayed,
    'PLUS_MINUS': currentPlayerData.plusMinus,
    '+/-': currentPlayerData.plusMinus, // Support both formats
    'MIN': currentPlayerData.minutesPerGame || 32.5
  };

  const calculateCustomStatForSeason = (seasonData: any) => {
    const seasonStatMappings = {
      'PTS': seasonData.points,
      'PPG': seasonData.points, // Support both formats
      'AST': seasonData.assists,
      'APG': seasonData.assists, // Support both formats
      'REB': seasonData.rebounds,
      'RPG': seasonData.rebounds, // Support both formats
      'STL': seasonData.steals,
      'SPG': seasonData.steals, // Support both formats
      'BLK': seasonData.blocks,
      'BPG': seasonData.blocks, // Support both formats
      'TOV': seasonData.turnovers,
      'TPG': seasonData.turnovers, // Support both formats
      'FG_PCT': seasonData.fieldGoalPercentage,
      'FG%': seasonData.fieldGoalPercentage, // Support both formats
      'THREE_PCT': seasonData.threePointPercentage,
      '3P%': seasonData.threePointPercentage, // Support both formats
      'FT_PCT': seasonData.freeThrowPercentage,
      'FT%': seasonData.freeThrowPercentage, // Support both formats
      'GP': seasonData.gamesPlayed,
      'PLUS_MINUS': seasonData.plusMinus,
      '+/-': seasonData.plusMinus, // Support both formats
      'MIN': seasonData.minutesPerGame || 32.5
    };

    try {
      let expression = formula;
      
      // Replace stat abbreviations with actual values
      Object.entries(seasonStatMappings).forEach(([key, value]) => {
        if (key.includes('_PCT')) {
          // Handle percentage stats
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          expression = expression.replace(regex, value.toString());
        } else {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          expression = expression.replace(regex, value.toString());
        }
      });
      
      const result = evaluate(expression);
      return typeof result === 'number' ? result : null;
    } catch (error) {
      return null;
    }
  };

  const calculateCustomStat = () => {
    console.log('Starting calculation with formula:', formula);
    console.log('Stat mappings:', statMappings);
    
    try {
      let expression = formula;
      
      // Handle +/- first since it has special characters
      if (expression.includes('+/-')) {
        expression = expression.replace(/\+\/-/g, statMappings['+/-'].toString());
      }
      
      // Replace stat abbreviations with actual values
      Object.entries(statMappings).forEach(([key, value]) => {
        if (key === '+/-') {
          // Skip +/- as we handled it above
          return;
        }
        if (key.includes('%')) {
          // Handle percentage stats with special regex
          const escapedKey = key.replace(/%/g, '\\%');
          const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
          expression = expression.replace(regex, value.toString());
        } else {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          expression = expression.replace(regex, value.toString());
        }
      });
      
      console.log('Expression after replacement:', expression);
      
      const result = evaluate(expression);
      console.log('Evaluation result:', result);
      setCalculatedValue(typeof result === 'number' ? result : null);

      // Calculate for all seasons to create chart data
      if (player.seasons && formula.trim()) {
        const chartDataPoints = player.seasons
          .map(seasonData => {
            const value = calculateCustomStatForSeason(seasonData);
            return value !== null ? {
              season: seasonData.season,
              value: value,
              team: seasonData.team
            } : null;
          })
          .filter(point => point !== null)
          .sort((a, b) => a!.season.localeCompare(b!.season));
        
        console.log('Chart data points:', chartDataPoints);
        setChartData(chartDataPoints as Array<{season: string, value: number, team: string}>);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculatedValue(null);
      setChartData([]);
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    // Reset calculated value when formula changes
    setCalculatedValue(null);
  };

  const handleCalculate = () => {
    calculateCustomStat();
  };

  const handleSaveStat = async () => {
    try {
      const response = await fetch('/api/custom-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customStatName,
          formula: formula,
          description: `Custom stat: ${customStatName}`
        }),
      });
      
      if (response.ok) {
        // You could add a toast notification here
        console.log('Stat saved successfully!');
      }
    } catch (error) {
      console.error('Error saving stat:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{player.name}</h1>
              <p className="text-slate-300">{currentPlayerData.team} • {currentPlayerData.position} • {selectedSeason}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Season Selector */}
            {player.availableSeasons && player.availableSeasons.length > 1 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoadingSeason}
                >
                  {player.availableSeasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="text-right">
              <p className="text-slate-400 text-sm">Custom Stat Calculator</p>
              <p className="text-orange-400 font-medium">Build your own analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Stat Calculator - Main Focus */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 border border-orange-500/30 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <Calculator className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Custom Stat Calculator</h2>
              <p className="text-slate-400">Create your own performance metrics</p>
            </div>
          </div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Formula Examples
          </button>
          <button
            onClick={() => setShowSavedStats(!showSavedStats)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Saved Stats
          </button>
        </div>

        {/* Result Display - Prominent */}
        {calculatedValue !== null && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-center shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">{customStatName}</h3>
            </div>
            <div className="text-5xl font-bold text-white mb-2">{calculatedValue.toFixed(2)}</div>
            <div className="text-orange-100 text-sm bg-black/20 rounded-lg px-3 py-1 inline-block">
              Formula: {formula}
            </div>
          </div>
        )}

        {/* No Result State */}
        {calculatedValue === null && (
          <div className="bg-slate-700/50 rounded-xl p-8 mb-6 text-center border-2 border-dashed border-slate-600">
            <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Calculate</h3>
            <p className="text-slate-400 text-sm">Enter a formula below to see your custom stat result</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom Stat Name:
            </label>
            <input
              type="text"
              value={customStatName}
              onChange={(e) => setCustomStatName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
              placeholder="Enter a name for your custom stat..."
            />
          </div>

          {/* Interactive Calculator Interface */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Formula Builder:
              </label>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                <div className="text-slate-300 text-sm mb-1">Formula:</div>
                <div className="text-white text-lg font-mono min-h-[2rem] break-all">
                  {formula || "Click stats and operations to build your formula"}
                </div>
              </div>
              
              {/* Calculate Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleCalculate}
                  disabled={!formula}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Calculate
                </button>
                <button
                  onClick={handleSaveStat}
                  disabled={!formula || !customStatName || calculatedValue === null}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Save Stat
                </button>
                <button
                  onClick={() => {
                    setFormula("");
                    handleFormulaChange("");
                  }}
                  className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Statistics */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Player Statistics</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "PPG", value: "PPG" },
                    { name: "APG", value: "APG" },
                    { name: "RPG", value: "RPG" },
                    { name: "SPG", value: "SPG" },
                    { name: "BPG", value: "BPG" },
                    { name: "TPG", value: "TPG" },
                    { name: "FG%", value: "FG%" },
                    { name: "3P%", value: "3P%" },
                    { name: "FT%", value: "FT%" },
                    { name: "+/-", value: "+/-" },
                    { name: "GP", value: "GP" },
                    { name: "MIN", value: "MIN" }
                  ].map((stat) => (
                    <button
                      key={stat.value}
                      onClick={() => {
                        const newFormula = formula + stat.value;
                        setFormula(newFormula);
                        handleFormulaChange(newFormula);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      {stat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operations */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Operations</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { symbol: "+", value: " + " },
                    { symbol: "-", value: " - " },
                    { symbol: "×", value: " * " },
                    { symbol: "÷", value: " / " },
                    { symbol: "(", value: "(" },
                    { symbol: ")", value: ")" }
                  ].map((op) => (
                    <button
                      key={op.symbol}
                      onClick={() => {
                        const newFormula = formula + op.value;
                        setFormula(newFormula);
                        handleFormulaChange(newFormula);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      {op.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numbers */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Numbers</h4>
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        const newFormula = formula + num;
                        setFormula(newFormula);
                        handleFormulaChange(newFormula);
                      }}
                      className="bg-slate-600 hover:bg-slate-500 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculator Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFormula("");
                  setCalculatedValue(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const newFormula = formula.slice(0, -1);
                  setFormula(newFormula);
                  handleFormulaChange(newFormula);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {showExamples && (
            <FormulaExamples onFormulaSelect={(selectedFormula) => {
              setFormula(selectedFormula);
              handleFormulaChange(selectedFormula);
              setShowExamples(false);
            }} />
          )}

          {/* Saved Stats Section */}
          {showSavedStats && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Saved Custom Stats</h3>
              {isLoadingStats ? (
                <div className="text-slate-400">Loading saved stats...</div>
              ) : savedStats.length === 0 ? (
                <div className="text-slate-400">No saved stats yet. Create and save a stat to see it here!</div>
              ) : (
                <div className="space-y-3">
                  {savedStats.map((stat: any) => (
                    <div
                      key={stat.id}
                      className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-slate-500 cursor-pointer transition-colors"
                      onClick={() => {
                        setFormula(stat.formula);
                        setCustomStatName(stat.name);
                        handleFormulaChange(stat.formula);
                        setShowSavedStats(false);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-medium">{stat.name}</h4>
                          <p className="text-slate-400 text-sm mt-1">{stat.formula}</p>
                        </div>
                        <div className="text-xs text-slate-500">
                          Click to load
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-3 font-medium">Available Player Stats:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(statMappings).map(([key, value]) => (
                <div key={key} className="bg-slate-600 rounded-lg p-3 text-center">
                  <div className="text-orange-300 font-bold text-sm">{key}</div>
                  <div className="text-white font-medium">
                    {key.includes('%') ? (value * 100).toFixed(1) + '%' : value.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Stat Chart */}
      {chartData.length > 0 && calculatedValue !== null && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-medium text-white">{customStatName} Over Time</h3>
            <span className="text-sm text-slate-400">({chartData.length} seasons)</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="season" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}`,
                    customStatName
                  ]}
                  labelFormatter={(label: string) => {
                    const point = chartData.find(d => d.season === label);
                    return `${label} (${point?.team || 'N/A'})`;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#F97316" 
                  strokeWidth={3}
                  dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Track how {customStatName.toLowerCase()} changed throughout {player.name}'s career across different teams and seasons.
          </div>
        </div>
      )}

      {/* Compact Player Stats */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-medium text-white">Season Statistics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Points</div>
            <div className="text-orange-400 font-bold">{currentPlayerData.points.toFixed(1)} PPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Assists</div>
            <div className="text-blue-400 font-bold">{currentPlayerData.assists.toFixed(1)} APG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Rebounds</div>
            <div className="text-green-400 font-bold">{currentPlayerData.rebounds.toFixed(1)} RPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Field Goal %</div>
            <div className="text-yellow-400 font-bold">{(currentPlayerData.fieldGoalPercentage * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Plus/Minus</div>
            <div className={`font-bold ${currentPlayerData.plusMinus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentPlayerData.plusMinus > 0 ? '+' : ''}{currentPlayerData.plusMinus.toFixed(1)}
            </div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Games</div>
            <div className="text-slate-300 font-bold">{currentPlayerData.gamesPlayed} GP</div>
          </div>
        </div>
      </div>
    </div>
  );
}