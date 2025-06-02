import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StatCalculator from "./components/stat-calculator";
import SaveStatDialog from "./components/save-stat-dialog";

const queryClient = new QueryClient();

function MainApp() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formula, setFormula] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("2024-25");
  const [savedStats, setSavedStats] = useState<Array<{
    id: number;
    name: string;
    description: string;
    formula: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/nba/players?season=${selectedSeason}`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
          setError("");
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

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    setLoading(true);
    setResults([]);
  };

  const calculateStats = async () => {
    if (!formula.trim()) return;
    
    try {
      const response = await fetch("/api/nba/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setError("Failed to calculate custom statistics");
      }
    } catch (err) {
      console.error("Error calculating stats:", err);
      setError("Error calculating statistics");
    }
  };

  const handleSaveStat = (name: string, description: string) => {
    const newStat = {
      id: Date.now(),
      name,
      description,
      formula,
      createdAt: new Date().toISOString()
    };
    
    setSavedStats(prev => [newStat, ...prev]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            NBA Custom Stats Calculator
          </h1>
          <p className="text-xl text-slate-300">
            Create custom basketball statistics with authentic NBA player data
          </p>
          
          {/* Season Selector */}
          <div className="mt-6 flex justify-center">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <label htmlFor="season-select" className="block text-sm font-medium text-slate-300 mb-2">
                Select NBA Season:
              </label>
              <select
                id="season-select"
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="2024-25">2024-25 Season (Current)</option>
                <option value="2023-24">2023-24 Season</option>
                <option value="2022-23">2022-23 Season</option>
                <option value="2021-22">2021-22 Season</option>
                <option value="2020-21">2020-21 Season</option>
                <option value="2019-20">2019-20 Season</option>
                <option value="2018-19">2018-19 Season</option>
                <option value="2017-18">2017-18 Season</option>
                <option value="2016-17">2016-17 Season</option>
                <option value="2015-16">2015-16 Season</option>
                <option value="2014-15">2014-15 Season</option>
                <option value="2013-14">2013-14 Season</option>
                <option value="2012-13">2012-13 Season</option>
                <option value="2011-12">2011-12 Season</option>
                <option value="2010-11">2010-11 Season</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading NBA player data...</div>
          </div>
        ) : players.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4">NBA Players Loaded ({players.length} players)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {players.slice(0, 9).map((player: any) => (
                  <div key={player.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="font-medium text-slate-50 mb-1">{player.name}</div>
                    <div className="text-sm text-slate-400 mb-2">{player.position} - {player.team}</div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>{player.points.toFixed(1)} PTS, {player.assists.toFixed(1)} AST, {player.rebounds.toFixed(1)} REB</div>
                      <div>{player.turnovers.toFixed(1)} TOV, {player.steals.toFixed(1)} STL, {player.blocks.toFixed(1)} BLK</div>
                      <div>FG: {(player.fieldGoalPercentage * 100).toFixed(1)}%, +/-: {player.plusMinus.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <StatCalculator 
                onFormulaChange={setFormula}
                onCalculate={calculateStats}
              />

              {results.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <SaveStatDialog 
                    formula={formula}
                    onSave={handleSaveStat}
                  />
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Custom Statistics Leaderboard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2">Rank</th>
                        <th className="text-left py-2">Player</th>
                        <th className="text-left py-2">Team</th>
                        <th className="text-left py-2">Custom Stat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result: any, index) => (
                        <tr key={result.player.id} className="border-b border-slate-700">
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2 font-medium">{result.player.name}</td>
                          <td className="py-2">{result.player.team}</td>
                          <td className="py-2">{result.customStat.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {savedStats.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4">Your Saved Custom Stats</h3>
                <div className="space-y-4">
                  {savedStats.map((stat) => (
                    <div key={stat.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-50">{stat.name}</h4>
                        <button
                          onClick={() => {
                            setFormula(stat.formula);
                            calculateStats();
                          }}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                        >
                          Use Formula
                        </button>
                      </div>
                      {stat.description && (
                        <p className="text-sm text-slate-400 mb-2">{stat.description}</p>
                      )}
                      <div className="text-xs text-slate-500 font-mono">{stat.formula}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-lg text-slate-300">No NBA player data available</div>
          </div>
        )}
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