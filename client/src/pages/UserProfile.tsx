import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calculator, Star, ArrowLeft, User, Crown } from "lucide-react";
import type { CustomStat, FavoritePlayer, Player, User as UserType } from "@shared/schema";

interface UserProfileProps {
  players: Player[];
  onBack: () => void;
}

export default function UserProfile({ players, onBack }: UserProfileProps) {
  const { isAuthenticated, user } = useAuth();
  const typedUser = user as UserType | null;

  // Fetch user's custom stats
  const { data: customStats = [], isLoading: statsLoading } = useQuery<CustomStat[]>({
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
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<FavoritePlayer[]>({
    queryKey: ["/api/favorite-players"],
    queryFn: async () => {
      const response = await fetch("/api/favorite-players", {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You need to be signed in to view your profile
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {typedUser?.firstName?.[0] || typedUser?.email?.[0] || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {typedUser?.firstName && typedUser?.lastName 
                  ? `${typedUser.firstName} ${typedUser.lastName}`
                  : typedUser?.email?.split('@')[0] || 'User'
                }
              </h1>
              <p className="text-slate-600 dark:text-slate-400">{typedUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Custom Stats Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardTitle className="flex items-center gap-3 text-blue-900 dark:text-blue-200">
                <Calculator className="w-6 h-6 text-blue-600" />
                My Custom Stats
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {customStats.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-blue-100 dark:bg-blue-800/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : customStats.length > 0 ? (
                <div className="space-y-4">
                  {customStats.map((stat) => (
                    <div
                      key={stat.id}
                      className="p-4 bg-white dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-600"
                    >
                      <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">
                        {stat.name}
                      </h3>
                      <code className="text-sm text-blue-700 dark:text-blue-300 font-mono block p-3 bg-blue-50 dark:bg-blue-800/50 rounded border">
                        {stat.formula}
                      </code>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Created: {stat.createdAt ? new Date(stat.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-600 dark:text-blue-400">
                    No custom stats created yet
                  </p>
                  <p className="text-sm text-blue-500 dark:text-blue-500 mt-1">
                    Create your first custom stat using the calculator
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Players Section */}
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
              <CardTitle className="flex items-center gap-3 text-red-900 dark:text-red-200">
                <Heart className="w-6 h-6 text-red-600" />
                Favorite Players
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {favorites.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {favoritesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-red-100 dark:bg-red-800/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : favorites.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {favorites.map((favorite, index) => {
                    const player = players.find(p => p.playerId === favorite.playerId);
                    const colors = [
                      'from-red-400 to-pink-400',
                      'from-purple-400 to-indigo-400', 
                      'from-blue-400 to-cyan-400',
                      'from-green-400 to-emerald-400',
                      'from-yellow-400 to-orange-400'
                    ];
                    const gradientClass = colors[index % colors.length];

                    return (
                      <div
                        key={favorite.id}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-600 hover:shadow-md transition-shadow"
                      >
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                          {favorite.playerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-red-900 dark:text-red-200">
                            {favorite.playerName}
                          </p>
                          {player && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {player.team} • {player.position}
                            </p>
                          )}
                        </div>
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 dark:text-red-400">
                    No favorite players yet
                  </p>
                  <p className="text-sm text-red-500 dark:text-red-500 mt-1">
                    Add players to your favorites by clicking the heart icon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Stats Summary */}
        <Card className="mt-8 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-6 text-center">
              <div className="flex-1">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {customStats.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Custom Stats Created
                </div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {favorites.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Favorite Players
                </div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {typedUser?.createdAt ? Math.ceil((Date.now() - new Date(typedUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Days as Member
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}