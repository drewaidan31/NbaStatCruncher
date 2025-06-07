import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, X, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { FavoritePlayer, Player } from "@shared/schema";

interface FavoritePlayersProps {
  onFavoriteChange?: (hasFavorites: boolean) => void;
  players: Player[];
}

export function FavoritePlayers({ onFavoriteChange, players }: FavoritePlayersProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        title: "Player Added",
        description: "Player added to your favorites",
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
        description: "Player removed from your favorites",
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
        title: "Authentication Required",
        description: "Please log in to save favorite players",
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

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorite Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Log in to save your favorite players and get personalized insights</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorite Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading your favorites...</p>
        </CardContent>
      </Card>
    );
  }

  const displayedFavorites = showAll ? favorites : favorites.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Favorite Players
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {favorites.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No favorite players yet</p>
            <p className="text-sm text-muted-foreground">
              Click the heart icon on any player to add them to your favorites and get personalized insights
            </p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Personalized Insights</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Your custom stats appear 2x more often in random graphs for these players
              </p>
            </div>

            <div className="space-y-2">
              {displayedFavorites.map((favorite: FavoritePlayer) => {
                const player = players.find(p => p.playerId === favorite.playerId);
                return (
                  <div
                    key={favorite.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <div>
                        <p className="font-medium">{favorite.playerName}</p>
                        {player && (
                          <p className="text-sm text-muted-foreground">
                            {player.team} • {player.position}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => player && handleToggleFavorite(player)}
                      disabled={removeFavoriteMutation.isPending}
                    >
                      <X className="h-4 w-4" />
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
                className="w-full"
              >
                {showAll ? "Show Less" : `Show All ${favorites.length} Favorites`}
              </Button>
            )}
          </>
        )}

        {/* Quick add section */}
        {players.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Quick Add</h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {players.slice(0, 5).filter(player => !isFavorite(player.playerId)).map((player) => (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.team} • {player.position}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(player)}
                    disabled={addFavoriteMutation.isPending}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Heart button component for individual players
interface FavoriteButtonProps {
  player: Player;
  className?: string;
}

export function FavoriteButton({ player, className = "" }: FavoriteButtonProps) {
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
        title: "Added to Favorites",
        description: `${player.name} added to your favorites`,
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
        title: "Authentication Required",
        description: "Please log in to save favorite players",
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
      className={`${className} ${isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
}