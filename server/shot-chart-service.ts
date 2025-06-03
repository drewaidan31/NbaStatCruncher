import { spawn } from 'child_process';

interface ShotData {
  gameId: string;
  playerId: number;
  playerName: string;
  period: number;
  eventType: string;
  actionType: string;
  shotType: string;
  shotZoneBasic: string;
  shotZoneArea: string;
  shotZoneRange: string;
  shotDistance: number;
  locX: number;
  locY: number;
  shotAttempted: boolean;
  shotMade: boolean;
  gameDate: string;
}

interface ShotChartData {
  shots: ShotData[];
  summary: {
    totalAttempts: number;
    totalMakes: number;
    fieldGoalPercentage: number;
    averageDistance: number;
    zoneBreakdown: Record<string, { attempts: number; makes: number; percentage: number }>;
  };
}

export async function getPlayerShotChart(playerId: number, season: string = '2024-25'): Promise<ShotChartData | null> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [
      'server/shot_chart_data.py',
      playerId.toString(),
      season
    ]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && outputData.trim()) {
        try {
          const shotData = JSON.parse(outputData);
          resolve(shotData);
        } catch (error) {
          console.error('Error parsing shot chart data:', error);
          resolve(null);
        }
      } else {
        console.error('Shot chart error:', errorData);
        resolve(null);
      }
    });

    // Set timeout for long-running requests
    setTimeout(() => {
      pythonProcess.kill();
      resolve(null);
    }, 30000);
  });
}

export function calculateShotZoneEfficiency(shots: ShotData[]) {
  const zones: Record<string, { attempts: number; makes: number }> = {};
  
  shots.forEach(shot => {
    const zone = shot.shotZoneBasic;
    if (!zones[zone]) {
      zones[zone] = { attempts: 0, makes: 0 };
    }
    zones[zone].attempts++;
    if (shot.shotMade) {
      zones[zone].makes++;
    }
  });

  return Object.entries(zones).map(([zone, data]) => ({
    zone,
    attempts: data.attempts,
    makes: data.makes,
    percentage: data.attempts > 0 ? (data.makes / data.attempts) * 100 : 0
  }));
}