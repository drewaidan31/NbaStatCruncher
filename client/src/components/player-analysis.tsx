import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, TrendingUp, Calendar, Heart, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getTeamColors, getTeamGradient, getTeamTextColor } from '../utils/team-colors';

import FormulaExamples from './formula-examples';

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

interface PlayerAnalysisProps {
  player: Player;
  onBack: () => void;
}

interface ChartDataPoint {
  season: string;
  value: number;
  team?: string;
}

export default function PlayerAnalysis({ player, onBack }: PlayerAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeason, setSelectedSeason] = useState(player.currentSeason || '2023-24');
  const [formula, setFormula] = useState('');
  const [customStatName, setCustomStatName] = useState('');
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showSavedStats, setShowSavedStats] = useState(false);

  const queryClient = useQueryClient();

  // Get favorites data
  const { data: favorites = [] } = useQuery({
    queryKey: ['/api/favorite-players']
  });

  // Get saved stats
  const { data: savedStats = [], isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/custom-stats']
  });

  const isFavorite = (playerId: number) => {
    return favorites.some((fav: any) => fav.playerId === playerId);
  };

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (playerData: { playerId: number; playerName: string }) => {
      const response = await fetch('/api/favorite-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(playerData),
      });
      if (!response.ok) throw new Error('Failed to add favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-players'] });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await fetch(`/api/favorite-players/${playerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorite-players'] });
    },
  });

  const handleToggleFavorite = () => {
    if (isFavorite(player.playerId)) {
      removeFavoriteMutation.mutate(player.playerId);
    } else {
      addFavoriteMutation.mutate({
        playerId: player.playerId,
        playerName: player.name,
      });
    }
  };

  // Get current season data
  const getCurrentSeasonData = () => {
    if (!player.seasons) return player;
    
    const seasons = Array.isArray(player.seasons) ? player.seasons : [player.seasons];
    const currentSeasonData = seasons.find((s: any) => s.season === selectedSeason);
    return currentSeasonData || player;
  };

  const currentPlayerData = getCurrentSeasonData();

  const calculateStatForSeason = (formula: string, seasonData: any) => {
    try {
      // Replace stat abbreviations with actual values
      let processedFormula = formula
        .replace(/PTS/g, seasonData.points?.toString() || '0')
        .replace(/AST/g, seasonData.assists?.toString() || '0')
        .replace(/REB/g, seasonData.rebounds?.toString() || '0')
        .replace(/STL/g, seasonData.steals?.toString() || '0')
        .replace(/BLK/g, seasonData.blocks?.toString() || '0')
        .replace(/TOV/g, seasonData.turnovers?.toString() || '0')
        .replace(/FG_PCT/g, seasonData.fieldGoalPercentage?.toString() || '0')
        .replace(/FGA/g, seasonData.fieldGoalAttempts?.toString() || '0')
        .replace(/THREE_PCT/g, seasonData.threePointPercentage?.toString() || '0')
        .replace(/3PA/g, seasonData.threePointAttempts?.toString() || '0')
        .replace(/FT_PCT/g, seasonData.freeThrowPercentage?.toString() || '0')
        .replace(/FTA/g, seasonData.freeThrowAttempts?.toString() || '0')
        .replace(/PLUS_MINUS/g, seasonData.plusMinus?.toString() || '0')
        .replace(/W_PCT/g, seasonData.winPercentage?.toString() || '0')
        .replace(/MIN/g, seasonData.minutesPerGame?.toString() || '0')
        .replace(/GP/g, seasonData.gamesPlayed?.toString() || '0');

      return eval(processedFormula);
    } catch (error) {
      return null;
    }
  };

  const calculateCustomStat = () => {
    if (!formula.trim()) return;
    
    try {
      const result = calculateStatForSeason(formula, currentPlayerData);
      setCalculatedValue(result);
      
      // Generate chart data for career progression if multiple seasons available
      if (player.seasons && Array.isArray(player.seasons)) {
        const chartPoints = player.seasons
          .sort((a: any, b: any) => {
            const yearA = parseInt(a.season.split('-')[0]);
            const yearB = parseInt(b.season.split('-')[0]);
            return yearA - yearB;
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
    if (!newFormula.trim()) {
      setCalculatedValue(null);
      setChartData([]);
    }
    setCursorPosition(newFormula.length);
  };

  const insertAtCursor = (insertion: string) => {
    const newFormula = formula.slice(0, cursorPosition) + insertion + formula.slice(cursorPosition);
    setFormula(newFormula);
    setCursorPosition(cursorPosition + insertion.length);
    handleFormulaChange(newFormula);
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

  const insertSavedStat = (stat: any) => {
    const insertion = `(${stat.formula})`;
    setFormula(prev => {
      const newFormula = prev + insertion;
      handleFormulaChange(newFormula);
      return newFormula;
    });
    setShowSavedStats(false);
  };

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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: teamTextColor }}>{player.name}</h1>
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite(player.playerId) ? "Remove from favorites" : "Add to favorites"}
                  className="opacity-70 hover:opacity-100 transition-all duration-200 hover:scale-110 p-1"
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                >
                  <Heart 
                    className={`w-6 h-6 transition-colors ${
                      isFavorite(player.playerId) 
                        ? 'text-orange-400 fill-orange-400' 
                        : 'text-white/60 hover:text-orange-400'
                    }`}
                  />
                </button>
              </div>
              <p className="opacity-90" style={{ color: teamTextColor }}>
                {getTeamColors(currentPlayerData.team).name} • {currentPlayerData.position} • {selectedSeason}
              </p>

            </div>
          </div>
          <div className="flex items-center gap-4">
            {player.availableSeasons && player.availableSeasons.length > 1 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: teamTextColor }} />
                <select
                  value={selectedSeason || ''}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-black/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    color: teamTextColor,
                    borderColor: teamTextColor + '50'
                  }}
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white/20 backdrop-blur-sm text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'calculator'
                ? 'bg-white/20 backdrop-blur-sm text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Calculator
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-300 dark:border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
              <div className="text-slate-600 dark:text-slate-400 text-xs">Points</div>
              <div className="text-blue-600 dark:text-blue-400 font-bold">{currentPlayerData.points.toFixed(1)} PPG</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
              <div className="text-slate-600 dark:text-slate-400 text-xs">Assists</div>
              <div className="text-purple-600 dark:text-purple-400 font-bold">{currentPlayerData.assists.toFixed(1)} APG</div>
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
      )}

      {/* Calculator Tab */}
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
          </div>

          {/* Result Display */}
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
          </div>

          {/* Standardized Calculator Interface */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Quick Calculator</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Statistics */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Player Statistics</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "PPG", value: "PTS" },
                    { name: "APG", value: "AST" },
                    { name: "RPG", value: "REB" },
                    { name: "SPG", value: "STL" },
                    { name: "BPG", value: "BLK" },
                    { name: "TPG", value: "TOV" },
                    { name: "FG%", value: "FG_PCT" },
                    { name: "FGA", value: "FGA" },
                    { name: "3P%", value: "THREE_PCT" },
                    { name: "3PA", value: "3PA" },
                    { name: "FT%", value: "FT_PCT" },
                    { name: "FTA", value: "FTA" },
                    { name: "+/-", value: "PLUS_MINUS" },
                    { name: "W%", value: "W_PCT" },
                    { name: "MPG", value: "MIN" },
                    { name: "GP", value: "GP" }
                  ].map((stat) => (
                    <button
                      key={stat.value}
                      onClick={() => insertAtCursor(stat.value)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      {stat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operations */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Operations</h4>
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
                      onClick={() => insertAtCursor(op.value)}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-lg py-2 px-3 rounded transition-colors"
                    >
                      {op.symbol}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((num) => (
                    <button
                      key={num}
                      onClick={() => insertAtCursor(num)}
                      className="bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500 text-white text-lg py-2 px-3 rounded transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setFormula("");
                      setCalculatedValue(null);
                      setChartData([]);
                      setCursorPosition(0);
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={calculateCustomStat}
                    disabled={!formula.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded font-medium transition-colors"
                  >
                    Calculate
                  </button>
                </div>
              </div>
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
                      onClick={() => insertSavedStat(stat)}
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
                        Click to insert into formula
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}