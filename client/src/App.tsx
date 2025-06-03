import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StatCalculator from "./components/stat-calculator";
import SaveStatDialog from "./components/save-stat-dialog";
import PlayerSearch from "./components/player-search";
import PlayerAnalysis from "./components/player-analysis";
import PlayerComparison from "./components/player-comparison";
import FormulaExamples from "./components/formula-examples";
import UsageRateLeaderboard from "./components/usage-rate-leaderboard";
import UserProfile from "./components/user-profile";
import ThemeToggle from "./components/theme-toggle";

import { BarChart3, Search, Calculator, TrendingUp, Sparkles, RefreshCw, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { evaluate } from "mathjs";

const queryClient = new QueryClient();

interface Player {
  playerId: number;
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  minutesPerGame?: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  fieldGoalAttempts?: number;
  threePointPercentage: number;
  threePointAttempts?: number;
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
    fieldGoalAttempts?: number;
    threePointPercentage: number;
    threePointAttempts?: number;
    freeThrowPercentage: number;
    plusMinus: number;
  }>;
  availableSeasons?: string[];
}

type ViewMode = 'leaderboard' | 'search' | 'analysis' | 'comparison' | 'usage-rate';

function MainApp() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formula, setFormula] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all-time");
  const [viewMode, setViewMode] = useState<ViewMode>('leaderboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerSeason, setSelectedPlayerSeason] = useState("");
  const [comparisonData, setComparisonData] = useState<{
    player1: Player;
    season1: string;
    player2: Player;
    season2: string;
  } | null>(null);
  const [savedStats, setSavedStats] = useState<Array<{
    id: number;
    name: string;
    description: string;
    formula: string;
    createdAt: string;
  }>>([]);
  const [customStatName, setCustomStatName] = useState("Total Impact");
  const [showSavedStats, setShowSavedStats] = useState(false);
  const [featuredPlayer, setFeaturedPlayer] = useState<Player | null>(null);
  const [featuredStat, setFeaturedStat] = useState<{name: string, formula: string, description: string} | null>(null);
  const [featuredChartData, setFeaturedChartData] = useState<Array<{season: string, value: number, team: string}>>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Preset custom stat equations for the showcase
  const presetStats = [
    { name: "True Shooting % (TS%)", formula: "PTS / (2 * (FGA + (0.44 * FTA)))", description: "Combines all forms of scoring into one metric - field goals, 3-pointers, and free throws" },
    { name: "Offensive Impact", formula: "PTS + AST * 1.5", description: "Points + weighted assists to measure offensive contribution" },
    { name: "Complete Player", formula: "PTS + AST + REB + STL + BLK", description: "Total production across all major statistical categories" },
    { name: "Efficiency Rating", formula: "(PTS + REB + AST) / TOV", description: "Production per turnover - higher is better" },
    { name: "Clutch Factor", formula: "PTS * FG_PCT + AST", description: "Scoring efficiency combined with playmaking" },
    { name: "Defensive Impact", formula: "REB + STL * 2 + BLK * 2", description: "Rebounds plus weighted steals and blocks" },
    { name: "Floor General", formula: "AST * 2 + PTS * 0.5", description: "Playmaking focus with scoring support" },
    { name: "Big Man Index", formula: "PTS + REB * 1.5 + BLK * 2", description: "Traditional big man stats with emphasis on rebounding and blocks" },
    { name: "Shooter's Touch", formula: "PTS * FG_PCT * THREE_PCT", description: "Scoring volume multiplied by shooting efficiency" },
    { name: "Hustle Metric", formula: "REB + STL + (GP / 82) * 10", description: "Effort stats plus games played consistency" },
    { name: "Versatility Score", formula: "PTS + AST + REB + (STL + BLK) * 1.5", description: "Well-rounded contribution with defensive bonus" },
    { name: "Point Guard Rating", formula: "AST * 2.5 + PTS - TOV", description: "Playmaking emphasis with turnover penalty" },
    { name: "Scoring Punch", formula: "PTS * (FG_PCT + THREE_PCT) / 2", description: "Points weighted by overall shooting efficiency" },
    { name: "Team Player", formula: "AST * 3 + REB + (PTS * 0.3)", description: "Pass-first mentality with rebounding help" },
    { name: "Two-Way Impact", formula: "(PTS + AST) + (STL + BLK) * 2", description: "Offensive production plus defensive disruption" },
    { name: "Consistency Factor", formula: "PTS + (GP / 82) * 5", description: "Scoring with games played reliability bonus" },
    { name: "Clutch Shooter", formula: "PTS * FT_PCT * THREE_PCT", description: "Scoring ability across different shot types" },
    { name: "Paint Presence", formula: "REB * 2 + BLK * 3 + PTS * 0.5", description: "Interior dominance measurement" },
    { name: "Pace Impact", formula: "PTS + AST + (MIN / 36) * 5", description: "Production adjusted for playing time" },
    { name: "Winning Formula", formula: "PTS + AST + REB - TOV + PLUS_MINUS / 10", description: "Complete stats with team success factor" },
    { name: "Star Power", formula: "PTS * 1.5 + AST + REB + (GP / 82) * 3", description: "Scoring emphasis with all-around contribution" }
  ];

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/nba/players?season=${selectedSeason}`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
          setError("");
          
          // Set up featured player showcase after players are loaded
          if (data.length > 0) {
            setupFeaturedShowcase(data);
          }
        } else {
          setError(`Failed to load NBA data: ${response.status}`);
        }
      } catch (err) {
        setError("Network error connecting to NBA data");
        console.error("Error fetching players:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [selectedSeason]);

  // Update featured showcase when refresh counter changes or on initial load
  useEffect(() => {
    if (players && players.length > 0) {
      setupFeaturedShowcase(players);
    }
  }, [refreshCounter, players]);

  // Also randomize on component mount to ensure different selection each visit
  useEffect(() => {
    if (players && players.length > 0) {
      setupFeaturedShowcase(players);
    }
  }, []);

  const calculateCustomStatForSeason = (seasonData: any, formula: string) => {
    const seasonStatMappings = {
      'PTS': seasonData.points,
      'AST': seasonData.assists,
      'REB': seasonData.rebounds,
      'STL': seasonData.steals,
      'BLK': seasonData.blocks,
      'TOV': seasonData.turnovers,
      'FG_PCT': seasonData.fieldGoalPercentage,
      'FGA': seasonData.fieldGoalAttempts || 0,
      'THREE_PCT': seasonData.threePointPercentage,
      '3PA': seasonData.threePointAttempts || 0,
      'FT_PCT': seasonData.freeThrowPercentage,
      'FTA': seasonData.freeThrowAttempts || 0,
      'GP': seasonData.gamesPlayed,
      'PLUS_MINUS': seasonData.plusMinus,
      'MIN': seasonData.minutesPerGame || 32.5
    };

    try {
      let expression = formula;
      
      // Handle PLUS_MINUS first since it has special characters
      if (expression.includes('PLUS_MINUS')) {
        expression = expression.replace(/PLUS_MINUS/g, seasonStatMappings['PLUS_MINUS'].toString());
      }
      
      // Replace stat abbreviations with actual values
      Object.entries(seasonStatMappings).forEach(([key, value]) => {
        if (key !== 'PLUS_MINUS') {
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

  const setupFeaturedShowcase = useCallback((playerData: any[]) => {
    // Filter players with multiple seasons
    const playersWithMultipleSeasons = playerData.filter(p => p.seasons && p.seasons.length >= 3);
    
    if (playersWithMultipleSeasons.length === 0) return;
    
    // Generate truly random selection each time the function is called
    // This ensures different players/stats on each website visit or refresh
    const playerIndex = Math.floor(Math.random() * playersWithMultipleSeasons.length);
    const statIndex = Math.floor(Math.random() * presetStats.length);
    
    const selectedPlayer = playersWithMultipleSeasons[playerIndex];
    const selectedStat = presetStats[statIndex];
    
    console.log('Refresh counter:', refreshCounter, 'Player Index:', playerIndex, 'Stat Index:', statIndex, 'Selected Stat:', selectedStat.name);
    
    // Calculate chart data for this player and stat
    const chartDataPoints = selectedPlayer.seasons
      .map((seasonData: any) => {
        const value = calculateCustomStatForSeason(seasonData, selectedStat.formula);
        return value !== null ? {
          season: seasonData.season,
          value: value,
          team: seasonData.team
        } : null;
      })
      .filter((point: any) => point !== null)
      .sort((a: any, b: any) => a.season.localeCompare(b.season));
    
    setFeaturedPlayer(selectedPlayer);
    setFeaturedStat(selectedStat);
    setFeaturedChartData(chartDataPoints);
  }, [refreshCounter]);

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    setLoading(true);
    setResults([]);
  };

  const calculateStats = async () => {
    console.log("Calculate button clicked, formula:", formula, "season:", selectedSeason);
    if (!formula.trim()) {
      console.log("No formula provided, returning");
      return;
    }
    
    try {
      console.log("Sending calculation request...");
      const response = await fetch("/api/nba/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula, season: selectedSeason })
      });
      
      console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Calculation results:", data.length, "players");
        setResults(data);
      } else {
        const errorText = await response.text();
        console.error("Calculation failed:", response.status, errorText);
        setError("Failed to calculate custom statistics");
      }
    } catch (err) {
      console.error("Error calculating stats:", err);
      setError("Error calculating statistics");
    }
  };

  const handleSaveStat = async () => {
    try {
      const response = await fetch('/api/custom-stats/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customStatName,
          formula: formula,
          description: `Custom stat: ${customStatName}`
        }),
        credentials: 'include',
      });
      
      if (response.ok) {
        alert('Stat saved successfully!');
        fetchSavedStats();
      } else {
        console.error('Failed to save stat:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving stat:', error);
    }
  };

  const fetchSavedStats = async () => {
    try {
      const response = await fetch('/api/custom-stats/my', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSavedStats(data);
      }
    } catch (error) {
      console.error('Error fetching saved stats:', error);
    }
  };

  const loadSavedStat = (stat: any) => {
    setFormula(stat.formula);
    setCustomStatName(stat.name);
    setShowSavedStats(false);
  };

  const handlePlayerSelect = (player: Player, season: string) => {
    setSelectedPlayer(player);
    setSelectedPlayerSeason(season);
    setViewMode('analysis');
  };

  const handleCompareSelect = (comparison: {
    player1: Player;
    season1: string;
    player2: Player;
    season2: string;
  }) => {
    setComparisonData(comparison);
    setViewMode('comparison');
  };

  const handleBackToSearch = () => {
    setViewMode('search');
  };

  const handleBackToLeaderboard = () => {
    setViewMode('leaderboard');
  };

  // Render different views based on view mode
  const renderCurrentView = () => {
    if (viewMode === 'analysis' && selectedPlayer) {
      return (
        <PlayerAnalysis
          player={selectedPlayer}
          season={selectedPlayerSeason}
          onBack={handleBackToSearch}
        />
      );
    }

    if (viewMode === 'comparison' && comparisonData) {
      return (
        <PlayerComparison
          comparison={comparisonData}
          onBack={handleBackToSearch}
          currentFormula={formula}
        />
      );
    }

    if (viewMode === 'search') {
      return (
        <PlayerSearch
          onPlayerSelect={handlePlayerSelect}
          onCompareSelect={handleCompareSelect}
          currentFormula={formula}
          customStatResults={results}
        />
      );
    }

    // Default leaderboard view
    return (
      <div className="space-y-6">
        {/* Featured Player Showcase */}
        {featuredPlayer && featuredStat && featuredChartData.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Analysis</h2>
              <span className="text-sm text-slate-600 dark:text-slate-400">• Changes daily</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Player Info and Stats */}
              <div className="space-y-4">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {featuredPlayer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <button
                        onClick={() => handlePlayerSelect(featuredPlayer, featuredPlayer.currentSeason || '2024-25')}
                        className="text-xl font-bold text-slate-900 dark:text-white hover:text-orange-400 transition-colors cursor-pointer text-left"
                      >
                        {featuredPlayer.name} →
                      </button>
                      <p className="text-slate-600 dark:text-slate-300">{featuredPlayer.position} • Career Spanning {featuredChartData.length} Seasons</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        setFormula(featuredStat.formula);
                        setCustomStatName(featuredStat.name);
                        
                        // Wait for state to update, then calculate
                        setTimeout(async () => {
                          try {
                            const response = await fetch("/api/nba/calculate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ formula: featuredStat.formula })
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              setResults(data);
                              
                              // Scroll to results section after calculation
                              setTimeout(() => {
                                const resultsElement = document.getElementById('leaderboard-results');
                                if (resultsElement) {
                                  resultsElement.scrollIntoView({ 
                                    behavior: 'smooth',
                                    block: 'start'
                                  });
                                }
                              }, 200);
                            } else {
                              setError("Failed to calculate custom statistics");
                            }
                          } catch (err) {
                            console.error("Error calculating stats:", err);
                            setError("Error calculating statistics");
                          }
                        }, 100);
                      }}
                      className="w-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 rounded-lg p-3 transition-colors cursor-pointer text-left"
                    >
                      <div className="text-orange-600 dark:text-orange-400 font-semibold mb-1">{featuredStat.name} →</div>
                      <div className="text-slate-700 dark:text-slate-300 text-sm">{featuredStat.description}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono">{featuredStat.formula}</div>
                      <div className="text-xs text-orange-500 dark:text-orange-300 mt-2">Click to see all-time leaders</div>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-300 dark:bg-slate-600 rounded p-3 text-center">
                        <div className="text-slate-600 dark:text-slate-400 text-xs">Current Value</div>
                        <div className="text-slate-900 dark:text-white font-bold">{
                          featuredChartData.length > 0 ? 
                          featuredChartData[featuredChartData.length - 1].value.toFixed(1) : 
                          'N/A'
                        }</div>
                      </div>
                      <div className="bg-slate-300 dark:bg-slate-600 rounded p-3 text-center">
                        <div className="text-slate-600 dark:text-slate-400 text-xs">Peak Value</div>
                        <div className="text-orange-600 dark:text-orange-400 font-bold">{
                          Math.max(...featuredChartData.map(d => d.value)).toFixed(1)
                        }</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chart */}
              <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Career Progression</h4>
                  </div>
                  <button
                    onClick={() => {
                      // Increment refresh counter to trigger new random selection
                      setRefreshCounter(prev => prev + 1);
                      setResults([]);
                      setError("");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 rounded-lg transition-colors text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={featuredChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis 
                        dataKey="season" 
                        stroke="var(--chart-text)"
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis stroke="var(--chart-text)" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: number) => [
                          `${value.toFixed(2)}`,
                          featuredStat.name
                        ]}
                        labelFormatter={(label: string) => {
                          const point = featuredChartData.find(d => d.season === label);
                          return `${label} (${point?.team || 'N/A'})`;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#F97316" 
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <g>
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={4} 
                                fill="#F97316" 
                                stroke="#1F2937" 
                                strokeWidth={2}
                              />
                              <text 
                                x={cx} 
                                y={cy - 8} 
                                textAnchor="middle" 
                                fontSize={8} 
                                fill="#9CA3AF"
                                fontWeight="bold"
                              >
                                {payload?.team}
                              </text>
                            </g>
                          );
                        }}
                        activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Hover over points to see detailed season data
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">NBA Custom Stats Calculator</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">Build your own basketball analytics formulas using real NBA player data. Create custom stats, compare players, and discover new insights.</p>

          <StatCalculator 
            onFormulaChange={setFormula}
            onCalculate={calculateStats}
            formula={formula}
          />

          {/* Save functionality for main menu */}
          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Custom Stat Name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customStatName}
                  onChange={(e) => setCustomStatName(e.target.value)}
                  placeholder="Enter stat name (e.g., Total Impact)"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={async () => {
                    if (!formula.trim()) return;
                    try {
                      const response = await fetch('/api/nba/generate-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ formula })
                      });
                      if (response.ok) {
                        const result = await response.json();
                        setCustomStatName(result.name);
                      }
                    } catch (error) {
                      console.error('Error generating name:', error);
                    }
                  }}
                  disabled={!formula.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Auto-Name
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={calculateStats}
                disabled={!formula.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Calculate
              </button>
              <button
                onClick={handleSaveStat}
                disabled={!formula.trim() || !customStatName.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Save Stat
              </button>
              <button
                onClick={() => setShowSavedStats(!showSavedStats)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Saved Stats
              </button>
              <button
                onClick={() => {
                  setFormula("");
                  setCustomStatName("Total Impact");
                }}
                className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Saved Stats Display */}
          {showSavedStats && (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mt-4">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Your Saved Stats</h4>
              <div className="space-y-2">
                {savedStats.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400">No saved stats yet</p>
                ) : (
                  savedStats.map((stat) => (
                    <button
                      key={stat.id}
                      onClick={() => loadSavedStat(stat)}
                      className="w-full text-left bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-50">{stat.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{stat.formula}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <FormulaExamples onFormulaSelect={setFormula} />

        {results.length > 0 && (
          <div id="leaderboard-results" className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {customStatName ? `${customStatName} Leaderboard` : "Custom Statistics Leaderboard"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Player</th>
                    <th className="text-left py-2">Team</th>
                    <th className="text-left py-2">{customStatName || "Custom Stat"}</th>
                    <th className="text-left py-2">Season</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result: any, index) => (
                    <tr key={`${result.player.id}-${result.bestSeason}-${index}`} className="border-b border-slate-700">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2 font-medium">
                        <button
                          onClick={() => handlePlayerSelect(result.player, result.bestSeason)}
                          className="text-white hover:text-orange-400 transition-colors cursor-pointer text-left underline decoration-slate-500 hover:decoration-orange-400"
                        >
                          {result.player.name}
                        </button>
                      </td>
                      <td className="py-2">{result.player.team}</td>
                      <td className="py-2">
                        {customStatName.includes("eFG%") || customStatName.includes("TS%") ? 
                          `${(result.customStat * 100).toFixed(1)}%` : 
                          result.customStat.toFixed(2)
                        }
                      </td>
                      <td className="py-2 text-orange-400 font-medium">{result.bestSeason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {savedStats.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Your Saved Custom Stats</h3>
            <div className="space-y-4">
              {savedStats.map((stat) => (
                <div key={stat.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-50">{stat.name}</h4>
                    <button
                      onClick={() => {
                        setFormula(stat.formula);
                        calculateStats();
                      }}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                    >
                      Use Formula
                    </button>
                  </div>
                  {stat.description && (
                    <p className="text-sm text-slate-400 mb-2">{stat.description}</p>
                  )}
                  <div className="text-xs text-slate-500 font-mono">{stat.formula}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              NBA Custom Stats Calculator
            </h1>
            <p className="text-xl text-slate-600">
              Create custom basketball statistics with authentic NBA player data
            </p>
          </div>
          <div className="ml-8 flex items-center gap-3">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 border border-slate-300 dark:border-slate-700">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'leaderboard'
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Leaderboards
              </button>
              <button
                onClick={() => setViewMode('search')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'search'
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                <Search className="w-4 h-4" />
                Player Search
              </button>
            </div>
          </div>
        </div>

        {/* Season Selector - Only show for leaderboard view */}
        {viewMode === 'leaderboard' && (
          <div className="flex justify-center mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-300 dark:border-slate-700">
              <label htmlFor="season-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select NBA Season:
              </label>
              <div className="relative">
                <select
                  id="season-select"
                  value={selectedSeason}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  style={{ colorScheme: 'light dark' }}
                >
                <option value="all-time">All-Time Leaders (1996-2025)</option>
                <option value="2024-25">2024-25 Season (Current)</option>
                <option value="2023-24">2023-24 Season</option>
                <option value="2022-23">2022-23 Season</option>
                <option value="2021-22">2021-22 Season</option>
                <option value="2020-21">2020-21 Season</option>
                <option value="2019-20">2019-20 Season</option>
                <option value="2018-19">2018-19 Season</option>
                <option value="2017-18">2017-18 Season</option>
                <option value="2016-17">2016-17 Season</option>
                <option value="2015-16">2015-16 Season</option>
                <option value="2014-15">2014-15 Season</option>
                <option value="2013-14">2013-14 Season</option>
                <option value="2012-13">2012-13 Season</option>
                <option value="2011-12">2011-12 Season</option>
                <option value="2010-11">2010-11 Season</option>
                <option value="2009-10">2009-10 Season</option>
                <option value="2008-09">2008-09 Season</option>
                <option value="2007-08">2007-08 Season</option>
                <option value="2006-07">2006-07 Season</option>
                <option value="2005-06">2005-06 Season</option>
                <option value="2004-05">2004-05 Season</option>
                <option value="2003-04">2003-04 Season</option>
                <option value="2002-03">2002-03 Season</option>
                <option value="2001-02">2001-02 Season</option>
                <option value="2000-01">2000-01 Season</option>
                <option value="1999-00">1999-00 Season</option>
                <option value="1998-99">1998-99 Season</option>
                <option value="1997-98">1997-98 Season</option>
                <option value="1996-97">1996-97 Season</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {loading && viewMode === 'leaderboard' ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading NBA player data...</div>
          </div>
        ) : viewMode === 'leaderboard' && players.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-lg text-slate-300">No NBA player data available</div>
          </div>
        ) : (
          renderCurrentView()
        )}
      </div>


    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}