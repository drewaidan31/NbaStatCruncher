import { useState } from "react";
import { Search, User, TrendingUp, Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlayerSearchFavorites } from "./player-search-favorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { FavoritePlayer } from "@shared/schema";

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
  availableSeasons?: string[];
}

interface PlayerSearchProps {
  onPlayerSelect: (player: Player, season: string) => void;
  onCompareSelect: (players: { player1: Player; season1: string; player2: Player; season2: string }) => void;
  currentFormula?: string;
  customStatResults?: Array<{ playerId: number; value: number; rank: number }>;
}

export default function PlayerSearch({ onPlayerSelect, onCompareSelect, currentFormula, customStatResults }: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedSeason1, setSelectedSeason1] = useState("");
  const [selectedSeason2, setSelectedSeason2] = useState("");
  const [showSeasonPicker, setShowSeasonPicker] = useState<{ player: Player; isPlayer2: boolean } | null>(null);

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players = [], isLoading, error } = useQuery({
    queryKey: ["/api/nba/players"],
    queryFn: async () => {
      const response = await fetch("/api/nba/players");
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      return response.json();
    },
  });

  // Fetch user's favorite players
  const { data: favorites = [], isLoading: favoritesLoading, error: favoritesError } = useQuery<FavoritePlayer[]>({
    queryKey: ["/api/favorite-players"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await fetch("/api/favorite-players", {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }
      return response.json();
    },
  });

  // Debug favorites state
  console.log("Favorites data:", favorites);
  console.log("Favorites count:", favorites.length);
  console.log("Favorites loading:", favoritesLoading);
  console.log("Favorites error:", favoritesError);

  // Add favorite player mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async ({ playerId, playerName }: { playerId: number; playerName: string }) => {
      console.log("Making API call to add favorite:", { playerId, playerName });
      const response = await fetch(`/api/favorite-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, playerName }),
        credentials: 'include',
      });
      console.log("Add favorite response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Add favorite error:", errorText);
        if (response.status === 409) {
          // Already favorited, just refresh the cache
          queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
          return null;
        }
        throw new Error(`Failed to add favorite: ${response.status} ${errorText}`);
      }
      const result = await response.json();
      console.log("Add favorite success:", result);
      return result;
    },
    onSuccess: (result) => {
      console.log("Add favorite mutation success");
      // Immediately update the cache with the new favorite
      queryClient.setQueryData(["/api/favorite-players"], (oldData: FavoritePlayer[] | undefined) => {
        if (!oldData) return [result];
        return [...oldData, result];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
      toast({
        title: "Added to Favorites!",
        description: "Player added with personalized insights",
      });
    },
    onError: (error) => {
      console.log("Add favorite mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to add player to favorites",
        variant: "destructive",
      });
    },
  });

  // Remove favorite player mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await fetch(`/api/favorite-players/${playerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove favorite");
      return await response.json();
    },
    onSuccess: (_, playerId) => {
      // Immediately update the cache by removing the favorite
      queryClient.setQueryData(["/api/favorite-players"], (oldData: FavoritePlayer[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(fav => fav.playerId !== playerId);
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
      toast({
        title: "Removed from Favorites",
        description: "Player removed from your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player from favorites",
        variant: "destructive",
      });
    },
  });

  const isFavorite = (playerId: number) => {
    return favorites.some((fav: FavoritePlayer) => fav.playerId === playerId);
  };

  const handleToggleFavorite = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log("Heart clicked for player:", player.name, "ID:", player.playerId);
    console.log("Is authenticated:", isAuthenticated);
    console.log("Is favorite:", isFavorite(player.playerId));
    
    if (!isAuthenticated) {
      console.log("User not authenticated, showing login toast");
      toast({
        title: "Please Log In",
        description: "Log in to save favorite players and get personalized insights",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite(player.playerId)) {
      console.log("Removing from favorites");
      removeFavoriteMutation.mutate(player.playerId);
    } else {
      console.log("Adding to favorites");
      addFavoriteMutation.mutate({
        playerId: player.playerId,
        playerName: player.name,
      });
    }
  };

  // Debug: Log the data structure
  console.log("Players data:", players);
  console.log("Query loading:", isLoading);
  console.log("Query error:", error);
  console.log("Search term:", searchTerm);

  const filteredPlayers = searchTerm.length >= 1
    ? players
      .filter((player: Player) => {
        const name = player.name;
        return name && name.toLowerCase().includes(searchTerm.toLowerCase());
      }).slice(0, 10) // Show max 10 suggestions
    : [];

  // Helper function to get custom stat value for a player
  const getCustomStatValue = (player: Player) => {
    if (!customStatResults || !currentFormula) return null;
    const result = customStatResults.find(r => r.playerId === player.playerId);
    return result ? { value: result.value, rank: result.rank } : null;
  };

  const handlePlayerClick = (player: Player) => {
    if (compareMode) {
      if (!selectedPlayer1) {
        // Select first player and show season picker
        setShowSeasonPicker({ player, isPlayer2: false });
      } else {
        // Select second player and show season picker
        setShowSeasonPicker({ player, isPlayer2: true });
      }
    } else {
      onPlayerSelect(player, player.currentSeason || "2024-25");
    }
  };

  const handleSeasonSelect = (season: string) => {
    if (!showSeasonPicker) return;
    
    if (!showSeasonPicker.isPlayer2) {
      // First player selected
      setSelectedPlayer1(showSeasonPicker.player);
      setSelectedSeason1(season);
      setShowSeasonPicker(null);
    } else {
      // Second player selected - start comparison
      setSelectedSeason2(season);
      onCompareSelect({
        player1: selectedPlayer1!,
        season1: selectedSeason1,
        player2: showSeasonPicker.player,
        season2: season
      });
      setCompareMode(false);
      setSelectedPlayer1(null);
      setSelectedSeason1("");
      setSelectedSeason2("");
      setShowSeasonPicker(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-300 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Player Search</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCompareMode(false);
              setSelectedPlayer1(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !compareMode
                ? "bg-orange-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            <User className="w-4 h-4 inline mr-1" />
            Individual
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              compareMode
                ? "bg-orange-600 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Compare
          </button>
        </div>
      </div>

      {compareMode && selectedPlayer1 && !showSeasonPicker && (
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 mb-4 border border-slate-300 dark:border-slate-600">
          <div className="text-sm text-slate-600 dark:text-slate-300">Selected for comparison:</div>
          <div className="text-slate-900 dark:text-white font-medium">
            {selectedPlayer1.name} ({selectedSeason1}) - {selectedPlayer1.team}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Now select a second player to compare</div>
        </div>
      )}

      {/* Season Selection Modal */}
      {showSeasonPicker && (
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4 border border-orange-500">
          <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
            Select season for {showSeasonPicker.player.name}:
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {showSeasonPicker.player.availableSeasons?.map((season) => (
              <button
                key={season}
                onClick={() => handleSeasonSelect(season)}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm py-2 px-3 rounded transition-colors"
              >
                {season}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSeasonPicker(null)}
              className="bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm py-1 px-3 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Search Players:
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-500 dark:placeholder-slate-400"
          placeholder="Type player name... (searches all players from any season)"
        />
      </div>

      {searchTerm.length >= 1 && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-slate-600 dark:text-slate-400">Loading players...</div>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {filteredPlayers.length} suggestion{filteredPlayers.length !== 1 ? 's' : ''}
                {filteredPlayers.length === 10 ? ' (showing top 10)' : ''}
                {currentFormula && customStatResults && (
                  <span className="text-green-600 dark:text-green-400 ml-2">• Showing custom stat: {currentFormula}</span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredPlayers.map((player: Player) => (
                  <div
                    key={player.playerId}
                    onClick={() => handlePlayerClick(player)}
                    className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border border-slate-300 dark:border-slate-600 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20 transform hover:scale-[1.02] group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white transition-all duration-300 ease-in-out group-hover:text-orange-400 group-hover:font-bold group-hover:transform group-hover:translate-x-1">{player.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 transition-all duration-300 ease-in-out group-hover:text-slate-700 dark:group-hover:text-slate-200">
                          {player.team} • {player.position} • {player.currentSeason || "2024-25"}
                        </div>
                        {player.availableSeasons && player.availableSeasons.length > 1 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Played in {player.availableSeasons.length} seasons
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          {(() => {
                            const customStat = getCustomStatValue(player);
                            if (customStat && currentFormula) {
                              return (
                                <>
                                  <div className="text-green-600 dark:text-green-400 font-bold text-base">#{customStat.rank}</div>
                                  <div className="text-green-700 dark:text-green-300 font-medium">{customStat.value.toFixed(2)}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">Custom Stat</div>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <div className="text-orange-600 dark:text-orange-400 font-medium">{player.points.toFixed(1)} PPG</div>
                                  <div className="text-slate-600 dark:text-slate-400">{player.assists.toFixed(1)} APG</div>
                                  <div className="text-slate-600 dark:text-slate-400">{player.rebounds.toFixed(1)} RPG</div>
                                </>
                              );
                            }
                          })()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleFavorite(player, e);
                          }}
                          title={isFavorite(player.playerId) ? "Remove from favorites" : "Add to favorites"}
                          className="opacity-60 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-10 relative"
                          disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                        >
                          <Heart 
                            className={`w-5 h-5 transition-colors ${
                              isFavorite(player.playerId) 
                                ? 'text-orange-500 fill-orange-500' 
                                : 'text-slate-400 hover:text-orange-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-slate-400">No players found matching "{searchTerm}"</div>
            </div>
          )}
        </div>
      )}

      {searchTerm.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <div className="text-slate-600 dark:text-slate-400 mb-2">Search for any NBA player</div>
          <div className="text-slate-500 dark:text-slate-500 text-sm">
            Type a player's name to see unified profiles with all their seasons
          </div>
        </div>
      )}

      {/* Favorite Players Section */}
      <div className="mt-6">
        <PlayerSearchFavorites 
          players={players} 
          onPlayerSelect={onPlayerSelect}
        />
      </div>
    </div>
  );
}