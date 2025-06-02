import { useState } from "react";
import { ArrowLeft, Calculator, TrendingUp, GitCompare } from "lucide-react";

import { evaluate } from "mathjs";

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

  const { player1, season1, player2, season2 } = comparison;

  const getStatMappings = (player: Player) => ({
    'PPG': player.points,
    'APG': player.assists,
    'RPG': player.rebounds,
    'SPG': player.steals,
    'BPG': player.blocks,
    'TPG': player.turnovers,
    'FG%': player.fieldGoalPercentage,
    '3P%': player.threePointPercentage,
    'FT%': player.freeThrowPercentage,
    'GP': player.gamesPlayed,
    '+/-': player.plusMinus,
    'MIN': 32.5 // Default minutes per game
  });

  const calculateCustomStat = (player: Player) => {
    try {
      let expression = formula;
      const statMappings = getStatMappings(player);
      
      // Replace stat abbreviations with actual values
      // Handle +/- first since it has special characters
      if (expression.includes('+/-')) {
        expression = expression.replace(/\+\/-/g, statMappings['+/-'].toString());
      }
      
      // Handle percentage stats
      Object.entries(statMappings).forEach(([key, value]) => {
        if (key !== '+/-') {
          if (key.includes('%')) {
            // For percentage stats, escape the % character
            const escapedKey = key.replace(/%/g, '\\%');
            const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
            expression = expression.replace(regex, value.toString());
          } else {
            // For regular stats
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            expression = expression.replace(regex, value.toString());
          }
        }
      });

      const result = evaluate(expression);
      return typeof result === 'number' ? result : null;
    } catch (error) {
      console.error('Custom stat calculation error:', error, 'Formula:', formula);
      return null;
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    // Auto-calculate when formula changes
    setTimeout(() => {
      const value1 = calculateCustomStat(player1);
      const value2 = calculateCustomStat(player2);
      setPlayer1Value(value1);
      setPlayer2Value(value2);
    }, 100);
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
      <div className="bg-slate-700 rounded-lg p-4">
        <div className="text-slate-400 text-sm mb-2">{label}</div>
        <div className="flex justify-between items-center">
          <div className={`font-bold ${betterPlayer === 1 ? 'text-green-400' : 'text-slate-300'}`}>
            {formatValue(value1)}
          </div>
          <div className="text-slate-500 text-sm">vs</div>
          <div className={`font-bold ${betterPlayer === 2 ? 'text-green-400' : 'text-slate-300'}`}>
            {formatValue(value2)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{player1.name}</h2>
              <p className="text-slate-300">{player1.team} • {season1}</p>
            </div>
            <GitCompare className="w-8 h-8 text-orange-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{player2.name}</h2>
              <p className="text-slate-300">{player2.team} • {season2}</p>
            </div>
          </div>
        </div>

        {/* Stats Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white">Custom Stat Comparison</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom Stat Name:
            </label>
            <input
              type="text"
              value={customStatName}
              onChange={(e) => setCustomStatName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Available Stats (PPG, APG, RPG, SPG, BPG, TPG, FG%, 3P%, FT%, GP, +/-, MIN)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-blue-300 mb-1">{player1.name} ({season1})</div>
                {Object.entries(getStatMappings(player1)).map(([key, value]) => (
                  <div key={key} className="text-slate-300">
                    <span className="font-medium text-orange-300">{key}</span>: {
                      key.includes('%') ? (value * 100).toFixed(1) + '%' : value.toFixed(1)
                    }
                  </div>
                ))}
              </div>
              <div>
                <div className="font-medium text-blue-300 mb-1">{player2.name} ({season2})</div>
                {Object.entries(getStatMappings(player2)).map(([key, value]) => (
                  <div key={key} className="text-slate-300">
                    <span className="font-medium text-orange-300">{key}</span>: {
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