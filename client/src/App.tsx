import { useState, useEffect, useCallback } from "react";

// Force dark mode on app load
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import StatCalculator from "./components/stat-calculator";
import SaveStatDialog from "./components/save-stat-dialog";
import PlayerSearch from "./components/player-search";
import PlayerAnalysis from "./components/player-analysis";
import PlayerComparison from "./components/player-comparison";
import FormulaExamples from "./components/formula-examples";
import UsageRateLeaderboard from "./components/usage-rate-leaderboard";
import TeamStats from "./components/team-stats";
import AboutSection from "./components/about-section";
import StatsLibrary from "./pages/StatsLibrary";
import UserProfilePage from "./pages/UserProfile";
import ScatterPlotAnalyzer from "./components/scatter-plot-analyzer";
import GuidedStatBuilder from "./components/guided-stat-builder";
import { ColorfulFavoriteButton } from "./components/colorful-favorites";
import { UserProfileDropdown } from "./components/user-profile-dropdown";
import { MyCustomStats } from "./components/my-custom-stats";
import AuthPage from "./pages/auth-page";
import { generatePersonalizedGraph, generateCareerProgressionData } from "./utils/personalized-graphs";
import Header from "./components/header";
// Define needed types locally
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
  freeThrowAttempts?: number;
  plusMinus: number;
  currentSeason?: string | null;
  seasons?: unknown;
  availableSeasons?: string[] | null;
}

interface CustomStat {
  id: number;
  name: string;
  formula: string;
  description: string | null;
  userId: string | null;
  isPublic: number | null;
  createdAt: Date | null;
}

interface FavoritePlayer {
  id: number;
  userId: string;
  playerId: number;
  playerName: string;
  createdAt: Date | null;
}

import { BarChart3, Search, Calculator, TrendingUp, Sparkles, RefreshCw, ChevronDown, Filter, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { evaluate } from "mathjs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});

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
  currentSeason?: string | null;
  seasons?: unknown;
  availableSeasons?: string[] | null;
}

type ViewMode = 'leaderboard' | 'search' | 'analysis' | 'comparison' | 'usage-rate' | 'about' | 'stats-library' | 'profile' | 'scatter-plot' | 'guided-builder';

function MainApp({ user, onLogout }: { user?: any; onLogout?: () => void }) {
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
  const [selectedPosition, setSelectedPosition] = useState<string>("all");



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

  const setupFeaturedShowcase = useCallback(async (playerData: any[]) => {
    // Filter players with multiple seasons
    const playersWithMultipleSeasons = playerData.filter(p => p.seasons && p.seasons.length >= 3);
    
    if (playersWithMultipleSeasons.length === 0) return;
    
    // Fetch user's favorites and custom stats for personalized graphs
    let userFavorites: FavoritePlayer[] = [];
    let userCustomStats: CustomStat[] = [];
    
    try {
      const [favoritesResponse, customStatsResponse] = await Promise.all([
        fetch('/api/favorite-players'),
        fetch('/api/custom-stats/my')
      ]);
      
      if (favoritesResponse.ok) {
        userFavorites = await favoritesResponse.json();
      }
      
      if (customStatsResponse.ok) {
        userCustomStats = await customStatsResponse.json();
      }
    } catch (error) {
      console.log('Using default showcase (not logged in or error fetching user data)');
    }
    
    // Use personalized graph generation
    const personalizedConfig = {
      favorites: userFavorites,
      userCustomStats: userCustomStats,
      allPlayers: playersWithMultipleSeasons,
      refreshCounter: refreshCounter
    };
    
    const { selectedPlayer, selectedStat } = generatePersonalizedGraph(personalizedConfig);
    
    // Generate career progression data using the personalized utility
    const chartDataPoints = generateCareerProgressionData(
      selectedPlayer,
      selectedStat.formula,
      selectedStat.name
    );
    
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
    
    // Clear any previous errors when starting a new calculation
    setError("");
    
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
        // Clear error on successful calculation
        setError("");
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
      } else if (response.status === 409) {
        alert('A stat with this name and formula already exists. Please use a different name or modify the formula.');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        alert(`Failed to save stat: ${errorData.message || response.statusText}`);
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

  const insertSavedStat = (stat: any) => {
    // Insert the saved stat formula into the current formula
    const insertion = `(${stat.formula})`;
    console.log('Inserting saved stat:', stat.name, 'formula:', stat.formula);
    console.log('Current formula before insert:', formula);
    setFormula(prev => {
      const newFormula = prev + insertion;
      console.log('New formula after insert:', newFormula);
      return newFormula;
    });
    setShowSavedStats(false);
  };

  const handleDeleteStat = async (statId: number) => {
    if (!confirm('Are you sure you want to delete this custom stat?')) {
      return;
    }

    try {
      const response = await fetch(`/api/custom-stats/${statId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchSavedStats(); // Refresh the list
      } else {
        alert('Failed to delete stat');
      }
    } catch (error) {
      console.error('Error deleting stat:', error);
      alert('Failed to delete stat');
    }
  };

  const handleEditStat = (stat: any) => {
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
          player={selectedPlayer as any}
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

    if (viewMode === 'about') {
      return <AboutSection />;
    }

    if (viewMode === 'stats-library') {
      return <StatsLibrary />;
    }

    if (viewMode === 'profile') {
      return (
        <UserProfilePage 
          players={players}
          onBack={() => setViewMode('leaderboard')}
        />
      );
    }

    if (viewMode === 'scatter-plot') {
      return (
        <ScatterPlotAnalyzer 
          players={players}
          onBack={() => setViewMode('leaderboard')}
        />
      );
    }

    if (viewMode === 'guided-builder') {
      return (
        <GuidedStatBuilder 
          onBack={() => setViewMode('leaderboard')}
          onStatCreated={() => {
            // Refresh the page to show the new stat
            window.location.reload();
          }}
        />
      );
    }

    // Default leaderboard view
    return (
      <div className="space-y-6">
        {/* Featured Player Showcase */}
        {featuredPlayer && featuredStat && featuredChartData.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-6 transition-all duration-500 ease-in-out hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.02] hover:border-orange-400 group">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Analysis</h2>
              <span className="text-sm text-slate-600 dark:text-slate-400">• Changes daily</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Player Info and Stats */}
              <div className="space-y-4">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-5 transition-all duration-300 ease-in-out group-hover:bg-slate-300 dark:group-hover:bg-slate-600 group-hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ease-in-out group-hover:scale-125 group-hover:bg-orange-500 group-hover:shadow-lg group-hover:rotate-12">
                      {featuredPlayer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => handlePlayerSelect(featuredPlayer, featuredPlayer.currentSeason || '2024-25')}
                        className="text-xl font-bold text-slate-900 dark:text-white hover:text-orange-400 transition-all duration-300 ease-in-out cursor-pointer text-left group-hover:transform group-hover:translate-x-2 group-hover:scale-105"
                      >
                        {featuredPlayer.name} →
                      </button>
                      <p className="text-slate-600 dark:text-slate-300 transition-all duration-300 ease-in-out group-hover:text-slate-700 dark:group-hover:text-slate-200">{featuredPlayer.position} • Career Spanning {featuredChartData.length} Seasons</p>
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
                        key="featured-player-line"
                        type="monotone" 
                        dataKey="value" 
                        stroke="#F97316" 
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload, index } = props;
                          return (
                            <g key={`dot-${index}`}>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">NBA Custom Stats Calculator</h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">Build your own basketball analytics formulas using real NBA player data. Create custom stats, compare players, and discover new insights.</p>
            </div>
            <Button
              onClick={() => setViewMode('guided-builder')}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Simple Mode
            </Button>
          </div>

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
                onClick={() => {
                  setShowSavedStats(!showSavedStats);
                  if (!showSavedStats) {
                    fetchSavedStats();
                  }
                }}
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
              <button
                onClick={() => {
                  setFormula(prev => prev.slice(0, -1));
                }}
                disabled={!formula}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Saved Stats Display */}
          {showSavedStats && (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mt-4">
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Your Saved Stats</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedStats.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400">No saved stats yet. Save your first custom stat above!</p>
                ) : (
                  savedStats.map((stat) => (
                    <div
                      key={stat.id}
                      className="p-3 bg-white dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => insertSavedStat(stat)}>
                          <div className="font-medium text-slate-900 dark:text-slate-50">{stat.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">{stat.formula}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click to insert into formula</div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button
                            onClick={() => handleEditStat(stat)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStat(stat.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* My Custom Stats Section */}
        <MyCustomStats onStatSelect={(formula, name) => {
          console.log('Inserting saved custom stat:', name, 'formula:', formula);
          console.log('Current formula before insert:', formula);
          const insertion = `(${formula})`;
          setFormula(prev => {
            const newFormula = prev + insertion;
            console.log('New formula after insert:', newFormula);
            return newFormula;
          });
        }} />

        <FormulaExamples onFormulaSelect={(selectedFormula) => {
          console.log('Inserting preset formula:', selectedFormula);
          console.log('Current formula before insert:', formula);
          const insertion = `(${selectedFormula})`;
          setFormula(prev => {
            const newFormula = prev + insertion;
            console.log('New formula after insert:', newFormula);
            return newFormula;
          });
        }} />

        {results.length > 0 && (
          <div id="leaderboard-results" className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {customStatName ? `${customStatName} Leaderboard` : "Custom Statistics Leaderboard"}
              </h3>
              
              {/* Position Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="relative">
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 pr-8 text-sm appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <option value="all">All Positions</option>
                    <option value="PG">Point Guards</option>
                    <option value="SG">Shooting Guards</option>
                    <option value="SF">Small Forwards</option>
                    <option value="PF">Power Forwards</option>
                    <option value="C">Centers</option>
                    <option value="G">Guards</option>
                    <option value="F">Forwards</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2">Rank</th>
                    <th className="text-left py-2">Player</th>
                    <th className="text-left py-2">Position</th>
                    <th className="text-left py-2">Team</th>
                    <th className="text-left py-2">{customStatName || "Custom Stat"}</th>
                    <th className="text-left py-2">Season</th>
                  </tr>
                </thead>
                <tbody>
                  {results.filter((result: any) => {
                    if (selectedPosition === "all") return true;
                    
                    const playerName = result.player.name.toLowerCase();
                    const playerPosition = result.player.position;
                    
                    // Since the data doesn't have detailed positions, we'll use player name patterns
                    // to determine likely positions for filtering demonstration
                    let estimatedPosition = "G"; // Default
                    
                    // Point Guards - typically known playmakers
                    const pointGuards = ["chris paul", "stephen curry", "russell westbrook", "damian lillard", 
                                       "kyrie irving", "ja morant", "trae young", "luka dončić", "de'aaron fox",
                                       "tyrese haliburton", "fred vanvleet", "mike conley", "kyle lowry", "terry rozier"];
                    
                    // Centers - typically known big men
                    const centers = ["joel embiid", "nikola jokić", "anthony davis", "karl-anthony towns",
                                   "rudy gobert", "bam adebayo", "jusuf nurkić", "clint capela", "nikola vučević",
                                   "hassan whiteside", "dwight howard", "andre drummond", "deandre jordan"];
                    
                    if (pointGuards.some(pg => playerName.includes(pg))) estimatedPosition = "PG";
                    else if (centers.some(c => playerName.includes(c))) estimatedPosition = "C";
                    else if (playerName.includes("lebron") || playerName.includes("durant") || 
                             playerName.includes("kawhi") || playerName.includes("paul george")) estimatedPosition = "SF";
                    else if (playerName.includes("giannis") || playerName.includes("davis") || 
                             playerName.includes("siakam") || playerName.includes("randle")) estimatedPosition = "PF";
                    else estimatedPosition = "SG"; // Default for other guards
                    
                    // Handle specific position matches
                    if (selectedPosition === estimatedPosition) return true;
                    
                    // Handle grouped positions
                    if (selectedPosition === "G" && (estimatedPosition === "PG" || estimatedPosition === "SG")) return true;
                    if (selectedPosition === "F" && (estimatedPosition === "SF" || estimatedPosition === "PF")) return true;
                    
                    return false;
                  }).map((result: any, index) => (
                    <tr 
                      key={`${result.player.id}-${result.bestSeason}-${index}`} 
                      onClick={() => handlePlayerSelect(result.player, result.bestSeason)}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20 group cursor-pointer"
                    >
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2 font-medium">
                        <span className="text-white group-hover:text-orange-400 transition-all duration-300 ease-in-out underline decoration-slate-500 group-hover:decoration-orange-400 group-hover:transform group-hover:translate-x-2 font-medium group-hover:font-bold">
                          {result.player.name}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="bg-slate-700 text-orange-400 px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">
                          {(() => {
                            const playerName = result.player.name.toLowerCase();
                            const pointGuards = ["chris paul", "stephen curry", "russell westbrook", "damian lillard", 
                                               "kyrie irving", "ja morant", "trae young", "luka dončić", "de'aaron fox",
                                               "tyrese haliburton", "fred vanvleet", "mike conley", "kyle lowry", "terry rozier"];
                            const centers = ["joel embiid", "nikola jokić", "anthony davis", "karl-anthony towns",
                                           "rudy gobert", "bam adebayo", "jusuf nurkić", "clint capela", "nikola vučević",
                                           "hassan whiteside", "dwight howard", "andre drummond", "deandre jordan"];
                            
                            if (pointGuards.some(pg => playerName.includes(pg))) return "PG";
                            else if (centers.some(c => playerName.includes(c))) return "C";
                            else if (playerName.includes("lebron") || playerName.includes("durant") || 
                                     playerName.includes("kawhi") || playerName.includes("paul george")) return "SF";
                            else if (playerName.includes("giannis") || playerName.includes("davis") || 
                                     playerName.includes("siakam") || playerName.includes("randle")) return "PF";
                            else return "SG";
                          })()}
                        </span>
                      </td>
                      <td className="py-2 transition-all duration-300 ease-in-out group-hover:text-blue-400 group-hover:font-semibold">{result.player.team}</td>
                      <td className="py-2 transition-all duration-300 ease-in-out group-hover:text-green-400 group-hover:font-bold group-hover:scale-110">
                        {result.customStat !== null && result.customStat !== undefined ? (
                          customStatName.includes("eFG%") || customStatName.includes("TS%") ? 
                            `${(result.customStat * 100).toFixed(1)}%` : 
                            result.customStat.toFixed(2)
                        ) : 'N/A'}
                      </td>
                      <td className="py-2 text-orange-400 font-medium transition-all duration-300 ease-in-out group-hover:text-yellow-400 group-hover:font-bold">{result.bestSeason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              NBA Custom Stats Calculator
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Create custom basketball statistics with authentic NBA player data
            </p>
          </div>
          <div className="ml-8 flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setViewMode('profile')}
              className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                D
              </div>
              <span className="hidden md:block text-slate-700 dark:text-slate-300">
                Profile
              </span>
            </Button>
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
              <button
                onClick={() => setViewMode('stats-library')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'stats-library'
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                <Calculator className="w-4 h-4" />
                Stats Library
              </button>

              <button
                onClick={() => setViewMode('scatter-plot')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'scatter-plot'
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Scatter Plot
              </button>

              <button
                onClick={() => setViewMode('about')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'about'
                    ? "bg-orange-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                <Calculator className="w-4 h-4" />
                Custom Stats Guide
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

function AppWithAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.log("No active session");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthPage(false);
    // Refresh user data
    fetch("/api/auth/user")
      .then(res => res.json())
      .then(userData => setUser(userData))
      .catch(err => console.error("Failed to refresh user data:", err));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-white">Loading Box+...</div>
        </div>
      </div>
    );
  }

  if (!user && showAuthPage) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">🏀</div>
                  <h1 className="text-xl font-bold text-slate-50">Box+</h1>
                </div>
                <span className="text-sm text-slate-400 hidden sm:block">2024-25 Season Analytics</span>
              </div>
              <Button
                onClick={() => setShowAuthPage(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Sign In
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Box+</h1>
            <p className="text-xl text-slate-300 mb-8">Advanced NBA Analytics Platform</p>
            <p className="text-slate-400 mb-8">Sign in to access custom statistics, save favorite players, and unlock advanced analytics.</p>
            <Button 
              onClick={() => setShowAuthPage(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <MainApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithAuth />
    </QueryClientProvider>
  );
}