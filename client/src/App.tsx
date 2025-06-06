import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Calculator, Search, TrendingUp, User, Info, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayerSearch from "@/components/player-search";
import PlayerAnalysis from "@/components/player-analysis";
import PlayerComparison from "@/components/player-comparison";
import ScatterPlotAnalyzer from "@/components/scatter-plot-analyzer";
import GuidedStatBuilder from "@/components/guided-stat-builder";
import UsageRateLeaderboard from "@/components/usage-rate-leaderboard";
import FormulaExamples from "@/components/formula-examples";
import StatsLibrary from "@/pages/StatsLibrary";
import AboutSection from "@/components/about-section";
import UserProfilePage from "@/pages/UserProfile";
import { UserProfileDropdown } from "@/components/user-profile-dropdown";
import { MyCustomStats } from "@/components/my-custom-stats";
import StatCalculator from "@/components/stat-calculator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generatePersonalizedGraph } from "@/utils/personalized-graphs";
import type { Player, FavoritePlayer, CustomStat } from "@shared/schema";

type ViewMode = 'home' | 'search' | 'analysis' | 'comparison' | 'usage-rate' | 'examples' | 'stats-library' | 'about' | 'profile' | 'scatter-plot' | 'guided-builder' | 'saved-stats';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerSeason, setSelectedPlayerSeason] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<{
    player1: Player;
    season1: string;
    player2: Player;
    season2: string;
  } | null>(null);

  // Navigation handler
  const handleNavigation = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Authentication state
  const { isAuthenticated } = useAuth();

  // Featured showcase state
  const [featuredPlayer, setFeaturedPlayer] = useState<Player | null>(null);
  const [featuredStat, setFeaturedStat] = useState<{name: string, formula: string, description: string} | null>(null);
  const [featuredChartData, setFeaturedChartData] = useState<Array<{season: string, value: number, team: string}>>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch players data
  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Setup featured showcase
  useEffect(() => {
    const setupFeaturedShowcase = async (players: Player[]) => {
      console.log('setupFeaturedShowcase called with', players.length, 'players');
      
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping featured showcase');
        return;
      }

      try {
        // Fetch user's favorites
        const favoritesResponse = await fetch('/api/favorite-players', {
          credentials: 'include'
        });
        
        if (!favoritesResponse.ok) {
          console.log('Failed to fetch favorites');
          return;
        }

        const favorites: FavoritePlayer[] = await favoritesResponse.json();
        console.log('Fetched user favorites:', favorites.length, 'favorites');

        if (favorites.length === 0) {
          console.log('No favorites found, not setting up featured showcase');
          return;
        }

        // Get a random favorite player
        const randomFavorite = favorites[Math.floor(Math.random() * favorites.length)];
        const selectedPlayer = players.find(p => p.playerId === randomFavorite.playerId);

        if (!selectedPlayer) {
          console.log('Selected player not found in players data');
          return;
        }

        // Generate featured stat and chart data
        const personalizedData = generatePersonalizedGraph({
          favoritesCount: favorites.length,
          customStatsCount: 3,
          playersCount: players.length
        });

        const selectedStat = {
          name: personalizedData.selectedStat.name,
          formula: personalizedData.selectedStat.formula,
          description: personalizedData.selectedStat.description
        };

        const chartDataPoints = selectedPlayer.seasons ? 
          (selectedPlayer.seasons as any[]).slice(0, 10).map((season: any) => ({
            season: season.season,
            value: season.points + season.assists + season.rebounds,
            team: season.team
          })) : [];

        console.log('Generated chart data points:', chartDataPoints.length);

        setFeaturedPlayer(selectedPlayer);
        setFeaturedStat(selectedStat);
        setFeaturedChartData(chartDataPoints);
      } catch (error) {
        console.error('Error setting up featured showcase:', error);
      }
    };

    if (players.length > 0) {
      setupFeaturedShowcase(players);
    }
  }, [players, isAuthenticated, refreshCounter]);

  const handlePlayerSelect = (player: any, season: string) => {
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

  const renderContent = () => {
    if (viewMode === 'analysis' && selectedPlayer) {
      return (
        <PlayerAnalysis
          player={selectedPlayer}
          season={selectedPlayerSeason}
          onBack={() => setViewMode('search')}
        />
      );
    }

    if (viewMode === 'comparison' && comparisonData) {
      return (
        <PlayerComparison
          comparison={comparisonData}
          onBack={() => setViewMode('search')}
        />
      );
    }

    if (viewMode === 'about') {
      return <AboutSection />;
    }

    if (viewMode === 'search') {
      return (
        <PlayerSearch
          onPlayerSelect={handlePlayerSelect}
          onCompareSelect={(comparisonData: any) => {
            setComparisonData(comparisonData);
            setViewMode('comparison');
          }}
        />
      );
    }

    if (viewMode === 'usage-rate') {
      return (
        <UsageRateLeaderboard
          onPlayerSelect={handlePlayerSelect}
        />
      );
    }

    if (viewMode === 'stats-library') {
      return <StatsLibrary />;
    }

    if (viewMode === 'examples') {
      return <FormulaExamples onFormulaSelect={() => {}} />;
    }

    if (viewMode === 'profile') {
      return <UserProfilePage players={players} onBack={() => setViewMode('home')} />;
    }

    if (viewMode === 'scatter-plot') {
      return <ScatterPlotAnalyzer players={players} onBack={() => setViewMode('home')} />;
    }

    if (viewMode === 'guided-builder') {
      return <GuidedStatBuilder onBack={() => setViewMode('home')} />;
    }

    if (viewMode === 'saved-stats') {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Saved Custom Stats</h1>
            <Button onClick={() => setViewMode('home')} variant="outline">
              Back to Home
            </Button>
          </div>
          <MyCustomStats onStatSelect={(formula, name) => {
            // This will be handled by the StatCalculator component
            setViewMode('home');
          }} />
        </div>
      );
    }

    // Default home view
    return (
      <div className="space-y-6">
        {/* Season Selector */}
        <div className="flex justify-center">
          <div className="bg-slate-800 rounded-lg p-1">
            <select className="bg-slate-700 text-white px-4 py-2 rounded border-none outline-none">
              <option>All-Time Leaders (1996-2025)</option>
              <option>2024-25 Season</option>
              <option>2023-24 Season</option>
            </select>
          </div>
        </div>

        {/* Featured Analysis Section */}
        {featuredPlayer && featuredStat && featuredChartData.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-orange-900 dark:text-orange-200">Featured Analysis</h2>
              <span className="text-sm text-orange-700 dark:text-orange-300">• Changes daily</span>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Player Info */}
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-800/30 dark:to-amber-800/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {featuredPlayer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-900 dark:text-orange-200 text-lg">{featuredPlayer.name} ➜</h3>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">{featuredPlayer.team} • Career Spanning {(featuredPlayer.seasons as any[] || []).length} Seasons</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-orange-900 dark:text-orange-200 font-medium">{featuredStat.name} ➜</div>
                  <div className="text-orange-700 dark:text-orange-300 text-sm">{featuredStat.description}</div>
                  <div className="text-orange-600 dark:text-orange-400 text-sm font-mono">
                    {featuredStat.formula}
                  </div>
                  <div className="text-orange-700 dark:text-orange-300 text-sm">
                    Click to see all-time leaders
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-900 dark:text-orange-200">
                        {featuredChartData.length > 0 ? Number(featuredChartData[featuredChartData.length - 1]?.value || 0).toFixed(1) : '0.0'}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Current Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-900 dark:text-orange-200">
                        {Math.max(...featuredChartData.map(d => d.value || 0)).toFixed(1)}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Peak Value</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">📈 Career Progression</h4>
                  <Button 
                    onClick={() => setRefreshCounter(prev => prev + 1)} 
                    variant="outline" 
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    🔄 Refresh
                  </Button>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={featuredChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any, name: string) => [
                          typeof value === 'number' ? Number(value).toFixed(2) : value,
                          featuredStat?.name || name
                        ]}
                        labelFormatter={(label) => `Season: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#ea580c" 
                        strokeWidth={3}
                        dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#ea580c', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Hover over points to see detailed season data
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Stats Calculator */}
        <StatCalculator 
          onFormulaChange={() => {}}
          onCalculate={() => {}}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-xl font-bold text-orange-400">NBA Custom Stats Calculator</h1>
                <p className="text-sm text-slate-400">Create custom basketball statistics with authentic NBA player data</p>
              </div>
              
              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant={viewMode === 'home' ? 'default' : 'ghost'}
                  onClick={() => handleNavigation('home')}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <BarChart3 className="w-4 h-4" />
                  Leaderboards
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('search')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Search className="w-4 h-4" />
                  Player Search
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('stats-library')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Calculator className="w-4 h-4" />
                  Stats Library
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('scatter-plot')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <TrendingUp className="w-4 h-4" />
                  Scatter Plot
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('guided-builder')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Calculator className="w-4 h-4" />
                  Custom Stats Guide
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('profile')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Button>
              )}
              <UserProfileDropdown players={players} />
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

export default App;