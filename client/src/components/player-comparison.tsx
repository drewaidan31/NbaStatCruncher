import { useState } from "react";
import { ArrowLeft, Calculator, TrendingUp, GitCompare } from "lucide-react";

import { evaluate } from "mathjs";
import FormulaExamples from "./formula-examples";
import { PlayerAwards } from "./player-awards";
import { getTeamColors, getTeamGradient, getTeamTextColor } from "../utils/team-colors";

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
}

interface ComparisonData {
  player1: Player;
  season1: string;
  player2: Player;
  season2: string;
}

interface PlayerComparisonProps {
  comparison: ComparisonData;
  onBack: () => void;
  currentFormula?: string;
}

export default function PlayerComparison({ comparison, onBack, currentFormula }: PlayerComparisonProps) {
  const [formula, setFormula] = useState("");
  const [customStatName, setCustomStatName] = useState("Total Impact");
  const [player1Value, setPlayer1Value] = useState<number | null>(null);
  const [player2Value, setPlayer2Value] = useState<number | null>(null);
  const [savedStats, setSavedStats] = useState<any[]>([]);
  const [showSavedStats, setShowSavedStats] = useState(false);

  const { player1, season1, player2, season2 } = comparison;

  const getStatMappings = (player: any) => ({
    'PTS': player.points,
    'AST': player.assists,
    'REB': player.rebounds,
    'STL': player.steals,
    'BLK': player.blocks,
    'TOV': player.turnovers,
    'FG_PCT': player.fieldGoalPercentage,
    'FG%': player.fieldGoalPercentage,
    'FGA': player.fieldGoalAttempts || 0,
    'THREE_PCT': player.threePointPercentage,
    '3P%': player.threePointPercentage,
    '3PA': player.threePointAttempts || 0,
    'FT_PCT': player.freeThrowPercentage,
    'FT%': player.freeThrowPercentage,
    'FTA': player.freeThrowAttempts || 0,
    'GP': player.gamesPlayed,
    'PLUS_MINUS': player.plusMinus,
    '+/-': player.plusMinus,
    'MIN': player.minutesPerGame || 0,
    'W_PCT': player.winPercentage || 0
  });

  const calculateCustomStat = (player: any) => {
    // Only calculate if formula is not empty
    if (!formula || formula.trim().length === 0) {
      console.log('No formula provided');
      return null;
    }
    
    try {
      let expression = formula;
      const statMappings = getStatMappings(player);
      console.log('Original formula:', formula);
      console.log('Player stats:', statMappings);
      
      // Replace stat abbreviations with actual values
      // Handle +/- first since it has special characters
      if (expression.includes('+/-')) {
        expression = expression.replace(/\+\/-/g, statMappings['+/-'].toString());
        console.log('After +/- replacement:', expression);
      }
      
      // Handle percentage stats first
      if (expression.includes('FG%')) {
        expression = expression.replace(/FG%/g, statMappings['FG%'].toString());
      }
      if (expression.includes('3P%')) {
        expression = expression.replace(/3P%/g, statMappings['3P%'].toString());
      }
      if (expression.includes('FT%')) {
        expression = expression.replace(/FT%/g, statMappings['FT%'].toString());
      }
      
      // Handle regular stats
      Object.entries(statMappings).forEach(([key, value]) => {
        if (key !== '+/-' && !key.includes('%')) {
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          expression = expression.replace(regex, value.toString());
        }
      });
      
      console.log('Final expression:', expression);
      const result = evaluate(expression);
      console.log('Calculation result:', result);
      return typeof result === 'number' ? result : null;
    } catch (error) {
      console.log('Calculation error:', error);
      return null;
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    // Reset values when formula changes
    setPlayer1Value(null);
    setPlayer2Value(null);
  };

  const handleCalculate = () => {
    const value1 = calculateCustomStat(player1);
    const value2 = calculateCustomStat(player2);
    setPlayer1Value(value1);
    setPlayer2Value(value2);
  };

  const fetchSavedStats = async () => {
    try {
      const response = await fetch('/api/custom-stats');
      if (response.ok) {
        const stats = await response.json();
        setSavedStats(stats);
      }
    } catch (error) {
      console.error('Error fetching saved stats:', error);
    }
  };

  const insertSavedStat = (stat: any) => {
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
        alert('Stat saved successfully!');
      }
    } catch (error) {
      console.error('Error saving stat:', error);
    }
  };

  const StatComparison = ({ label, value1, value2, isPercentage = false, higherIsBetter = true }: {
    label: string;
    value1: number;
    value2: number;
    isPercentage?: boolean;
    higherIsBetter?: boolean;
  }) => {
    const formatValue = (value: number) => {
      return isPercentage ? `${(value * 100).toFixed(1)}%` : value.toFixed(1);
    };

    const getBetterPlayer = () => {
      if (higherIsBetter) {
        return value1 > value2 ? 1 : value2 > value1 ? 2 : 0;
      } else {
        return value1 < value2 ? 1 : value2 < value1 ? 2 : 0;
      }
    };

    const betterPlayer = getBetterPlayer();

    return (
      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-4">
        <div className="text-slate-600 dark:text-slate-400 text-sm mb-2">{label}</div>
        <div className="flex justify-between items-center">
          <div className={`font-bold ${betterPlayer === 1 ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatValue(value1)}
          </div>
          <div className="text-slate-500 dark:text-slate-500 text-sm">vs</div>
          <div className={`font-bold ${betterPlayer === 2 ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatValue(value2)}
          </div>
        </div>
      </div>
    );
  };

  // Get team colors for both players
  const team1Colors = getTeamColors(player1.team);
  const team2Colors = getTeamColors(player2.team);
  const team1Gradient = getTeamGradient(player1.team);
  const team2Gradient = getTeamGradient(player2.team);
  const team1TextColor = getTeamTextColor(player1.team);
  const team2TextColor = getTeamTextColor(player2.team);

  return (
    <div className="space-y-6">
      {/* Header with Split Team Colors */}
      <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-4 p-6">
          <button
            onClick={onBack}
            className="p-2 bg-black/20 hover:bg-black/30 rounded-lg transition-colors backdrop-blur-sm text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 flex-1">
            {/* Player 1 Section */}
            <div 
              className="flex-1 p-4 rounded-lg relative overflow-hidden"
              style={{ background: team1Gradient }}
            >
              <div className="relative z-10">
                <h2 className="text-xl font-bold" style={{ color: team1TextColor }}>{player1.name}</h2>
                <p className="opacity-90" style={{ color: team1TextColor }}>
                  {team1Colors.name} • {season1}
                </p>
                <PlayerAwards playerName={player1.name} season={season1} />
              </div>
            </div>
            
            {/* VS Separator */}
            <div className="bg-slate-800 p-3 rounded-full">
              <GitCompare className="w-6 h-6 text-orange-400" />
            </div>
            
            {/* Player 2 Section */}
            <div 
              className="flex-1 p-4 rounded-lg relative overflow-hidden"
              style={{ background: team2Gradient }}
            >
              <div className="relative z-10">
                <h2 className="text-xl font-bold" style={{ color: team2TextColor }}>{player2.name}</h2>
                <p className="opacity-90" style={{ color: team2TextColor }}>
                  {team2Colors.name} • {season2}
                </p>
                <PlayerAwards playerName={player2.name} season={season2} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-white dark:bg-slate-800">
          <StatComparison label="Points per Game" value1={player1.points} value2={player2.points} />
          <StatComparison label="Assists per Game" value1={player1.assists} value2={player2.assists} />
          <StatComparison label="Rebounds per Game" value1={player1.rebounds} value2={player2.rebounds} />
          <StatComparison label="Steals per Game" value1={player1.steals} value2={player2.steals} />
          <StatComparison label="Blocks per Game" value1={player1.blocks} value2={player2.blocks} />
          <StatComparison label="Turnovers per Game" value1={player1.turnovers} value2={player2.turnovers} higherIsBetter={false} />
          <StatComparison label="Field Goal %" value1={player1.fieldGoalPercentage} value2={player2.fieldGoalPercentage} isPercentage />
          <StatComparison label="3-Point %" value1={player1.threePointPercentage} value2={player2.threePointPercentage} isPercentage />
          <StatComparison label="Free Throw %" value1={player1.freeThrowPercentage} value2={player2.freeThrowPercentage} isPercentage />
          <StatComparison label="Plus/Minus" value1={player1.plusMinus} value2={player2.plusMinus} />
          <StatComparison label="Games Played" value1={player1.gamesPlayed} value2={player2.gamesPlayed} />
        </div>
      </div>

      {/* Custom Stat Calculator */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Custom Stat Comparison</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Custom Stat Name:
            </label>
            <input
              type="text"
              value={customStatName}
              onChange={(e) => setCustomStatName(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-500 dark:placeholder-slate-400"
              placeholder="Enter a name for your custom stat..."
            />
          </div>

          {/* Interactive Calculator Interface */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Formula Builder:
              </label>
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 border border-slate-300 dark:border-slate-600">
                <div className="text-slate-600 dark:text-slate-300 text-sm mb-1">Formula:</div>
                <div className="text-slate-900 dark:text-white text-lg font-mono min-h-[2rem] break-all">
                  {formula || "Click stats and operations to build your formula"}
                </div>
              </div>
              
              {/* Calculate Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleCalculate}
                  disabled={!formula}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Calculate
                </button>
                <button
                  onClick={handleSaveStat}
                  disabled={!formula || !customStatName || (player1Value === null && player2Value === null)}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
                    handleFormulaChange("");
                  }}
                  className="bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Saved Stats Modal */}
            {showSavedStats && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-slate-900 dark:text-slate-50">Your Saved Stats</h4>
                    <button 
                      onClick={() => setShowSavedStats(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2">
                    {savedStats.length === 0 ? (
                      <p className="text-slate-600 dark:text-slate-400">No saved stats yet. Save your first custom stat above!</p>
                    ) : (
                      savedStats.map((stat) => (
                        <div
                          key={stat.id}
                          className="p-3 bg-slate-100 dark:bg-slate-700 rounded border"
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
              </div>
            )}

            {/* Formula Examples */}
            <FormulaExamples 
              onFormulaSelect={(selectedFormula) => {
                console.log('Inserting preset formula:', selectedFormula);
                console.log('Current formula before insert:', formula);
                const insertion = `(${selectedFormula})`;
                setFormula(prev => {
                  const newFormula = prev + insertion;
                  console.log('New formula after insert:', newFormula);
                  return newFormula;
                });
                handleFormulaChange(formula + insertion);
              }}
            />

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
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Numbers</h4>
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        const newFormula = formula + num;
                        setFormula(newFormula);
                        handleFormulaChange(newFormula);
                      }}
                      className="bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500 text-white text-sm py-2 px-3 rounded transition-colors"
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
                  setPlayer1Value(null);
                  setPlayer2Value(null);
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

          <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Available Stats (PPG, APG, RPG, SPG, BPG, TPG, FG%, 3P%, FT%, GP, +/-, MIN)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-blue-600 dark:text-blue-300 mb-1">{player1.name} ({season1})</div>
                {Object.entries(getStatMappings(player1)).map(([key, value]) => (
                  <div key={key} className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-orange-600 dark:text-orange-300">{key}</span>: {
                      key.includes('%') ? (value * 100).toFixed(1) + '%' : value.toFixed(1)
                    }
                  </div>
                ))}
              </div>
              <div>
                <div className="font-medium text-blue-600 dark:text-blue-300 mb-1">{player2.name} ({season2})</div>
                {Object.entries(getStatMappings(player2)).map(([key, value]) => (
                  <div key={key} className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium text-orange-600 dark:text-orange-300">{key}</span>: {
                      key.includes('%') ? (value * 100).toFixed(1) + '%' : value.toFixed(1)
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Stat Results */}
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <div className="flex-1">
                <div className="text-slate-300 text-sm mb-2">{customStatName} Comparison</div>
                {formula ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {player1Value !== null ? player1Value.toFixed(2) : "—"}
                        </div>
                        <div className="text-xs text-slate-400">{player1.name}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">
                          {player2Value !== null ? player2Value.toFixed(2) : "—"}
                        </div>
                        <div className="text-xs text-slate-400">{player2.name}</div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs text-slate-400">Formula: {formula}</div>
                      {player1Value !== null && player2Value !== null && (
                        <div className="text-sm font-medium text-green-400 mt-1">
                          {player1Value > player2Value 
                            ? `${player1.name} leads by ${(player1Value - player2Value).toFixed(2)}`
                            : player2Value > player1Value 
                            ? `${player2.name} leads by ${(player2Value - player1Value).toFixed(2)}`
                            : "Tied!"
                          }
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 py-4">
                    Build a formula above to compare custom stats
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}