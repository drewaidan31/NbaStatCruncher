import { useState, useEffect } from "react";
import { ArrowLeft, Calculator, TrendingUp, Sparkles, BarChart3, Calendar } from "lucide-react";
import FormulaInput from "./formula-input";
import FormulaExamples from "./formula-examples";
import { evaluate } from "mathjs";
import { useQuery } from "@tanstack/react-query";

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

interface PlayerAnalysisProps {
  player: Player;
  season: string;
  onBack: () => void;
}

export default function PlayerAnalysis({ player, season, onBack }: PlayerAnalysisProps) {
  const [formula, setFormula] = useState("PPG + APG + RPG");
  const [customStatName, setCustomStatName] = useState("Total Impact");
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(player.currentSeason || season);
  const [currentPlayerData, setCurrentPlayerData] = useState(player);

  // Query to fetch specific season data for the player
  const { data: seasonPlayerData, isLoading: isLoadingSeason } = useQuery({
    queryKey: ['/api/nba/players', player.playerId, 'season', selectedSeason],
    enabled: selectedSeason !== player.currentSeason && !!selectedSeason,
  });

  // Update current player data when season changes
  useEffect(() => {
    if (seasonPlayerData) {
      setCurrentPlayerData(seasonPlayerData as Player);
    } else if (selectedSeason === player.currentSeason) {
      setCurrentPlayerData(player);
    }
  }, [seasonPlayerData, selectedSeason, player]);

  const statMappings = {
    'PPG': currentPlayerData.points,
    'APG': currentPlayerData.assists,
    'RPG': currentPlayerData.rebounds,
    'SPG': currentPlayerData.steals,
    'BPG': currentPlayerData.blocks,
    'TPG': currentPlayerData.turnovers,
    'FG%': currentPlayerData.fieldGoalPercentage,
    '3P%': currentPlayerData.threePointPercentage,
    'FT%': currentPlayerData.freeThrowPercentage,
    'GP': currentPlayerData.gamesPlayed,
    '+/-': currentPlayerData.plusMinus,
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{player.name}</h1>
              <p className="text-slate-300">{currentPlayerData.team} • {currentPlayerData.position} • {selectedSeason}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Season Selector */}
            {player.availableSeasons && player.availableSeasons.length > 1 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoadingSeason}
                >
                  {player.availableSeasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="text-right">
              <p className="text-slate-400 text-sm">Custom Stat Calculator</p>
              <p className="text-orange-400 font-medium">Build your own analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Stat Calculator - Main Focus */}
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
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Formula Examples
          </button>
        </div>

        {/* Result Display - Prominent */}
        {calculatedValue !== null && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-center shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">{customStatName}</h3>
            </div>
            <div className="text-5xl font-bold text-white mb-2">{calculatedValue.toFixed(2)}</div>
            <div className="text-orange-100 text-sm bg-black/20 rounded-lg px-3 py-1 inline-block">
              Formula: {formula}
            </div>
          </div>
        )}

        {/* No Result State */}
        {calculatedValue === null && (
          <div className="bg-slate-700/50 rounded-xl p-8 mb-6 text-center border-2 border-dashed border-slate-600">
            <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Ready to Calculate</h3>
            <p className="text-slate-400 text-sm">Enter a formula below to see your custom stat result</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom Stat Name:
            </label>
            <input
              type="text"
              value={customStatName}
              onChange={(e) => setCustomStatName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
              placeholder="Enter a name for your custom stat..."
            />
          </div>

          <FormulaInput formula={formula} onFormulaChange={handleFormulaChange} />

          {showExamples && (
            <FormulaExamples onFormulaSelect={(selectedFormula) => {
              setFormula(selectedFormula);
              handleFormulaChange(selectedFormula);
              setShowExamples(false);
            }} />
          )}

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-3 font-medium">Available Player Stats:</div>
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
      </div>

      {/* Compact Player Stats */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-medium text-white">Season Statistics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Points</div>
            <div className="text-orange-400 font-bold">{currentPlayerData.points.toFixed(1)} PPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Assists</div>
            <div className="text-blue-400 font-bold">{currentPlayerData.assists.toFixed(1)} APG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Rebounds</div>
            <div className="text-green-400 font-bold">{currentPlayerData.rebounds.toFixed(1)} RPG</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Field Goal %</div>
            <div className="text-yellow-400 font-bold">{(currentPlayerData.fieldGoalPercentage * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Plus/Minus</div>
            <div className={`font-bold ${currentPlayerData.plusMinus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentPlayerData.plusMinus > 0 ? '+' : ''}{currentPlayerData.plusMinus.toFixed(1)}
            </div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs">Games</div>
            <div className="text-slate-300 font-bold">{currentPlayerData.gamesPlayed} GP</div>
          </div>
        </div>
      </div>
    </div>
  );
}