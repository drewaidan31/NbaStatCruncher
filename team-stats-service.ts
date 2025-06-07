import { spawn } from 'child_process';
import path from 'path';

interface TeamStats {
  teamId: number;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  points: number;
  pointsPerGame: number;
  fieldGoalAttempts: number;
  freeThrowAttempts: number;
  offensiveRebounds: number;
  turnovers: number;
  possessions: number;
  possessionsPerGame: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  plusMinus: number;
}

interface TeamPossessionData {
  teams: TeamStats[];
  leagueAverage: {
    possessionsPerGame: number;
    pace: number;
    offensiveRating: number;
    defensiveRating: number;
  };
}

export async function getTeamPossessionData(season: string = '2024-25'): Promise<TeamPossessionData | null> {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'team_stats_data.py');
    const pythonProcess = spawn('python3', [scriptPath, season]);
    
    let data = '';
    let error = '';

    pythonProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', error);
        resolve(null);
        return;
      }

      try {
        const result = JSON.parse(data);
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse team stats data:', parseError);
        resolve(null);
      }
    });
  });
}

export function calculateAdvancedTeamMetrics(teamStats: any): TeamStats {
  const games = teamStats.GP;
  
  // Calculate possessions using standard formula
  const possessions = teamStats.FGA + (0.44 * teamStats.FTA) - teamStats.OREB + teamStats.TOV;
  const possessionsPerGame = possessions / games;
  
  // Calculate pace (possessions per 48 minutes)
  const totalMinutes = teamStats.MIN;
  const pace = (possessions * 48) / totalMinutes;
  
  // Calculate offensive rating (points per 100 possessions)
  const offensiveRating = (teamStats.PTS / possessions) * 100;
  
  // Defensive rating would need opponent data, so we'll estimate based on league average
  const estimatedDefensiveRating = 110; // This would need actual opponent data
  
  return {
    teamId: teamStats.TEAM_ID,
    teamName: teamStats.TEAM_NAME,
    gamesPlayed: games,
    wins: teamStats.W,
    losses: teamStats.L,
    winPercentage: teamStats.W_PCT,
    points: teamStats.PTS,
    pointsPerGame: teamStats.PTS / games,
    fieldGoalAttempts: teamStats.FGA,
    freeThrowAttempts: teamStats.FTA,
    offensiveRebounds: teamStats.OREB,
    turnovers: teamStats.TOV,
    possessions: Math.round(possessions),
    possessionsPerGame: Math.round(possessionsPerGame * 10) / 10,
    pace: Math.round(pace * 10) / 10,
    offensiveRating: Math.round(offensiveRating * 10) / 10,
    defensiveRating: estimatedDefensiveRating,
    assists: teamStats.AST,
    rebounds: teamStats.REB,
    steals: teamStats.STL,
    blocks: teamStats.BLK,
    fieldGoalPercentage: teamStats.FG_PCT,
    threePointPercentage: teamStats.FG3_PCT,
    freeThrowPercentage: teamStats.FT_PCT,
    plusMinus: teamStats.PLUS_MINUS
  };
}