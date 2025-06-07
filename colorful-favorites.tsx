import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, X, Star, TrendingUp, Search, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { FavoritePlayer, Player } from "@shared/schema";

interface ColorfulFavoritesProps {
  onFavoriteChange?: (hasFavorites: boolean) => void;
  players: Player[];
}

export function ColorfulFavorites({ onFavoriteChange, players }: ColorfulFavoritesProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Fetch user's favorite players
  const { data: favorites = [], isLoading } = useQuery<FavoritePlayer[]>({
    queryKey: ["/api/favorite-players"],
    enabled: isAuthenticated,
  });

  // Add favorite player mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async ({ playerId, playerName }: { playerId: number; playerName: string }) => {
      const response = await fetch(`/api/favorite-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, playerName }),
      });
      if (!response.ok) throw new Error("Failed to add favorite");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
      toast({
        title: "🌟 Player Added!",
        description: "Added to your favorites with personalized insights",
      });
      onFavoriteChange?.(true);
    },
    onError: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
      toast({
        title: "Player Removed",
        description: "Removed from your favorites",
      });
      onFavoriteChange?.(favorites.length <= 1);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player from favorites",
        variant: "destructive",
      });
    },
  });

  const handleToggleFavorite = (player: Player) => {
    if (!isAuthenticated) {
      toast({
        title: "Please Log In",
        description: "Log in to save your favorite players and get personalized insights",
        variant: "destructive",
      });
      return;
    }

    const isFavorite = favorites.some((fav: FavoritePlayer) => fav.playerId === player.playerId);
    
    if (isFavorite) {
      removeFavoriteMutation.mutate(player.playerId);
    } else {
      addFavoriteMutation.mutate({
        playerId: player.playerId,
        playerName: player.name,
      });
    }
  };

  const isFavorite = (playerId: number) => {
    return favorites.some((fav: FavoritePlayer) => fav.playerId === playerId);
  };

  // Filter players based on search term
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedFavorites = showAll ? favorites : favorites.slice(0, 3);
  const displayedSearchResults = filteredPlayers.slice(0, 8);

  if (!isAuthenticated) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Crown className="h-6 w-6 text-yellow-500" />
            Your Basketball Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Sparkles className="h-16 w-16 mx-auto text-purple-400 mb-4" />
          <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-2">
            Unlock Personalized Insights
          </h3>
          <p className="text-purple-600 dark:text-purple-300 mb-4">
            Log in to save your favorite players and get custom analytics tailored just for you
          </p>
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-800/30 dark:to-blue-800/30 rounded-lg p-4 text-sm text-purple-700 dark:text-purple-300">
            Your custom stats will appear 2x more often in featured analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Heart className="h-6 w-6 text-red-500 animate-pulse" />
            Your Favorite Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-3/4"></div>
            <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-rose-200 dark:border-rose-700 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-rose-500/10 to-purple-500/10 dark:from-rose-500/20 dark:to-purple-500/20">
        <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
          <Heart className="h-6 w-6 text-red-500 animate-pulse" />
          Your Favorite Players
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-pink-200 to-purple-200 text-purple-800">
              {favorites.length} {favorites.length === 1 ? 'Player' : 'Players'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Search Section */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search players by name or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-700 focus:border-purple-400 dark:focus:border-purple-500"
            />
          </div>
          
          {searchTerm && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Search Results ({filteredPlayers.length})
              </h4>
              {displayedSearchResults.map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-pink-50 dark:from-gray-800 dark:to-purple-900/30 rounded-lg border border-pink-100 dark:border-pink-800 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {player.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{player.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {player.team} • {player.position}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(player)}
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                    className={`${isFavorite(player.playerId) 
                      ? "text-red-500 hover:text-red-600" 
                      : "text-gray-400 hover:text-red-500"
                    } transition-colors`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite(player.playerId) ? "fill-current" : ""}`} />
                  </Button>
                </div>
              ))}
              {filteredPlayers.length > 8 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  Showing first 8 results. Continue typing to narrow down.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Favorites Display */}
        {favorites.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                No favorites yet
              </h3>
              <p className="text-purple-600 dark:text-purple-300 text-sm">
                Search for players above and click the heart to add them to your favorites
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Personalized Insights Banner */}
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Personalized Insights Active</span>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your custom stats appear 2x more often in featured analysis for these players
              </p>
            </div>

            {/* Favorites List */}
            <div className="space-y-3">
              {displayedFavorites.map((favorite: FavoritePlayer, index) => {
                const player = players.find(p => p.playerId === favorite.playerId);
                const colors = [
                  'from-red-400 to-pink-400',
                  'from-purple-400 to-indigo-400', 
                  'from-blue-400 to-cyan-400',
                  'from-green-400 to-emerald-400',
                  'from-yellow-400 to-orange-400'
                ];
                const bgColor = colors[index % colors.length];
                
                return (
                  <div
                    key={favorite.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${bgColor} rounded-full flex items-center justify-center shadow-lg`}>
                        <Star className="h-6 w-6 text-white fill-current" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {favorite.playerName}
                        </h4>
                        {player && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {player.team} • {player.position} • {player.points.toFixed(1)} PPG
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => player && handleToggleFavorite(player)}
                      disabled={removeFavoriteMutation.isPending}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {favorites.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-200 dark:border-pink-700 hover:from-pink-100 hover:to-purple-100"
              >
                {showAll ? "Show Less" : `Show All ${favorites.length} Favorites`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced heart button component for individual players
interface ColorfulFavoriteButtonProps {
  player: Player;
  className?: string;
  showLabel?: boolean;
}

export function ColorfulFavoriteButton({ player, className = "", showLabel = false }: ColorfulFavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery<FavoritePlayer[]>({
    queryKey: ["/api/favorite-players"],
    enabled: isAuthenticated,
  });

  const isFavorite = favorites.some((fav: FavoritePlayer) => fav.playerId === player.playerId);

  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorite-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.playerId, playerName: player.name }),
      });
      if (!response.ok) throw new Error("Failed to add favorite");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
      toast({
        title: "🌟 Added to Favorites!",
        description: `${player.name} is now in your favorites with personalized insights`,
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorite-players/${player.playerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove favorite");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-players"] });
      toast({
        title: "Removed from Favorites",
        description: `${player.name} removed from your favorites`,
      });
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Please Log In",
        description: "Log in to save favorite players and get personalized insights",
        variant: "destructive",
      });
      return;
    }

    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
      className={`${className} ${
        isFavorite 
          ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
          : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      } transition-all duration-200 ${showLabel ? "px-3 py-2" : ""}`}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current animate-pulse" : ""} ${showLabel ? "mr-2" : ""}`} />
      {showLabel && (isFavorite ? "Favorited" : "Add to Favorites")}
    </Button>
  );
}