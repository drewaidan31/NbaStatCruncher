import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PlayerData {
  player_id: number;
  name: string;
  team: string;
  position: string;
  current_season: string;
  games_played: number;
  minutes_per_game: number;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  field_goal_percentage: number;
  field_goal_attempts: number;
  three_point_percentage: number;
  three_point_attempts: number;
  free_throw_percentage: number;
  free_throw_attempts: number;
  plus_minus: number;
  win_percentage: number;
}

interface PlayerCareerData {
  seasons: PlayerData[];
  careerAverages: {
    games: number;
    points: number;
    assists: number;
    rebounds: number;
    field_goal_percentage: number;
    three_point_percentage: number;
    free_throw_percentage: number;
  };
}

export default function PlayerProfile() {
  const { playerId, season } = useParams<{ playerId: string; season: string }>();

  const { data: playerData, isLoading: playerLoading } = useQuery<PlayerData>({
    queryKey: ["/api/players", playerId, season],
    enabled: !!playerId && !!season,
  });

  const { data: careerData, isLoading: careerLoading } = useQuery<PlayerCareerData>({
    queryKey: ["/api/players", playerId, "career"],
    enabled: !!playerId,
  });

  if (playerLoading || careerLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/scatter-plot">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scatter Plot
            </Button>
          </Link>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Player not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const efficiency = ((playerData.points + playerData.assists + playerData.rebounds + playerData.steals + playerData.blocks) - 
    (playerData.field_goal_attempts - (playerData.points / 2)) - (playerData.free_throw_attempts - (playerData.points * 0.1)) - playerData.turnovers);

  const trueShootingPercentage = playerData.points / (2 * (playerData.field_goal_attempts + 0.44 * playerData.free_throw_attempts));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/scatter-plot">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scatter Plot
            </Button>
          </Link>
        </div>

        {/* Player Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{playerData.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{playerData.team}</Badge>
                <Badge variant="outline">{playerData.position}</Badge>
                <Badge variant="outline">{playerData.current_season}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Points Per Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerData.points.toFixed(1)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assists Per Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerData.assists.toFixed(1)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rebounds Per Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerData.rebounds.toFixed(1)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Minutes Per Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerData.minutes_per_game.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Shooting Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Shooting Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Field Goal %</div>
                <div className="text-2xl font-bold">{(playerData.field_goal_percentage * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">{playerData.field_goal_attempts.toFixed(1)} attempts/game</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Three Point %</div>
                <div className="text-2xl font-bold">{(playerData.three_point_percentage * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">{playerData.three_point_attempts.toFixed(1)} attempts/game</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Free Throw %</div>
                <div className="text-2xl font-bold">{(playerData.free_throw_percentage * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">{playerData.free_throw_attempts.toFixed(1)} attempts/game</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">True Shooting %</div>
                <div className="text-2xl font-bold">{(trueShootingPercentage * 100).toFixed(1)}%</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Efficiency Rating</div>
                <div className="text-2xl font-bold">{efficiency.toFixed(1)}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Plus/Minus</div>
                <div className={`text-2xl font-bold ${playerData.plus_minus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {playerData.plus_minus > 0 ? '+' : ''}{playerData.plus_minus.toFixed(1)}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Win Percentage</div>
                <div className="text-2xl font-bold">{(playerData.win_percentage * 100).toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defensive Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Defensive Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Steals Per Game</div>
                <div className="text-2xl font-bold">{playerData.steals.toFixed(1)}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Blocks Per Game</div>
                <div className="text-2xl font-bold">{playerData.blocks.toFixed(1)}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Turnovers Per Game</div>
                <div className="text-2xl font-bold">{playerData.turnovers.toFixed(1)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Season Context */}
        <Card>
          <CardHeader>
            <CardTitle>Season Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Games Played</div>
                <div className="text-xl font-bold">{playerData.games_played} / 82</div>
                <div className="text-sm text-muted-foreground">
                  {((playerData.games_played / 82) * 100).toFixed(1)}% of season
                </div>
              </div>
              
              {careerData && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Career Seasons</div>
                  <div className="text-xl font-bold">{careerData.seasons.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Career PPG: {careerData.careerAverages.points.toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}