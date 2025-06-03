import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StatCalculator from "./components/stat-calculator";
import LeaderboardTable from "./components/leaderboard-table";
import { BarChart3, Search, Sparkles, RefreshCw, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { evaluate } from "mathjs";

const queryClient = new QueryClient();

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

function MainApp() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("2024-25");
  const [formula, setFormula] = useState("");
  const [featuredPlayer, setFeaturedPlayer] = useState<Player | null>(null);
  const [featuredStat, setFeaturedStat] = useState<{name: string, formula: string, description: string} | null>(null);
  const [featuredChartData, setFeaturedChartData] = useState<Array<{season: string, value: number, team: string}>>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Preset custom stat equations
  const presetStats = [
    { name: "Offensive Impact", formula: "PTS + AST * 1.5", description: "Points + weighted assists to measure offensive contribution" },
    { name: "Complete Player", formula: "PTS + AST + REB + STL + BLK", description: "Total production across all major statistical categories" },
    { name: "Efficiency Rating", formula: "(PTS + REB + AST) / TOV", description: "Production per turnover - higher is better" },
    { name: "Clutch Factor", formula: "PTS * FG_PCT + AST", description: "Scoring efficiency combined with playmaking" },
    { name: "Defensive Impact", formula: "REB + STL * 2 + BLK * 2", description: "Rebounds plus weighted steals and blocks" },
    { name: "Floor General", formula: "AST * 2 + PTS * 0.5", description: "Playmaking focus with scoring support" },
    { name: "Big Man Index", formula: "PTS + REB * 1.5 + BLK * 2", description: "Traditional big man stats with emphasis on rebounding and blocks" },
    { name: "Shooter's Touch", formula: "PTS * FG_PCT * THREE_PCT", description: "Scoring volume multiplied by shooting efficiency" },
    { name: "Hustle Metric", formula: "REB + STL + (GP / 82) * 10", description: "Effort stats plus games played consistency" },
    { name: "Versatility Score", formula: "PTS + AST + REB + (STL + BLK) * 1.5", description: "Well-rounded contribution with defensive bonus" }
  ];

  // Season options from 1996-97 to 2024-25
  const seasonOptions = [
    "2024-25", "2023-24", "2022-23", "2021-22", "2020-21", "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
    "2014-15", "2013-14", "2012-13", "2011-12", "2010-11", "2009-10", "2008-09", "2007-08", "2006-07", "2005-06",
    "2004-05", "2003-04", "2002-03", "2001-02", "2000-01", "1999-00", "1998-99", "1997-98", "1996-97"
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

  const calculateCustomStatForSeason = (seasonData: any, formula: string) => {
    const seasonStatMappings = {
      'PTS': seasonData.points,
      'AST': seasonData.assists,
      'REB': seasonData.rebounds,
      'STL': seasonData.steals,
      'BLK': seasonData.blocks,
      'TOV': seasonData.turnovers,
      'FG_PCT': seasonData.fieldGoalPercentage,
      'THREE_PCT': seasonData.threePointPercentage,
      'FT_PCT': seasonData.freeThrowPercentage,
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
    
    // Generate truly random selection each time
    const playerIndex = Math.floor(Math.random() * playersWithMultipleSeasons.length);
    const statIndex = Math.floor(Math.random() * presetStats.length);
    
    const selectedPlayer = playersWithMultipleSeasons[playerIndex];
    const selectedStat = presetStats[statIndex];
    
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-orange-500">
            NBA Custom Stats Calculator
          </h1>
          <p className="text-lg text-gray-400">
            Create custom basketball statistics with authentic NBA player data
          </p>
        </div>

        {/* Navigation Bar */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 rounded-lg p-1">
            <div className="flex">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-orange-600 text-white"
              >
                <BarChart3 className="w-4 h-4" />
                Leaderboards
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-300"
              >
                <Search className="w-4 h-4" />
                Player Search
              </button>
            </div>
          </div>
        </div>

        {/* Season Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select NBA Season:
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-orange-500 min-w-[200px]"
            >
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {season} Season {season === "2024-25" ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured Player Showcase */}
        {featuredPlayer && featuredStat && featuredChartData.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Featured Analysis</h2>
              <span className="text-sm text-slate-400">• Changes daily</span>
              <button
                onClick={() => setRefreshCounter(prev => prev + 1)}
                className="ml-auto flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Player Info and Stats */}
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {featuredPlayer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{featuredPlayer.name} →</h3>
                      <p className="text-slate-300">{featuredPlayer.position} • Career Spanning {featuredChartData.length} Seasons</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-600 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-400 mb-2">{featuredStat.name} →</h4>
                      <p className="text-sm text-slate-300 mb-3">{featuredStat.description}</p>
                      <div className="text-xs text-slate-400 font-mono bg-slate-800 p-2 rounded">
                        {featuredStat.formula}
                      </div>
                      <div className="text-sm text-slate-300 mt-3">
                        Click to see all-time leaders
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-600 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">
                          {featuredChartData.length > 0 ? featuredChartData[featuredChartData.length - 1]?.value.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-400">Current Value</div>
                      </div>
                      <div className="bg-slate-600 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">
                          {featuredChartData.length > 0 ? Math.max(...featuredChartData.map(d => d.value)).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-400">Peak Value</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Progression Chart */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">Career Progression</h3>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={featuredChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="season" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [value.toFixed(2), featuredStat?.name]}
                        labelFormatter={(label) => `${label} Season`}
                        itemStyle={{ color: '#F97316' }}
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

        {/* NBA Custom Stats Calculator */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">NBA Custom Stats Calculator</h2>
          <p className="text-slate-300 mb-6">Build your own basketball analytics formulas using real NBA player data. Create custom stats, compare players, and discover new insights.</p>
          
          <StatCalculator 
            onFormulaChange={setFormula}
            onCalculate={() => {}}
          />
        </div>

        {/* NBA Player Leaderboard Table */}
        <LeaderboardTable
          formula={formula}
          searchTerm=""
          selectedTeam=""
          selectedPosition=""
        />
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