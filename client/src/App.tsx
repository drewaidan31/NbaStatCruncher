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
import { generatePersonalizedGraph, generateCareerProgressionData } from "./utils/personalized-graphs";
import type { CustomStat, FavoritePlayer } from "@shared/schema";

import { BarChart3, Search, Calculator, TrendingUp, Sparkles, RefreshCw, ChevronDown, Filter, User, Home, Info, BookOpen, Activity, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  freeThrowAttempts?: number;
  currentSeason?: string;
  seasons?: unknown;
  availableSeasons?: string[] | null;
}

type ViewMode = 'leaderboard' | 'search' | 'analysis' | 'comparison' | 'usage-rate' | 'about' | 'stats-library' | 'profile' | 'scatter-plot' | 'guided-builder' | 'examples';

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
  const [showSavedStats, setShowSavedStats] = useState(false);
  const [savedStats, setSavedStats] = useState([]);
  const [customStatName, setCustomStatName] = useState("");

  // Featured analysis state
  const [featuredPlayer, setFeaturedPlayer] = useState<Player | null>(null);
  const [featuredStat, setFeaturedStat] = useState<{name: string, formula: string, description: string} | null>(null);
  const [featuredChartData, setFeaturedChartData] = useState<Array<{season: string, value: number, team: string}>>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [hasFavorites, setHasFavorites] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>("all");

  // User authentication state
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Check if user is authenticated
  const isAuthenticated = !userLoading && user && user.id;

  // Load initial data
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/players");
        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }
        const data = await response.json();
        setPlayers(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const setupFeaturedShowcase = useCallback(async (playerData: any[]) => {
    // Filter players with multiple seasons
    const playersWithMultipleSeasons = playerData.filter(p => p.seasons && p.seasons.length >= 3);
    
    if (playersWithMultipleSeasons.length === 0) return;
    
    // Fetch user's favorites and custom stats for personalized graphs
    let userFavorites: FavoritePlayer[] = [];
    let userCustomStats: CustomStat[] = [];
    
    try {
      const [favoritesResponse, customStatsResponse] = await Promise.all([
        fetch('/api/favorites'),
        fetch('/api/custom-stats/my')
      ]);
      
      console.log('Favorites response status:', favoritesResponse.status);
      
      if (favoritesResponse.ok) {
        userFavorites = await favoritesResponse.json();
        console.log('Fetched user favorites:', userFavorites.length, 'favorites');
      } else {
        console.log('Failed to fetch favorites:', favoritesResponse.status);
      }
      
      if (customStatsResponse.ok) {
        userCustomStats = await customStatsResponse.json();
        console.log('Fetched user custom stats:', userCustomStats.length, 'stats');
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
    
    console.log('Players with multiple seasons:', playersWithMultipleSeasons.length);
    console.log('Setting hasFavorites to:', userFavorites.length > 0);
    
    setHasFavorites(userFavorites.length > 0);
    
    if (userFavorites.length > 0) {
      // Use personalized graph generation
      const personalizedConfig = {
        favorites: userFavorites,
        userCustomStats: userCustomStats,
        allPlayers: playersWithMultipleSeasons,
        refreshCounter: refreshCounter
      };
      
      console.log('Generating personalized graph with config:', {
        favoritesCount: userFavorites.length,
        customStatsCount: userCustomStats.length,
        playersCount: playersWithMultipleSeasons.length
      });
      
      const { selectedPlayer, selectedStat } = generatePersonalizedGraph(personalizedConfig);
      
      console.log('Generated personalized graph:', {
        selectedPlayerName: selectedPlayer?.name,
        selectedStatName: selectedStat?.name
      });
      
      // Generate career progression data using the personalized utility
      const chartDataPoints = generateCareerProgressionData(
        selectedPlayer,
        selectedStat.formula,
        selectedStat.name
      );
      
      console.log('Generated chart data points:', chartDataPoints.length);
      
      setFeaturedPlayer(selectedPlayer);
      setFeaturedStat(selectedStat);
      setFeaturedChartData(chartDataPoints);
    } else {
      console.log('No favorites found, not setting up featured showcase');
    }
  }, [refreshCounter]);

  // Setup featured showcase when players load or refresh counter changes
  useEffect(() => {
    if (players.length > 0) {
      setupFeaturedShowcase(players);
    }
  }, [players, setupFeaturedShowcase]);

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
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formula,
          season: selectedSeason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate stats");
      }

      const data = await response.json();
      console.log("Calculation response:", data);
      setResults(data.results);
      setError("");
    } catch (err: any) {
      console.error("Calculation error:", err);
      setError(err.message);
      setResults([]);
    }
  };

  const saveCustomStat = async (statName: string, formula: string, description: string) => {
    try {
      const response = await fetch("/api/stats/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: statName,
          formula,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save stat");
      }

      // Refresh saved stats
      setSavedStats(prev => [...prev, { name: statName, formula, description }]);
    } catch (err: any) {
      setError(err.message);
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

  const handlePlayerComparison = (
    player1: Player,
    season1: string,
    player2: Player,
    season2: string
  ) => {
    setComparisonData({ player1, season1, player2, season2 });
    setViewMode('comparison');
  };

  const handleNavigation = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const renderContent = () => {
    if (viewMode === 'search' && selectedPlayer) {
      return (
        <PlayerAnalysis
          player={selectedPlayer}
          season={selectedPlayerSeason}
        />
      );
    }

    if (viewMode === 'comparison' && comparisonData) {
      return (
        <PlayerComparison
          player1={comparisonData.player1}
          season1={comparisonData.season1}
          player2={comparisonData.player2}
          season2={comparisonData.season2}
          formula={formula}
        />
      );
    }

    if (viewMode === 'analysis') {
      return <FormulaExamples />;
    }

    if (viewMode === 'about') {
      return <AboutSection />;
    }

    if (viewMode === 'search') {
      return (
        <PlayerSearch
          players={players}
          onPlayerSelect={handlePlayerSelect}
        />
      );
    }

    if (viewMode === 'usage-rate') {
      return (
        <UsageRateLeaderboard
          players={players}
          onPlayerSelect={handlePlayerSelect}
        />
      );
    }

    if (viewMode === 'stats-library') {
      return <StatsLibrary />;
    }

    if (viewMode === 'profile') {
      return <UserProfilePage />;
    }

    if (viewMode === 'scatter-plot') {
      return <ScatterPlotAnalyzer />;
    }

    if (viewMode === 'guided-builder') {
      return <GuidedStatBuilder />;
    }

    // Default leaderboard view
    return (
      <div className="space-y-6">
        {/* Featured Analysis Section */}
        {featuredPlayer && featuredStat && hasFavorites && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Featured Analysis</h3>
                  </div>
                  <ColorfulFavoriteButton 
                    player={{
                      ...featuredPlayer,
                      name: featuredPlayer.name,
                      team: featuredPlayer.team,
                      position: featuredPlayer.position
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {featuredPlayer.name}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {featuredPlayer.team} • {featuredPlayer.position}
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4">
                    <h5 className="font-medium text-slate-900 dark:text-white mb-2">{featuredStat.name}</h5>
                    <code className="text-sm bg-white dark:bg-slate-800 px-2 py-1 rounded">
                      {featuredStat.formula}
                    </code>
                    <button
                      onClick={() => {
                        setFormula(featuredStat.formula);
                        setCustomStatName(featuredStat.name);
                      }}
                      className="block mt-3 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                    >
                      Copy to Formula Builder →
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {featuredStat.description}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Career Progression
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setRefreshCounter(prev => prev + 1);
                      setResults([]);
                      setError("");
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/70 transition-colors"
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
                        height={60}
                      />
                      <YAxis 
                        stroke="var(--chart-text)"
                        fontSize={10}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                                <p className="font-medium text-slate-900 dark:text-white">{label} Season</p>
                                <p className="text-orange-600 dark:text-orange-400">
                                  {featuredStat?.name}: {payload[0].value?.toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Team: {payload[0].payload?.team}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#F97316" 
                        strokeWidth={3}
                        dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                        connectNulls={false}
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
        
        {/* Non-authenticated fallback */}
        {(!hasFavorites || !isAuthenticated) && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <User className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Get Personalized Analytics</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Create an account and add favorite players to see personalized featured analysis with career progression charts and custom statistics for the players you follow most.
              </p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  onClick={() => setViewMode('profile')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('search')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Explore Players
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Stat Builder Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/3 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-blue-500" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Stat Builder</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('guided-builder')}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Simple Mode
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('analysis')}
                    className="flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Formula Guide
                  </Button>
                </div>
              </div>

              <StatCalculator 
                onSeasonChange={handleSeasonChange}
                onCalculate={calculateStats}
                formula={formula}
                setFormula={setFormula}
                results={results}
                error={error}
                loading={loading}
                selectedSeason={selectedSeason}
                players={players}
                customStatName={customStatName}
                setCustomStatName={setCustomStatName}
                onSaveCustomStat={saveCustomStat}
              />

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSavedStats(!showSavedStats)}
                  className="text-slate-600 dark:text-slate-300"
                >
                  {showSavedStats ? 'Hide' : 'Show'} Saved Stats
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormula("");
                    setCustomStatName("");
                  }}
                  className="text-slate-600 dark:text-slate-300"
                >
                  Clear Formula
                </Button>
              </div>

              {showSavedStats && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Saved Custom Stats</h3>
                  {savedStats.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400">No saved stats yet.</p>
                  ) : (
                    <div className="grid gap-2">
                      {savedStats.map((stat: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          onClick={() => loadSavedStat(stat)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900 dark:text-white">{stat.name}</h4>
                              <code className="text-sm text-slate-600 dark:text-slate-400">{stat.formula}</code>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormula(stat.formula);
                                setCustomStatName(stat.name);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Load
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:w-1/3">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {customStatName ? `${customStatName} Results` : "Results"}
                  </h3>
                  {results.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                      >
                        <option value="all">All Positions</option>
                        <option value="PG">Point Guard</option>
                        <option value="SG">Shooting Guard</option>
                        <option value="SF">Small Forward</option>
                        <option value="PF">Power Forward</option>
                        <option value="C">Center</option>
                      </select>
                    </div>
                  )}
                </div>
                
                {results.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results
                      .filter((player: any) => selectedPosition === 'all' || player.position === selectedPosition)
                      .slice(0, 50)
                      .map((player: any, index: number) => {
                        const rank = selectedPosition === 'all' 
                          ? index + 1 
                          : results
                              .filter((p: any) => selectedPosition === 'all' || p.position === selectedPosition)
                              .indexOf(player) + 1;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                {rank}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">{player.name}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">{player.team} • {player.position}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900 dark:text-white">{player.customStat.toFixed(2)}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {customStatName ? customStatName : "Custom"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My Custom Stats Component */}
        <MyCustomStats />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">NBA Analytics</h1>
              </div>
              
              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={viewMode === 'leaderboard' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('leaderboard')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                <Button
                  variant={viewMode === 'search' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('search')}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Player Search
                </Button>
                <Button
                  variant={viewMode === 'scatter-plot' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('scatter-plot')}
                  className="flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Analysis
                </Button>
                <Button
                  variant={viewMode === 'guided-builder' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('guided-builder')}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Stat Builder
                </Button>
                <Button
                  variant={viewMode === 'stats-library' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('stats-library')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Library
                </Button>
                <Button
                  variant={viewMode === 'about' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('about')}
                  className="flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  About
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
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