import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StatCalculator from "./components/stat-calculator";

const queryClient = new QueryClient();

export default function App() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formula, setFormula] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/nba/players");
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
  }, []);

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
      setError("Error calculating statistics");
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              NBA Custom Stats Calculator
            </h1>
            <p className="text-xl text-slate-300">
              Create custom basketball statistics with authentic 2024-25 NBA player data
            </p>
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
                        {results.map((result, index) => (
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
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-lg text-slate-300">No NBA player data available</div>
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
