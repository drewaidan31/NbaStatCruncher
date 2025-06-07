import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
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
  const itemsPerPage = 20;

  const queryClient = useQueryClient();

  // Fetch player data with season filtering
  const { data: players, isLoading: playersLoading, error: playersError } = useQuery({
    queryKey: ["/api/nba/players", selectedSeason],
    queryFn: async () => {
      try {
        let url = "/api/nba/players";
        if (selectedSeason && selectedSeason !== "all-time") {
          url = `/api/nba/players/season/${selectedSeason}`;
        }
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch NBA data: ${response.status}`);
        }
        const data = await response.json();
        console.log(`NBA players loaded for ${selectedSeason}:`, data.length);
        return data;
      } catch (error) {
        console.error("Error fetching NBA players:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });



  // Calculate custom stats mutation
  const calculateMutation = useMutation({
    mutationFn: async ({ formula, season }: { formula: string; season?: string }) => {
      const response = await apiRequest("POST", "/api/nba/calculate", { formula, season });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to calculate custom statistics");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/nba/calculate", formula], data);
    },
  });

  // Get calculated results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/nba/calculate", formula],
    enabled: false, // Only run when explicitly called
  });

  const handleCalculate = () => {
    if (formula.trim()) {
      calculateMutation.mutate({ formula, season: selectedSeason });
    }
  };

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];

    let filtered = results.filter((result: PlayerResult) => {
      // Handle both old and new data structures
      const player = result.player || result;
      const playerName = player.name || result.name;
      const playerTeam = player.team || result.team;
      const playerPosition = player.position || result.position;
      
      // Search filter
      if (searchTerm && playerName && !playerName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Team filter
      if (selectedTeam !== "all" && playerTeam !== selectedTeam) {
        return false;
      }
      
      // Position filter (simplified matching)
      if (selectedPosition !== "all" && playerPosition && !playerPosition.includes(selectedPosition)) {
        return false;
      }
      
      return true;
    });

    // Sort results
    filtered.sort((a: PlayerResult, b: PlayerResult) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'player':
          aValue = a.player.name;
          bValue = b.player.name;
          break;
        case 'team':
          aValue = a.player.team;
          bValue = b.player.team;
          break;
        case 'customStat':
          aValue = a.customStat;
          bValue = b.customStat;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, searchTerm, selectedTeam, selectedPosition, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredAndSortedResults.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronDown className="w-4 h-4 text-slate-500" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-orange-500" /> : 
      <ChevronDown className="w-4 h-4 text-orange-500" />;
  };

  if (playersError) {
    return (
      <Alert className="border-red-500 bg-red-950 text-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Network Error: Unable to connect to NBA data. Backend is working with your API subscription.
        </AlertDescription>
      </Alert>
    );
  }

  // Show players and allow formula calculation
  if (players && Array.isArray(players) && players.length > 0 && (!results || !Array.isArray(results))) {
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
            disabled={!formula.trim() || calculateMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {calculateMutation.isPending ? "Calculating..." : "Calculate Custom Stats"}
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-700 px-6 py-4 border-b border-slate-300 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
            {formula ? `Results: ${formula}` : "Custom Stat Leaderboard"}
          </h3>
          <div className="flex items-center gap-4">
            {filteredAndSortedResults.length > 0 && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredAndSortedResults.length} players
              </span>
            )}
            <Button
              onClick={handleCalculate}
              disabled={!formula.trim() || calculateMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {calculateMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Calculating...</span>
                </div>
              ) : (
                "Calculate"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {(playersLoading || resultsLoading || calculateMutation.isPending) && (
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-700" />
                  <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-slate-700" />
                </div>
                <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {calculateMutation.error && (
        <div className="p-6">
          <Alert className="border-red-500 bg-red-950 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {calculateMutation.error instanceof Error 
                ? calculateMutation.error.message 
                : "Failed to calculate custom statistics"}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Results table */}
      {filteredAndSortedResults.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('rank')}
                      className="flex items-center space-x-1 hover:text-slate-50 p-0 h-auto font-medium"
                    >
                      <span>Rank</span>
                      {getSortIcon('rank')}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('player')}
                      className="flex items-center space-x-1 hover:text-slate-50 p-0 h-auto font-medium"
                    >
                      <span>Player</span>
                      {getSortIcon('player')}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('team')}
                      className="flex items-center space-x-1 hover:text-slate-50 p-0 h-auto font-medium"
                    >
                      <span>Team</span>
                      {getSortIcon('team')}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('customStat')}
                      className="flex items-center space-x-1 hover:text-slate-50 p-0 h-auto font-medium"
                    >
                      <span>Custom Stat</span>
                      {getSortIcon('customStat')}
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Season</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden sm:table-cell">PTS</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell">AST</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell">REB</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden lg:table-cell">TOV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {paginatedResults.map((result: PlayerResult, index) => {
                  const player = result.player;
                  const initials = player.name.split(' ').map(n => n[0]).join('').substring(0, 2);
                  
                  return (
                    <tr key={player.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${
                          result.rank <= 3 ? 'text-orange-500' : 'text-slate-400'
                        }`}>
                          {result.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-slate-300 font-semibold text-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-50">{player.name}</div>
                            <div className="text-sm text-slate-400">{player.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {player.team}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-slate-50">
                          {result.customStat.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-orange-400">
                          {player.currentSeason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden sm:table-cell">
                        {player.points.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden md:table-cell">
                        {player.assists.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden md:table-cell">
                        {player.rebounds.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 hidden lg:table-cell">
                        {player.turnovers.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-700/30 px-6 py-4 border-t border-slate-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing <span className="font-medium text-slate-50">{startIndex + 1}</span> to{" "}
                  <span className="font-medium text-slate-50">
                    {Math.min(startIndex + itemsPerPage, filteredAndSortedResults.length)}
                  </span>{" "}
                  of <span className="font-medium text-slate-50">{filteredAndSortedResults.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-slate-600 text-slate-300 hover:bg-slate-500"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "secondary"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-orange-600 text-white hover:bg-orange-700"
                              : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-slate-600 text-slate-300 hover:bg-slate-500"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!playersLoading && !resultsLoading && !calculateMutation.isPending && 
       filteredAndSortedResults.length === 0 && !calculateMutation.error && (
        <div className="p-12 text-center">
          <div className="text-slate-400 mb-4">
            {formula ? "No results found for your search criteria." : "Enter a formula and click Calculate to see results."}
          </div>
          {formula && (
            <Button
              onClick={handleCalculate}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Calculate Stats
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
