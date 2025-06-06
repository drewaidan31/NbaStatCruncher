import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, X, Star, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { FavoritePlayer, Player } from "@shared/schema";

interface PlayerSearchFavoritesProps {
  players: Player[];
  onPlayerSelect?: (player: Player, season: string) => void;
}

export function PlayerSearchFavorites({ players, onPlayerSelect }: PlayerSearchFavoritesProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's favorite players
  const { data: favorites = [], isLoading } = useQuery<FavoritePlayer[]>({
    queryKey: ["/api/favorite-players"],
    enabled: isAuthenticated,
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
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player from favorites",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFavorite = (playerId: number) => {
    removeFavoriteMutation.mutate(playerId);
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <CardContent className="text-center py-6">
          <Heart className="h-12 w-12 mx-auto text-blue-400 mb-3" />
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Save Your Favorite Players
          </h3>
          <p className="text-blue-600 dark:text-blue-300 text-sm mb-4">
            Log in to save players and get personalized analytics with your custom stats
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Log In to Save Favorites
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Heart className="h-5 w-5 text-red-500 animate-pulse" />
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
    <Card className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-rose-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border-rose-200 dark:border-rose-700">
      <CardHeader className="bg-gradient-to-r from-rose-500/10 to-purple-500/10 dark:from-rose-500/20 dark:to-purple-500/20">
        <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
          <Heart className="h-5 w-5 text-red-500" />
          Your Favorite Players
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-pink-200 to-purple-200 text-purple-800">
              {favorites.length} {favorites.length === 1 ? 'Player' : 'Players'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                No favorites yet
              </h3>
              <p className="text-purple-600 dark:text-purple-300 text-sm mb-3">
                Search for players above and click the ❤️ heart icon to add them to your favorites
              </p>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3 text-sm text-purple-700 dark:text-purple-300">
                💡 Tip: Favorited players get personalized insights with your custom stats appearing 2x more often
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">


            {/* Favorites List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {favorites.map((favorite: FavoritePlayer, index) => {
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
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20"
                    onClick={() => {
                      if (player && onPlayerSelect) {
                        onPlayerSelect(player, player.currentSeason || '2024-25');
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${bgColor} rounded-full flex items-center justify-center shadow`}>
                        <Star className="h-5 w-5 text-white fill-current" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {favorite.playerName}
                        </h4>
                        {player && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {player.team} • {player.position} • {player.points.toFixed(1)} PPG
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(favorite.playerId);
                      }}
                      disabled={removeFavoriteMutation.isPending}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from favorites"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}