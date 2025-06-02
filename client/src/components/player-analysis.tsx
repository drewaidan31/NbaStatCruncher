import { useState } from "react";
import { ArrowLeft, Calculator, TrendingUp } from "lucide-react";
import FormulaInput from "./formula-input";
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

interface PlayerAnalysisProps {
  player: Player;
  season: string;
  onBack: () => void;
}

export default function PlayerAnalysis({ player, season, onBack }: PlayerAnalysisProps) {
  const [formula, setFormula] = useState("PPG + APG + RPG");
  const [customStatName, setCustomStatName] = useState("Total Impact");
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);

  const statMappings = {
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
  };

  const calculateCustomStat = () => {
    try {
      let expression = formula;
      
      // Replace stat abbreviations with actual values
      Object.entries(statMappings).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key.replace(/[+\-%]/g, '\\$&')}\\b`, 'g');
        expression = expression.replace(regex, value.toString());
      });

      const result = evaluate(expression);
      setCalculatedValue(typeof result === 'number' ? result : null);
    } catch (error) {
      setCalculatedValue(null);
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    // Auto-calculate when formula changes
    setTimeout(() => {
      let expression = newFormula;
      try {
        Object.entries(statMappings).forEach(([key, value]) => {
          const regex = new RegExp(`\\b${key.replace(/[+\-%]/g, '\\$&')}\\b`, 'g');
          expression = expression.replace(regex, value.toString());
        });
        const result = evaluate(expression);
        setCalculatedValue(typeof result === 'number' ? result : null);
      } catch {
        setCalculatedValue(null);
      }
    }, 100);
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
          <div>
            <h1 className="text-2xl font-bold text-white">{player.name}</h1>
            <p className="text-slate-300">{player.team} • {player.position} • {season}</p>
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Points</div>
            <div className="text-orange-400 font-bold text-lg">{player.points.toFixed(1)} PPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Assists</div>
            <div className="text-blue-400 font-bold text-lg">{player.assists.toFixed(1)} APG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Rebounds</div>
            <div className="text-green-400 font-bold text-lg">{player.rebounds.toFixed(1)} RPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Steals</div>
            <div className="text-purple-400 font-bold text-lg">{player.steals.toFixed(1)} SPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Blocks</div>
            <div className="text-red-400 font-bold text-lg">{player.blocks.toFixed(1)} BPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Games</div>
            <div className="text-slate-300 font-bold text-lg">{player.gamesPlayed} GP</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Field Goal %</div>
            <div className="text-yellow-400 font-bold text-lg">{(player.fieldGoalPercentage * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">3-Point %</div>
            <div className="text-cyan-400 font-bold text-lg">{(player.threePointPercentage * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Free Throw %</div>
            <div className="text-indigo-400 font-bold text-lg">{(player.freeThrowPercentage * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Plus/Minus</div>
            <div className={`font-bold text-lg ${player.plusMinus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {player.plusMinus > 0 ? '+' : ''}{player.plusMinus.toFixed(1)}
            </div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-sm">Turnovers</div>
            <div className="text-orange-300 font-bold text-lg">{player.turnovers.toFixed(1)} TPG</div>
          </div>
        </div>
      </div>

      {/* Custom Stat Calculator */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white">Custom Stat Calculator</h2>
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

          <FormulaInput formula={formula} onFormulaChange={handleFormulaChange} />

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Available Stats:</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {Object.entries(statMappings).map(([key, value]) => (
                <div key={key} className="text-slate-300">
                  <span className="font-medium text-orange-300">{key}</span>: {
                    key.includes('%') ? (value * 100).toFixed(1) + '%' : value.toFixed(1)
                  }
                </div>
              ))}
            </div>
          </div>

          {calculatedValue !== null && (
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-slate-300 text-sm">{customStatName}</div>
                  <div className="text-2xl font-bold text-white">{calculatedValue.toFixed(2)}</div>
                  <div className="text-xs text-slate-400">
                    Formula: {formula}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}