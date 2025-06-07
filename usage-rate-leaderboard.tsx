import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Calendar } from "lucide-react";

interface LeaderboardEntry {
  playerId: number;
  playerName: string;
  team: string;
  season: string;
  value: number;
  assists: number;
  fieldGoalAttempts: number;
  freeThrowAttempts: number;
  turnovers: number;
  minutesPerGame: number;
}

interface UsageRateLeaderboardProps {
  season?: string;
}

export default function UsageRateLeaderboard({ season = "2024-25" }: UsageRateLeaderboardProps) {
  const [selectedSeason, setSelectedSeason] = useState(season);

  const { data: leaderboardData, isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/nba/custom-stats', 'Usage Rate (USG%)', selectedSeason],
    queryFn: async () => {
      const formula = "100 * (0.33 * AST + FGA + 0.44 * FTA + TOV) / (MIN * 2.4)";
      const response = await fetch(`/api/nba/custom-stats?formula=${encodeURIComponent(formula)}&season=${selectedSeason}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage rate data');
      }
      return response.json();
    }
  });

  const availableSeasons = [
    "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
    "2019-20", "2018-19", "2017-18", "2016-17", "2015-16"
  ];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Usage Rate Leaders
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-slate-600 dark:text-slate-400">Loading usage rate data...</div>
        </div>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Usage Rate Leaders
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-slate-600 dark:text-slate-400">Unable to load usage rate data</div>
        </div>
      </div>
    );
  }

  const topPlayers = leaderboardData.slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Usage Rate Leaders
        </h3>
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {availableSeasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {topPlayers.map((player, index) => (
          <div
            key={`${player.playerId}-${player.season}`}
            className={`p-4 rounded-lg border transition-colors ${
              index < 3
                ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30'
                : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-amber-600 text-black' :
                  'bg-slate-600 text-white'
                }`}>
                  {index + 1}
                </div>
                
                <div>
                  <div className="text-white font-medium">{player.playerName}</div>
                  <div className="text-slate-400 text-sm">{player.team} • {player.season}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-orange-400 font-bold text-lg flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {player.value.toFixed(1)}%
                </div>
                <div className="text-slate-400 text-xs">Usage Rate</div>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
              <div className="text-center">
                <div className="text-slate-400">FGA</div>
                <div className="text-white font-medium">{player.fieldGoalAttempts?.toFixed(0) || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">AST</div>
                <div className="text-white font-medium">{player.assists?.toFixed(1) || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">TOV</div>
                <div className="text-white font-medium">{player.turnovers?.toFixed(1) || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400">MIN</div>
                <div className="text-white font-medium">{player.minutesPerGame?.toFixed(1) || 'N/A'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-slate-700 rounded-lg">
        <div className="text-sm text-slate-300 mb-1">
          <strong>Usage Rate Formula:</strong>
        </div>
        <code className="text-xs text-slate-400 font-mono">
          USG% = 100 × (0.33 × AST + FGA + 0.44 × FTA + TOV) / (MIN × 2.4)
        </code>
        <div className="text-xs text-slate-500 mt-2">
          Measures the percentage of team possessions a player uses while on the court
        </div>
      </div>
    </div>
  );
}