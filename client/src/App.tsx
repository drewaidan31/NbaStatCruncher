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

import { BarChart3, Search, Calculator, TrendingUp, Sparkles, RefreshCw, ChevronDown, Filter, User } from "lucide-react";
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

  // Fetch featured analysis data on component mount and when refreshCounter changes
  useEffect(() => {
    const generateFeaturedAnalysis = async () => {
      if (!isAuthenticated) return;
      
      try {
        // Fetch user's favorite players
        const favoritesResponse = await fetch('/api/favorites');
        const userFavorites = favoritesResponse.ok ? await favoritesResponse.json() : [];
        
        // Configuration for personalized graph generation
        const personalizedConfig = {
          userFavorites: userFavorites,
          refreshCounter: refreshCounter,
          fallbackPlayers: ['LeBron James', 'Stephen Curry', 'Kevin Durant', 'Giannis Antetokounmpo', 
                           'Luka Dončić', 'Jayson Tatum', 'Nikola Jokić', 'Joel Embiid']
        };
        
        const { selectedPlayer, selectedStat } = generatePersonalizedGraph(personalizedConfig);
        
        setHasFavorites(userFavorites.length > 0);
        
        // Generate career progression data using the personalized utility
        const chartDataPoints = generateCareerProgressionData(
          selectedPlayer,
          selectedStat.formula,
          selectedStat.name
        );
        
        setFeaturedPlayer(selectedPlayer);
        setFeaturedStat(selectedStat);
        setFeaturedChartData(chartDataPoints);
      } catch (error) {
        console.error('Error generating featured analysis:', error);
      }
    };

    generateFeaturedAnalysis();
  }, [refreshCounter, isAuthenticated]);

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
            </div>
            
            <div className="flex items-center gap-4">
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Featured Analysis Section - Only Career Progression with Authentic Data */}
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
              </div>
            </div>
          )}

          {/* Custom Stat Builder Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Stat Builder</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Simple Mode
                </Button>
              </div>
            </div>
          </div>

          {/* My Custom Stats Component */}
          <MyCustomStats />
        </div>
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