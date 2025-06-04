import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Shield, TrendingUp, Medal, Users } from "lucide-react";

interface PlayerAwardsProps {
  playerName: string;
  season: string;
}

export function PlayerAwards({ playerName, season }: PlayerAwardsProps) {
  // Convert NBA season format (e.g., "2001-02") to award year format (e.g., "2001")
  const getAwardYear = (season: string) => {
    if (season === 'all-time' || !season) return '';
    // For NBA seasons like "2001-02", use the first year
    return season.split('-')[0];
  };

  const awardYear = getAwardYear(season);

  const { data: awardsData, isLoading } = useQuery({
    queryKey: ['/api/awards', playerName, awardYear],
    queryFn: async () => {
      if (!awardYear) return null;
      const response = await fetch(`/api/awards/${encodeURIComponent(playerName)}/${awardYear}`);
      if (!response.ok) throw new Error('Failed to fetch awards');
      return response.json();
    },
    enabled: !!playerName && !!awardYear
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="w-4 h-4 border border-slate-300 dark:border-slate-600 border-t-transparent rounded-full animate-spin"></div>
        Loading awards...
      </div>
    );
  }

  if (!awardsData || season === 'all-time') {
    return null;
  }

  const { awards, allStar, teams } = awardsData;

  // Filter for major awards that were won
  const majorAwards = awards?.filter((award: any) => award.winner === 'TRUE') || [];
  
  // Get award display info
  const getAwardInfo = (awardType: string) => {
    switch (awardType) {
      case 'nba mvp':
        return { icon: Trophy, label: 'MVP', color: 'text-yellow-600 dark:text-yellow-400' };
      case 'dpoy':
        return { icon: Shield, label: 'DPOY', color: 'text-blue-600 dark:text-blue-400' };
      case 'nba roy':
        return { icon: TrendingUp, label: 'ROY', color: 'text-green-600 dark:text-green-400' };
      case 'mip':
        return { icon: TrendingUp, label: 'MIP', color: 'text-purple-600 dark:text-purple-400' };
      case 'smoy':
        return { icon: Users, label: '6MOY', color: 'text-orange-600 dark:text-orange-400' };
      case 'clutch_poy':
        return { icon: Medal, label: 'Clutch', color: 'text-red-600 dark:text-red-400' };
      default:
        return { icon: Medal, label: awardType.toUpperCase(), color: 'text-slate-600 dark:text-slate-400' };
    }
  };

  // Get team info
  const getTeamInfo = (type: string, team: string) => {
    if (type === 'All-NBA') {
      return { 
        label: team === '1T' ? 'All-NBA 1st' : team === '2T' ? 'All-NBA 2nd' : team === '3T' ? 'All-NBA 3rd' : 'All-NBA',
        color: 'text-yellow-600 dark:text-yellow-400'
      };
    }
    if (type === 'All-Defense') {
      return { 
        label: team === '1st' ? 'All-Defense 1st' : team === '2nd' ? 'All-Defense 2nd' : 'All-Defense',
        color: 'text-blue-600 dark:text-blue-400'
      };
    }
    if (type === 'All-Rookie') {
      return { 
        label: team === '1st' ? 'All-Rookie 1st' : team === '2nd' ? 'All-Rookie 2nd' : 'All-Rookie',
        color: 'text-green-600 dark:text-green-400'
      };
    }
    return { label: `${type} ${team}`, color: 'text-slate-600 dark:text-slate-400' };
  };

  const hasAnyAwards = majorAwards.length > 0 || allStar || (teams && teams.length > 0);

  if (!hasAnyAwards) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {/* Major Awards */}
      {majorAwards.map((award: any, index: number) => {
        const { icon: Icon, label, color } = getAwardInfo(award.award);
        return (
          <div
            key={`award-${index}`}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${color} bg-white dark:bg-slate-700 border-current`}
            title={`${label} Winner ${season}`}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </div>
        );
      })}

      {/* All-Star */}
      {allStar && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-700 border-current"
          title={`All-Star ${season}`}
        >
          <Star className="w-3 h-3" />
          <span>All-Star</span>
        </div>
      )}

      {/* All-NBA, All-Defense, All-Rookie Teams */}
      {teams?.filter((team: any) => team.team !== 'ORV').map((team: any, index: number) => {
        const { label, color } = getTeamInfo(team.type, team.team);
        return (
          <div
            key={`team-${index}`}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${color} bg-white dark:bg-slate-700 border-current`}
            title={`${label} ${season}`}
          >
            <Medal className="w-3 h-3" />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}