import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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

interface ShotChartProps {
  playerId: number;
  playerName: string;
  season?: string;
}

export default function ShotChart({ playerId, playerName, season = "2024-25" }: ShotChartProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const { data: shotData, isLoading, error } = useQuery<ShotChartData>({
    queryKey: ['/api/nba/players', playerId, 'shots', season],
    queryFn: async () => {
      const response = await fetch(`/api/nba/players/${playerId}/shots?season=${season}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shot chart data');
      }
      return response.json();
    },
    enabled: !!playerId
  });

  // NBA court dimensions (in pixels)
  const COURT_WIDTH = 500;
  const COURT_HEIGHT = 470;
  
  // Convert NBA coordinates to SVG coordinates
  const convertCoordinates = (x: number, y: number) => {
    // NBA court: X ranges from -250 to 250, Y ranges from -47.5 to 422.5
    const svgX = ((x + 250) / 500) * COURT_WIDTH;
    const svgY = ((422.5 - y) / 470) * COURT_HEIGHT;
    return { x: svgX, y: svgY };
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Shot Chart - {playerName}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading shot chart data...</div>
        </div>
      </div>
    );
  }

  if (error || !shotData) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Shot Chart - {playerName}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Shot chart data not available for this season</div>
        </div>
      </div>
    );
  }

  const { shots, summary } = shotData;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Shot Chart - {playerName}</h3>
        <div className="text-sm text-slate-400">{season} Season</div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-slate-400 text-xs">Total Attempts</div>
          <div className="text-white font-bold text-lg">{summary.totalAttempts}</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-slate-400 text-xs">Makes</div>
          <div className="text-green-400 font-bold text-lg">{summary.totalMakes}</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-slate-400 text-xs">FG%</div>
          <div className="text-orange-400 font-bold text-lg">{summary.fieldGoalPercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-slate-400 text-xs">Avg Distance</div>
          <div className="text-blue-400 font-bold text-lg">{summary.averageDistance.toFixed(1)} ft</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Visualization */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Shot Locations</h4>
          <div className="relative">
            <svg 
              width={COURT_WIDTH} 
              height={COURT_HEIGHT} 
              viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
              className="bg-green-800 rounded border border-white"
            >
              {/* Court Lines */}
              {/* Three-point line */}
              <path
                d="M 30 0 A 237.5 237.5 0 0 1 470 0"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              {/* Free throw line */}
              <rect
                x="150"
                y="330"
                width="200"
                height="2"
                fill="white"
              />
              {/* Paint area */}
              <rect
                x="170"
                y="330"
                width="160"
                height="140"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              {/* Basket */}
              <circle
                cx="250"
                cy="417.5"
                r="7.5"
                fill="none"
                stroke="orange"
                strokeWidth="3"
              />

              {/* Plot shots */}
              {shots.map((shot, index) => {
                const coords = convertCoordinates(shot.locX, shot.locY);
                return (
                  <circle
                    key={index}
                    cx={coords.x}
                    cy={coords.y}
                    r="3"
                    fill={shot.shotMade ? "#0F766E" : "#B45309"}
                    fillOpacity="0.8"
                    stroke={shot.shotMade ? "#134E4A" : "#92400E"}
                    strokeWidth="2"
                    className="hover:r-4 transition-all cursor-pointer"
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: "#0F766E", borderColor: "#134E4A" }}></div>
              <span className="text-slate-300">Made ({summary.totalMakes})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: "#B45309", borderColor: "#92400E" }}></div>
              <span className="text-slate-300">Missed ({summary.totalAttempts - summary.totalMakes})</span>
            </div>
          </div>
        </div>

        {/* Zone Breakdown */}
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Zone Efficiency</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(summary.zoneBreakdown)
              .sort((a, b) => b[1].attempts - a[1].attempts)
              .map(([zone, stats]) => (
                <div
                  key={zone}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedZone === zone 
                      ? 'bg-slate-700 border-orange-500' 
                      : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedZone(selectedZone === zone ? null : zone)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-medium text-sm">{zone}</div>
                    <div className="text-orange-400 font-bold">
                      {stats.percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{stats.makes}/{stats.attempts}</span>
                    <span>{stats.attempts} attempts</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(stats.percentage, 100)}%`,
                        backgroundColor: "#0F766E"
                      }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}