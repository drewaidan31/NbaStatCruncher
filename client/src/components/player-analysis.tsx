import { useState, useEffect } from "react";
import { ArrowLeft, Calculator, TrendingUp, Sparkles, BarChart3, Calendar, Target } from "lucide-react";
import FormulaExamples from "./formula-examples";
import ShotChart from "./shot-chart";
import { PlayerAwards } from "./player-awards";
import { evaluate } from "mathjs";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getTeamColors, getTeamGradient, getTeamTextColor } from "../utils/team-colors";

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
    freeThrowAttempts?: number;
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
  const [selectedSeason, setSelectedSeason] = useState(season || player.currentSeason);
  const [currentPlayerData, setCurrentPlayerData] = useState(player);
  const [chartData, setChartData] = useState<Array<{season: string, value: number, team: string}>>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'shooting' | 'calculator'>('overview');

  // Query to fetch specific season data for the player
  const { data: seasonPlayerData, isLoading: isLoadingSeason } = useQuery({
    queryKey: ['/api/nba/players', player.playerId, 'season', selectedSeason],
    queryFn: async () => {
      const response = await fetch(`/api/nba/players/${player.playerId}?season=${selectedSeason}`);
      if (!response.ok) {
        throw new Error('Failed to fetch season data');
      }
      return response.json();
    },
    enabled: !!selectedSeason && selectedSeason !== player.currentSeason,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Query to fetch saved custom stats
  const { data: savedStats = [], isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/custom-stats/my'],
    enabled: showSavedStats,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch('/api/custom-stats/my', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch saved stats: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  // Update selected season when season prop changes from navigation
  useEffect(() => {
    if (season && season !== selectedSeason) {
      setSelectedSeason(season);
    }
  }, [season]);

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
          fieldGoalAttempts: seasonData.fieldGoalAttempts,
          threePointPercentage: seasonData.threePointPercentage,
          threePointAttempts: seasonData.threePointAttempts,
          freeThrowPercentage: seasonData.freeThrowPercentage,
          freeThrowAttempts: seasonData.freeThrowAttempts,
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
    'AST': currentPlayerData.assists,
    'REB': currentPlayerData.rebounds,
    'STL': currentPlayerData.steals,
    'BLK': currentPlayerData.blocks,
    'TOV': currentPlayerData.turnovers,
    'FG_PCT': currentPlayerData.fieldGoalPercentage,
    'FG%': currentPlayerData.fieldGoalPercentage,
    'FGA': currentPlayerData.fieldGoalAttempts || 0,
    '3P_PCT': currentPlayerData.threePointPercentage,
    '3P%': currentPlayerData.threePointPercentage,
    '3PA': currentPlayerData.threePointAttempts || 0,
    'FT_PCT': currentPlayerData.freeThrowPercentage,
    'FT%': currentPlayerData.freeThrowPercentage,
    'FTA': currentPlayerData.freeThrowAttempts || 0,
    'GP': currentPlayerData.gamesPlayed,
    'PLUS_MINUS': currentPlayerData.plusMinus,
    '+/-': currentPlayerData.plusMinus,
    'MIN': currentPlayerData.minutesPerGame || 0
  };

  const calculateStatForSeason = (formula: string, seasonData: any) => {
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
      'FGA': seasonData.fieldGoalAttempts || 0,
      '3P_PCT': seasonData.threePointPercentage,
      '3P%': seasonData.threePointPercentage, // Support both formats
      '3PA': seasonData.threePointAttempts || 0,
      'FT_PCT': seasonData.freeThrowPercentage,
      'FT%': seasonData.freeThrowPercentage, // Support both formats
      'FTA': seasonData.freeThrowAttempts || 0,
      'GP': seasonData.gamesPlayed,
      'PLUS_MINUS': seasonData.plusMinus,
      '+/-': seasonData.plusMinus, // Support both formats
      'MIN': seasonData.minutesPerGame || 0
    };

    try {
      let expression = formula;
      
      // Handle +/- first since it has special characters
      if (expression.includes('+/-')) {
        expression = expression.replace(/\+\/-/g, seasonStatMappings['+/-'].toString());
      }
      
      // Replace stat abbreviations with actual values
      // First handle percentage stats specifically
      if (expression.includes('FG%')) {
        expression = expression.replace(/FG%/g, seasonStatMappings['FG%'].toString());
      }
      if (expression.includes('3P%')) {
        expression = expression.replace(/3P%/g, seasonStatMappings['3P%'].toString());
      }
      if (expression.includes('FT%')) {
        expression = expression.replace(/FT%/g, seasonStatMappings['FT%'].toString());
      }
      
      // Then handle other stats
      Object.entries(seasonStatMappings).forEach(([key, value]) => {
        if (key === '+/-' || key.includes('%')) {
          // Skip these as we handled them above
          return;
        }
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, value.toString());
      });
      
      const result = evaluate(expression);
      return typeof result === 'number' ? result : null;
    } catch (error) {
      return null;
    }
  };

  const calculateCustomStat = () => {
    console.log('Starting calculation with formula:', formula);
    console.log('Current player data:', currentPlayerData);
    console.log('Stat mappings:', statMappings);
    
    try {
      let expression = formula;
      
      // Handle +/- first since it has special characters
      if (expression.includes('+/-')) {
        expression = expression.replace(/\+\/-/g, statMappings['+/-'].toString());
      }
      
      // Create extended mappings for backward compatibility
      const extendedMappings = {
        ...statMappings,
        'PPG': currentPlayerData.points,
        'APG': currentPlayerData.assists,
        'RPG': currentPlayerData.rebounds,
        'SPG': currentPlayerData.steals,
        'BPG': currentPlayerData.blocks,
        'TPG': currentPlayerData.turnovers,
      };
      
      // Replace stat abbreviations with actual values
      // First handle percentage stats specifically
      if (expression.includes('FG%')) {
        expression = expression.replace(/FG%/g, extendedMappings['FG%'].toString());
      }
      if (expression.includes('3P%')) {
        expression = expression.replace(/3P%/g, extendedMappings['3P%'].toString());
      }
      if (expression.includes('FT%')) {
        expression = expression.replace(/FT%/g, extendedMappings['FT%'].toString());
      }
      
      // Then handle other stats
      Object.entries(extendedMappings).forEach(([key, value]) => {
        if (key === '+/-' || key.includes('%')) {
          // Skip these as we handled them above
          return;
        }
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, value.toString());
      });
      
      console.log('Final expression:', expression);
      const result = evaluate(expression);
      console.log('Calculated result:', result);
      
      setCalculatedValue(typeof result === 'number' ? result : null);
      
      // Build chart data if seasons are available
      if (player.seasons && player.seasons.length > 0) {
        const chartPoints = player.seasons
          .sort((a, b) => {
            // Convert season format (e.g., "2019-20") to comparable numbers
            const yearA = parseInt(a.season.split('-')[0]);
            const yearB = parseInt(b.season.split('-')[0]);
            return yearA - yearB; // Sort from oldest to newest
          })
          .map(seasonData => {
            const seasonResult = calculateStatForSeason(formula, seasonData);
            return seasonResult !== null ? {
              season: seasonData.season,
              value: seasonResult,
              team: seasonData.team
            } : null;
          })
          .filter(point => point !== null);
        
        setChartData(chartPoints);
      }
      
    } catch (error) {
      console.error('Error calculating custom stat:', error);
      setCalculatedValue(null);
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    // Don't auto-calculate, let users press the Calculate button
    if (!newFormula.trim()) {
      setCalculatedValue(null);
      setChartData([]);
    }
  };

  const saveStat = async () => {
    if (!customStatName.trim() || !formula.trim() || calculatedValue === null) {
      alert('Please provide a stat name and valid formula');
      return;
    }

    try {
      const response = await fetch('/api/custom-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: customStatName.trim(),
          formula: formula.trim(),
          value: calculatedValue,
          playerId: player.playerId,
          playerName: player.name,
          season: selectedSeason
        }),
      });

      if (response.ok) {
        alert('Custom stat saved successfully!');
        setCustomStatName('');
        refetchStats();
      } else {
        const errorData = await response.text();
        alert(`Failed to save stat: ${errorData}`);
      }
    } catch (error) {
      console.error('Error saving stat:', error);
      alert('Failed to save stat');
    }
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
        refetchStats();
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
    handleFormulaChange(stat.formula);
  };

  // Get team colors for current player's team
  const teamColors = getTeamColors(currentPlayerData.team);
  const teamGradient = getTeamGradient(currentPlayerData.team);
  const teamTextColor = getTeamTextColor(currentPlayerData.team);

  return (
    <div className="space-y-6">
      {/* Header with Team Colors */}
      <div 
        className="rounded-lg p-6 border border-slate-300 dark:border-slate-700 relative overflow-hidden"
        style={{
          background: teamGradient,
          color: teamTextColor
        }}
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-black/20 hover:bg-black/30 rounded-lg transition-colors backdrop-blur-sm"
              style={{ color: teamTextColor }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: teamTextColor }}>{player.name}</h1>
              <p className="opacity-90" style={{ color: teamTextColor }}>
                {getTeamColors(currentPlayerData.team).name} • {currentPlayerData.position} • {selectedSeason}
              </p>
              <PlayerAwards playerName={player.name} season={selectedSeason || ''} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Season Selector */}
            {player.availableSeasons && player.availableSeasons.length > 1 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: teamTextColor }} />
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-black/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    color: teamTextColor,
                    borderColor: teamTextColor + '50'
                  }}
                  disabled={false}
                >
                  {player.availableSeasons.map((season) => (
                    <option key={season} value={season} className="bg-slate-800 text-white">
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation with Team Colors */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-black/10 hover:bg-black/20 backdrop-blur-sm'
            }`}
            style={{ color: teamTextColor }}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('shooting')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'shooting'
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-black/10 hover:bg-black/20 backdrop-blur-sm'
            }`}
            style={{ color: teamTextColor }}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Shot Chart
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'calculator'
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-black/10 hover:bg-black/20 backdrop-blur-sm'
            }`}
            style={{ color: teamTextColor }}
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Custom Stats
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Compact Player Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-300 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Season Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="text-slate-600 dark:text-slate-400 text-xs">Points</div>
                <div className="text-orange-600 dark:text-orange-400 font-bold">{currentPlayerData.points.toFixed(1)} PPG</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="text-slate-600 dark:text-slate-400 text-xs">Assists</div>
                <div className="text-blue-600 dark:text-blue-400 font-bold">{currentPlayerData.assists.toFixed(1)} APG</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="text-slate-600 dark:text-slate-400 text-xs">Rebounds</div>
                <div className="text-green-600 dark:text-green-400 font-bold">{currentPlayerData.rebounds.toFixed(1)} RPG</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="text-slate-600 dark:text-slate-400 text-xs">Field Goal %</div>
                <div className="text-yellow-600 dark:text-yellow-400 font-bold">{(currentPlayerData.fieldGoalPercentage * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="text-slate-600 dark:text-slate-400 text-xs">Plus/Minus</div>
                <div className={`font-bold ${currentPlayerData.plusMinus >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {currentPlayerData.plusMinus > 0 ? '+' : ''}{currentPlayerData.plusMinus.toFixed(1)}
                </div>
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                <div className="text-slate-600 dark:text-slate-400 text-xs">Games Played</div>
                <div className="text-purple-600 dark:text-purple-400 font-bold">{currentPlayerData.gamesPlayed}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shooting' && (
        <ShotChart
          playerId={player.playerId}
          playerName={player.name}
          season={selectedSeason}
        />
      )}

      {activeTab === 'calculator' && (
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavedStats(!showSavedStats)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Saved Stats
              </button>
            </div>
          </div>

          {/* Result Display - Prominent */}
          {calculatedValue !== null && (
            <>
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-center shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-bold text-white">{customStatName || "Custom Stat"}</h3>
                </div>
                <div className="text-5xl font-bold text-white mb-2">{calculatedValue.toFixed(2)}</div>
                <div className="text-orange-100 text-sm bg-black/20 rounded-lg px-3 py-1 inline-block">
                  Formula: {formula}
                </div>
              </div>

              {/* Custom Stat Chart - Right after result */}
              {chartData.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-300 dark:border-slate-700 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">{customStatName || "Custom Stat"} Over Time</h3>
                    <span className="text-sm text-slate-600 dark:text-slate-400">({chartData.length} seasons)</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" />
                        <XAxis 
                          dataKey="season" 
                          stroke="#64748B"
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            color: '#1E293B'
                          }}
                          labelFormatter={(label) => {
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
                          activeDot={{ r: 6, fill: '#EA580C' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}


            </>
          )}

          {/* Formula Input */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Stat Name
              </label>
              <input
                type="text"
                value={customStatName}
                onChange={(e) => setCustomStatName(e.target.value)}
                placeholder="e.g., Impact Score, Efficiency Rating"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Formula
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => handleFormulaChange(e.target.value)}
                placeholder="e.g., PTS + AST + REB"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={calculateCustomStat}
              disabled={!formula.trim()}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Calculate
            </button>
            <button
              onClick={saveStat}
              disabled={!customStatName.trim() || !formula.trim() || calculatedValue === null}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              Save Custom Stat
            </button>
            <button
              onClick={() => {
                setFormula("");
                setCustomStatName("");
                setCalculatedValue(null);
                setChartData([]);
              }}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Quick Calculator */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Quick Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Player Stats */}
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Player Stats</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "PTS", value: "PTS" },
                    { name: "AST", value: "AST" },
                    { name: "REB", value: "REB" },
                    { name: "STL", value: "STL" },
                    { name: "BLK", value: "BLK" },
                    { name: "TOV", value: "TOV" },
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
            <div className="flex gap-2 mt-4">
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

          <FormulaExamples onFormulaSelect={(selectedFormula, selectedName) => {
            setFormula(selectedFormula);
            if (selectedName) {
              setCustomStatName(selectedName);
            }
            handleFormulaChange(selectedFormula);
          }} />

          {/* Saved Stats Section */}
          {showSavedStats && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Saved Custom Stats</h3>
                <button
                  onClick={() => setShowSavedStats(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              {isLoadingStats ? (
                <div className="text-center text-slate-400 py-4">Loading saved stats...</div>
              ) : savedStats.length === 0 ? (
                <div className="text-center text-slate-400 py-4">No saved stats yet</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedStats.map((stat: any) => (
                    <div
                      key={stat.id}
                      className="bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-600 transition-colors"
                      onClick={() => {
                        setFormula(stat.formula);
                        setCustomStatName(stat.name);
                        handleFormulaChange(stat.formula);
                        setShowSavedStats(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{stat.name}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStat(stat);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStat(stat.id);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-300 mb-1">Formula: {stat.formula}</div>
                      <div className="text-lg font-bold text-orange-400">{stat.value?.toFixed(2)}</div>
                      <div className="text-xs text-slate-500 mt-2">
                        Click to load
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-3 font-medium">Available Player Stats (Per Game):</div>
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
      )}
    </div>
  );
}