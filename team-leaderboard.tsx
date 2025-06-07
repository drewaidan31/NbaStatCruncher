import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Player } from "@shared/schema";

interface TeamLeaderboardProps {
  formula: string;
  selectedSeason?: string;
  searchTerm: string;
}

interface TeamStats {
  team: string;
  playerCount: number;
  avgCustomStat: number;
  topPlayer: {
    name: string;
    customStat: number;
  };
  totalCustomStat: number;
}

type SortField = 'team' | 'playerCount' | 'avgCustomStat' | 'topPlayer' | 'totalCustomStat';
type SortDirection = 'asc' | 'desc';

export default function TeamLeaderboard({
  formula,
  selectedSeason = "all-time",
  searchTerm,
}: TeamLeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('avgCustomStat');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch players data
  const { data: players, isLoading } = useQuery({
    queryKey: ["/api/nba/players", selectedSeason],
    queryFn: async () => {
      try {
        let url = "/api/nba/players";
        if (selectedSeason && selectedSeason !== "all-time") {
          url = `/api/nba/players/season/${selectedSeason}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching players:", error);
        throw error;
      }
    },
  });

  // Calculate custom stat for each player
  const calculateCustomStat = (player: Player) => {
    if (!formula.trim()) return 0;

    const statMappings = {
      'PPG': player.points,
      'PTS': player.points,
      'APG': player.assists,
      'AST': player.assists,
      'RPG': player.rebounds,
      'REB': player.rebounds,
      'SPG': player.steals,
      'STL': player.steals,
      'BPG': player.blocks,
      'BLK': player.blocks,
      'TPG': player.turnovers,
      'TOV': player.turnovers,
      'FG%': player.fieldGoalPercentage,
      'FG_PCT': player.fieldGoalPercentage,
      '3P%': player.threePointPercentage,
      'THREE_PCT': player.threePointPercentage,
      'FT%': player.freeThrowPercentage,
      'FT_PCT': player.freeThrowPercentage,
      'GP': player.gamesPlayed,
      'PLUS_MINUS': player.plusMinus,
      '+/-': player.plusMinus,
      'MIN': player.minutesPerGame || 32.5
    };

    try {
      let expression = formula.toUpperCase();
      
      // Replace stat abbreviations with actual values
      Object.entries(statMappings).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(regex, value.toString());
      });
      
      // Simple evaluation for basic math operations
      const result = Function(`"use strict"; return (${expression})`)();
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
      return 0;
    }
  };

  // Aggregate team statistics
  const teamStats = useMemo(() => {
    if (!players || !Array.isArray(players) || !formula.trim()) return [];

    const teamMap = new Map<string, {
      players: Player[];
      customStats: number[];
    }>();

    // Filter players by search term and group by team
    const filteredPlayers = players.filter(player =>
      !searchTerm || player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredPlayers.forEach(player => {
      const customStat = calculateCustomStat(player);
      if (!teamMap.has(player.team)) {
        teamMap.set(player.team, { players: [], customStats: [] });
      }
      teamMap.get(player.team)!.players.push(player);
      teamMap.get(player.team)!.customStats.push(customStat);
    });

    // Calculate team aggregates
    const teamStatsArray: TeamStats[] = [];
    teamMap.forEach((data, team) => {
      const customStats = data.customStats;
      const players = data.players;
      
      if (customStats.length === 0) return;

      const avgCustomStat = customStats.reduce((a, b) => a + b, 0) / customStats.length;
      const totalCustomStat = customStats.reduce((a, b) => a + b, 0);
      
      // Find top player on team
      let topPlayer = { name: '', customStat: -Infinity };
      players.forEach((player, index) => {
        if (customStats[index] > topPlayer.customStat) {
          topPlayer = {
            name: player.name,
            customStat: customStats[index]
          };
        }
      });

      teamStatsArray.push({
        team,
        playerCount: players.length,
        avgCustomStat,
        topPlayer,
        totalCustomStat
      });
    });

    // Sort teams
    teamStatsArray.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'team':
          aValue = a.team;
          bValue = b.team;
          break;
        case 'playerCount':
          aValue = a.playerCount;
          bValue = b.playerCount;
          break;
        case 'avgCustomStat':
          aValue = a.avgCustomStat;
          bValue = b.avgCustomStat;
          break;
        case 'topPlayer':
          aValue = a.topPlayer.customStat;
          bValue = b.topPlayer.customStat;
          break;
        case 'totalCustomStat':
          aValue = a.totalCustomStat;
          bValue = b.totalCustomStat;
          break;
        default:
          aValue = a.avgCustomStat;
          bValue = b.avgCustomStat;
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return teamStatsArray;
  }, [players, formula, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="text-center py-8">
          <div className="text-lg">Loading team data...</div>
        </div>
      </div>
    );
  }

  if (!formula.trim()) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="text-center py-8">
          <div className="text-lg text-slate-300">Enter a formula to see team leaderboards</div>
          <div className="text-sm text-slate-400 mt-2">
            Example: PPG + RPG + APG for overall impact by team
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
        <h3 className="font-semibold text-slate-50">
          Team Leaderboard: {formula}
        </h3>
        <div className="text-sm text-slate-400 mt-1">
          {teamStats.length} teams • Season: {selectedSeason === "all-time" ? "All-Time" : selectedSeason}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-600">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Rank
              </th>
              <SortHeader field="team">Team</SortHeader>
              <SortHeader field="playerCount">Players</SortHeader>
              <SortHeader field="avgCustomStat">Avg Score</SortHeader>
              <SortHeader field="totalCustomStat">Total Score</SortHeader>
              <SortHeader field="topPlayer">Top Player</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {teamStats.map((team, index) => (
              <tr key={team.team} className="hover:bg-slate-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Badge 
                      variant={index < 3 ? "default" : "secondary"}
                      className={
                        index === 0 ? "bg-yellow-600 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-orange-600 text-white" :
                        "bg-slate-600 text-slate-300"
                      }
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-lg text-orange-400">
                    {team.team}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300">
                    {team.playerCount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-slate-50">
                    {team.avgCustomStat.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300">
                    {team.totalCustomStat.toFixed(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-50">
                    {team.topPlayer.name}
                  </div>
                  <div className="text-xs text-orange-400">
                    {team.topPlayer.customStat.toFixed(2)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teamStats.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No teams found matching your criteria
        </div>
      )}
    </div>
  );
}