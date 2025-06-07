import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import type { Player } from "@shared/schema";

interface LeaderboardTableProps {
  formula: string;
  searchTerm: string;
  selectedTeam: string;
  selectedPosition: string;
  selectedSeason?: string;
}

interface PlayerResult {
  player: Player;
  customStat: number;
  rank: number;
  formula: string;
  bestSeason?: string;
}

type SortField = 'rank' | 'player' | 'team' | 'customStat';
type SortDirection = 'asc' | 'desc';

export default function LeaderboardTable({
  formula,
  searchTerm,
  selectedTeam,
  selectedPosition,
  selectedSeason = "all-time",
}: LeaderboardTableProps) {
  const [sortField, setSortField] = useState<SortField>('customStat');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const itemsPerPage = 20;

  // Fetch player data with season filtering
  const { data: players, isLoading, error: playersError } = useQuery({
    queryKey: ["/api/nba/players", selectedSeason],
    queryFn: async () => {
      try {
        let url = "/api/nba/players";
        if (selectedSeason && selectedSeason !== "all-time") {
          url += `?season=${selectedSeason}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch players: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching players:", error);
        throw error;
      }
    },
  });

  const handleCalculate = async () => {
    if (!formula.trim()) return;
    
    setIsCalculating(true);
    try {
      const response = await fetch("/api/nba/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula, season: selectedSeason }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error("Failed to calculate stats");
        setResults([]);
      }
    } catch (error) {
      console.error("Error calculating stats:", error);
      setResults([]);
    } finally {
      setIsCalculating(false);
    }
  };

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];

    let filtered = results.filter((result: PlayerResult) => {
      const player = result.player;
      if (!player) return false;

      const matchesSearch = !searchTerm || 
        player.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = !selectedTeam || selectedTeam === "all" || 
        player.team === selectedTeam;
      const matchesPosition = !selectedPosition || selectedPosition === "all" || 
        player.position === selectedPosition;
      
      return matchesSearch && matchesTeam && matchesPosition;
    });

    filtered.sort((a: PlayerResult, b: PlayerResult) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'player':
          aValue = a.player?.name || '';
          bValue = b.player?.name || '';
          break;
        case 'team':
          aValue = a.player?.team || '';
          bValue = b.player?.team || '';
          break;
        case 'customStat':
          aValue = a.customStat;
          bValue = b.customStat;
          break;
        default:
          aValue = a.customStat;
          bValue = b.customStat;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [results, searchTerm, selectedTeam, selectedPosition, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredAndSortedResults.slice(startIndex, startIndex + itemsPerPage);

  // Show loading state
  if (isLoading || isCalculating) {
    const loadingText = isCalculating 
      ? "Calculating custom statistics..." 
      : "Loading NBA players...";
    
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          <span className="text-slate-300">{loadingText}</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (playersError) {
    return (
      <Alert className="bg-red-900/20 border-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-200">
          Failed to load NBA players. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Show players and allow formula calculation
  if (players && Array.isArray(players) && players.length > 0 && (!results || !Array.isArray(results) || results.length === 0)) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">
              NBA Players Ready ({players.length} players)
            </h3>
            <p className="text-slate-300">
              Enter a formula above and click "Calculate Custom Stats" to see the leaderboard
            </p>
          </div>
          <Button 
            onClick={handleCalculate}
            disabled={!formula.trim() || isCalculating}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isCalculating ? "Calculating..." : "Calculate Custom Stats"}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.slice(0, 8).map((player: any) => (
            <div key={player.id} className="bg-slate-700 p-4 rounded-lg">
              <div className="font-medium text-slate-50 mb-1">{player.name}</div>
              <div className="text-sm text-slate-400 mb-2">{player.position} - {player.team}</div>
              <div className="text-xs text-slate-500">
                {player.points.toFixed(1)} PTS, {player.assists.toFixed(1)} AST, {player.rebounds.toFixed(1)} REB
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show results table
  if (results && Array.isArray(results) && results.length > 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-50 mb-2">
                Custom Stat Results
              </h3>
              {filteredAndSortedResults.length !== results.length && (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {filteredAndSortedResults.length} of {results.length} players
                </span>
              )}
            </div>
            <Button
              onClick={handleCalculate}
              disabled={!formula.trim() || isCalculating}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isCalculating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Calculating...</span>
                </div>
              ) : (
                "Recalculate"
              )}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th 
                  className="text-left p-4 text-slate-300 cursor-pointer hover:text-slate-50 transition-colors"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Rank</span>
                    {getSortIcon('rank')}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-slate-300 cursor-pointer hover:text-slate-50 transition-colors"
                  onClick={() => handleSort('player')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Player</span>
                    {getSortIcon('player')}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-slate-300 cursor-pointer hover:text-slate-50 transition-colors"
                  onClick={() => handleSort('team')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Team</span>
                    {getSortIcon('team')}
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-slate-300 cursor-pointer hover:text-slate-50 transition-colors"
                  onClick={() => handleSort('customStat')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Custom Stat</span>
                    {getSortIcon('customStat')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((result: PlayerResult, index) => {
                const player = result.player;
                if (!player) return null;

                return (
                  <tr key={`${player.id}-${index}`} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-orange-600/20 text-orange-300 border-orange-600/30">
                        #{result.rank}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-slate-50">{player.name}</div>
                        <div className="text-sm text-slate-400">{player.position}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">{player.team}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-orange-400 font-medium">
                        {typeof result.customStat === 'number' ? result.customStat.toFixed(2) : 'N/A'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedResults.length)} of {filteredAndSortedResults.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-500" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">No Data Available</h3>
        <p className="text-sm">
          {!formula.trim() 
            ? "Enter a formula to calculate custom statistics" 
            : "Click 'Calculate Custom Stats' to generate results"
          }
        </p>
      </div>
    </div>
  );
}