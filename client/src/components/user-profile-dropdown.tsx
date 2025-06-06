import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, User, Calculator, Star, X, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CustomStat, FavoritePlayer, Player } from "@shared/schema";

interface UserProfileDropdownProps {
  players?: Player[];
}

export function UserProfileDropdown({ players = [] }: UserProfileDropdownProps) {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user's custom stats
  const { data: customStats = [] } = useQuery<CustomStat[]>({
    queryKey: ["/api/custom-stats/my"],
    queryFn: async () => {
      const response = await fetch("/api/custom-stats/my", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch user's favorite players
  const { data: favorites = [] } = useQuery<FavoritePlayer[]>({
    queryKey: ["/api/favorite-players"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <Button 
        onClick={() => window.location.href = '/api/login'}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        Log In
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user?.firstName?.[0] || user?.email?.[0] || 'U'}
        </div>
        <span className="hidden md:block text-slate-700 dark:text-slate-300">
          {user?.firstName || user?.email?.split('@')[0] || 'User'}
        </span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-xl border-2 border-orange-200 dark:border-orange-700">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <Crown className="h-5 w-5 text-yellow-500" />
                Your Profile
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="ml-auto hover:bg-orange-100 dark:hover:bg-orange-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* User Info */}
              <div className="border-b border-orange-100 dark:border-orange-800 pb-3">
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email
                  }
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>

              {/* Custom Stats Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Your Custom Stats
                  </h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {customStats.length}
                  </Badge>
                </div>
                {customStats.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {customStats.slice(0, 3).map((stat) => (
                      <div
                        key={stat.id}
                        className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700"
                      >
                        <p className="font-medium text-sm text-blue-900 dark:text-blue-200">
                          {stat.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                          {stat.formula}
                        </p>
                      </div>
                    ))}
                    {customStats.length > 3 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                        +{customStats.length - 3} more stats
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No custom stats created yet
                  </p>
                )}
              </div>

              {/* Favorite Players Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Favorite Players
                  </h3>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {favorites.length}
                  </Badge>
                </div>
                {favorites.length > 0 ? (
                  <div className="space-y-2">
                    {favorites.slice(0, 3).map((favorite, index) => {
                      const player = players.find(p => p.playerId === favorite.playerId);
                      const colors = [
                        'from-red-400 to-pink-400',
                        'from-purple-400 to-indigo-400', 
                        'from-blue-400 to-cyan-400'
                      ];
                      const bgColor = colors[index % colors.length];
                      
                      return (
                        <div
                          key={favorite.id}
                          className="flex items-center gap-3 p-2 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded border border-red-200 dark:border-red-700"
                        >
                          <div className={`w-8 h-8 bg-gradient-to-br ${bgColor} rounded-full flex items-center justify-center shadow`}>
                            <Star className="h-4 w-4 text-white fill-current" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {favorite.playerName}
                            </p>
                            {player && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {player.team} • {player.points.toFixed(1)} PPG
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {favorites.length > 3 && (
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">
                        +{favorites.length - 3} more players
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No favorite players yet
                  </p>
                )}
              </div>

              {/* Personalized Analytics Badge */}
              {favorites.length > 0 && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-1">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-sm">Personalized Analytics</span>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Your custom stats appear 2x more often in featured analysis
                  </p>
                </div>
              )}

              {/* Logout Button */}
              <div className="pt-2 border-t border-orange-100 dark:border-orange-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  className="w-full text-slate-600 hover:text-slate-800 border-slate-300"
                >
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}